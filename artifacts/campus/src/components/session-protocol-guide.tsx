import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ListOrdered, Package } from "lucide-react";
import type { VentouseProtocol } from "@/lib/ventouse-protocols";
import { cn } from "@/lib/utils";

/**
 * Contenu Formation intégré en séance — schéma & points + étapes (pas un simple résumé).
 */
export function SessionProtocolGuide({
  protocol,
  className,
}: {
  protocol: VentouseProtocol;
  className?: string;
}) {
  const [materialDone, setMaterialDone] = useState<Record<string, boolean>>({});
  const [stepsDone, setStepsDone] = useState<Record<string, boolean>>({});
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    setMaterialDone({});
    setStepsDone({});
    setZoom(false);
  }, [protocol.number]);

  const materialReady =
    protocol.material.length > 0 && protocol.material.every((m) => materialDone[m]);
  const stepsReady = protocol.steps.length > 0 && protocol.steps.every((s) => stepsDone[s.title]);

  return (
    <div
      className={cn("space-y-4", className)}
      data-testid="session-protocol-guide"
      id="session-que-faire"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-[#132338] px-5 py-4 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/80">
            Protocole Formation · #{protocol.number}
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">{protocol.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-white/70">{protocol.objective}</p>
        </div>

        <div className="space-y-5 p-4 md:p-5">
          {protocol.material.length > 0 ? (
            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Package size={16} className="text-primary" /> 1 · Matériel
                </p>
                <span className={cn("text-xs font-medium", materialReady ? "text-primary" : "text-slate-500")}>
                  {protocol.material.filter((m) => materialDone[m]).length}/{protocol.material.length}
                </span>
              </div>
              <ul className="space-y-2">
                {protocol.material.map((m) => {
                  const on = !!materialDone[m];
                  return (
                    <li key={m}>
                      <button
                        type="button"
                        onClick={() => setMaterialDone((prev) => ({ ...prev, [m]: !prev[m] }))}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition",
                          on ? "border-primary/40 bg-primary/5" : "border-slate-200 bg-slate-50 hover:border-primary/30",
                        )}
                      >
                        {on ? (
                          <CheckCircle2 size={18} className="shrink-0 text-primary" />
                        ) : (
                          <Circle size={18} className="shrink-0 text-slate-300" />
                        )}
                        {m}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-2xl border border-border">
            <div className="border-b border-border/70 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-900">2 · Schéma & points</h4>
              <p className="mt-0.5 text-xs text-slate-500">Même fiche que en Formation — points d’application.</p>
            </div>
            <button
              type="button"
              className="block w-full bg-slate-50 p-3"
              onClick={() => setZoom(true)}
              title="Agrandir le schéma"
            >
              <img
                src={protocol.anatomyImageSrc}
                alt={`Points d'application — protocole ${protocol.number}`}
                className="mx-auto w-full rounded-xl border border-primary/15 bg-white object-contain shadow-sm"
                style={{ maxHeight: "min(65vh, 520px)" }}
              />
            </button>
            <ol className="grid gap-2 border-t border-border/70 p-4 sm:grid-cols-2">
              {protocol.applicationPoints.map((point, idx) => (
                <li
                  key={point}
                  className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-3 text-sm font-medium text-slate-800"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {idx + 1}
                  </span>
                  {point}
                </li>
              ))}
            </ol>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ListOrdered size={16} className="text-primary" /> 3 · Étape par étape
              </p>
              <span className={cn("text-xs font-medium", stepsReady ? "text-primary" : "text-slate-500")}>
                {protocol.steps.filter((s) => stepsDone[s.title]).length}/{protocol.steps.length}
              </span>
            </div>
            <div className="space-y-2">
              {protocol.steps.map((s, idx) => {
                const on = !!stepsDone[s.title];
                return (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => setStepsDone((prev) => ({ ...prev, [s.title]: !prev[s.title] }))}
                    className={cn(
                      "flex w-full gap-3 rounded-xl border p-3 text-left transition",
                      on ? "border-primary/35 bg-primary/5" : "border-slate-200 bg-white",
                    )}
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {idx + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">{s.title}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-slate-600">{s.detail}</span>
                    </span>
                    {on ? <CheckCircle2 size={18} className="shrink-0 text-primary" /> : null}
                  </button>
                );
              })}
            </div>
          </section>

          {protocol.proTip ? (
            <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
              <strong className="font-semibold">Astuce — </strong>
              {protocol.proTip}
            </p>
          ) : null}
        </div>
      </div>

      {zoom ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setZoom(false)}
          role="dialog"
          aria-modal
        >
          <img
            src={protocol.anatomyImageSrc}
            alt=""
            className="max-h-[92vh] max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
