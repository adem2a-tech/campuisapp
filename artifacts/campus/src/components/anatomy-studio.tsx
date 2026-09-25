import { useEffect, useRef, useState } from "react";
import {
  FRENCH_STRUCTURE_CHIPS,
  resolveClinicalFromPick,
  resolveClinicalFromRegion,
  type ClinicalMatch,
} from "@/lib/anatomy-clinical";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Droplets,
  ExternalLink,
  FileText,
  RotateCcw,
  Sparkles,
  Timer,
  Wrench,
} from "lucide-react";

type HumanApiInstance = {
  on: (event: string, cb: (...args: any[]) => void) => void;
  send?: (method: string, params?: any, callback?: (data: any) => void) => void;
  pick?: { on: (event: string, cb: (e: any) => void) => void };
  scene?: {
    on: (event: string, cb: (e: any) => void) => void;
    getObjects?: (cb: (objects: Record<string, { displayName?: string; name?: string }>) => void) => void;
  };
};

declare global {
  interface Window {
    HumanAPI?: new (iframeId: string) => HumanApiInstance;
  }
}

const SKELETON_3D_SRC =
  "https://human.biodigital.com/widget/?be=2XJE&s=female&lang=fr&background.colors=0.08,0.12,0.18,1,0.05,0.08,0.12,1&initial.hand-hint=false&ui-fullscreen=true&ui-center=true&ui-dissect=true&ui-zoom=true&ui-help=false&ui-tools-display=primary&ui-info=true&ui-anatomy-labels=true&uaid=3bEyJ";

const MSD_SOURCE =
  "https://www.msdmanuals.com/fr/professional/multimedia/3dmodel/syst%C3%A8me-squelettique";

const HUMAN_API_SRCS = [
  "https://human-api.biodigital.com/build/1.2.1/human-api-1.2.1.min.js",
  "https://developer.biodigital.com/builds/api/human-api.min.js",
];

function loadHumanApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.HumanAPI) {
      resolve();
      return;
    }
    const trySrc = (index: number) => {
      const src = HUMAN_API_SRCS[index];
      if (!src) {
        reject(new Error("HumanAPI load error"));
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => trySrc(index + 1);
      document.head.appendChild(s);
    };
    trySrc(0);
  });
}

function extractNameFromPayload(data: unknown): string {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (Array.isArray(data)) {
    for (const item of data) {
      const n = extractNameFromPayload(item);
      if (n) return n;
    }
    return "";
  }
  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    const direct =
      o.displayName || o.name || o.objectId || o.id || o.title || o.label;
    if (typeof direct === "string" && direct.length < 120) return direct;
    if (o.object) return extractNameFromPayload(o.object);
    if (o.objects) return extractNameFromPayload(o.objects);
    // selected map { id: true }
    const keys = Object.keys(o).filter((k) => o[k] === true);
    if (keys.length === 1) return keys[0]!;
  }
  return "";
}

