import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, Lightbulb, X } from "lucide-react";
import { Link } from "wouter";
import {
  coachingContextFromPath,
  tipsFor,
  type CoachingContext,
  type CoachingTip,
} from "@/lib/pdf-coaching-tips";
import { cn } from "@/lib/utils";

const DISMISS_PREFIX = "campus-coach-dismiss:";

/** Barre sticky de rappels selon la page — liée au suivi pas à pas. */
export function StickyCoachingBar({ path }: { path: string }) {
  const context = coachingContextFromPath(path);
  if (!context) return null;
  return <PdfCoachingPanel context={context} sticky />;
}

export function PdfCoachingPanel({
  context,
  compact,
  sticky,
}: {
  context: CoachingContext;
  compact?: boolean;
  sticky?: boolean;
}) {
  const tips = tipsFor(context);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const primary = tips[0];

  useEffect(() => {
    setOpenId(null);
    setDismissed(false);
    try {
      if (sessionStorage.getItem(`${DISMISS_PREFIX}${context}`) === "1") {
        setDismissed(true);
      }
    } catch {
      /* ignore */
    }
  }, [context]);

  if (!tips.length || !primary || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(`${DISMISS_PREFIX}${context}`, "1");
    } catch {
      /* ignore */
    }
  }

  if (sticky) {
    const open = openId === primary.id;
    return (
      <div
        className="sticky top-[88px] z-[15] mb-5 overflow-hidden rounded-2xl border border-primary/15 bg-white/95 shadow-sm backdrop-blur-md"
        data-testid={`coaching-sticky-${context}`}
      >
        <div className="flex items-start gap-3 bg-[#132338] px-4 py-3 text-white">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/10">
            <Lightbulb size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
              Rappel · Suivi pas à pas
            </p>
            <p className="mt-0.5 text-sm font-semibold leading-snug">{primary.teaser}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpenId(open ? null : primary.id)}
            className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 hover:bg-white/15"
            aria-expanded={open}
            aria-label={open ? "Réduire" : "Détails"}
            data-testid="button-coach-expand"
          >
            <ChevronDown size={16} className={cn("transition", open && "rotate-180")} />
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 hover:bg-white/15"
            aria-label="Masquer le rappel"
            data-testid="button-coach-dismiss"
          >
            <X size={15} />
          </button>
        </div>

        {open ? (
          <div className="space-y-3 border-t border-slate-100 px-4 py-3.5">
            <TipDetails tip={primary} />
            {tips.slice(1).map((tip) => (
              <details key={tip.id} className="rounded-xl border border-slate-200 bg-slate-50/80">
                <summary className="cursor-pointer list-none px-3.5 py-2.5 text-sm font-semibold text-slate-900 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2">
                    <BookOpen size={14} className="shrink-0 text-primary" />
                    {tip.title}
                  </span>
                  <span className="mt-0.5 block pl-6 text-[12px] font-normal text-muted-foreground">
                    {tip.teaser}
                  </span>
                </summary>
                <div className="border-t border-slate-100 px-3.5 pb-3 pt-2">
                  <TipDetails tip={tip} />
                </div>
              </details>
            ))}
            <Link
              href="/formation"
              className="inline-flex text-sm font-semibold text-primary hover:underline"
              data-testid="link-coach-formation"
            >
              Pas sûr·e ? Revenez au suivi pas à pas →
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[12px] text-slate-600">
            <span>{primary.title}</span>
            <Link href="/formation" className="font-semibold text-primary hover:underline" data-testid="link-coach-formation-compact">
              Suivi pas à pas →
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-primary/15 bg-white shadow-sm",
        compact ? "p-3" : "p-4",
      )}
      data-testid={`coaching-${context}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Lightbulb size={15} />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-primary/70">
            Rappel · Suivi pas à pas
          </p>
          <p className="text-sm font-semibold text-slate-900">Que faire à ce moment-là ?</p>
        </div>
      </div>

      <div className="space-y-2">
        {tips.map((tip) => {
          const open = openId === tip.id;
          return (
            <div key={tip.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : tip.id)}
                className="flex w-full items-start gap-3 px-3.5 py-3 text-left"
                data-testid={`coaching-tip-${tip.id}`}
              >
                <BookOpen size={15} className="mt-0.5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{tip.title}</span>
                  <span className="mt-0.5 block text-[12px] leading-5 text-muted-foreground">{tip.teaser}</span>
                </span>
                <ChevronDown size={16} className={cn("mt-1 shrink-0 text-muted-foreground transition", open && "rotate-180")} />
              </button>
              {open && (
                <div className="border-t border-slate-100 px-3.5 pb-3.5 pt-2">
                  <TipDetails tip={tip} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Link href="/formation" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
        Revenir au suivi pas à pas →
      </Link>
    </div>
  );
}

function TipDetails({ tip }: { tip: CoachingTip }) {
  return (
    <>
      <div className="space-y-2 text-[13px] leading-6 text-foreground/90">
        {tip.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      {tip.checklist && tip.checklist.length > 0 ? (
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {tip.checklist.map((c) => (
            <li key={c} className="rounded-lg bg-primary/5 px-2.5 py-1.5 text-[12px] font-medium text-slate-800">
              — {c}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-[10px] text-muted-foreground">Source : {tip.source}</p>
    </>
  );
}
