/**
 * Registre des zones anatomiques sélectionnables (extensible).
 * Ajouter une zone = 1 entrée ici + 1 mesh dans AnatomyBody.
 */

import { getVentouseProtocol, VENTOUSE_PROTOCOLS, type VentouseProtocol } from "@/lib/ventouse-protocols";

export type AnatomyZoneId =
  | "trapeze"
  | "nuque"
  | "dorsal"
  | "lombaires"
  | "sacrum"
  | "epaule"
  | "bras"
  | "coude"
  | "avant-bras"
  | "thorax"
  | "abdomen"
  | "hanche"
  | "cuisse"
  | "genou"
  | "mollet"
  | "pied"
  | "crane"
  | "machoire";

export type AnatomyZoneDef = {
  id: AnatomyZoneId;
  /** Libellé court affiché (majuscules type légende médicale) */
  label: string;
  /** Phrase « Que faire quand… » */
  painQuestion: string;
  /** Numéro de protocole ventouses préféré (PDF 150) */
  preferredProtocol: number;
  /** Mots-clés de secours si le n° exact manque */
  fallbackKeywords: string[];
  /** Point d'ancrage 3D pour le trait de légende [x,y,z] */
  anchor: [number, number, number];
};

export const ANATOMY_ZONES: AnatomyZoneDef[] = [
  {
    id: "crane",
    label: "Crâne",
    painQuestion: "Que faire lorsque la personne a mal au crâne / céphalée ?",
    preferredProtocol: 13,
    fallbackKeywords: ["céphalée", "migraine", "tête"],
    anchor: [0.02, 1.58, 0.08],
  },
  {
    id: "machoire",
    label: "Mâchoire",
    painQuestion: "Que faire lorsque la personne a mal à la mâchoire ?",
    preferredProtocol: 81,
    fallbackKeywords: ["bruxisme", "mâchoire", "atm", "facial"],
    anchor: [0.06, 1.46, 0.14],
  },
  {
    id: "nuque",
    label: "Nuque",
    painQuestion: "Que faire lorsque la personne a mal à la nuque ?",
    preferredProtocol: 3,
    fallbackKeywords: ["cervical", "nuque", "cou"],
    anchor: [0.02, 1.38, -0.06],
  },
  {
    id: "trapeze",
    label: "Trapèze",
    painQuestion: "Que faire lorsque la personne a mal au trapèze ?",
    preferredProtocol: 3,
    fallbackKeywords: ["trapèze", "cervical", "épaule"],
    anchor: [0.1, 1.26, -0.05],
  },
  {
    id: "epaule",
    label: "Épaule",
    painQuestion: "Que faire lorsque la personne a mal à l'épaule ?",
    preferredProtocol: 6,
    fallbackKeywords: ["épaule", "deltoïde"],
    anchor: [0.22, 1.18, 0.04],
  },
  {
    id: "dorsal",
    label: "Dos supérieur",
    painQuestion: "Que faire lorsque la personne a mal au dos supérieur ?",
    preferredProtocol: 4,
    fallbackKeywords: ["dorsalgie", "interscapulaire", "rhomboïde"],
    anchor: [0.02, 1.08, -0.1],
  },
  {
    id: "thorax",
    label: "Thorax",
    painQuestion: "Que faire lorsque la personne a une gêne thoracique / respiratoire ?",
    preferredProtocol: 47,
    fallbackKeywords: ["respiratoire", "thorax", "asthme"],
    anchor: [0.02, 1.02, 0.12],
  },
  {
    id: "bras",
    label: "Bras",
    painQuestion: "Que faire lorsque la personne a mal au bras ?",
    preferredProtocol: 7,
    fallbackKeywords: ["bras", "épicondylite", "humérus"],
    anchor: [0.28, 0.92, 0.04],
  },
  {
    id: "avant-bras",
    label: "Avant-bras",
    painQuestion: "Que faire lorsque la personne a mal à l'avant-bras / poignet ?",
    preferredProtocol: 8,
    fallbackKeywords: ["canal carpien", "fléchisseur", "poignet", "avant-bras"],
    anchor: [0.32, 0.62, 0.06],
  },
  {
    id: "coude",
    label: "Coude",
    painQuestion: "Que faire lorsque la personne a mal au coude ?",
    preferredProtocol: 7,
    fallbackKeywords: ["épicondylite", "coude", "tennis"],
    anchor: [0.28, 0.78, 0.04],
  },
  {
    id: "lombaires",
    label: "Lombaires",
    painQuestion: "Que faire lorsque la personne a mal aux lombaires ?",
    preferredProtocol: 1,
    fallbackKeywords: ["lombaire", "dos", "lombalgie"],
    anchor: [0.02, 0.78, -0.08],
  },
  {
    id: "sacrum",
    label: "Sacrum",
    painQuestion: "Que faire lorsque la personne a mal au sacrum / sciatique ?",
    preferredProtocol: 5,
    fallbackKeywords: ["sciatique", "sacrum", "lombaire"],
    anchor: [0.02, 0.62, -0.07],
  },
  {
    id: "abdomen",
    label: "Abdomen",
    painQuestion: "Que faire lorsque la personne a une gêne digestive / abdominale ?",
    preferredProtocol: 57,
    fallbackKeywords: ["digestif", "abdomen", "estomac"],
    anchor: [0.02, 0.82, 0.12],
  },
  {
    id: "hanche",
    label: "Hanche",
    painQuestion: "Que faire lorsque la personne a mal à la hanche ?",
    preferredProtocol: 5,
    fallbackKeywords: ["hanche", "bassin", "sciatique"],
    anchor: [0.12, 0.58, 0.04],
  },
  {
    id: "cuisse",
    label: "Cuisse",
    painQuestion: "Que faire lorsque la personne a mal à la cuisse ?",
    preferredProtocol: 106,
    fallbackKeywords: ["cuisse", "sport", "fémur"],
    anchor: [0.08, 0.42, 0.04],
  },
  {
    id: "genou",
    label: "Genou",
    painQuestion: "Que faire lorsque la personne a mal au genou ?",
    preferredProtocol: 9,
    fallbackKeywords: ["genou", "rotule"],
    anchor: [0.06, 0.28, 0.08],
  },
  {
    id: "mollet",
    label: "Mollet",
    painQuestion: "Que faire lorsque la personne a mal au mollet / jambes lourdes ?",
    preferredProtocol: 32,
    fallbackKeywords: ["mollet", "jambes", "circulation"],
    anchor: [0.05, 0.14, -0.02],
  },
  {
    id: "pied",
    label: "Pied / cheville",
    painQuestion: "Que faire lorsque la personne a mal à la cheville ou au pied ?",
    preferredProtocol: 10,
    fallbackKeywords: ["cheville", "entorse", "talon", "plante", "achille", "pied"],
    anchor: [0.05, 0.04, 0.08],
  },
];

