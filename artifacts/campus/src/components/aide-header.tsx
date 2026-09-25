import { useEffect, useRef, useState } from "react";
import { Lightbulb, X } from "lucide-react";
import { Link } from "wouter";
import { aideHintForPath } from "@/lib/aide-suivi";
import { cn } from "@/lib/utils";

/** Bouton « Aide » (ampoule) dans le header — rappel suivi pas à pas selon la page. */
export function AideHeaderButton({ path }: { path: string }) {
  const [query, setQuery] = useState(() => (typeof window !== "undefined" ? window.location.search : ""));
  const fullPath = path.includes("?") ? path : `${path}${query}`;
  const hint = aideHintForPath(fullPath);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setQuery(typeof window !== "undefined" ? window.location.search : "");
  }, [path]);

  useEffect(() => {
    const sync = () => setQuery(window.location.search);
    window.addEventListener("popstate", sync);
    const id = window.setInterval(sync, 400);
    return () => {
      window.removeEventListener("popstate", sync);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!hint) return null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold shadow-sm backdrop-blur transition",
          open
            ? "border-primary/40 bg-primary text-primary-foreground"
            : "border-white/70 bg-white/50 text-muted-foreground hover:bg-white/80 hover:text-foreground",
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
        data-testid="button-header-aide"
      >
        <Lightbulb size={15} strokeWidth={2} />
        <span className="hidden sm:inline">Aide</span>
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(calc(100vw-2rem),340px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          role="dialog"
          aria-label="Aide suivi pas à pas"
          data-testid="panel-header-aide"
        >
          <div className="flex items-start gap-3 bg-[#132338] px-4 py-3.5 text-white">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/10">
              <Lightbulb size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                Aide · Suivi pas à pas
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug">{hint.hook}</p>
              <p className="mt-1 text-[12px] text-white/70">
                Je vois que vous êtes sur {hint.where}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 hover:bg-white/15"
              aria-label="Fermer"
            >
              <X size={15} />
            </button>
          </div>

          <div className="space-y-3 px-4 py-3.5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/80">
                {hint.moduleTitle}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{hint.step.title}</p>
              <p className="mt-2 rounded-xl bg-primary/10 px-3 py-2.5 text-[13px] font-semibold leading-snug text-primary">
                À faire — {hint.step.action}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{hint.step.detail}</p>
            </div>

            {hint.step.checklist.length > 0 ? (
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Checklist</p>
                <ul className="grid gap-1.5">
                  {hint.step.checklist.map((c) => (
                    <li
                      key={c}
                      className="rounded-lg border border-primary/10 bg-secondary/50 px-2.5 py-1.5 text-[12px] font-medium text-slate-800"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="text-[10px] text-muted-foreground">Source : {hint.step.source}</p>

            <Link
              href="/formation"
              onClick={() => setOpen(false)}
              className="inline-flex text-sm font-semibold text-primary hover:underline"
              data-testid="link-aide-formation"
            >
              Ouvrir le suivi pas à pas →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
