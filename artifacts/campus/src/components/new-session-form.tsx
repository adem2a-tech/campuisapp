import * as React from "react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  Check,
  Mail,
  MoveRight,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetDashboardSummaryQueryKey,
  getListClientsQueryKey,
  getListSessionsQueryKey,
  useCreateSession,
  useListClients,
} from "@workspace/api-client-react";
import { ProtocolQueFaire } from "@/components/protocol-que-faire";
import { zoneIdForProtocol, zoneLabelForId } from "@/lib/protocol-to-zone";
import {
  nextLocalSessionId,
  upsertLocalSession,
  type LocalSession,
} from "@/lib/local-sessions";
import { listLocalClients, mergeClientLists } from "@/lib/local-clients";
import {
  getVentouseProtocol,
  searchVentouseProtocols,
  type VentouseProtocol,
} from "@/lib/ventouse-protocols";
import type { AnatomyZoneId } from "@/lib/anatomy-zones";
import { cn } from "@/lib/utils";

function Step({ n, label, active, done }: { n: string; label: string; active?: boolean; done?: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs",
        active ? "bg-secondary font-medium text-primary" : done ? "bg-primary/10 font-medium text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      <span className="font-mono text-[10px]">{n}</span>
      {label}
    </span>
  );
}

type Phase = "pratique" | "bilan";

