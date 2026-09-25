import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { listLocalAppointments, mergeAppointmentLists, upcomingAppointments } from "@/lib/local-appointments";
import { useListAppointments } from "@workspace/api-client-react";

const POPUP_KEY = "campus-rdv-popup-enabled";

export function isRdvPopupEnabled() {
  try {
    const v = localStorage.getItem(POPUP_KEY);
    return v !== "0";
  } catch {
    return true;
  }
}

export function setRdvPopupEnabled(on: boolean) {
  localStorage.setItem(POPUP_KEY, on ? "1" : "0");
  window.dispatchEvent(new Event("campus-rdv-popup-changed"));
}

function listOr<T>(data: unknown, fallback: T[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: T[] }).data)) {
    return (data as { data: T[] }).data;
  }
  return fallback;
}

function timeLabel(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/** Toast périodique — prochain RDV. Désactivable depuis Notifications (horloge). */
export function AppointmentReminderPopup() {
  const [enabled, setEnabled] = useState(() => isRdvPopupEnabled());
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  const apptsQ = useListAppointments({});

  useEffect(() => {
    const sync = () => setEnabled(isRdvPopupEnabled());
    window.addEventListener("campus-rdv-popup-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("campus-rdv-popup-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setToast(null);
      return;
    }

    function show() {
      const list = mergeAppointmentLists(listOr(apptsQ.data, []), listLocalAppointments());
      const next = upcomingAppointments(list, 1)[0];
      if (!next) return;
      setToast({
        title: "Rappel de rendez-vous",
        body: `Vous avez un RDV à ${timeLabel(next.startsAt)} — ${next.clientName || "client"}${next.serviceName ? ` · ${next.serviceName}` : ""}.`,
      });
    }

    show();
    const id = window.setInterval(show, 2 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [enabled, apptsQ.data]);

  if (!toast || !enabled) return null;

  return (
    <div
      className="fixed bottom-24 right-4 z-[55] w-[min(calc(100vw-2rem),340px)] overflow-hidden rounded-2xl border border-sky-400/30 bg-[#132338] text-white shadow-2xl animate-enter md:bottom-6"
      data-testid="toast-rdv-reminder"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-sky-500/20 text-sky-200">
          <Clock size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{toast.title}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-white/75">{toast.body}</p>
          <p className="mt-2 text-[10px] text-white/45">Notifications → Enlever les notifications</p>
        </div>
        <button
          type="button"
          onClick={() => setToast(null)}
          className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
          aria-label="Fermer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