export function getAnatomyZone(id: string): AnatomyZoneDef | undefined {
  return ANATOMY_ZONES.find((z) => z.id === id);
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Alias de recherche FR → zone (ex. « dos », « cuisse »). */
const SEARCH_ALIASES: Array<{ keys: string[]; zoneId: AnatomyZoneId }> = [
  { keys: ["dos", "dorsalgie", "haut du dos", "dos superieur"], zoneId: "dorsal" },
  { keys: ["bas du dos", "lombalgie", "lombaires", "lombaire"], zoneId: "lombaires" },
  { keys: ["cou", "cervical", "cervicales", "nuque"], zoneId: "nuque" },
  { keys: ["jambes", "jambe", "mollet"], zoneId: "mollet" },
  { keys: ["pied", "pieds", "orteils", "cheville", "talon", "plante", "achille"], zoneId: "pied" },
  { keys: ["fesses", "fessier", "fessiers", "sciatique"], zoneId: "sacrum" },
  { keys: ["poitrine", "pectoraux", "respiration"], zoneId: "thorax" },
  { keys: ["ventre", "digestif"], zoneId: "abdomen" },
  { keys: ["bras", "biceps", "triceps", "avant bras", "coude"], zoneId: "bras" },
  { keys: ["anxiete", "stress", "insomnie", "sommeil"], zoneId: "crane" },
  { keys: ["tete", "crane", "migraine", "cephalee"], zoneId: "crane" },
];

/** Recherche zone par libellé / alias / mots-clés. */
export function searchAnatomyZones(query: string): AnatomyZoneDef[] {
  const q = normalize(query).trim();
  if (!q || q.length < 2) return [];

  const aliasHits = new Set<AnatomyZoneId>();
  for (const alias of SEARCH_ALIASES) {
    if (alias.keys.some((k) => k.includes(q) || q.includes(k))) {
      aliasHits.add(alias.zoneId);
    }
  }

  return ANATOMY_ZONES.filter((zone) => {
    if (aliasHits.has(zone.id)) return true;
    const blob = normalize([zone.id, zone.label, ...zone.fallbackKeywords].join(" "));
    return blob.includes(q) || q.includes(normalize(zone.label));
  }).slice(0, 8);
}

/** Résout le protocole ventouses lié à une zone (extensible). */
export function resolveZoneProtocol(zone: AnatomyZoneDef): VentouseProtocol | null {
  const preferred = getVentouseProtocol(zone.preferredProtocol);
  if (preferred) return preferred;

  const keys = zone.fallbackKeywords.map(normalize);
  let best: VentouseProtocol | null = null;
  let score = 0;
  for (const p of VENTOUSE_PROTOCOLS) {
    const blob = normalize([p.title, p.objective, ...p.indications, ...p.applicationPoints].join(" "));
    let s = 0;
    for (const k of keys) if (blob.includes(k)) s += 2;
    if (s > score) {
      score = s;
      best = p;
    }
  }
  return score >= 2 ? best : null;
}
