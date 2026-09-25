import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Search, X } from "lucide-react";
import { ANATOMY_ZONES, searchAnatomyZones, type AnatomyZoneId } from "@/lib/anatomy-zones";
import { cn } from "@/lib/utils";

const IMG = `${import.meta.env.BASE_URL}anatomy-3d.png`;

const HOTSPOTS: Array<{
  zoneId: AnatomyZoneId;
  x: number;
  y: number;
  w: number;
  h: number;
}> = [
  { zoneId: "crane", x: 12, y: 3, w: 8, h: 9 },
  { zoneId: "machoire", x: 14, y: 10, w: 5, h: 4 },
  { zoneId: "nuque", x: 47, y: 13, w: 6, h: 7 },
  { zoneId: "trapeze", x: 44, y: 18, w: 12, h: 8 },
  { zoneId: "dorsal", x: 44, y: 26, w: 12, h: 12 },
  { zoneId: "lombaires", x: 45, y: 38, w: 10, h: 12 },
  { zoneId: "sacrum", x: 46, y: 48, w: 8, h: 7 },
  { zoneId: "epaule", x: 18, y: 18, w: 7, h: 8 },
  { zoneId: "bras", x: 20, y: 28, w: 5, h: 12 },
  { zoneId: "thorax", x: 11, y: 22, w: 10, h: 10 },
  { zoneId: "abdomen", x: 12, y: 34, w: 8, h: 10 },
  { zoneId: "hanche", x: 11, y: 48, w: 10, h: 8 },
  { zoneId: "cuisse", x: 12, y: 56, w: 8, h: 12 },
  { zoneId: "genou", x: 13, y: 68, w: 6, h: 8 },
  { zoneId: "mollet", x: 13, y: 78, w: 6, h: 10 },
  { zoneId: "pied", x: 13, y: 89, w: 7, h: 8 },
];

type Props = {
  compact?: boolean;
  focusZoneId?: AnatomyZoneId | null;
  hideSearch?: boolean;
  className?: string;
  linkToQueFaire?: boolean;
};

export function AnatomyImageBoard({
  compact = false,
  focusZoneId = null,
  hideSearch = false,
  className,
  linkToQueFaire = true,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<AnatomyZoneId | null>(focusZoneId);
  const suggestions = useMemo(() => searchAnatomyZones(query), [query]);

  useEffect(() => {
    if (focusZoneId) setActiveId(focusZoneId);
  }, [focusZoneId]);

  const highlighted = focusZoneId || activeId;
  const activeZone = highlighted ? ANATOMY_ZONES.find((z) => z.id === highlighted) : null;

  return (
    <div className={cn("space-y-4", className)} data-testid="anatomy-image-board">
      {!hideSearch ? (
        <div className="relative mx-auto w-full max-w-xl">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une zone… cuisse, dos, nuque…"
              className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              data-testid="input-anatomy-search"
            />
            {query ? (
              <button type="button" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" onClick={() => setQuery("")} aria-label="Effacer">
                <X size={14} />
              </button>
            ) : null}
          </div>
          {query.trim().length >= 2 && suggestions.length > 0 ? (
            <ul className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-20 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {suggestions.map((z) => (
                <li key={z.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm hover:bg-slate-50"
                    onClick={() => {
                      setActiveId(z.id);
                      setQuery(z.label);
                    }}
                  >
                    <span className="font-medium">{z.label}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Voir</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "relative mx-auto w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-[#f7f5f1]",
          compact ? "max-w-2xl aspect-[1.55]" : "max-w-4xl aspect-[1.55]",
        )}
      >
        <img src={IMG} alt="Anatomie musculaire — face, dos, profil" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
        {HOTSPOTS.map((spot) => {
          const zone = ANATOMY_ZONES.find((z) => z.id === spot.zoneId);
          const on = highlighted === spot.zoneId;
          return (
            <button
              type="button"
              key={`${spot.zoneId}-${spot.x}`}
              onClick={() => setActiveId(spot.zoneId)}
              className={cn(
                "absolute cursor-pointer rounded-full transition",
                on
                  ? "border-2 border-sky-500 bg-sky-400/35 shadow-[0_0_0_4px_rgba(14,165,233,0.25)]"
                  : "border-0 bg-transparent hover:bg-sky-400/15",
              )}
              style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }}
              title={zone?.label}
              aria-label={zone?.label}
              aria-pressed={on}
              data-testid={`button-anatomy-zone-${spot.zoneId}`}
            />
          );
        })}
      </div>

      {activeZone ? (
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Zone sélectionnée</p>
            <p className="text-base font-semibold text-slate-900">{activeZone.label}</p>
            <p className="text-sm text-slate-500">{activeZone.painQuestion}</p>
          </div>
          {linkToQueFaire ? (
            <Link
              href={`/anatomie/${activeZone.id}`}
              className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              data-testid="link-anatomy-que-faire"
            >
              Que faire
            </Link>
          ) : null}
        </div>
      ) : (
        <p className="text-center text-sm text-slate-500">Cliquez une zone sur l’image ou recherchez (nuque, lombaires, bras…).</p>
      )}

      {!compact ? (
        <div className="mx-auto flex max-w-4xl flex-wrap gap-2">
          {ANATOMY_ZONES.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setActiveId(z.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                highlighted === z.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
              )}
            >
              {z.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
