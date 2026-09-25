import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

const KEY = "campus-welcome-seen-v1";

/** Message de bienvenue — première visite uniquement. */
export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" data-testid="welcome-modal">
      <button type="button" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" aria-label="Fermer" onClick={dismiss} />
      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
        style={{
          background: "linear-gradient(165deg, #ffffff 0%, #e8f4fb 55%, #dbeafe 100%)",
          border: "1px solid rgba(14, 116, 168, 0.3)",
          boxShadow: "0 24px 64px -20px rgba(15,42,72,0.5), 8px 0 40px -16px rgba(14,116,168,0.4)",
        }}
      >
        <div className="flex items-start justify-between gap-3 bg-[#132338] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">CAMPUS</p>
              <p className="text-base font-semibold">Bienvenue</p>
            </div>
          </div>
          <button type="button" onClick={dismiss} className="rounded-lg p-1.5 hover:bg-white/10" aria-label="Fermer">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <p className="text-[15px] font-semibold leading-snug text-[#132338]">
            Bienvenue — vous allez utiliser la meilleure application de France pour les praticiens en thérapie manuelle et ventousothérapie.
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            Clients, agenda, sessions, formation pas à pas et facturation : tout est conçu pour votre cabinet. Vos données restent synchronisées sur cet appareil à chaque connexion.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="btn-primary inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold"
            data-testid="button-welcome-start"
          >
            Commencer
          </button>
        </div>
      </div>
    </div>
  );
}
