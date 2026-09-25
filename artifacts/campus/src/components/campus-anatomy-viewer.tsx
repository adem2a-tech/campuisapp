import { Link } from "wouter";
import { AnatomyViewer } from "@/components/anatomy-3d/AnatomyViewer";
import { cn } from "@/lib/utils";
import type { AnatomyFocus } from "@/lib/oscar-focus";
import { Mars, Venus } from "lucide-react";
import { useState } from "react";

type Props = {
  className?: string;
  focus?: AnatomyFocus | null;
};

/**
 * Campus 3D — modèle GLB contrôlé (zones + trait de légende).
 * Sync fiable depuis Formation (pas la recherche Oscar approximative).
 */
export function CampusAnatomyViewer({ className, focus = null }: Props) {
  const [sexHint, setSexHint] = useState<"M" | "F" | null>("M");

  return (
    <div className={cn("space-y-3", className)} data-testid="campus-anatomy-viewer">
      {focus ? (
        <div
          className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3"
          data-testid="anatomy-focus-banner"
        >
          <p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary">
            Synchronisé depuis Formation
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {focus.protocolTitle
              ? `P${focus.protocolNumber} · ${focus.protocolTitle}`
              : focus.legendLabel}
            <span className="font-normal text-slate-500"> → {focus.zoneLabel}</span>
          </p>
          {focus.organHints.length > 0 ? (
            <p className="mt-1 text-xs text-slate-600">Repères : {focus.organHints.join(" · ")}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600">
        <div>
          <p className="font-semibold text-slate-900">Campus 3D</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Zone ciblée + trait de légende. Cliquez un muscle ou utilisez la recherche.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setSexHint("M")}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
              sexHint === "M" ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <Mars size={13} /> Homme
          </button>
          <button
            type="button"
            onClick={() => setSexHint("F")}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
              sexHint === "F" ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <Venus size={13} /> Femme
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-slate-200 bg-[#0c1218] shadow-sm",
          sexHint === "F" && "hue-rotate-[-8deg]",
        )}
      >
        <AnatomyViewer
          focusZoneId={focus?.zoneId ?? null}
          focusLegend={focus?.legendLabel ?? null}
          focusProtocolNumber={focus?.protocolNumber ?? null}
          focusOrgans={focus?.organHints ?? null}
          className="min-h-[min(78vh,820px)]"
          canvasClassName="!h-[min(78vh,820px)] min-h-[420px]"
        />
      </div>

      <p className="text-[11px] text-slate-500">
        Modèle musculaire Campus · pour un explorateur organique complet :{" "}
        <Link href="/anatomie?oscar=1" className="underline hover:text-slate-700">
          ouvrir Oscar (optionnel)
        </Link>
        .
      </p>
    </div>
  );
}
