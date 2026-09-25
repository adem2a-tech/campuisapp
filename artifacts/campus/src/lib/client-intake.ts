/**
 * Anamnèse / suivi client — champs issus du PDF
 * « Système d'évaluation professionnelle » (pages 3–7).
 */

export const HEALTH_CONDITIONS = [
  "Hypertension artérielle",
  "Hypotension artérielle",
  "Grossesse",
  "Intervention chirurgicale récente",
  "Diabète",
  "Affections cutanées",
  "Maladies cardiaques",
  "Allergies",
  "Troubles de la thyroïde",
  "Douleur chronique",
  "Affections respiratoires",
  "Maladies auto-immunes",
  "Varices",
  "Pacemaker",
  "Épilepsie",
  "Ostéoporose",
  "Cancer",
  "Aucune des réponses précédentes",
] as const;

export const TREATMENT_GOALS = [
  "Détente",
  "Soulagement de la douleur",
  "Soulagement du stress",
  "Remodelage corporel",
  "Drainage lymphatique",
  "Réduction de la cellulite",
  "Récupération sportive",
  "Amélioration du sommeil",
] as const;

export type ClientIntake = {
  clientKey: string;
  updatedAt: string;
  // PAGE 3 — inscription
  birthDate: string;
  age: string;
  gender: string;
  address: string;
  city: string;
  emergencyContact: string;
  emergencyPhone: string;
  profession: string;
  referredBy: string;
  // PAGE 4 — anamnèse
  conditions: string[];
  healthNotes: string;
  // PAGE 5 — médicaments / allergies
  medications: string;
  allergies: string;
  medicalRestrictions: string;
  // PAGE 6 — mode de vie
  hydration: string;
  activity: string;
  sleepQuality: string;
  sleepHours: string;
  stressLevel: string;
  lifestyleNotes: string;
  nutrition: string;
  otherHabits: string;
  // PAGE 7 — objectifs
  goals: string[];
  goalsNotes: string;
};

const KEY = "campus-client-intake-v1";

function readMap(): Record<string, ClientIntake> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, ClientIntake>) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function emptyIntake(clientKey: string): ClientIntake {
  return {
    clientKey,
    updatedAt: new Date().toISOString(),
    birthDate: "",
    age: "",
    gender: "",
    address: "",
    city: "Ajaccio",
    emergencyContact: "",
    emergencyPhone: "",
    profession: "",
    referredBy: "",
    conditions: [],
    healthNotes: "",
    medications: "",
    allergies: "",
    medicalRestrictions: "",
    hydration: "",
    activity: "",
    sleepQuality: "",
    sleepHours: "",
    stressLevel: "",
    lifestyleNotes: "",
    nutrition: "",
    otherHabits: "",
    goals: [],
    goalsNotes: "",
  };
}

export function loadClientIntake(clientKey: string): ClientIntake {
  return readMap()[clientKey] ?? emptyIntake(clientKey);
}

export function saveClientIntake(intake: ClientIntake) {
  const map = readMap();
  map[intake.clientKey] = { ...intake, updatedAt: new Date().toISOString() };
  writeMap(map);
  return map[intake.clientKey]!;
}

/** Déplace une anamnèse (ex. brouillon → id client). */
export function moveClientIntake(fromKey: string, toKey: string) {
  const map = readMap();
  const intake = map[fromKey];
  if (!intake) return;
  map[toKey] = { ...intake, clientKey: toKey, updatedAt: new Date().toISOString() };
  delete map[fromKey];
  writeMap(map);
}

export function intakeCompleteness(intake: ClientIntake) {
  let score = 0;
  let total = 8;
  if (intake.birthDate || intake.age) score++;
  if (intake.emergencyContact && intake.emergencyPhone) score++;
  if (intake.conditions.length) score++;
  if (intake.medications.trim() || intake.allergies.trim()) score++;
  if (intake.sleepQuality || intake.sleepHours) score++;
  if (intake.stressLevel) score++;
  if (intake.hydration || intake.activity) score++;
  if (intake.goals.length) score++;
  return Math.round((score / total) * 100);
}

const CONFIRM_KEY = "campus-client-intake-confirmed-v1";

function readConfirmed(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(CONFIRM_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function isIntakeConfirmed(clientKey: string) {
  return !!readConfirmed()[clientKey];
}

export function markIntakeConfirmed(clientKey: string) {
  const map = readConfirmed();
  map[clientKey] = true;
  localStorage.setItem(CONFIRM_KEY, JSON.stringify(map));
}
