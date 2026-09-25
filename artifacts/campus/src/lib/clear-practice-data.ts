/** Purge des données de pratique locales (pas les prefs UI / cookies). */

const PRACTICE_KEYS = [
  "campus-local-sessions-v1",
  "campus-local-appointments-v1",
  "campus-local-clients-v1",
  "campus-client-intake-v1",
  "campus-client-day-protocols-v1",
  "campus-protocol-practice-log-v1",
  "campus-billed-sessions-v1",
  "campus-french-invoices-v1",
  "campus-invoice-sequence-v1",
  "campus-invoice-seller-v1",
  "campus-bodymap-favorites-v1",
  "campus-formation-parcours-v1",
];

const PREFIXES = ["campus-formation-progress:"];

export function clearPracticeLocalData() {
  for (const key of PRACTICE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (PREFIXES.some((p) => k.startsWith(p))) toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

const LAST_ACCOUNT_KEY = "campus-last-account-email";

export function bindAccountAndClearIfNeeded(email: string) {
  const next = email.trim().toLowerCase();
  const prev = localStorage.getItem(LAST_ACCOUNT_KEY);
  // Première connexion : mémoriser sans tout effacer.
  if (!prev) {
    localStorage.setItem(LAST_ACCOUNT_KEY, next);
    return false;
  }
  const switched = prev !== next;
  if (switched) {
    clearPracticeLocalData();
  }
  localStorage.setItem(LAST_ACCOUNT_KEY, next);
  return switched;
}

/** Remise à zéro côté API (clients / sessions / RDV) pour un vrai compte vide. */
export async function resetApiPracticeData() {
  try {
    const base = (import.meta as any).env?.VITE_API_BASE || "/api";
    await fetch(`${String(base).replace(/\/$/, "")}/dev/reset-practice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    /* API absente : on a déjà vidé le local */
  }
}
