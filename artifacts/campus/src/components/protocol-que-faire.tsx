import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link } from "wouter";
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock3,
  Droplets,
  ExternalLink,
  FileText,
  FlaskConical,
  ListChecks,
  Sparkles,
  Timer,
  UserPlus,
  Wind,
} from "lucide-react";
import { formationPdfHref, getDocumentById } from "@/lib/formation-resources";
import { attachProtocolToClient } from "@/lib/client-day-protocols";
import { PROTOCOL_CATEGORIES, type VentouseProtocol } from "@/lib/ventouse-protocols";
import { zoneIdForProtocol, zoneLabelForId } from "@/lib/protocol-to-zone";
import { useListClients } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

type Props = {
  protocol: VentouseProtocol;
  backHref?: string;
  backLabel?: string;
  eyebrow?: string;
  titleOverride?: string;
  preselectedClientId?: number;
  /** Intégré dans Nouvelle session — même contenu Formation, sans navigation. */
  embedded?: boolean;
};

type LucideIcon = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

function materialIcon(label: string): LucideIcon {
  const s = label.toLowerCase();
  if (s.includes("ventouse")) return Wind;
  if (s.includes("pompe") || s.includes("aspiration")) return FlaskConical;
  if (s.includes("huile")) return Droplets;
  if (s.includes("serviette")) return Sparkles;
  if (s.includes("fiche") || s.includes("suivi")) return FileText;
  return ClipboardList;
}

function stepIcon(title: string): LucideIcon {
  const s = title.toLowerCase();
  if (s.includes("évalu")) return ListChecks;
  if (s.includes("prépar")) return Droplets;
  if (s.includes("applic")) return Wind;
  if (s.includes("dur")) return Timer;
  if (s.includes("retrait")) return Circle;
  if (s.includes("soin") || s.includes("après")) return Sparkles;
  return ListChecks;
}

