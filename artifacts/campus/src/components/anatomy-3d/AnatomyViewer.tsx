import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Link } from "wouter";
import { Loader2, Minus, Plus, RotateCcw, Search, X } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { AnatomyImageBoard } from "@/components/anatomy-image-board";
import { resolveMuscleSelection, type MuscleSelection } from "@/lib/anatomy-muscle-map";
import { getAnatomyZone, searchAnatomyZones, type AnatomyZoneDef, type AnatomyZoneId } from "@/lib/anatomy-zones";
import { cn } from "@/lib/utils";

const SELECTED = "#2563eb";
const assetBase = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
const MODEL_URL = `${assetBase}models/anatomy-body.glb`;
const DRACO_PATH = `${assetBase}draco/`;

useGLTF.setDecoderPath(DRACO_PATH);

type MeshRef = THREE.Mesh & {
  userData: {
    type?: string;
    name?: string;
    nameDetail?: string;
    originalMaterial?: THREE.Material | THREE.Material[];
  };
};

type CatalogEntry = {
  uuid: string;
  mesh: MeshRef;
  selection: MuscleSelection;
  center: THREE.Vector3;
};

export type AnatomyViewerProps = {
  compact?: boolean;
  hideSearch?: boolean;
  /** Masque le panneau légende (utile en nouvelle session) */
  hideLegend?: boolean;
  focusZoneId?: AnatomyZoneId | null;
  className?: string;
  canvasClassName?: string;
  onZoneFocus?: (zone: AnatomyZoneDef) => void;
  onReady?: () => void;
  /** Libellé légende imposé (ex. « Mâchoire / ATM »). */
  focusLegend?: string | null;
  focusProtocolNumber?: number | null;
  focusOrgans?: string[] | null;
  /** Morphologie visible (même GLB, proportions + teinte). */
  sex?: "M" | "F";
};