export function NewSessionForm({
  SectionHeading,
  PrimaryButton,
  Field,
  TextInput,
  TextArea,
  Avatar,
  Empty,
  Toast,
  Link,
}: {
  SectionHeading: React.ComponentType<{ eyebrow?: string; title: string; detail?: string; action?: React.ReactNode }>;
  PrimaryButton: React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  Field: React.ComponentType<{ label: string; children: React.ReactNode }>;
  TextInput: React.ComponentType<React.InputHTMLAttributes<HTMLInputElement>>;
  TextArea: React.ComponentType<React.TextareaHTMLAttributes<HTMLTextAreaElement>>;
  Avatar: React.ComponentType<{ name: string; color?: string; small?: boolean }>;
  Empty: React.ComponentType<{ icon: typeof Users; title: string; body: string; action?: React.ReactNode }>;
  Toast: React.ComponentType<{ message: string; onClose: () => void }>;
  Link: React.ComponentType<{ href: string; className?: string; children: React.ReactNode; "data-testid"?: string }>;
}) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const [clientId, setClientId] = useState(Number(params.get("clientId")) || 0);
  const [complaint, setComplaint] = useState("");
  const [toast, setToast] = useState("");
  const [saved, setSaved] = useState(false);
  const [phase, setPhase] = useState<Phase>("pratique");
  const [before, setBefore] = useState(5);
  const [after, setAfter] = useState(7);
  const [duration, setDuration] = useState(45);
  const [price, setPrice] = useState(75);
  const [observations, setObservations] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [selectedProtocol, setSelectedProtocol] = useState<VentouseProtocol | null>(null);
  const [workedZones, setWorkedZones] = useState<Array<{ zoneId: AnatomyZoneId; label: string; protocolNumber: number }>>([]);

  const clientsQ = useListClients({ status: "active" });
  const create = useCreateSession();
  const apiClients: any[] = Array.isArray(clientsQ.data) ? clientsQ.data : (clientsQ.data as any)?.data || [];
  const clients: any[] = mergeClientLists(apiClients, listLocalClients());
  const client = clients.find((c: any) => c.id === clientId) || clients[0];

  const protocolHits = useMemo(() => {
    const q = complaint.trim();
    if (q.length < 2) return [];
    return searchVentouseProtocols(q).slice(0, 8);
  }, [complaint]);

  function pickProtocol(p: VentouseProtocol) {
    setSelectedProtocol(p);
    const zoneId = zoneIdForProtocol(p);
    const label = zoneLabelForId(zoneId);
    setWorkedZones((prev) => {
      if (prev.some((z) => z.protocolNumber === p.number)) return prev;
      return [...prev, { zoneId, label, protocolNumber: p.number }];
    });
    const mins = Math.max(20, Math.min(60, p.applicationPoints.length * 5 + 15));
    setDuration(mins);
    setToast(`Protocole #${p.number} — ${p.title}`);
  }

  function finishProtocol() {
    if (!selectedProtocol) {
      setToast("Choisissez d’abord un protocole (ex. anxiété, bras, tête…).");
      return;
    }
    setPhase("bilan");
    setToast("Protocole ventouse terminé — complétez le ressenti");
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!client || create.isPending || phase !== "bilan") return;

    const zones = workedZones.map((z, i) => ({
      zoneId: i + 1,
      label: z.label,
      technique: "Ventouses",
      intensity: 5,
      durationMinutes: Math.max(1, Math.round(duration / Math.max(1, workedZones.length))),
      note: `Protocole #${z.protocolNumber}`,
    }));
    const payload = {
      clientId: client.id,
      occurredAt: new Date().toISOString(),
      durationMinutes: duration,
      beforeFeeling: before,
      afterFeeling: after,
      mobilityBefore: before,
      mobilityAfter: after,
      zones,
      techniques: ["Ventouses"],
      observations: [
        observations,
        complaint ? `Plainte : ${complaint}` : "",
        selectedProtocol ? `Protocole : #${selectedProtocol.number} ${selectedProtocol.title}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      practitionerRecommendations: recommendations || selectedProtocol?.proTip || "",
      price: Math.max(0, Number(price) || 0),
    };

    const persistLocal = (id: number, localOnly = false) => {
      const local: LocalSession = {
        id,
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        occurredAt: payload.occurredAt,
        durationMinutes: payload.durationMinutes,
        beforeFeeling: payload.beforeFeeling,
        afterFeeling: payload.afterFeeling,
        mobilityBefore: payload.mobilityBefore,
        mobilityAfter: payload.mobilityAfter,
        zones: payload.zones,
        techniques: payload.techniques,
        observations: payload.observations,
        practitionerRecommendations: payload.practitionerRecommendations,
        price: payload.price,
        localOnly,
      };
      upsertLocalSession(local);
      return local;
    };

    create.mutate(
      { data: payload } as any,
      {
        onSuccess: (session: any) => {
          persistLocal(session.id, false);
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setSaved(true);
          setToast("Session enregistrée");
          setTimeout(() => setLocation(`/sessions/${session.id}`), 600);
        },
        onError: () => {
          const local = persistLocal(nextLocalSessionId(), true);
          setSaved(true);
          setToast("Session enregistrée en local (API indisponible)");
          setTimeout(() => setLocation(`/sessions/${local.id}`), 600);
        },
      },
    );
  }

  function emailRecapDraft() {
    if (!client) return;
    const zones = workedZones.map((z) => z.label).join(", ") || "—";
    const body = [
      `Bonjour ${client.firstName},`,
      "",
      "Récapitulatif de votre séance CAMPUS :",
      selectedProtocol ? `• Protocole : #${selectedProtocol.number} ${selectedProtocol.title}` : "",
      `• Zones travaillées : ${zones}`,
      `• Durée : ${duration} min`,
      `• Sensation avant → après : ${before}/10 → ${after}/10`,
      observations ? `• Observations : ${observations}` : "",
      "",
      "Recommandations jusqu’au prochain rendez-vous :",
      recommendations || selectedProtocol?.proTip || "Hydratation, étirements doux, repos relatif.",
      "",
      "À bientôt,",
      "Votre praticien CAMPUS",
    ]
      .filter(Boolean)
      .join("\n");
    window.location.href = `mailto:${encodeURIComponent(client.email || "")}?subject=${encodeURIComponent(`Récap séance — ${client.firstName} ${client.lastName}`)}&body=${encodeURIComponent(body)}`;
  }

  if (clients.length === 0) {
    return (
      <div className="animate-enter">
        <SectionHeading
          eyebrow="Documenter au fil du geste"
          title="Nouvelle session"
          detail="Ajoutez d'abord un client pour documenter une session."
          action={
            <Link href="/clients" className="btn-3d inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" data-testid="link-add-client-session">
              <Plus size={17} /> Ajouter un client
            </Link>
          }
        />
        <Empty
          icon={Users}
          title="Aucun client"
          body="Créez un client dans votre carnet avant de documenter une session."
          action={
            <Link href="/clients" className="btn-3d inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
              <Plus size={16} /> Aller aux clients
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="animate-enter">
      <SectionHeading
        eyebrow="Documenter au fil du geste"
        title="Nouvelle session"
        detail={
          phase === "pratique"
            ? "Tapez ce que ressent la personne — les protocoles ventouses s’affichent, puis le ressenti avant / après."
            : "Ressenti, durée, observations — puis enregistrez la session."
        }
        action={
          phase === "bilan" ? (
            <PrimaryButton type="button" onClick={save} disabled={create.isPending || saved} data-testid="button-save-session">
              <Check size={16} /> {create.isPending ? "Enregistrement…" : saved ? "Enregistré" : "Enregistrer la session"}
            </PrimaryButton>
          ) : undefined
        }
      />
      {toast && <Toast message={toast} onClose={() => setToast("")} />}

      <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
        <Step n="01" label="Client & plainte" active={phase === "pratique"} done />
        <MoveRight size={14} className="text-border" />
        <Step n="02" label="Protocole" active={phase === "pratique"} done={phase === "bilan"} />
        <MoveRight size={14} className="text-border" />
        <Step n="03" label="Ressenti & envoi" active={phase === "bilan"} />
      </div>

      {phase === "pratique" && (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5">
            <div className="surface rounded-2xl p-5">
              <p className="mb-4 text-sm font-semibold">La personne</p>
              <Field label="Client">
                <select
                  value={client?.id || ""}
                  onChange={(e) => setClientId(Number(e.target.value))}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  data-testid="select-session-client"
                >
                  {clients.map((c: any) => (
                    <option value={c.id} key={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              </Field>
              {client && (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-secondary/60 p-3">
                  <Avatar name={`${client.firstName} ${client.lastName}`} color={client.avatarColor} small />
                  <div>
                    <p className="text-sm font-medium">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{client.sessionsCount || 0} sessions documentées</p>
                  </div>
                </div>
              )}
              <div className="mt-4">
                <Field label="Que ressent la personne ?">
                  <div className="relative">
                    <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-muted-foreground" />
                    <TextInput
                      value={complaint}
                      onChange={(e) => setComplaint(e.target.value)}
                      placeholder="Ex. anxiété, bras, tête, lombaires…"
                      className="!pl-10"
                      data-testid="input-session-complaint"
                    />
                  </div>
                </Field>
                <p className="mt-2 text-xs text-muted-foreground">Comme en Formation : les protocoles correspondants apparaissent en direct.</p>
              </div>
            </div>

            <div className="surface rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Protocoles suggérés</p>
                <span className="font-mono text-[10px] text-muted-foreground">{protocolHits.length} résultat{protocolHits.length > 1 ? "s" : ""}</span>
              </div>
              {complaint.trim().length < 2 ? (
                <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
                  Tapez un symptôme ou une zone (bras, anxiété, nuque…) pour proposer les protocoles.
                </p>
              ) : protocolHits.length === 0 ? (
                <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">Aucun protocole pour « {complaint} ».</p>
              ) : (
                <ul className="max-h-[320px] space-y-2 overflow-y-auto">
                  {protocolHits.map((p) => {
                    const active = selectedProtocol?.number === p.number;
                    return (
                      <li key={p.number}>
                        <button
                          type="button"
                          onClick={() => pickProtocol(p)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition",
                            active ? "border-primary bg-secondary/70" : "border-border/70 bg-white hover:border-primary/40 hover:bg-secondary/30",
                          )}
                          data-testid={`button-session-protocol-${p.number}`}
                        >
                          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 font-mono text-[11px] font-bold text-primary">
                            {p.number}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-900">{p.title}</span>
                            <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{p.objective}</span>
                          </span>
                          <ArrowRight size={16} className={cn("mt-1 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {selectedProtocol ? (
              <>
                <ProtocolQueFaire
                  protocol={selectedProtocol}
                  embedded
                  preselectedClientId={clientId ? Number(clientId) : undefined}
                />

                <PrimaryButton type="button" className="w-full" onClick={finishProtocol} data-testid="button-protocol-done">
                  <Check size={16} /> Protocole ventouse terminé
                </PrimaryButton>
              </>
            ) : (
              <div className="surface rounded-2xl p-8 text-center text-sm text-muted-foreground">
                Choisissez un protocole à gauche — la même fiche Formation (Que faire) s’affiche ici.
              </div>
            )}
          </div>
        </div>
      )}

      {phase === "bilan" && (
        <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-[#132338] px-5 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">Ressenti & durée</p>
                <p className="mt-0.5 text-sm font-semibold text-white">Avant / après — simple et clair</p>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Durée (min)">
                  <TextInput type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value) || 45)} data-testid="input-session-duration" />
                </Field>
                <Field label="Tarif (€)">
                  <TextInput
                    type="number"
                    min={0}
                    step={1}
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
                    data-testid="input-session-price"
                  />
                </Field>
                <Field label="Avant /10">
                  <TextInput
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={10}
                    step={1}
                    value={before}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setBefore(0);
                        return;
                      }
                      const n = Number.parseInt(raw, 10);
                      if (Number.isNaN(n)) return;
                      setBefore(Math.min(10, Math.max(0, n)));
                    }}
                    data-testid="input-session-before"
                  />
                </Field>
                <Field label="Après /10">
                  <TextInput
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={10}
                    step={1}
                    value={after}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setAfter(0);
                        return;
                      }
                      const n = Number.parseInt(raw, 10);
                      if (Number.isNaN(n)) return;
                      setAfter(Math.min(10, Math.max(0, n)));
                    }}
                    data-testid="input-session-after"
                  />
                </Field>
              </div>
              <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-3">
                <p className="text-sm text-slate-600">
                  Évolution :{" "}
                  <strong className={after - before >= 0 ? "text-emerald-700" : "text-rose-700"}>
                    {after}/10 {after - before >= 0 ? `+${after - before}` : after - before}
                  </strong>
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <p className="mb-4 text-sm font-semibold text-slate-900">Observations & recommandations</p>
              <div className="space-y-4">
                <Field label="Notes de séance">
                  <TextArea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Ce que vous avez observé…" data-testid="textarea-session-observations" />
                </Field>
                <Field label="Recommandations jusqu’au prochain RDV">
                  <TextArea value={recommendations} onChange={(e) => setRecommendations(e.target.value)} placeholder="Hydratation, étirements, précautions…" data-testid="textarea-session-recommendations" />
                </Field>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setPhase("pratique")} className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold">
                ← Revenir au protocole
              </button>
              <PrimaryButton type="submit" disabled={create.isPending || saved} data-testid="button-save-session">
                <Check size={16} /> Enregistrer la session
              </PrimaryButton>
              <button
                type="button"
                onClick={emailRecapDraft}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-slate-700"
                data-testid="button-email-session-recap"
              >
                <Mail size={15} /> Envoyer le récap par e-mail
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Zones travaillées</p>
            <p className="mt-1 text-xs text-slate-500">Sans schéma — juste les repères de la séance.</p>
            <ul className="mt-4 space-y-2">
              {workedZones.length === 0 ? (
                <li className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">Aucune zone enregistrée.</li>
              ) : (
                workedZones.map((z) => {
                  const p = getVentouseProtocol(z.protocolNumber);
                  return (
                    <li key={`${z.protocolNumber}-${z.zoneId}`} className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-sm">
                      <span className="font-semibold text-slate-900">{z.label}</span>
                      {p ? <span className="mt-0.5 block text-xs text-slate-500">#{p.number} {p.title}</span> : null}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </form>
      )}
    </div>
  );
}
