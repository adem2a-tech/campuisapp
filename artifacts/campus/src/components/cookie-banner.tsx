import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

const KEY = "campus-cookie-consent-v1";

type Choice = "accepted" | "refused" | null;

function readChoice(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "accepted" || v === "refused") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function CookieBanner() {
  const [choice, setChoice] = useState<Choice>("accepted"); // hide until hydrated
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setChoice(readChoice());
    setReady(true);
  }, []);

  function decide(next: "accepted" | "refused") {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    setChoice(next);
  }

  if (!ready || choice) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/25 p-4 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      data-testid="cookie-banner"
    >
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-white/80 bg-white p-5 shadow-[0_28px_70px_-24px_rgba(15,23,42,0.45)] sm:p-6">
        <div className="flex gap-3">
          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700">
            <Cookie size={18} />
          </span>
          <div className="min-w-0">
            <p id="cookie-title" className="text-sm font-bold tracking-[-0.02em] text-slate-900">
              Cookies &amp; confidentialité
            </p>
            <p id="cookie-desc" className="mt-1.5 text-xs leading-relaxed text-slate-500">
              CAMPUS utilise des cookies essentiels au fonctionnement (session, préférences) et, avec votre accord,
              des cookies de mesure d’audience pour améliorer l’expérience praticien.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
            data-testid="button-cookies-accept"
          >
            Tout accepter
          </button>
          <button
            type="button"
            onClick={() => decide("refused")}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            data-testid="button-cookies-refuse"
          >
            Refuser
          </button>
        </div>
      </div>
    </div>
  );
}