function AnatomyBody({
  selectedUuid,
  selectedZoneId,
  sex = "M",
  onSelect,
  onCatalog,
  onReady,
}: {
  selectedUuid: string | null;
  selectedZoneId?: AnatomyZoneId | null;
  sex?: "M" | "F";
  onSelect: (mesh: MeshRef, point: THREE.Vector3) => void;
  onCatalog: (entries: CatalogEntry[]) => void;
  onReady: () => void;
}) {
  const { scene } = useGLTF(MODEL_URL, DRACO_PATH);
  const root = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    // Hauteur cible ~1.7 m pour cadrage caméra
    const targetH = 1.7;
    if (size.y > 0.01) {
      const s = targetH / size.y;
      clone.scale.setScalar(s);
    }
    clone.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(clone);
    clone.position.y -= box2.min.y;

    clone.traverse((obj) => {
      const mesh = obj as MeshRef;
      if (!mesh.isMesh) return;
      mesh.visible = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const t = mesh.userData?.type;
      if (t === "bone") {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          const mat = m as THREE.MeshStandardMaterial;
          if (mat?.isMeshStandardMaterial) {
            mat.transparent = true;
            mat.opacity = 0.22;
            mat.depthWrite = false;
          }
        });
      }
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    const female = sex === "F";
    root.scale.set(female ? 0.86 : 1, female ? 0.97 : 1, female ? 0.9 : 1);
    root.traverse((obj) => {
      const mesh = obj as MeshRef;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial;
        if (!mat?.isMeshStandardMaterial) return;
        if (!mat.userData.campusBaseColor) {
          mat.userData.campusBaseColor = mat.color.clone();
        }
        const base = mat.userData.campusBaseColor as THREE.Color;
        if (female) {
          mat.color.copy(base).lerp(new THREE.Color("#f0c2b0"), 0.38);
          mat.roughness = Math.min(0.92, (mat.roughness || 0.6) + 0.08);
        } else {
          mat.color.copy(base);
        }
      });
    });
  }, [root, sex]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  useEffect(() => {
    const entries: CatalogEntry[] = [];
    root.updateMatrixWorld(true);
    root.traverse((obj) => {
      const mesh = obj as MeshRef;
      if (!mesh.isMesh || !mesh.visible) return;
      const t = mesh.userData?.type;
      if (t === "bone") return;
      const selection = resolveMuscleSelection(
        {
          name: mesh.userData?.name,
          nameDetail: mesh.userData?.nameDetail,
          type: mesh.userData?.type,
        },
        mesh.name || mesh.userData?.name || "Muscle",
      );
      const center = new THREE.Vector3();
      new THREE.Box3().setFromObject(mesh).getCenter(center);
      entries.push({ uuid: mesh.uuid, mesh, selection, center });
    });
    onCatalog(entries);
  }, [root, onCatalog]);

  useEffect(() => {
    root.traverse((obj) => {
      const mesh = obj as MeshRef;
      if (!mesh.isMesh) return;
      const zoneHit =
        Boolean(selectedZoneId) &&
        resolveMuscleSelection(
          { name: mesh.userData?.name, nameDetail: mesh.userData?.nameDetail, type: mesh.userData?.type },
          mesh.name || mesh.userData?.name || "Muscle",
        ).zoneId === selectedZoneId;
      const isSelected = mesh.uuid === selectedUuid || zoneHit;
      if (isSelected) {
        if (!mesh.userData.originalMaterial) {
          mesh.userData.originalMaterial = mesh.material;
        }
        const base = Array.isArray(mesh.userData.originalMaterial)
          ? mesh.userData.originalMaterial[0]
          : mesh.userData.originalMaterial;
        const hl = (base as THREE.MeshStandardMaterial).clone();
        if (hl.isMeshStandardMaterial) {
          hl.emissive = new THREE.Color(SELECTED);
          hl.emissiveIntensity = 0.55;
          hl.color = new THREE.Color(SELECTED);
        }
        mesh.material = hl;
      } else if (mesh.userData.originalMaterial) {
        mesh.material = mesh.userData.originalMaterial;
        delete mesh.userData.originalMaterial;
      }
    });
  }, [root, selectedUuid, selectedZoneId]);

  const drag = useRef({ x: 0, y: 0, moved: false });

  return (
    <primitive
      object={root}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        drag.current = { x: e.clientX, y: e.clientY, moved: false };
      }}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        if (Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y) > 8) {
          drag.current.moved = true;
        }
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (drag.current.moved) return;
        e.stopPropagation();
        const mesh = e.object as MeshRef;
        if (!mesh?.isMesh) return;
        if (mesh.userData?.type === "bone") return;
        onSelect(mesh, e.point.clone());
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    />
  );
}

function AnchorProjector({
  worldPoint,
  onScreen,
}: {
  worldPoint: THREE.Vector3 | null;
  onScreen: (p: { x: number; y: number } | null) => void;
}) {
  const { camera, size } = useThree();
  useFrame(() => {
    if (!worldPoint) {
      onScreen(null);
      return;
    }
    const v = worldPoint.clone().project(camera);
    onScreen({
      x: (v.x * 0.5 + 0.5) * size.width,
      y: (-v.y * 0.5 + 0.5) * size.height,
    });
  });
  return null;
}

type ViewCmd = { kind: "front" | "back" | "reset" | "zoomIn" | "zoomOut"; id: number };

function ViewCommander({ cmd }: { cmd: ViewCmd | null }) {
  const applied = useRef(0);
  const controls = useThree((s) => s.controls) as unknown as {
    target: THREE.Vector3;
    update: () => void;
    object: THREE.Camera;
  } | null;
  const { camera } = useThree();

  useFrame(() => {
    if (!cmd || !controls || applied.current === cmd.id) return;
    applied.current = cmd.id;
    const t = controls.target;
    if (cmd.kind === "front") {
      t.set(0, 0.88, 0);
      camera.position.set(0, 1.02, 2.75);
    } else if (cmd.kind === "back") {
      t.set(0, 0.88, 0);
      camera.position.set(0, 1.02, -2.75);
    } else if (cmd.kind === "reset") {
      t.set(0, 0.88, 0);
      camera.position.set(0.15, 1.05, 2.7);
    } else if (cmd.kind === "zoomIn") {
      camera.position.lerp(t, 0.28);
    } else if (cmd.kind === "zoomOut") {
      const dir = camera.position.clone().sub(t).multiplyScalar(1.28);
      camera.position.copy(t).add(dir);
    }
    controls.update();
  });
  return null;
}

