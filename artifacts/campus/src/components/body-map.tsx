import { useState } from "react";
import { cn } from "@/lib/utils";
import { BODY_ZONE_PROTOCOLS, type ZoneProtocol } from "@/lib/campus-protocols";

type BodyMapProps = {
  selectedSlugs?: string[];
  onToggleZone?: (slug: string) => void;
  onSelectZone?: (protocol: ZoneProtocol) => void;
  highlightSlug?: string | null;
  showLabels?: boolean;
  className?: string;
  variant?: "compact" | "full";
  /** Style Milo = vert ; défaut = ambre */
  activeTone?: "amber" | "green";
};

type ViewKey = "front" | "back" | "side";

const VIEW_HOTSPOTS: Record<ViewKey, Array<{ slug: string; x: number; y: number; w: number; h: number }>> = {
  front: [
    { slug: "eye", x: 14, y: 6, w: 4, h: 3 },
    { slug: "head", x: 12, y: 3, w: 8, h: 8 },
    { slug: "forehead", x: 13, y: 4, w: 6, h: 3 },
    { slug: "jaw", x: 14, y: 11, w: 5, h: 3 },
    { slug: "ear", x: 19, y: 8, w: 3, h: 4 },
    { slug: "chest", x: 11, y: 22, w: 10, h: 10 },
    { slug: "shoulder-r", x: 18, y: 18, w: 7, h: 8 },
    { slug: "shoulder-l", x: 7, y: 18, w: 7, h: 8 },
    { slug: "abdomen", x: 12, y: 34, w: 8, h: 10 },
    { slug: "knee-r", x: 16, y: 68, w: 6, h: 8 },
    { slug: "knee-l", x: 10, y: 68, w: 6, h: 8 },
  ],
  back: [
    { slug: "head", x: 46, y: 4, w: 8, h: 9 },
    { slug: "neck", x: 47, y: 14, w: 6, h: 7 },
    { slug: "upper-back", x: 44, y: 22, w: 12, h: 12 },
    { slug: "lower-back", x: 45, y: 38, w: 10, h: 12 },
  ],
  side: [
    { slug: "eye", x: 81, y: 6, w: 3, h: 3 },
    { slug: "head", x: 79, y: 4, w: 8, h: 9 },
    { slug: "neck", x: 80, y: 14, w: 6, h: 7 },
    { slug: "chest", x: 78, y: 24, w: 8, h: 10 },
    { slug: "abdomen", x: 79, y: 36, w: 7, h: 9 },
    { slug: "lower-back", x: 82, y: 36, w: 6, h: 10 },
    { slug: "knee-r", x: 80, y: 68, w: 6, h: 8 },
  ],
};

export function BodyMap({
  selectedSlugs = [],
  onToggleZone,
  onSelectZone,
  highlightSlug,
  showLabels = false,
  className,
  variant = "compact",
  activeTone = "amber",
}: BodyMapProps) {
  const [view, setView] = useState<ViewKey>("front");
  const spots = VIEW_HOTSPOTS[view];

  function handleZoneClick(slug: string) {
    const protocol = BODY_ZONE_PROTOCOLS.find((z) => z.slug === slug);
    if (!protocol) return;
    onToggleZone?.(slug);
    onSelectZone?.(protocol);
  }

  const activeCls =
    activeTone === "green"
      ? "border-emerald-400 bg-emerald-400/55 shadow-[0_0_0_4px_rgba(52,211,153,.28)]"
      : "border-amber-400 bg-amber-400/45 shadow-[0_0_0_4px_rgba(251,191,36,.25)]";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-center gap-2">
        {(
          [
            ["front", "Face"],
            ["back", "Dos"],
            ["side", "Profil"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              view === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "relative mx-auto w-full overflow-hidden rounded-2xl bg-white",
          variant === "full" ? "max-w-[820px] aspect-[1.55]" : "max-w-[560px] aspect-[1.55]",
        )}
      >
        <img
          src={`${import.meta.env.BASE_URL}anatomy-3d.png`}
          alt="Anatomie musculaire — face, dos, profil"
          className="absolute inset-0 h-full w-full object-contain object-center"
          draggable={false}
        />
        {spots.map((spot) => {
          const protocol = BODY_ZONE_PROTOCOLS.find((z) => z.slug === spot.slug);
          if (!protocol) return null;
          const active = selectedSlugs.includes(spot.slug) || highlightSlug === spot.slug;
          return (
            <button
              type="button"
              key={`${view}-${spot.slug}-${spot.x}`}
              onClick={() => handleZoneClick(spot.slug)}
              className={cn(
                "absolute rounded-full border-2 transition-all",
                active
                  ? activeCls
                  : "border-sky-500/70 bg-sky-400/20 hover:bg-sky-400/40",
              )}
              style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }}
              aria-label={protocol.label}
              title={`${protocol.label} · ${protocol.durationMinutes} min`}
              data-testid={`button-body-zone-${spot.slug}`}
            >
              {showLabels && (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-background/90 px-1.5 text-[9px] font-medium text-foreground shadow">
                  {protocol.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        Cliquez une zone — le protocole ventouses (durée, points, taille) s&apos;affiche.
      </p>
    </div>
  );
}

export function ProtocolCard({ protocol }: { protocol: ZoneProtocol }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-secondary/30 p-4 text-sm" data-testid="card-zone-protocol">
      <p className="font-mono text-[10px] uppercase tracking-[.14em] text-primary">
        Protocole ventouses · {protocol.label}
      </p>
      <div className="mt-3 grid gap-2 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Durée</span>
          <strong>{protocol.durationMinutes} min</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Ventouses</span>
          <strong className="text-right">{protocol.cupSize}</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Fréquence</span>
          <strong className="text-right">{protocol.frequency}</strong>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{protocol.technique}</p>
      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">Points</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {protocol.points.map((p) => (
            <span key={p} className="rounded-md bg-background px-2 py-0.5 text-[10px]">
              {p}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-3 text-[10px] text-amber-700">⚠ {protocol.precautions}</p>
    </div>
  );
}
