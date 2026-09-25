import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Circle, X } from "lucide-react";
import { getVentouseProtocol } from "@/lib/ventouse-protocols";
import {
  clearClientDayProtocol,
  listClientDayProtocols,
  type ClientDayProtocol,
} from "@/lib/client-day-protocols";
import { loadClientIntake } from "@/lib/client-intake";
import { cn } from "@/lib/utils";

type ClientInfo = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
};

/** Vue duale : fiche client + étapes protocole pour la séance du jour. */
export function ClientSessionCoach({
  client,
}: {
  client: ClientInfo;
}) {
  const [attached, setAttached] = useState<ClientDayProtocol[]>(() => listClientDayProtocols(client.id));
  const [activeNumber, setActiveNumber] = useState<number | null>(attached[0]?.protocolNumber ?? null);
  const [stepsDone, setStepsDone] = useState<Record<string, boolean>>({});

  const protocol = useMemo(
    () => (activeNumber != null ? getVentouseProtocol(activeNumber) : null),
    [activeNumber],
  );

  const intake = loadClientIntake(`id:${client.id}`);
  const intakeHints = [
    intake.healthNotes,
    intake.stressLevel ? `Stress : ${intake.stressLevel}` : "",
    intake.sleepQuality ? `Sommeil : ${intake.sleepQuality}` : "",
    intake.medications ? `Médicaments : ${intake.medications}` : "",
    intake.goalsNotes,
  ].filter(Boolean);

  function refresh() {
    const list = listClientDayProtocols(client.id);
    setAttached(list);
    if (activeNumber && !list.some((a) => a.protocolNumber === activeNumber)) {
      setActiveNumber(list[0]?.protocolNumber ?? null);
    }
  }

  function remove(n: number) {
    clearClientDayProtocol(client.id, n);
    refresh();
  }

  if (attached.length === 0) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-secondary/40 via-white to-white shadow-sm" data-testid="client-session-coach">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 bg-primary px-5 py-4 text-primary-foreground">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary-foreground/70">Séance d’aujourd’hui</p>
          <h3 className="mt-1 text-lg font-semibold">
            {client.firstName} {client.lastName}
            {protocol ? ` · P${protocol.number} ${protocol.title}` : ""}
          </h3>
        </div>
        <Link href="/formation" className="rounded-lg bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold hover:bg-primary-foreground/25">
          Changer de protocole
        </Link>
      </div>

      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="border-b border-border/70 p-5 lg:border-b-0 lg:border-r">
          <p className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Dossier client</p>
          <p className="mt-2 text-sm text-slate-700">
            {client.email || "—"}
            <br />
            {client.phone || "Téléphone non renseigné"}
          </p>
          {intakeHints.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {intakeHints.map((h) => (
                <li key={h} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {h}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Complétez l’anamnèse ci-dessous pour un suivi plus précis.</p>
          )}
          {client.notes ? <p className="mt-4 text-sm leading-6 text-slate-600">{client.notes}</p> : null}

          <div className="mt-5 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Protocoles du jour</p>
            {attached.map((a) => (
              <div key={`${a.protocolNumber}-${a.attachedAt}`} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveNumber(a.protocolNumber);
                    setStepsDone({});
                  }}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                    activeNumber === a.protocolNumber ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-800 hover:bg-slate-200",
                  )}
                >
                  P{a.protocolNumber} · {a.protocolTitle}
                </button>
                <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => remove(a.protocolNumber)} aria-label="Retirer">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="p-5">
          {!protocol ? (
            <p className="text-sm text-muted-foreground">Sélectionnez un protocole.</p>
          ) : (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[.12em] text-primary">Étapes à suivre</p>
              <p className="mt-1 text-sm text-slate-600">{protocol.objective}</p>

              <ol className="mt-4 space-y-2">
                {protocol.applicationPoints.map((p, i) => (
                  <li key={p} className="flex items-start gap-3 rounded-xl bg-secondary/50 px-3 py-2.5 text-sm">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="pt-1 font-medium text-slate-800">{p}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-5 space-y-2">
                {protocol.steps.map((s, idx) => {
                  const on = !!stepsDone[s.title];
                  return (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => setStepsDone((prev) => ({ ...prev, [s.title]: !prev[s.title] }))}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition",
                        on ? "border-primary/35 bg-primary/5" : "border-border bg-white hover:border-primary/30",
                      )}
                    >
                      <span className="mt-0.5 font-mono text-[10px] text-slate-400">{idx + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-900">{s.title}</span>
                        <span className="mt-0.5 block text-[13px] leading-5 text-slate-600">{s.detail}</span>
                      </span>
                      {on ? <CheckCircle2 size={18} className="shrink-0 text-primary" /> : <Circle size={18} className="shrink-0 text-slate-300" />}
                    </button>
                  );
                })}
              </div>

              <Link
                href={`/formation/protocole/${protocol.number}?clientId=${client.id}`}
                className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline"
              >
                Ouvrir la fiche complète (matériel, schéma, suivi) →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