function CameraFocus({
  lookAt,
  closeUp = false,
  token,
  userOrbiting,
}: {
  lookAt: THREE.Vector3 | null;
  closeUp?: boolean;
  token: number;
  userOrbiting: boolean;
}) {
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; update: () => void } | null;
  const { camera } = useThree();
  const goalCam = useRef(new THREE.Vector3());
  const applied = useRef(-1);
  const frames = useRef(99);

  useFrame(() => {
    if (!lookAt || !controls || userOrbiting) return;
    if (applied.current !== token) {
      applied.current = token;
      frames.current = 0;
    }
    if (frames.current > 40) return;
    frames.current += 1;
    controls.target.lerp(lookAt, 0.14);
    const desiredDist = closeUp ? 1.35 : 2.35;
    goalCam.current.set(lookAt.x + 0.22, lookAt.y + 0.18, lookAt.z + desiredDist);
    camera.position.lerp(goalCam.current, 0.12);
    controls.update();
  });
  return null;
}

export function AnatomyViewer({
  compact = false,
  hideSearch = false,
  hideLegend = false,
  focusZoneId = null,
  className,
  canvasClassName,
  onZoneFocus,
  focusLegend = null,
  focusProtocolNumber = null,
  focusOrgans = null,
  sex = "M",
}: AnatomyViewerProps = {}) {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [selection, setSelection] = useState<MuscleSelection | null>(null);
  const [hitPoint, setHitPoint] = useState<THREE.Vector3 | null>(null);
  const [screenAnchor, setScreenAnchor] = useState<{ x: number; y: number } | null>(null);
  const [legendLine, setLegendLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [modelSlow, setModelSlow] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const lastFocus = useRef<string | null>(null);
  const [camToken, setCamToken] = useState(0);
  const [userOrbiting, setUserOrbiting] = useState(false);
  const [viewCmd, setViewCmd] = useState<ViewCmd | null>(null);
  const pointerDrag = useRef(false);

  const suggestions = useMemo(() => searchAnatomyZones(query), [query]);
  const markReady = useMemo(() => () => setModelReady(true), []);

  useEffect(() => {
    if (modelReady) {
      setModelSlow(false);
      return;
    }
    const t = window.setTimeout(() => setModelSlow(true), 7000);
    return () => window.clearTimeout(t);
  }, [modelReady]);

  useEffect(() => {
    if (!screenAnchor || !wrapRef.current || !legendRef.current || !selection || hideLegend) {
      setLegendLine(null);
      return;
    }
    const wrap = wrapRef.current.getBoundingClientRect();
    const leg = legendRef.current.getBoundingClientRect();
    setLegendLine({
      x1: screenAnchor.x,
      y1: screenAnchor.y,
      x2: leg.left - wrap.left,
      y2: leg.top - wrap.top + leg.height * 0.35,
    });
  }, [screenAnchor, selection, hideLegend]);

  function handleSelect(mesh: MeshRef, point: THREE.Vector3) {
    setSelectedUuid(mesh.uuid);
    setHitPoint(point);
    setSelection(
      resolveMuscleSelection(
        {
          name: mesh.userData?.name,
          nameDetail: mesh.userData?.nameDetail,
          type: mesh.userData?.type,
        },
        mesh.name || mesh.userData?.name || "Muscle",
      ),
    );
    setSearchOpen(false);
  }

  function selectFromCatalog(entry: CatalogEntry) {
    setSelectedUuid(entry.uuid);
    setHitPoint(entry.center.clone());
    setSelection(entry.selection);
    setQuery(entry.selection.labelFr);
    setSearchOpen(false);
    setCamToken((n) => n + 1);
  }

  function pickZoneMesh(zone: AnatomyZoneDef): CatalogEntry | undefined {
    const hits = catalog.filter((e) => e.selection.zoneId === zone.id);
    if (hits.length === 0) {
      return catalog.find((e) => e.selection.labelFr.toLowerCase() === zone.label.toLowerCase());
    }
    const anchor = new THREE.Vector3(...zone.anchor);
    return [...hits].sort((a, b) => a.center.distanceTo(anchor) - b.center.distanceTo(anchor))[0];
  }

  function selectZone(zone: AnatomyZoneDef) {
    const hit = pickZoneMesh(zone);
    if (hit) selectFromCatalog(hit);
    else {
      setSelectedUuid(null);
      setHitPoint(new THREE.Vector3(...zone.anchor));
      setSelection({
        meshName: zone.id,
        nameEn: zone.label,
        nameDetail: "",
        labelFr: zone.label,
        zoneId: zone.id,
        protocolNumber: zone.preferredProtocol,
      });
      setQuery(zone.label);
      setSearchOpen(false);
    }
    onZoneFocus?.(zone);
  }

  useEffect(() => {
    if (!focusZoneId) return;
    const zone = getAnatomyZone(focusZoneId);
    if (!zone) return;
    const key = `${focusZoneId}|${focusLegend || ""}|${focusProtocolNumber || ""}|${(focusOrgans || []).join(",")}|${catalog.length > 0 ? "ready" : "pending"}`;
    if (lastFocus.current === key) return;
    lastFocus.current = key;
    const hit = pickZoneMesh(zone);
    const labelFr = focusLegend || zone.label;
    const nameDetail = (focusOrgans && focusOrgans.length > 0 ? focusOrgans.join(" · ") : "") || hit?.selection.nameDetail || "";
    if (hit) {
      setSelectedUuid(hit.uuid);
      setHitPoint(hit.center.clone());
      setSelection({
        ...hit.selection,
        labelFr,
        nameDetail,
        protocolNumber: focusProtocolNumber || hit.selection.protocolNumber,
      });
    } else {
      setSelectedUuid(null);
      setHitPoint(new THREE.Vector3(...zone.anchor));
      setSelection({
        meshName: zone.id,
        nameEn: zone.label,
        nameDetail,
        labelFr,
        zoneId: zone.id,
        protocolNumber: focusProtocolNumber || zone.preferredProtocol,
      });
    }
    onZoneFocus?.(zone);
    setCamToken((n) => n + 1);
  }, [focusZoneId, focusLegend, focusProtocolNumber, focusOrgans, catalog, onZoneFocus]);

  function clearSelection() {
    setSelectedUuid(null);
    setSelection(null);
    setHitPoint(null);
    setScreenAnchor(null);
    setLegendLine(null);
    lastFocus.current = null;
  }

  const protocolHref = focusProtocolNumber
    ? `/formation/protocole/${focusProtocolNumber}`
    : selection?.protocolNumber
      ? `/formation/protocole/${selection.protocolNumber}`
      : selection?.zoneId
        ? `/anatomie/${selection.zoneId}`
        : null;

  const showLegend = Boolean(selection && !hideLegend && !compact);

  return (
    <div className={cn("space-y-3", className)} data-testid="anatomy-3d-viewer">
      {!hideSearch ? (
        <div className="relative z-30 mx-auto w-full max-w-xl">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur-sm">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && suggestions[0]) {
                  e.preventDefault();
                  selectZone(suggestions[0]);
                }
                if (e.key === "Escape") {
                  setSearchOpen(false);
                  if (!query) clearSelection();
                }
              }}
              placeholder="Rechercher une zone… cuisse, dos, nuque…"
              className="h-8 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              data-testid="input-anatomy-search"
              autoComplete="off"
            />
            {query ? (
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => {
                  setQuery("");
                  clearSelection();
                  searchRef.current?.focus();
                }}
                aria-label="Effacer"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
          {searchOpen && suggestions.length > 0 ? (
            <ul className="absolute inset-x-0 top-[calc(100%+0.4rem)] z-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {suggestions.map((zone) => (
                <li key={zone.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-50"
                    onClick={() => selectZone(zone)}
                    data-testid={`anatomy-search-${zone.id}`}
                  >
                    <span className="font-medium">{zone.label}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Sélectionner</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div
        ref={wrapRef}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl bg-[#f3f1ec]",
          compact
            ? cn("h-[420px] min-h-[360px]", canvasClassName)
            : cn("h-[calc(100dvh-9.5rem)] min-h-[520px]", canvasClassName),
        )}
      >
        {!modelReady ? (
          <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-[#f3f1ec]/90">
            {modelSlow && focusZoneId ? (
              <div className="pointer-events-auto h-full w-full p-2">
                <AnatomyImageBoard compact focusZoneId={focusZoneId} hideSearch className="h-full" />
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                <Loader2 size={16} className="animate-spin text-primary" />
                Chargement du modèle 3D…
              </div>
            )}
          </div>
        ) : null}

        <ErrorBoundary
          resetKey={`${MODEL_URL}-${focusZoneId ?? "anatomy"}`}
          FallbackComponent={({ resetError, error }) => (
            <div className="grid h-full place-items-center p-6 text-center">
              <div>
                <p className="font-semibold text-slate-800">Le modèle 3D n’a pas pu s’afficher</p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  {import.meta.env.DEV ? error.message : "Vérifiez votre connexion (décodeur Draco) puis réessayez."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setModelReady(false);
                    resetError();
                  }}
                  className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}
        >
          <Canvas
            shadows
            camera={{ position: [0, 1.05, 2.6], fov: 40 }}
            onPointerMissed={compact ? undefined : clearSelection}
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            dpr={[1, 1.75]}
          >
            <color attach="background" args={["#f3f1ec"]} />
            <ambientLight intensity={1} />
            <directionalLight castShadow position={[4, 8, 4]} intensity={1.25} shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-4, 3, -2]} intensity={0.55} />
            <hemisphereLight args={["#ffffff", "#c8c2b8", 0.45]} />
            <Suspense fallback={null}>
              <AnatomyBody
                selectedUuid={selectedUuid}
                selectedZoneId={selection?.zoneId ?? focusZoneId}
                onSelect={handleSelect}
                onCatalog={setCatalog}
                onReady={markReady}
              />
            </Suspense>
            <ContactShadows position={[0, -0.01, 0]} opacity={0.28} scale={4} blur={2.4} far={2} />
            <OrbitControls
              makeDefault
              enablePan
              minDistance={1.1}
              maxDistance={6}
              target={[0, 0.9, 0]}
              maxPolarAngle={Math.PI * 0.92}
            />
            <CameraFocus
              lookAt={hitPoint}
              closeUp={["pied", "machoire", "crane", "genou", "coude", "avant-bras"].includes(
                selection?.zoneId || focusZoneId || "",
              )}
            />
            {!hideLegend ? <AnchorProjector worldPoint={hitPoint} onScreen={setScreenAnchor} /> : null}
          </Canvas>
        </ErrorBoundary>

        {legendLine && showLegend && (
          <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" aria-hidden>
            <line
              x1={legendLine.x1}
              y1={legendLine.y1}
              x2={legendLine.x2}
              y2={legendLine.y2}
              stroke="#1e3a5f"
              strokeWidth="1.25"
              strokeDasharray="3 4"
              opacity="0.75"
            />
            <circle cx={legendLine.x1} cy={legendLine.y1} r="3.5" fill={SELECTED} />
          </svg>
        )}

        {showLegend && (
          <aside
            ref={legendRef}
            className="absolute right-3 top-[16%] z-20 w-[min(100%-1.5rem,240px)] rounded-xl border border-slate-200/90 bg-white/95 p-4 shadow-[0_12px_40px_-18px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:right-5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Zone</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{selection!.labelFr}</p>
            {selection!.nameDetail ? (
              <p className="mt-1 text-[11px] leading-4 text-slate-500">{selection!.nameDetail}</p>
            ) : null}
            <div className="mt-3 h-px bg-slate-100" />
            {protocolHref ? (
              <Link
                href={protocolHref}
                className="mt-3 block text-sm font-semibold text-[#2563eb] hover:underline"
                data-testid="link-protocole-ventouse-legend"
              >
                Que faire — {selection!.labelFr}
              </Link>
            ) : (
              <p className="mt-3 text-sm font-medium text-slate-600">Aucun protocole dédié pour ce muscle.</p>
            )}
          </aside>
        )}

        {modelReady && !selection ? (
          <p className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1.5 text-[11px] text-slate-500 shadow-sm">
            Cliquez un muscle · molette = zoom · glisser = tourner
          </p>
        ) : null}
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_URL, DRACO_PATH);