export function AnatomyStudio({ firstName }: { firstName: string }) {
  const iframeId = "campus-biodigital-skeleton";
  const panelRef = useRef<HTMLDivElement>(null);
  const humanRef = useRef<HumanApiInstance | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [liveBone, setLiveBone] = useState<string | null>(null);
  const [match, setMatch] = useState<ClinicalMatch | null>(null);
  const lastPickRef = useRef("");

  function applyMatch(next: ClinicalMatch) {
    setMatch(next);
    setLiveBone(next.targetLabel || next.labelFr);
    lastPickRef.current = next.labelFr;
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function selectFromRaw(raw: string, openProtocol = false) {
    const cleaned = raw.trim();
    if (!cleaned) return;
    const next = resolveClinicalFromPick(cleaned);
    setLiveBone(next.labelFr);
    if (openProtocol || lastPickRef.current !== next.labelFr) {
      applyMatch(next);
    } else {
      lastPickRef.current = next.labelFr;
      setMatch(next);
    }
  }

  function selectStructure(regionId: string, label: string) {
    applyMatch(resolveClinicalFromRegion(regionId, label));
  }

  /** Bouton à côté de Décoloration / Isoler (overlay — l'iframe BioDigital n'est pas modifiable). */
  function openCuppingProtocol() {
    if (liveBone) {
      applyMatch(resolveClinicalFromPick(liveBone));
      return;
    }
    if (match) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    // Pas de sélection API : on guide l'utilisateur
    applyMatch(resolveClinicalFromRegion("jaw", "Maxillaire"));
  }

  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | undefined;

    const ingest = (raw: string) => {
      if (cancelled || !raw) return;
      const next = resolveClinicalFromPick(raw);
      setLiveBone(next.labelFr);
      // Synchronise le panneau diagnostic dès qu'un os est sélectionné dans le 3D
      if (lastPickRef.current !== next.labelFr) {
        lastPickRef.current = next.labelFr;
        setMatch(next);
      }
    };

    const onMessage = (event: MessageEvent) => {
      if (typeof event.origin === "string" && !event.origin.includes("biodigital")) return;
      const raw = extractNameFromPayload(event.data);
      if (raw) ingest(raw);
    };
    window.addEventListener("message", onMessage);

    (async () => {
      try {
        await loadHumanApi();
        if (cancelled || !window.HumanAPI) return;
        await new Promise((r) => setTimeout(r, 1600));
        if (cancelled) return;
        const human = new window.HumanAPI(iframeId);
        humanRef.current = human;

        const fromObjectId = (objectId: string) => {
          if (!objectId) return;
          if (human.scene?.getObjects) {
            human.scene.getObjects((objects) => {
              const obj = objects?.[objectId];
              ingest(obj?.displayName || obj?.name || objectId);
            });
          } else ingest(objectId);
        };

        human.pick?.on?.("picked", (event: any) => fromObjectId(event?.objectId || event?.id || ""));
        human.scene?.on?.("selectedObjectsUpdate", (flags: Record<string, boolean>) => {
          const id = Object.keys(flags || {}).find((k) => flags[k]);
          if (id) fromObjectId(id);
        });
        human.on?.("scene.objectSelected", (data: any) => fromObjectId(data?.objectId || data?.id || ""));
        human.on?.("scene.picked", (data: any) => fromObjectId(data?.objectId || data?.id || ""));

        // Poll la sélection BioDigital (double-clic dans l'iframe)
        pollTimer = window.setInterval(() => {
          if (!human.send) return;
          const handle = (data: any) => {
            const raw = extractNameFromPayload(data);
            if (raw) ingest(raw);
            else if (data && typeof data === "object") {
              const ids = Object.keys(data).filter((k) => (data as any)[k]);
              if (ids[0]) fromObjectId(ids[0]);
            }
          };
          try {
            human.send("scene.getSelectedObjects", handle);
          } catch {
            try {
              human.send("scene.getSelected", {}, handle);
            } catch {
              /* ignore */
            }
          }
        }, 600);
      } catch {
        /* overlay reste utilisable */
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("message", onMessage);
      if (pollTimer) window.clearInterval(pollTimer);
      humanRef.current = null;
    };
  }, [iframeKey]);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="relative overflow-hidden rounded-2xl bg-[#0b1220] shadow-[0_24px_50px_-24px_rgba(15,23,42,0.55)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[.14em] text-sky-300/80">Anatomie clinique</p>
              <p className="mt-0.5 text-sm text-slate-200">
                {firstName} — double-cliquez un os : le PDF synchronise le{" "}
                <span className="text-sky-200">muscle touché</span> ou{" "}
                <span className="text-violet-200">Psychologique</span> (stress)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIframeKey((k) => k + 1);
                  setLiveBone(null);
                  setMatch(null);
                  lastPickRef.current = "";
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/15"
              >
                <RotateCcw size={13} /> Vue d&apos;ensemble
              </button>
              <a
                href={MSD_SOURCE}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-xs text-slate-300 hover:text-white"
              >
                Source MSD <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div className="relative h-[min(58vh,560px)]">
            <iframe
              key={iframeKey}
              id={iframeId}
              title="Squelette 3D français"
              src={SKELETON_3D_SRC}
              className="h-full w-full border-0"
              allow="fullscreen; accelerometer; gyroscope"
              allowFullScreen
            />

            {/* Barre type BioDigital : cible PDF synchronisée (muscle ou psychologique) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-3">
              <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-xl border border-white/70 bg-gradient-to-b from-sky-50 to-sky-100/95 p-1.5 shadow-[0_12px_40px_-10px_rgba(15,23,42,0.55)] backdrop-blur-md">
                {(match?.targetLabel || liveBone) && (
                  <span
                    className={cn(
                      "hidden rounded-lg px-2.5 py-2 text-xs font-semibold sm:inline",
                      match?.targetKind === "psychologique"
                        ? "bg-violet-100 text-violet-800"
                        : "bg-sky-100/90 text-slate-800",
                    )}
                    title={
                      match?.targetKind === "psychologique"
                        ? "Protocole stress / mental (PDF)"
                        : match?.musclesTouched?.length
                          ? `Muscles touchés : ${match.musclesTouched.join(", ")}`
                          : liveBone ?? undefined
                    }
                  >
                    {match?.targetKind === "psychologique"
                      ? "Psychologique"
                      : match?.targetLabel || liveBone}
                  </span>
                )}
                <span className="rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500">Décoloration</span>
                <span className="rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500">Isoler</span>
                <button
                  type="button"
                  onClick={openCuppingProtocol}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:brightness-110"
                  data-testid="button-protocole-ventouse-overlay"
                >
                  <Sparkles size={13} />
                  Protocole ventouse
                </button>
              </div>
            </div>
          </div>
        </div>

        <div ref={panelRef} className="glass-ice flex min-h-[320px] flex-col rounded-2xl p-5 md:p-6" data-testid="anatomy-clinical-panel">
          {!match ? (
            <div className="flex flex-1 flex-col justify-center">
              <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-primary">Diagnostic</p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em]">Aucune zone sélectionnée</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Double-cliquez un os dans le 3D (ex. Maxilla / Frontal), puis cliquez le bouton{" "}
                <strong>Protocole ventouse</strong> sous le modèle — à côté de Décoloration / Isoler.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-primary">Douleur diagnostiquée</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Vous avez sélectionné : {match.labelFr}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Synchronisé avec le PDF —{" "}
                {match.targetKind === "psychologique" ? (
                  <>
                    cible <strong>psychologique</strong> (stress / bien-être mental).
                  </>
                ) : (
                  <>
                    muscle / zone touchée : <strong>{match.targetLabel}</strong>.
                  </>
                )}
              </p>

              {match.pdfFound && (
                <div
                  className={cn(
                    "mt-4 rounded-2xl px-4 py-3",
                    match.targetKind === "psychologique"
                      ? "border border-violet-200 bg-violet-50/90"
                      : "border border-sky-200 bg-sky-50/90",
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[.12em] opacity-80">
                    {match.targetKind === "psychologique" ? "Approche PDF" : "Muscle touché (PDF)"}
                  </p>
                  <p className="mt-1 text-base font-semibold">
                    {match.targetKind === "psychologique" ? "Psychologique" : match.targetLabel}
                  </p>
                  {match.targetKind === "muscle" && match.musclesTouched.length > 1 && (
                    <p className="mt-1.5 text-[12px] leading-5 text-slate-600">
                      Points d&apos;application : {match.musclesTouched.join(" · ")}
                    </p>
                  )}
                  {match.targetKind === "psychologique" && match.musclesTouched.length > 0 && (
                    <p className="mt-1.5 text-[12px] leading-5 text-slate-600">
                      Zones de pose associées : {match.musclesTouched.join(" · ")}
                    </p>
                  )}
                </div>
              )}

              {!match.pdfFound || !match.protocol ? (
                <div className="mt-5 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4">
                  <p className="text-sm font-semibold text-amber-950">
                    Aucun PDF n&apos;a été trouvé pour {match.labelFr}
                  </p>
                  <p className="mt-2 text-[13px] leading-6 text-amber-900/90">
                    Aucune fiche ventouses dédiée dans vos PDF pour cette structure. Parcourez le PDF des 150 protocoles.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  <div className="glass-ice-soft rounded-2xl p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-primary">Protocole ventouses</p>
                    <p className="mt-1 text-lg font-semibold">{match.protocol.title}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{match.protocol.source}</p>
                  </div>
                  <InfoRow icon={Timer} label="Technique" value={match.protocol.technique} />
                  <InfoRow icon={Droplets} label="Ventouse" value={match.protocol.cupSize} />
                  {match.protocol.material && <InfoRow icon={Wrench} label="Matériel" value={match.protocol.material} />}
                  <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-[12px] leading-5 text-amber-950">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <AlertTriangle size={13} /> Précautions
                    </span>
                    <p className="mt-1">{match.protocol.precautions}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[.1em] text-slate-500">
                      {match.targetKind === "psychologique" ? "Zones associées" : "Muscles / points touchés"}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {match.musclesTouched.length ? match.musclesTouched.join(", ") : match.protocol.points}
                    </p>
                  </div>
                  <ol className="list-decimal space-y-1 pl-4 text-sm leading-6 text-slate-700">
                    {match.protocol.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="mt-auto space-y-2 pt-5">
                <button
                  type="button"
                  onClick={openCuppingProtocol}
                  className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm"
                >
                  <Sparkles size={16} /> Protocole ventouse
                </button>
                <a
                  href={match.pdfHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/60 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-white"
                  data-testid="button-voir-pdf-ventouses"
                >
                  <FileText size={16} />
                  {match.pdfButtonLabel}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-ice rounded-2xl p-4 md:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Sélection rapide</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {FRENCH_STRUCTURE_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => selectStructure(chip.regionId, chip.label)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left transition",
                match?.labelFr === chip.label
                  ? "border-primary/40 bg-secondary text-primary"
                  : "border-white/60 bg-white/50 hover:bg-white/80",
              )}
            >
              <span className="block text-sm font-semibold">{chip.label}</span>
              <span className="mt-1 block text-[11px] opacity-70">{chip.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Timer; label: string; value: string }) {
  return (
    <div className="glass-ice-soft flex gap-3 rounded-xl px-3 py-2.5">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon size={14} />
      </span>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[.08em] text-slate-500">{label}</p>
        <p className="text-sm font-semibold leading-5 text-slate-800">{value}</p>
      </div>
    </div>
  );
}
