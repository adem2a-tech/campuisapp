import { useMemo, useState } from "react";
import { ExternalLink, Mars, Venus } from "lucide-react";
import { cn } from "@/lib/utils";
import { oscarEmbedSrc, type OscarFocus } from "@/lib/oscar-focus";

const OSCAR_EXTERNAL = "https://cosphilog.fr/oscar3d/";

type Props = {
  className?: string;
  height?: string;
  focus?: OscarFocus | null;
};

/**
 * Campus 3D — modèle interactif (base Oscar) + sync Formation.
 */
export function Oscar3dViewer({ className, height = "min(78vh, 820px)", focus = null }: Props) {
  const [sex, setSex] = useState<"M" | "F" | undefined>(undefined);

  const src = useMemo(() => {
    const base = oscarEmbedSrc();
    const params = new URLSearchParams();
    if (focus?.searchQuery) params.set("q", String(focus.searchQuery));
    if (sex) params.set("sex", sex);
    if (focus?.legendTerms?.length) params.set("legends", focus.legendTerms.join(","));
    const qs = params.toString();
    return qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base;
  }, [focus?.searchQuery, focus?.legendTerms, sex]);

  const fullscreenHref = useMemo(() => {
    const params = new URLSearchParams();
    if (focus?.searchQuery) params.set("q", focus.searchQuery);
    if (sex) params.set("sex", sex);
    if (focus?.legendTerms?.length) params.set("legends", focus.legendTerms.join(","));
    const qs = params.toString();
    return `${import.meta.env.BASE_URL || "/"}oscar3d/${qs ? `?${qs}` : ""}`;
  }, [focus?.searchQuery, focus?.legendTerms, sex]);

  return (
    <div className={cn("space-y-3", className)} data-testid="oscar3d-viewer">
      {focus ? (
        <div className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3" data-testid="oscar-focus-banner">
          <p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary">
            Synchronisé depuis Formation
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {focus.protocolTitle
              ? `P${focus.protocolNumber} · ${focus.protocolTitle}`
              : focus.zoneLabel}
            <span className="font-normal text-slate-500"> → {focus.zoneLabel}</span>
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Recherche : <strong>{focus.searchQuery}</strong>
            {focus.organHints.length > 0 ? <> · {focus.organHints.join(" · ")}</> : null}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600">
        <div>
          <p className="font-semibold text-slate-900">Campus 3D — anatomie interactive</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Panneaux gauche/droite rétractables dans le viewer · traits de légende sur la zone ciblée · ♂/♀ ci-dessous.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setSex("M")}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                sex === "M" ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-slate-50",
              )}
              data-testid="button-oscar-sex-m"
            >
              <Mars size={13} /> Homme
            </button>
            <button
              type="button"
              onClick={() => setSex("F")}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                sex === "F" ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-slate-50",
              )}
              data-testid="button-oscar-sex-f"
            >
              <Venus size={13} /> Femme
            </button>
          </div>
          <a
            href={fullscreenHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
          >
            Plein écran <ExternalLink size={13} />
          </a>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-2xl border border-slate-200 bg-[#0c1218] shadow-sm"
        style={{ height }}
      >
        <iframe
          key={src}
          title="Campus 3D — anatomie homme / femme"
          src={src}
          className="h-full w-full border-0"
          allow="fullscreen; clipboard-write"
          data-testid="iframe-oscar3d"
        />
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        Campus 3D s’appuie sur Oscar 3D © P. Cosentino —{" "}
        <a href={OSCAR_EXTERNAL} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-700">
          cosphilog.fr/oscar3d
        </a>{" "}
        · CC BY-NC-SA.
      </p>
    </div>
  );
}
