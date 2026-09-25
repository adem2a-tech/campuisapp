import { useCallback, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Check, ChevronRight, Mic2, Send, Sparkles, X } from "lucide-react";
import {
  getListAppointmentsQueryKey,
  getListClientsQueryKey,
  getGetDashboardSummaryQueryKey,
  useArchiveClient,
  useCancelAppointment,
  useCreateAppointment,
  useListAppointments,
  useListClients,
  useUpdateAppointment,
} from "@workspace/api-client-react";
import {
  ASSISTANT_ACTIONS,
  detectGreeting,
  formatApptLabel,
  loadDisplayFirstName,
  matchActionFromText,
  parseFrenchDateTime,
  type AssistantActionId,
} from "@/lib/campus-assistant-actions";
import {
  cancelLocalAppointment,
  listLocalAppointments,
  mergeAppointmentLists,
  nextLocalAppointmentId,
  rescheduleLocalAppointment,
  upsertLocalAppointment,
} from "@/lib/local-appointments";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

type Msg = { role: "bot" | "user"; text: string };

type Flow =
  | { kind: "idle" }
  | { kind: "pick-client"; action: "delete-client" | "new-rdv" }
  | { kind: "confirm-delete"; clientId: number; clientName: string }
  | { kind: "pick-rdv"; action: "cancel-rdv" | "move-rdv" }
  | { kind: "confirm-cancel"; apptId: number; label: string }
  | { kind: "ask-new-time"; apptId: number; label: string; durationMin: number }
  | { kind: "ask-new-rdv-time"; clientId: number; clientName: string };

function listOr<T>(data: unknown, fallback: T[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: T[] }).data;
  }
  return fallback;
}

const NAV: Partial<Record<AssistantActionId, string>> = {
  "open-clients": "/clients",
  "open-agenda": "/agenda",
  "open-session": "/sessions/new",
  "open-formation": "/formation",
  "open-aide": "/aide",
};