export function ProtocolQueFaire({
  protocol,
  backHref = "/formation",
  backLabel = "Protocoles",
  eyebrow = "Que faire",
  titleOverride,
  preselectedClientId,
  embedded = false,
}: Props) {
  const cat = PROTOCOL_CATEGORIES.find((c) => c.id === protocol.categoryId);
  const pdfDoc = getDocumentById("protocoles-ventouses");
  const pdfHref = pdfDoc ? formationPdfHref(pdfDoc, protocol.pdfPage) : undefined;
  const clientsQ = useListClients({ status: "active" });
  const clients: any[] = Array.isArray(clientsQ.data) ? clientsQ.data : [];
  const zoneLabel = zoneLabelForId(zoneIdForProtocol(protocol));

  const [materialDone, setMaterialDone] = useState<Record<string, boolean>>({});
  const [stepsDone, setStepsDone] = useState<Record<string, boolean>>({});
  const [durationMin, setDurationMin] = useState(12);
  const [timerSec, setTimerSec] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [attachClientId, setAttachClientId] = useState(String(preselectedClientId || ""));
  const [attachMsg, setAttachMsg] = useState("");
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    setMaterialDone({});
    setStepsDone({});
    setDurationMin(12);
    setTimerSec(null);
    setTimerRunning(false);
    setAttachMsg("");
  }, [protocol.number]);

  useEffect(() => {
    if (!timerRunning || timerSec == null) return;
    if (timerSec <= 0) {
      setTimerRunning(false);
      return;
    }
    const id = window.setTimeout(() => setTimerSec((s) => (s == null ? s : s - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [timerRunning, timerSec]);

  const materialReady = useMemo(
    () => protocol.material.length > 0 && protocol.material.every((m) => materialDone[m]),
    [protocol.material, materialDone],
  );
  const stepsReady = useMemo(
    () => protocol.steps.length > 0 && protocol.steps.every((s) => stepsDone[s.title]),
    [protocol.steps, stepsDone],
  );

  function attachToClient() {
    const c = clients.find((x) => String(x.id) === attachClientId);
    if (!c) {
      setAttachMsg("Choisissez un client.");
      return;
    }
    attachProtocolToClient({
      clientId: c.id,
      clientName: `${c.firstName} ${c.lastName}`,
      protocolNumber: protocol.number,
      protocolTitle: protocol.title,
    });
    setAttachMsg(`Ajouté à ${c.firstName} pour la séance d’aujourd’hui`);
  }

  const timerLabel =
    timerSec == null
      ? null
      : `${String(Math.floor(timerSec / 60)).padStart(2, "0")}:${String(timerSec % 60).padStart(2, "0")}`;

  return (
    <div className={cn(embedded ? "w-full pb-2" : "mx-auto max-w-3xl pb-14")} data-testid={embedded ? "session-protocol-formation" : "protocol-que-faire"}>
      {!embedded && backHref ? (
        <Link href={backHref} className="mb-4 inline-flex text-sm font-medium text-slate-600 hover:text-slate-900">
          ← {backLabel}
        </Link>
      ) : null}

      <p className="text-xs font-semibold text-primary">{embedded ? "Protocole Formation · Que faire" : eyebrow}</p>
      {titleOverride ? <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{titleOverride}</h2> : null}

      <header className="mt-4 rounded-2xl bg-primary px-5 py-5 text-primary-foreground md:px-6">
        <p className="text-xs font-medium text-primary-foreground/70">Protocole {protocol.number}</p>
        <h3 className="mt-1 text-2xl font-semibold tracking-tight">{protocol.title}</h3>
        <p className="mt-1 text-sm text-primary-foreground/75">{cat?.label}</p>
        <p className="mt-3 text-sm leading-relaxed text-primary-foreground/90">{protocol.objective}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex h-10 items-center rounded-xl bg-white/15 px-3 text-xs text-primary-foreground/90">
            Zone : {zoneLabel}
          </span>
          {embedded ? (
            <Link
              href={`/formation/protocole/${protocol.number}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-semibold text-primary"
            >
              Ouvrir en Formation <ExternalLink size={13} />
            </Link>
          ) : null}
        </div>
      </header>

      <div className="mt-5 space-y-5">
        {!embedded ? (
        <section className="surface rounded-2xl p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[200px] flex-1 text-sm font-medium text-slate-700">
              Ajouter à un client (séance du jour)
              <select
                className="mt-1.5 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
                value={attachClientId}
                onChange={(e) => setAttachClientId(e.target.value)}
                data-testid="select-attach-protocol-client"
              >
                <option value="">— Choisir un client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={attachToClient}
              className="btn-primary inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm"
              data-testid="button-attach-protocol-client"
            >
              <UserPlus size={16} /> Ajouter
            </button>
          </div>
          {attachMsg ? (
            <p className="mt-2 text-sm font-medium text-primary">
              {attachMsg}
              {attachClientId ? (
                <>
                  {" · "}
                  <Link href={`/clients/${attachClientId}`} className="underline">
                    Ouvrir le dossier
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
        </section>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs font-semibold text-primary">Indications</p>
            <ul className="mt-2 space-y-1.5">
              {protocol.indications.map((i) => (
                <li key={i} className="text-sm leading-snug text-slate-700">
                  · {i}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
            <p className="text-xs font-semibold text-rose-800">Contre-indications</p>
            <ul className="mt-2 space-y-1.5">
              {protocol.contraindications.map((i) => (
                <li key={i} className="text-sm leading-snug text-slate-700">
                  · {i}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="surface rounded-2xl p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-base font-semibold text-slate-900">1 · Matériel à préparer</h4>
            <span className={cn("text-sm font-medium", materialReady ? "text-primary" : "text-slate-500")}>
              {protocol.material.filter((m) => materialDone[m]).length}/{protocol.material.length}
            </span>
          </div>
          <ul className="space-y-2">
            {protocol.material.map((m) => {
              const on = !!materialDone[m];
              const Icon = materialIcon(m);
              return (
                <li key={m}>
                  <button
                    type="button"
                    onClick={() => setMaterialDone((prev) => ({ ...prev, [m]: !prev[m] }))}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition",
                      on
                        ? "border-primary/40 bg-primary/5"
                        : "border-transparent bg-slate-50 hover:bg-white hover:border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-11 shrink-0 place-items-center rounded-xl text-white shadow-sm",
                        on ? "bg-[#132338]" : "bg-primary",
                      )}
                    >
                      <Icon size={22} strokeWidth={2.25} />
                    </span>
                    <span className="flex-1 text-[15px] font-medium text-slate-900">{m}</span>
                    {on ? (
                      <CheckCircle2 size={22} className="shrink-0 text-primary" strokeWidth={2.25} />
                    ) : (
                      <Circle size={22} className="shrink-0 text-slate-300" strokeWidth={2} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Schéma PDF d’origine + points (couleurs app) */}
        <section className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="border-b border-border/70 px-4 py-3">
            <h4 className="text-base font-semibold text-slate-900">2 · Schéma & points</h4>
            <p className="mt-0.5 text-sm text-slate-600">Schéma PDF — repérez les numéros, puis la liste ci-dessous.</p>
          </div>
          <button
            type="button"
            className="block w-full bg-slate-50 p-3 md:p-4"
            onClick={() => setZoom(true)}
            title="Agrandir le schéma"
          >
            <img
              src={protocol.anatomyImageSrc}
              alt={`Points d'application — protocole ${protocol.number}`}
              className="protocol-diagram mx-auto w-full rounded-xl border border-primary/15 bg-white object-contain shadow-sm"
              style={{ maxHeight: embedded ? "min(78vh, 720px)" : "min(70vh, 640px)" }}
              loading="eager"
              decoding="async"
            />
          </button>
          <p className="px-4 pb-2 text-center text-xs text-slate-500">Touchez le schéma pour l’agrandir</p>
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

        <section className="surface rounded-2xl p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-base font-semibold text-slate-900">3 · Étape par étape</h4>
            <span className={cn("text-sm font-medium", stepsReady ? "text-primary" : "text-slate-500")}>
              {protocol.steps.filter((s) => stepsDone[s.title]).length}/{protocol.steps.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {protocol.steps.map((s, idx) => {
              const on = !!stepsDone[s.title];
              const isDuree = /dur[ée]e/i.test(s.title);
              const Icon = stepIcon(s.title);
              return (
                <div
                  key={s.title}
                  className={cn(
                    "rounded-2xl border p-3.5 transition",
                    on ? "border-primary/35 bg-primary/5" : "border-border/80 bg-white",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setStepsDone((prev) => ({ ...prev, [s.title]: !prev[s.title] }))}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-11 shrink-0 place-items-center rounded-xl text-white shadow-sm",
                        on ? "bg-[#132338]" : "bg-primary",
                      )}
                    >
                      <Icon size={22} strokeWidth={2.25} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400">{idx + 1}</span>
                        <span className="text-[15px] font-semibold text-slate-900">{s.title}</span>
                        {on ? <CheckCircle2 size={16} className="text-primary" /> : null}
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-slate-600">{s.detail}</span>
                    </span>
                  </button>
                  {isDuree ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock3 size={16} />
                        Minutes
                        <input
                          type="number"
                          min={5}
                          max={20}
                          value={durationMin}
                          onChange={(e) => setDurationMin(Number(e.target.value) || 12)}
                          className="h-9 w-16 rounded-lg border border-slate-200 px-2 text-sm"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setTimerSec(durationMin * 60);
                          setTimerRunning(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                      >
                        <Timer size={15} /> Chrono
                      </button>
                      {timerLabel ? (
                        <span className={cn("font-semibold tabular-nums", timerSec === 0 ? "text-[#132338]" : "text-primary")}>
                          {timerSec === 0 ? "Terminé" : timerLabel}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {protocol.proTip ? (
          <section className="rounded-2xl bg-primary px-4 py-4 text-primary-foreground">
            <p className="text-xs font-semibold text-primary-foreground/70">Conseil pro</p>
            <p className="mt-1 text-sm leading-relaxed">{protocol.proTip}</p>
          </section>
        ) : null}

        {pdfHref ? (
          <a
            href={pdfHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Page PDF source <ExternalLink size={14} />
          </a>
        ) : null}
      </div>

      {zoom ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setZoom(false)}
          role="dialog"
        >
          <img
            src={protocol.anatomyImageSrc}
            alt="Schéma agrandi"
            className="max-h-[92vh] max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
