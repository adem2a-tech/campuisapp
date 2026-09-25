/**
 * Assistant CAMPUS — actions 1 par 1 dans l’app (clients, RDV, navigation).
 * Pas d’API LLM : flux guidé + confirmation.
 */

export type AssistantActionId =
  | "delete-client"
  | "cancel-rdv"
  | "move-rdv"
  | "new-rdv"
  | "open-clients"
  | "open-agenda"
  | "open-session"
  | "open-formation"
  | "open-aide";

export type AssistantActionDef = {
  id: AssistantActionId;
  label: string;
  hint: string;
};

export const ASSISTANT_ACTIONS: AssistantActionDef[] = [
  { id: "delete-client", label: "Supprimer un client", hint: "Archive le dossier — 1 client à la fois" },
  { id: "cancel-rdv", label: "Annuler un RDV", hint: "Annule un rendez-vous à venir" },
  { id: "move-rdv", label: "Déplacer un RDV", hint: "Change la date / l’heure" },
  { id: "new-rdv", label: "Nouveau RDV", hint: "Crée un rendez-vous rapidement" },
  { id: "open-clients", label: "Ouvrir Clients", hint: "Aller à la liste clients" },
  { id: "open-agenda", label: "Ouvrir Agenda", hint: "Voir le planning" },
  { id: "open-session", label: "Nouvelle session", hint: "Documenter une séance" },
  { id: "open-formation", label: "Formation", hint: "Suivi pas à pas" },
  { id: "open-aide", label: "Aide protocoles", hint: "Orienter vers un protocole ventouse" },
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Distance simple pour typos (sallut → salut). */
function editDistance(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + cost);
    }
  }
  return dp[m]![n]!;
}

export type GreetKind = "hello" | "evening" | "bye" | null;

export function detectGreeting(raw: string): GreetKind {
  const t = normalize(raw);
  const first = t.split(" ")[0] || t;
  const hellos = ["bonjour", "salut", "hello", "hey", "coucou", "bonsoir"];
  for (const h of hellos) {
    if (t === h || t.startsWith(h + " ") || editDistance(first, h) <= 2) {
      return h === "bonsoir" ? "evening" : "hello";
    }
  }
  const byes = ["au revoir", "bye", "a bientot", "bonne soiree", "bonne journee"];
  for (const b of byes) {
    if (t === b || t.startsWith(b) || editDistance(t, b) <= 2) return "bye";
  }
  return null;
}

export function matchActionFromText(raw: string): AssistantActionId | null {
  const t = normalize(raw);
  if (/(supprim|archiv|effac).*(client)/.test(t) || /(client).*(supprim|archiv)/.test(t)) return "delete-client";
  if (/(annul).*(rdv|rendez)/.test(t) || /(rdv|rendez).*(annul)/.test(t)) return "cancel-rdv";
  if (/(deplac|report|chang).*(rdv|rendez|heure|date)/.test(t) || /(rdv).*(deplac|report)/.test(t)) return "move-rdv";
  if (/(nouveau|creer|ajoute).*(rdv|rendez)/.test(t)) return "new-rdv";
  if (/ouvre.*(client)/.test(t)) return "open-clients";
  if (/ouvre.*(agenda|planning)/.test(t)) return "open-agenda";
  if (/ouvre.*(session)/.test(t) || /nouvelle session/.test(t)) return "open-session";
  if (/ouvre.*(formation)/.test(t)) return "open-formation";
  if (/ouvre.*(aide)/.test(t) || /(aide|diagnostic|protocole).*(ventouse|plainte|douleur)/.test(t) || /trouver.*(protocole)/.test(t))
    return "open-aide";
  return null;
}

export function parseFrenchDateTime(raw: string): Date | null {
  const t = normalize(raw);
  const now = new Date();

  // demain 14h / demain 14:30
  const demain = t.match(/demain\s+(\d{1,2})\s*(?:h|:)?\s*(\d{0,2})/);
  if (demain) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(Number(demain[1]), Number(demain[2] || 0), 0, 0);
    return d;
  }

  // aujourd'hui 10h30
  const auj = t.match(/(aujourd hui|aujourdhui|auj)\s+(\d{1,2})\s*(?:h|:)?\s*(\d{0,2})/);
  if (auj) {
    const d = new Date(now);
    d.setHours(Number(auj[2]), Number(auj[3] || 0), 0, 0);
    return d;
  }

  // 25/09/2026 14h or 25-09 14:00
  const full = t.match(/(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?\s+(\d{1,2})\s*(?:h|:)?\s*(\d{0,2})/);
  if (full) {
    const day = Number(full[1]);
    const month = Number(full[2]) - 1;
    let year = full[3] ? Number(full[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, month, day, Number(full[4]), Number(full[5] || 0), 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // just 15h / 15:30 (today or tomorrow if past)
  const onlyTime = t.match(/^(\d{1,2})\s*(?:h|:)\s*(\d{0,2})$/);
  if (onlyTime) {
    const d = new Date(now);
    d.setHours(Number(onlyTime[1]), Number(onlyTime[2] || 0), 0, 0);
    if (d.getTime() < now.getTime()) d.setDate(d.getDate() + 1);
    return d;
  }

  return null;
}

export function formatApptLabel(a: { clientName?: string; startsAt: string; serviceName?: string; title?: string }) {
  const when = new Date(a.startsAt).toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${a.clientName || "Client"} · ${when}${a.serviceName || a.title ? ` · ${a.serviceName || a.title}` : ""}`;
}

const DISPLAY_NAME_KEY = "campus-display-name";

export function loadDisplayFirstName(fallbackEmail?: string | null) {
  try {
    const saved = localStorage.getItem(DISPLAY_NAME_KEY)?.trim();
    if (saved) return saved.split(/\s+/)[0]!;
  } catch {
    /* ignore */
  }
  if (!fallbackEmail) return "praticien";
  const local = fallbackEmail.split("@")[0]?.replace(/[._-]/g, " ") || "praticien";
  const first = local.split(" ")[0] || "praticien";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function saveDisplayFirstName(fullName: string) {
  try {
    localStorage.setItem(DISPLAY_NAME_KEY, fullName.trim());
  } catch {
    /* ignore */
  }
}