/** Assistant actions — 1 tâche à la fois, UI thème CAMPUS. */
export function CampusVoiceAssistant({ onClose }: { onClose?: () => void }) {
  const [, setLocation] = useLocation();
  const { session } = useSession();
  const you = loadDisplayFirstName(session?.email);
  const qc = useQueryClient();

  const clientsQ = useListClients({ status: "active" });
  const apptsQ = useListAppointments({});
  const archive = useArchiveClient();
  const cancelAppt = useCancelAppointment();
  const updateAppt = useUpdateAppointment();
  const createAppt = useCreateAppointment();

  const clients = useMemo(
    () =>
      listOr<any>(clientsQ.data, []).map((c) => ({
        id: Number(c.id),
        name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Client",
        firstName: c.firstName || "",
      })),
    [clientsQ.data],
  );

  const appointments = useMemo(() => {
    const merged = mergeAppointmentLists(listOr(apptsQ.data, []), listLocalAppointments());
    return merged
      .filter((a) => a.status !== "cancelled" && new Date(a.startsAt).getTime() >= Date.now() - 3600_000)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [apptsQ.data]);

  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      role: "bot",
      text: `Salut ${you} — je fais les actions 1 par 1. Choisis une tâche ci-dessous (supprimer client, déplacer RDV…).`,
    },
  ]);
  const [flow, setFlow] = useState<Flow>({ kind: "idle" });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const push = useCallback((role: Msg["role"], text: string) => {
    setMessages((m) => [...m, { role, text }]);
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: getListClientsQueryKey() });
    qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey({}) });
    qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  }, [qc]);

  const startAction = useCallback(
    (id: AssistantActionId) => {
      const nav = NAV[id];
      if (nav) {
        push("bot", `J’ouvre la page…`);
        setTimeout(() => {
          setLocation(nav);
          onClose?.();
        }, 280);
        return;
      }
      if (id === "delete-client") {
        if (!clients.length) {
          push("bot", "Aucun client pour le moment. Ajoute-en un d’abord.");
          return;
        }
        setFlow({ kind: "pick-client", action: "delete-client" });
        push("bot", "Quel client supprimer ? Touche un nom (1 seule action).");
        return;
      }
      if (id === "new-rdv") {
        if (!clients.length) {
          push("bot", "Ajoute un client avant de créer un RDV.");
          return;
        }
        setFlow({ kind: "pick-client", action: "new-rdv" });
        push("bot", "Pour qui est le RDV ? Choisis un client.");
        return;
      }
      if (id === "cancel-rdv" || id === "move-rdv") {
        if (!appointments.length) {
          push("bot", "Aucun RDV à venir. Crée-en un depuis Agenda ou « Nouveau RDV ».");
          return;
        }
        setFlow({ kind: "pick-rdv", action: id });
        push("bot", id === "cancel-rdv" ? "Quel RDV annuler ?" : "Quel RDV déplacer ?");
        return;
      }
    },
    [appointments.length, clients.length, onClose, push, setLocation],
  );

  const runDelete = useCallback(
    (clientId: number, clientName: string) => {
      setBusy(true);
      archive.mutate(
        { id: clientId } as any,
        {
          onSuccess: () => {
            invalidate();
            push("bot", `OK — ${clientName} a été archivé. Prochaine action ?`);
            setFlow({ kind: "idle" });
            setBusy(false);
          },
          onError: () => {
            push("bot", `Impossible d’archiver ${clientName} côté serveur. Réessaie.`);
            setBusy(false);
          },
        },
      );
    },
    [archive, invalidate, push],
  );

  const runCancel = useCallback(
    (apptId: number, label: string) => {
      setBusy(true);
      const finish = () => {
        cancelLocalAppointment(apptId);
        invalidate();
        push("bot", `RDV annulé : ${label}. Autre chose ?`);
        setFlow({ kind: "idle" });
        setBusy(false);
      };
      if (apptId < 0) {
        finish();
        return;
      }
      cancelAppt.mutate(
        { id: apptId } as any,
        {
          onSuccess: finish,
          onError: finish,
        },
      );
    },
    [cancelAppt, invalidate, push],
  );

  const runMove = useCallback(
    (apptId: number, startsAt: Date, durationMin: number, label: string) => {
      setBusy(true);
      const ends = new Date(startsAt.getTime() + durationMin * 60_000);
      const startsIso = startsAt.toISOString();
      const endsIso = ends.toISOString();
      const finish = () => {
        rescheduleLocalAppointment(apptId, startsIso, endsIso);
        invalidate();
        push(
          "bot",
          `Déplacé : ${label} → ${startsAt.toLocaleString("fr-FR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}.`,
        );
        setFlow({ kind: "idle" });
        setBusy(false);
      };
      if (apptId < 0) {
        finish();
        return;
      }
      updateAppt.mutate(
        { id: apptId, data: { startsAt: startsIso, endsAt: endsIso } } as any,
        { onSuccess: finish, onError: finish },
      );
    },
    [invalidate, push, updateAppt],
  );

  const runCreateRdv = useCallback(
    (clientId: number, clientName: string, startsAt: Date) => {
      setBusy(true);
      const ends = new Date(startsAt.getTime() + 45 * 60_000);
      const payload = {
        clientId,
        title: "Séance",
        serviceName: "Séance",
        startsAt: startsAt.toISOString(),
        endsAt: ends.toISOString(),
        price: 0,
      };
      const local = {
        id: nextLocalAppointmentId(),
        clientId,
        clientName,
        title: payload.title,
        serviceName: payload.serviceName,
        startsAt: payload.startsAt,
        endsAt: payload.endsAt,
        price: 0,
        status: "confirmed" as const,
        localOnly: true,
      };
      const doneOk = () => {
        invalidate();
        push(
          "bot",
          `RDV créé pour ${clientName} le ${startsAt.toLocaleString("fr-FR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}.`,
        );
        setFlow({ kind: "idle" });
        setBusy(false);
      };
      const doneLocal = () => {
        upsertLocalAppointment(local);
        doneOk();
      };
      createAppt.mutate({ data: payload } as any, { onSuccess: doneOk, onError: doneLocal });
    },
    [createAppt, invalidate, push],
  );

  const handleText = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || busy) return;
      push("user", text);
      setInput("");

      const greet = detectGreeting(text);
      if (greet && flow.kind === "idle") {
        if (greet === "hello") push("bot", `Bonjour ${you} — dis-moi la prochaine tâche (pastilles en bas).`);
        else if (greet === "evening") push("bot", `Bonsoir ${you} — on avance 1 action à la fois.`);
        else push("bot", `À bientôt ${you}.`);
        return;
      }

      if (flow.kind === "ask-new-time" || flow.kind === "ask-new-rdv-time") {
        const when = parseFrenchDateTime(text);
        if (!when) {
          push("bot", "Exemple : demain 14h · aujourd’hui 10h30 · 26/09 15h");
          return;
        }
        if (flow.kind === "ask-new-time") {
          runMove(flow.apptId, when, flow.durationMin, flow.label);
        } else {
          runCreateRdv(flow.clientId, flow.clientName, when);
        }
        return;
      }

      if (flow.kind === "confirm-delete") {
        const n = text.toLowerCase();
        if (/^(oui|ok|confirme|valide|yes)/.test(n)) {
          runDelete(flow.clientId, flow.clientName);
        } else if (/^(non|annule|stop)/.test(n)) {
          push("bot", "Annulé. Choisis une autre action.");
          setFlow({ kind: "idle" });
        } else {
          push("bot", "Réponds oui ou non.");
        }
        return;
      }

      if (flow.kind === "confirm-cancel") {
        const n = text.toLowerCase();
        if (/^(oui|ok|confirme|valide|yes)/.test(n)) {
          runCancel(flow.apptId, flow.label);
        } else if (/^(non|annule|stop)/.test(n)) {
          push("bot", "Annulé. Autre action ?");
          setFlow({ kind: "idle" });
        } else {
          push("bot", "Réponds oui ou non.");
        }
        return;
      }

      const action = matchActionFromText(text);
      if (action) {
        startAction(action);
        return;
      }

      // Match client name while picking
      if (flow.kind === "pick-client") {
        const n = text.toLowerCase();
        const hit = clients.find(
          (c) =>
            c.name.toLowerCase().includes(n) ||
            c.firstName.toLowerCase() === n ||
            String(c.id) === n,
        );
        if (hit) {
          if (flow.action === "delete-client") {
            setFlow({ kind: "confirm-delete", clientId: hit.id, clientName: hit.name });
            push("bot", `Confirmer la suppression de ${hit.name} ? (oui / non)`);
          } else {
            setFlow({ kind: "ask-new-rdv-time", clientId: hit.id, clientName: hit.name });
            push("bot", `OK ${hit.name}. Quelle date / heure ? Ex. demain 14h`);
          }
          return;
        }
        push("bot", "Je ne trouve pas ce client — touche un nom dans la liste.");
        return;
      }

      push("bot", "Choisis une pastille d’action en bas — je fais une seule tâche à la fois.");
    },
    [busy, clients, flow, push, runCancel, runCreateRdv, runDelete, runMove, startAction, you],
  );

  const choices =
    flow.kind === "pick-client"
      ? clients.map((c) => ({
          key: `c-${c.id}`,
          label: c.name,
          onClick: () => {
            push("user", c.name);
            if (flow.action === "delete-client") {
              setFlow({ kind: "confirm-delete", clientId: c.id, clientName: c.name });
              push("bot", `Confirmer la suppression de ${c.name} ? (oui / non)`);
            } else {
              setFlow({ kind: "ask-new-rdv-time", clientId: c.id, clientName: c.name });
              push("bot", `OK ${c.name}. Quelle date / heure ? Ex. demain 14h`);
            }
          },
        }))
      : flow.kind === "pick-rdv"
        ? appointments.slice(0, 8).map((a) => {
            const label = formatApptLabel(a);
            return {
              key: `a-${a.id}`,
              label,
              onClick: () => {
                push("user", label);
                if (flow.action === "cancel-rdv") {
                  setFlow({ kind: "confirm-cancel", apptId: a.id, label });
                  push("bot", `Annuler ce RDV ? (oui / non)`);
                } else {
                  const durationMin = Math.max(
                    30,
                    Math.round((new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / 60_000) || 45,
                  );
                  setFlow({ kind: "ask-new-time", apptId: a.id, label, durationMin });
                  push("bot", "Nouvelle date / heure ? Ex. demain 16h · 27/09 10h30");
                }
              },
            };
          })
        : flow.kind === "confirm-delete" || flow.kind === "confirm-cancel"
          ? [
              {
                key: "yes",
                label: "Oui, confirmer",
                onClick: () => handleText("oui"),
              },
              {
                key: "no",
                label: "Non, annuler",
                onClick: () => handleText("non"),
              },
            ]
          : [];

  return (
    <div className="flex w-full flex-col gap-3" data-testid="campus-ai-chat">
      <div
        ref={listRef}
        className="max-h-56 space-y-2.5 overflow-y-auto rounded-xl border border-white/10 bg-[#0c1829]/80 p-3"
      >
        {messages.map((msg, i) => (
          <div
            key={`${msg.role}-${i}`}
            className={cn(
              "rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
              msg.role === "user"
                ? "ml-8 bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "mr-4 border border-sky-400/20 bg-white/5 text-sky-50",
            )}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {choices.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-200/70">
            {flow.kind === "pick-client"
              ? "Clients"
              : flow.kind === "pick-rdv"
                ? "Rendez-vous"
                : "Confirmer"}
          </p>
          <div className="flex max-h-36 flex-col gap-1.5 overflow-y-auto">
            {choices.map((c) => (
              <button
                key={c.key}
                type="button"
                disabled={busy}
                onClick={c.onClick}
                className="flex items-center gap-2 rounded-xl border border-sky-400/25 bg-sky-500/10 px-3 py-2 text-left text-[12px] font-medium text-sky-50 transition hover:bg-sky-500/20"
              >
                <ChevronRight size={14} className="shrink-0 text-sky-300" />
                <span className="min-w-0 flex-1 truncate">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {ASSISTANT_ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={busy}
              title={a.hint}
              onClick={() => {
                push("user", a.label);
                startAction(a.id);
              }}
              className="rounded-full border border-sky-400/30 bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold text-sky-100 transition hover:bg-sky-500/25"
              data-testid={`chip-ai-${a.id}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {flow.kind !== "idle" ? (
        <button
          type="button"
          className="self-start text-[11px] font-medium text-sky-300/80 hover:text-sky-200"
          onClick={() => {
            setFlow({ kind: "idle" });
            push("bot", "OK — action annulée. Choisis une nouvelle tâche.");
          }}
        >
          ← Annuler cette action
        </button>
      ) : null}

      <div className="flex items-end gap-2 rounded-2xl border border-sky-400/25 bg-[#132338] p-2 shadow-inner">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleText(input);
            }
          }}
          rows={2}
          placeholder={
            flow.kind === "ask-new-time" || flow.kind === "ask-new-rdv-time"
              ? "Ex. demain 14h"
              : "Bonjour, ou une action…"
          }
          className="min-h-[44px] w-full resize-none rounded-xl bg-transparent px-2 py-1.5 text-[13px] text-sky-50 outline-none placeholder:text-sky-200/35"
          data-testid="input-ai-chat"
        />
        <button
          type="button"
          disabled={busy || !input.trim()}
          onClick={() => handleText(input)}
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-40"
          data-testid="button-ai-send"
        >
          {busy ? <Sparkles size={16} className="animate-pulse" /> : <Send size={16} />}
        </button>
      </div>

      <p className="flex items-center gap-1.5 text-[10px] text-sky-200/50">
        <Check size={12} className="text-sky-400" /> Une action à la fois · confirmation avant suppression
      </p>
    </div>
  );
}

export { Mic2 as CampusAssistantFabIcon };
