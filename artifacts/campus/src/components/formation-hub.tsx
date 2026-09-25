import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  FORMATION_PARCOURS,
  clearParcoursProgress,
  loadParcoursProgress,
  saveParcoursProgress,
  trackLabel,
} from "@/lib/formation-parcours";
import { formationPdfHref, getDocumentById } from "@/lib/formation-resources";
import { listProtocolPractice } from "@/lib/protocol-practice-log";
import {
  PROTOCOL_CATEGORIES,
  searchVentouseProtocols,
  type ProtocolCategoryId,
} from "@/lib/ventouse-protocols";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, FileText, RotateCcw } from "lucide-react";
import { zoneIdForProtocol, zoneLabelForId } from "@/lib/protocol-to-zone";

type Tab = "suivi" | "protocoles" | "pdf";

const FLAT_STEPS = FORMATION_PARCOURS.flatMap((mod, mi) =>
  mod.steps.map((step, si) => ({
    ...step,
    moduleId: mod.id,
    moduleTitle: mod.title,
    track: mod.track,
    globalIndex: FORMATION_PARCOURS.slice(0, mi).reduce((n, m) => n + m.steps.length, 0) + si,
  })),
);

export function FormationHub({ initialTab = "suivi" }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const saved = useMemo(() => loadParcoursProgress(), []);
  const initialIdx = Math.max(0, FLAT_STEPS.findIndex((s) => s.id === saved?.stepId));
  const [stepIdx, setStepIdx] = useState(initialIdx >= 0 ? initialIdx : 0);
  const [done, setDone] = useState<string[]>(saved?.doneStepIds ?? []);
  const [protoQuery, setProtoQuery] = useState("");
  const [categoryId, setCategoryId] = useState<ProtocolCategoryId | "all">("all");
  const [practiceLog, setPracticeLog] = useState(() => listProtocolPractice());

  const step = FLAT_STEPS[stepIdx] ?? FLAT_STEPS[0]!;
  const progressPct = Math.round((done.length / FLAT_STEPS.length) * 100);

  useEffect(() => {
    saveParcoursProgress({
      moduleId: step.moduleId,
      stepId: step.id,
      doneStepIds: done,
      updatedAt: new Date().toISOString(),
    });
  }, [step.moduleId, step.id, done]);

  useEffect(() => {
    if (tab === "suivi") setPracticeLog(listProtocolPractice());
  }, [tab]);

  function markDoneAndNext() {
    setDone((d) => (d.includes(step.id) ? d : [...d, step.id]));
    if (stepIdx < FLAT_STEPS.length - 1) setStepIdx(stepIdx + 1);
  }

  function resetParcours() {
    if (!window.confirm("Réinitialiser tout le suivi pas à pas ? La progression sera remise à zéro.")) return;
    clearParcoursProgress();
    setDone([]);
    setStepIdx(0);
  }

  const protocols = useMemo(
    () => searchVentouseProtocols(protoQuery, categoryId),
    [protoQuery, categoryId],
  );

  return (
    <div className="formation-shell space-y-5">
      {/* Barre de suivi toujours visible */}
      <div className="sticky top-[88px] z-10 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-[#132338] px-4 py-2.5 text-white">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">Formation</span>
          <span className="text-white/35">·</span>
          <span className="text-xs font-semibold">
            {tab === "suivi" ? "Suivi pas à pas" : tab === "protocoles" ? "Protocoles" : "PDF originaux"}
          </span>
          {tab === "suivi" ? (
            <>
              <span className="text-white/35">·</span>
              <span className="text-xs text-white/80">
                Étape {stepIdx + 1}/{FLAT_STEPS.length} — {step.title}
              </span>
            </>
          ) : null}
          <span className="ml-auto font-mono text-[10px] text-white/55">{progressPct}%</span>
        </div>
        {tab === "suivi" ? (
          <div className="flex gap-1 overflow-x-auto px-3 py-2.5">
            {FLAT_STEPS.slice(Math.max(0, stepIdx - 1), stepIdx + 4).map((s) => {
              const i = FLAT_STEPS.findIndex((x) => x.id === s.id);
              const active = i === stepIdx;
              const isDone = done.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStepIdx(i)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition",
                    active
                      ? "bg-[#132338] text-white"
                      : isDone
                        ? "bg-primary/10 text-primary"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  <span className="font-mono text-[9px]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="max-w-[140px] truncate">{s.title}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-2.5 text-xs text-slate-500">
            {tab === "protocoles"
              ? "Ouvrez Que faire pour la fiche protocole — le suivi reste accessible via l’onglet Suivi pas à pas."
              : "Documents PDF de référence Formation."}
          </div>
        )}
      </div>

      <div className="glass-ice inline-flex rounded-2xl p-1.5">
        {(
          [
            ["suivi", "Suivi pas à pas"],
            ["protocoles", "Protocoles"],
            ["pdf", "PDF originaux"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              tab === id ? "bg-primary text-primary-foreground shadow-sm" : "text-slate-600 hover:bg-white/50",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "suivi" && (
        <div className="space-y-5">
          <div className="surface rounded-2xl p-4 md:p-5">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-primary" />
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-500">
                Séances ventouses enregistrées
              </p>
            </div>
            {practiceLog.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">
                Aucune séance encore. Ouvrez un protocole → Que faire → appliquez en nouvelle session.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {practiceLog.slice(0, 8).map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/formation/protocole/${e.protocolNumber}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2.5 text-sm transition hover:bg-white"
                    >
                      <span className="font-semibold text-slate-900">
                        P{e.protocolNumber} · {e.protocolTitle}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(e.createdAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {e.beforeFeeling}→{e.afterFeeling}/10 · {e.durationMinutes} min
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <button type="button" onClick={() => setTab("protocoles")} className="text-sm font-semibold text-primary hover:underline">
                Choisir un protocole à pratiquer →
              </button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <aside className="glass-ice max-h-[70vh] space-y-1 overflow-y-auto rounded-2xl p-3">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
              Progression {progressPct}%
            </p>
            <div className="mb-3 mx-2 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            {FLAT_STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStepIdx(i)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-xl px-2.5 py-2.5 text-left text-[13px] transition",
                  i === stepIdx ? "bg-secondary text-primary" : "hover:bg-white/60 text-slate-700",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                    done.includes(s.id)
                      ? "bg-primary text-white"
                      : i === stepIdx
                        ? "bg-primary text-white"
                        : "bg-slate-200 text-slate-600",
                  )}
                >
                  {done.includes(s.id) ? "✓" : i + 1}
                </span>
                <span className="font-medium leading-snug">{s.title}</span>
              </button>
            ))}
          </aside>

          <div className="glass-ice overflow-hidden rounded-2xl">
            <div className="border-b border-white/50 bg-white/35 px-5 py-4 md:px-7">
              <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-primary">
                Étape {stepIdx + 1} / {FLAT_STEPS.length} · {trackLabel(step.track)}
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{step.moduleTitle}</p>
            </div>
            <div className="space-y-5 p-5 md:p-7">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-primary">À faire maintenant</p>
                <p className="mt-2 text-base font-semibold leading-7">{step.action}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-slate-500">Pourquoi</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{step.detail}</p>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.1em] text-slate-500">Checklist</p>
                <ul className="space-y-2">
                  {step.checklist.map((c) => (
                    <li key={c} className="glass-ice-soft flex gap-2 rounded-xl px-3 py-2.5 text-sm">
                      <CheckCircle2
                        size={16}
                        className={cn(
                          "mt-0.5 shrink-0",
                          done.includes(step.id) ? "text-primary" : "text-slate-400",
                        )}
                      />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-[11px] text-slate-500">Source : {step.source}</p>
              {step.id === "d2-s3" && (
                <Link href="/formation" className="btn-primary inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm">
                  Voir les protocoles <ArrowRight size={16} />
                </Link>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={stepIdx === 0}
                  onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-white/70 bg-white/50 px-4 text-sm font-medium disabled:opacity-40"
                >
                  <ArrowLeft size={15} /> Précédent
                </button>
                <button
                  type="button"
                  onClick={markDoneAndNext}
                  className="btn-primary inline-flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm"
                >
                  {done.includes(step.id) ? "Étape suivante" : "Fait — suivante"} <ArrowRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={resetParcours}
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-800 hover:bg-rose-100"
                  data-testid="button-formation-reset"
                >
                  <RotateCcw size={15} /> Réinitialiser
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {tab === "protocoles" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
                150 protocoles ventouses
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {protocols.length} fiche{protocols.length > 1 ? "s" : ""} — cliquez Que faire pour ouvrir la fiche
              </p>
            </div>
            <input
              value={protoQuery}
              onChange={(e) => setProtoQuery(e.target.value)}
              placeholder="Rechercher : céphalée, lombaire…"
              className="glass-ice h-11 w-full max-w-lg rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategoryId("all")}
              className={cn(
                "shrink-0 rounded-xl px-3.5 py-2 text-[12px] font-semibold transition",
                categoryId === "all" ? "bg-primary text-primary-foreground" : "glass-ice text-slate-600",
              )}
            >
              Tous
            </button>
            {PROTOCOL_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  "shrink-0 rounded-xl px-3.5 py-2 text-[12px] font-semibold transition",
                  categoryId === c.id ? "bg-primary text-primary-foreground" : "glass-ice text-slate-600",
                )}
              >
                {c.pageFrom}–{c.pageTo} · {c.label}
              </button>
            ))}
          </div>

          <div className="relative z-10 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {protocols.map((p) => {
              const zoneId = zoneIdForProtocol(p);
              const zoneLabel = zoneLabelForId(zoneId);
              return (
                <div
                  key={p.id}
                  className="glass-ice group relative z-10 rounded-2xl p-4 text-left transition hover:bg-white/85"
                  data-testid={`card-protocole-${p.number}`}
                >
                  <Link href={`/formation/protocole/${p.number}`} data-testid={`link-protocole-${p.number}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-primary">
                      Protocole {p.number}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold leading-snug text-slate-900">{p.title}</p>
                    <p className="mt-1.5 line-clamp-2 text-[12px] text-slate-600">{p.indications.join(" · ")}</p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      Zone : <span className="font-medium text-slate-700">{zoneLabel}</span>
                    </p>
                  </Link>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/formation/protocole/${p.number}`}
                      className="inline-flex items-center rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground"
                    >
                      Que faire
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {protocols.length === 0 && (
            <p className="glass-ice rounded-2xl p-6 text-sm text-slate-600">Aucun protocole pour cette recherche.</p>
          )}
        </div>
      )}

      {tab === "pdf" && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["evaluation-professionnelle", "Évaluation professionnelle", "35 pages"],
            ["protocoles-ventouses", "150 protocoles ventouses", "153 pages"],
            ["guide-points", "Guide des points", "17 pages"],
          ].map(([id, title, meta]) => {
            const doc = getDocumentById(id);
            if (!doc) return null;
            return (
              <a
                key={id}
                href={formationPdfHref(doc)}
                target="_blank"
                rel="noreferrer"
                className="glass-ice rounded-2xl p-5 transition hover:bg-white/70"
              >
                <FileText className="text-primary" size={20} />
                <p className="mt-3 font-semibold">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{meta}</p>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
