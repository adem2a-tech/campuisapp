/** Code PIN à 5 chiffres — entrée app + déverrouillage Facturation. */

const PIN_KEY = "campus-app-pin-v1";
const BILLING_UNLOCK_KEY = "campus-billing-unlocked-at";

export function hasAppPin(): boolean {
  try {
    return Boolean(localStorage.getItem(PIN_KEY));
  } catch {
    return false;
  }
}

export function getAppPin(): string | null {
  try {
    return localStorage.getItem(PIN_KEY);
  } catch {
    return null;
  }
}

export function setAppPin(pin: string) {
  const clean = pin.replace(/\D/g, "").slice(0, 5);
  if (clean.length !== 5) throw new Error("Le code doit contenir 5 chiffres.");
  localStorage.setItem(PIN_KEY, clean);
}

export function verifyAppPin(pin: string): boolean {
  const stored = getAppPin();
  if (!stored) return false;
  return stored === pin.replace(/\D/g, "").slice(0, 5);
}

/** Déverrouille Facturation pour la session navigateur (~45 min). */
export function unlockBilling() {
  sessionStorage.setItem(BILLING_UNLOCK_KEY, String(Date.now()));
}

export function lockBilling() {
  sessionStorage.removeItem(BILLING_UNLOCK_KEY);
}

export function isBillingUnlocked(maxAgeMs = 45 * 60 * 1000): boolean {
  try {
    const raw = sessionStorage.getItem(BILLING_UNLOCK_KEY);
    if (!raw) return false;
    const t = Number(raw);
    if (!Number.isFinite(t)) return false;
    return Date.now() - t < maxAgeMs;
  } catch {
    return false;
  }
}
