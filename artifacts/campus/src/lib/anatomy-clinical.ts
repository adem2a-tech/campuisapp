/**
 * Résolution clinique : structure anatomique (FR/EN) → protocole ventouses le plus proche.
 * Priorité : les 150 protocoles PDF, puis les fiches Guide.
 */

import {
  PROTOCOLE_FLASHCARDS,
  type ProtocolFlashcard,
} from "@/lib/formation-flashcards";
import { VENTOUSE_PROTOCOLS, type VentouseProtocol } from "@/lib/ventouse-protocols";

export type ClinicalTargetKind = "psychologique" | "muscle";

export type ClinicalMatch = {
  /** Nom affiché en français */
  labelFr: string;
  /** Nom brut éventuel (BioDigital EN) */
  labelRaw?: string;
  /** Zone clinique CAMPUS */
  regionId: string;
  regionLabel: string;
  /** Protocole trouvé dans les PDF (Guide / ventouses), sinon null */
  protocol: ProtocolFlashcard | null;
  /** true = une fiche PDF/protocole couvre cette structure */
  pdfFound: boolean;
  /** Lien vers le PDF protocoles ventouses */
  pdfHref: string;
  pdfButtonLabel: string;
  /** Phrase « que faire » pour le praticien */
  whatToDo: string[];
  reason: string;
  /**
   * Synchronisation PDF :
   * - stress / bien-être mental → « psychologique »
   * - sinon → muscles / points d'application du protocole
   */
  targetKind: ClinicalTargetKind;
  /** Libellé court pour la barre 3D (Psychologique ou 1er muscle) */
  targetLabel: string;
  /** Muscles / zones touchées issus du PDF (points d'application) */
  musclesTouched: string[];
  /** Numéro de fiche 150 protocoles si trouvé */
  ventouseNumber?: number;
};

/** Traductions des libellés BioDigital / anatomie anglaise fréquents. */
const EN_TO_FR: Array<{ match: RegExp; fr: string; regionId: string }> = [
  { match: /\b(skull|cranium)\b/i, fr: "Crâne", regionId: "head" },
  { match: /\bfrontal\b|^frontal$/i, fr: "Os frontal", regionId: "forehead" },
  { match: /\bparietal\b/i, fr: "Os pariétal", regionId: "head" },
  { match: /\btemporal\b/i, fr: "Os temporal", regionId: "ear" },
  { match: /\boccipital\b/i, fr: "Os occipital", regionId: "neck" },
  { match: /\bmandible|jaw\b/i, fr: "Mandibule", regionId: "jaw" },
  { match: /\bmaxilla\b/i, fr: "Maxillaire", regionId: "jaw" },
  { match: /\bnasal\b/i, fr: "Os nasal", regionId: "forehead" },
  { match: /\bzygomatic\b/i, fr: "Os zygomatique", regionId: "jaw" },
  { match: /\beye|orbit\b/i, fr: "Orbite / œil", regionId: "eye" },
  { match: /\bcervical\b/i, fr: "Vertèbre cervicale", regionId: "neck" },
  { match: /\bthoracic\b/i, fr: "Vertèbre thoracique", regionId: "upper-back" },
  { match: /\blumbar\b/i, fr: "Vertèbre lombaire", regionId: "lower-back" },
  { match: /\bsacrum|sacral\b/i, fr: "Sacrum", regionId: "lower-back" },
  { match: /\bcoccyx\b/i, fr: "Coccyx", regionId: "lower-back" },
  { match: /\bsternum\b/i, fr: "Sternum", regionId: "chest" },
  { match: /\brib|costal\b/i, fr: "Côte", regionId: "chest" },
  { match: /\bclavicle\b/i, fr: "Clavicule", regionId: "shoulder-r" },
  { match: /\bscapula\b/i, fr: "Omoplate", regionId: "shoulder-r" },
  { match: /\bhumerus\b/i, fr: "Humérus", regionId: "shoulder-r" },
  { match: /\bradius\b/i, fr: "Radius", regionId: "shoulder-r" },
  { match: /\bulna\b/i, fr: "Cubitus (ulna)", regionId: "shoulder-r" },
  { match: /\bcarpal|metacarpal|phalanx.*(hand|finger)|finger\b/i, fr: "Main / doigt", regionId: "shoulder-r" },
  { match: /\bfemur\b/i, fr: "Fémur", regionId: "knee-l" },
  { match: /\bpatella\b/i, fr: "Rotule (patella)", regionId: "knee-r" },
  { match: /\btibia\b/i, fr: "Tibia", regionId: "knee-r" },
  { match: /\bfibula\b/i, fr: "Péroné (fibula)", regionId: "knee-r" },
  { match: /\b(phalanx|toe|hallux).*(right|left)?.*(big)?.*toe\b|\bright big toe\b|\bphalanx right big toe\b/i, fr: "Phalange du gros orteil (droit)", regionId: "knee-r" },
  { match: /\b(talus|calcaneus|tarsal|metatarsal|phalanx.*(foot|toe)|toe|hallux|big.?toe)\b/i, fr: "Pied / orteil", regionId: "knee-r" },
  { match: /\bpelvis|ilium|ischium|pubis|hip\b/i, fr: "Bassin / hanche", regionId: "lower-back" },
  { match: /\bknee\b/i, fr: "Genou", regionId: "knee-r" },
  { match: /\bshoulder\b/i, fr: "Épaule", regionId: "shoulder-r" },
  { match: /\belbow\b/i, fr: "Coude", regionId: "shoulder-r" },
  { match: /\bwrist\b/i, fr: "Poignet", regionId: "shoulder-r" },
  { match: /\bankle\b/i, fr: "Cheville", regionId: "knee-r" },
  { match: /\bspine|vertebra\b/i, fr: "Colonne vertébrale", regionId: "upper-back" },
];

const FR_HINTS: Array<{ match: RegExp; fr: string; regionId: string }> = [
  { match: /f[eé]mur/i, fr: "Fémur", regionId: "knee-l" },
  { match: /rotule|patella/i, fr: "Rotule", regionId: "knee-r" },
  { match: /genou/i, fr: "Genou", regionId: "knee-r" },
  { match: /orteil|phalanx|phalange|pied|hallux/i, fr: "Pied / orteil", regionId: "knee-r" },
  { match: /frontal|front/i, fr: "Front / os frontal", regionId: "forehead" },
  { match: /lombaire|sacrum|sciatique/i, fr: "Lombaires / sacrum", regionId: "lower-back" },
  { match: /cervical|nuque|cou\b/i, fr: "Nuque / cervicales", regionId: "neck" },
  { match: /cr[aâ]ne|t[eê]te|c[eé]phal/i, fr: "Tête / crâne", regionId: "head" },
  { match: /[eé]paule|hum[eé]rus|omoplate|clavicule/i, fr: "Épaule", regionId: "shoulder-r" },
  { match: /thorax|c[oô]te|sternum/i, fr: "Thorax", regionId: "chest" },
  { match: /abdomen|ventre/i, fr: "Abdomen", regionId: "abdomen" },
  { match: /m[aâ]choire|mandibule|maxillaire|atm/i, fr: "Maxillaire / mâchoire", regionId: "jaw" },
  { match: /^maxilla$/i, fr: "Maxillaire", regionId: "jaw" },
  { match: /oreille|temporal/i, fr: "Oreille / temporal", regionId: "ear" },
  { match: /œil|oeil|orbite/i, fr: "Œil / orbite", regionId: "eye" },
];

const REGION_LABELS: Record<string, string> = {
  eye: "Œil",
  head: "Tête / crâne",
  forehead: "Front",
  ear: "Oreille",
  jaw: "Mâchoire / ATM",
  neck: "Nuque & cou",
  "upper-back": "Haut du dos",
  chest: "Thorax",
  abdomen: "Abdomen",
  "lower-back": "Lombaires",
  "shoulder-r": "Épaule",
  "shoulder-l": "Épaule",
  "knee-r": "Genou / membre inférieur",
  "knee-l": "Genou / membre inférieur",
  psychologique: "Psychologique",
  "muscle-direct": "Muscle touché (PDF)",
};

/** Priorité des protocoles par région (id protocole). */
const REGION_PROTOCOL_PRIORITY: Record<string, string[]> = {
  forehead: ["proto-cephalee", "proto-dos-cervical"],
  head: ["proto-cephalee", "proto-dos-cervical"],
  eye: ["proto-cephalee"],
  ear: ["proto-anxiete", "proto-cephalee"],
  jaw: ["proto-cephalee", "proto-dos-cervical"],
  neck: ["proto-dos-cervical", "proto-cephalee", "proto-zone1"],
  "upper-back": ["proto-dos-cervical", "proto-zone1", "proto-respiratoire"],
  chest: ["proto-respiratoire", "proto-dos-cervical"],
  abdomen: ["proto-digestif"],
  "lower-back": ["proto-lombaire", "proto-zone3"],
  "shoulder-r": ["proto-dos-cervical", "proto-sport", "proto-zone1"],
  "shoulder-l": ["proto-dos-cervical", "proto-sport", "proto-zone1"],
  "knee-r": ["proto-sport", "proto-lombaire"],
  "knee-l": ["proto-sport", "proto-lombaire"],
};

function protocolById(id: string) {
  return PROTOCOLE_FLASHCARDS.find((p) => p.id === id) ?? null;
}

function protocolsPdfHref(page?: number) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const url = `${base}/formation/protocoles-ventouses.pdf`;
  return page && page > 1 ? `${url}#page=${page}` : url;
}

function guidePdfHref() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/formation/guide-points-therapeutiques.pdf`;
}

function normalizeToken(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function tokensFrom(labelFr: string) {
  return normalizeToken(labelFr)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4);
}

const REGION_VENTOUSE_HINTS: Record<string, string[]> = {
  forehead: ["céphalée", "front", "migraine", "sinus"],
  head: ["céphalée", "migraine", "crâne", "tête"],
  eye: ["céphalée", "sinus", "œil"],
  ear: ["oreille", "tempor", "acouphène"],
  jaw: ["mâchoire", "atm", "mandibule", "facial", "bruxisme", "masséter", "masseter"],
  neck: ["cervical", "nuque", "cou", "trapèze"],
  "upper-back": ["dos", "thoracique", "interscapulaire", "trapèze", "rhomboïde"],
  chest: ["respiratoire", "asthme", "thorax", "intercostal"],
  abdomen: ["digestif", "abdomen", "intestin", "estomac"],
  "lower-back": ["lombaire", "sacrum", "sciatique", "bassin"],
  "shoulder-r": ["épaule", "deltoïde", "bras", "canal carpien", "poignet", "fléchisseur"],
  "shoulder-l": ["épaule", "deltoïde", "bras", "canal carpien", "poignet", "fléchisseur"],
  "knee-r": ["genou", "jambe", "sport", "mollet", "cheville"],
  "knee-l": ["genou", "jambe", "sport", "mollet", "cheville"],
  psychologique: ["stress", "anxiété", "anxi", "insomnie", "burnout", "mental", "détente", "sommeil"],
};

/** Protocoles stress / mental du PDF → cible « psychologique » (pas un muscle). */
export function isPsychologicalProtocol(p: Pick<VentouseProtocol, "categoryId" | "title" | "objective" | "indications">) {
  if (p.categoryId === "stress") return true;
  const blob = normalizeToken([p.title, p.objective, ...(p.indications ?? [])].join(" "));
  return /(anxi|stress|insomnie|burnout|mental|bien.?etre mental|irritabil|detente nerveuse|sommeil agite)/.test(blob);
}

export function resolveProtocolTarget(p: VentouseProtocol | null): {
  targetKind: ClinicalTargetKind;
  targetLabel: string;
  musclesTouched: string[];
} {
  if (!p) {
    return { targetKind: "muscle", targetLabel: "Zone à préciser", musclesTouched: [] };
  }
  if (isPsychologicalProtocol(p)) {
    return {
      targetKind: "psychologique",
      targetLabel: "Psychologique",
      musclesTouched: p.applicationPoints,
    };
  }
  const muscles = p.applicationPoints.filter(Boolean);
  return {
    targetKind: "muscle",
    targetLabel: muscles[0] ?? p.title,
    musclesTouched: muscles,
  };
}

function ventouseToFlashcard(p: VentouseProtocol): ProtocolFlashcard {
  return {
    id: p.id,
    category: "protocoles",
    title: `Protocole ${p.number} — ${p.title}`,
    condition: p.objective,
    points: p.applicationPoints.join(", "),
    cupSize: p.material.find((m) => /ventouse/i.test(m)) ?? p.material[0] ?? "",
    technique: p.steps.map((s) => s.title).join(" → "),
    frequency: p.steps.find((s) => /dur/i.test(s.title))?.detail ?? "10 à 15 minutes",
    precautions: p.contraindications.join(" · "),
    material: p.material.join(" · "),
    indications: p.indications,
    steps: p.steps.map((s) => `${s.title} : ${s.detail}`),
    tags: [p.title, ...p.indications, ...p.applicationPoints],
    level: "intermediaire",
    source: `150 protocoles ventouses · fiche ${p.number}`,
    anatomyRegionIds: [],
  };
}

function scoreVentouse(p: VentouseProtocol, needles: string[]) {
  const blob = normalizeToken(
    [p.title, p.objective, ...p.indications, ...p.applicationPoints, ...p.tags].join(" "),
  );
  let score = 0;
  for (const n of needles) {
    if (n.length < 4) continue;
    if (blob.includes(n)) score += n.length >= 6 ? 3 : 2;
  }
  return score;
}

function pickVentouseProtocol(regionId: string, labelFr: string): VentouseProtocol | null {
  const wantPsycho = regionId === "psychologique" || /psycholog/i.test(labelFr);
  const needles = [
    ...tokensFrom(labelFr),
    ...(REGION_VENTOUSE_HINTS[regionId] ?? []).map(normalizeToken),
  ];
  let best: VentouseProtocol | null = null;
  let bestScore = 0;
  for (const p of VENTOUSE_PROTOCOLS) {
    if (wantPsycho && !isPsychologicalProtocol(p)) continue;
    // Sur une structure osseuse / musculaire, ne pas coller un protocole stress
    // sauf si la recherche est explicitement psychologique.
    if (!wantPsycho && isPsychologicalProtocol(p) && regionId !== "psychologique") {
      // pénalité : on privilégie le muscle touché du PDF
      const s = scoreVentouse(p, needles) - 6;
      if (s > bestScore) {
        best = p;
        bestScore = s;
      }
      continue;
    }
    const s = scoreVentouse(p, needles);
    if (s > bestScore) {
      best = p;
      bestScore = s;
    }
  }
  if (wantPsycho && !best) {
    return VENTOUSE_PROTOCOLS.find((p) => p.categoryId === "stress") ?? VENTOUSE_PROTOCOLS.find(isPsychologicalProtocol) ?? null;
  }
  return bestScore >= 4 ? best : null;
}

/** Protocole ventouses dont un point d'application correspond au muscle cliqué. */
function pickVentouseByMuscle(muscleLabel: string): VentouseProtocol | null {
  const needle = normalizeToken(muscleLabel);
  if (needle.length < 3) return null;
  let best: VentouseProtocol | null = null;
  let bestScore = 0;
  for (const p of VENTOUSE_PROTOCOLS) {
    if (isPsychologicalProtocol(p)) continue;
    for (const point of p.applicationPoints) {
      const pt = normalizeToken(point);
      if (pt === needle || pt.includes(needle) || needle.includes(pt)) {
        const s = Math.max(pt.length, needle.length);
        if (s > bestScore) {
          best = p;
          bestScore = s;
        }
      }
    }
  }
  return best;
}

function pickGuideProtocol(regionId: string): ProtocolFlashcard | null {
  const priorities = REGION_PROTOCOL_PRIORITY[regionId] ?? [];
  for (const id of priorities) {
    const p = protocolById(id);
    if (p) return p;
  }
  return PROTOCOLE_FLASHCARDS.find((p) => p.anatomyRegionIds?.includes(regionId)) ?? null;
}

function buildWhatToDo(labelFr: string, protocol: ProtocolFlashcard | null, pdfFound: boolean): string[] {
  if (!pdfFound || !protocol) {
    return [
      `Douleur diagnostiquée sur : ${labelFr}.`,
      `Aucun protocole ventouses dédié n'a été trouvé pour « ${labelFr} » dans les PDF (Guide / 150 protocoles).`,
      "Ne pas improviser une pose : documenter la zone, vérifier les contre-indications générales, et consulter le PDF des 150 protocoles ou le Guide pour une zone voisine.",
      "Mettre à jour la carte corporelle et l'intensité douleur 0–10.",
    ];
  }
  return [
    `Douleur diagnostiquée sur : ${labelFr}.`,
    `Protocole ventouses trouvé : « ${protocol.title} ».`,
    `Ventouse / taille : ${protocol.cupSize}${protocol.material ? ` · ${protocol.material}` : ""}.`,
    `Technique : ${protocol.technique}.`,
    `Points : ${protocol.points}.`,
    `Durée / fréquence : ${protocol.frequency}.`,
    `Contre-indications : ${protocol.precautions}`,
  ];
}

export function translateAnatomyLabel(raw: string): { labelFr: string; regionId: string } | null {
  const text = raw.trim();
  if (!text) return null;
  for (const row of FR_HINTS) {
    if (row.match.test(text)) return { labelFr: row.fr, regionId: row.regionId };
  }
  for (const row of EN_TO_FR) {
    if (row.match.test(text)) return { labelFr: row.fr, regionId: row.regionId };
  }
  return null;
}

function finalizeMatch(labelFr: string, regionId: string, labelRaw?: string): ClinicalMatch {
  const byMuscle = regionId !== "psychologique" ? pickVentouseByMuscle(labelFr) : null;
  const ventouse = byMuscle ?? pickVentouseProtocol(regionId, labelFr);
  const guide = ventouse ? null : pickGuideProtocol(regionId);
  const protocol = ventouse ? ventouseToFlashcard(ventouse) : guide;
  const pdfFound = Boolean(protocol);
  const target = resolveProtocolTarget(ventouse);
  // Si le guide Match sans fiche 150 : tenter de déduire psychologique vs muscle
  const fallbackTarget =
    !ventouse && protocol
      ? /stress|anxi|insomnie|mental/i.test(`${protocol.title} ${protocol.condition}`)
        ? { targetKind: "psychologique" as const, targetLabel: "Psychologique", musclesTouched: [] }
        : {
            targetKind: "muscle" as const,
            targetLabel: protocol.points.split(",")[0]?.trim() || labelFr,
            musclesTouched: protocol.points
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          }
      : target;

  return {
    labelFr,
    labelRaw,
    regionId,
    regionLabel: REGION_LABELS[regionId] ?? regionId,
    protocol: pdfFound ? protocol : null,
    pdfFound,
    pdfHref: ventouse ? protocolsPdfHref(ventouse.pdfPage) : pdfFound ? guidePdfHref() : protocolsPdfHref(),
    pdfButtonLabel: pdfFound
      ? ventouse
        ? `Voir PDF — protocole ${ventouse.number}`
        : `Voir PDF — ventouses (${labelFr})`
      : `Parcourir le PDF des 150 protocoles`,
    whatToDo: buildWhatToDo(labelFr, protocol, pdfFound),
    reason: pdfFound
      ? ventouse
        ? fallbackTarget.targetKind === "psychologique"
          ? `Fiche ${ventouse.number} — approche psychologique (stress / mental).`
          : `Fiche ${ventouse.number} — muscle / zone touchée : ${fallbackTarget.musclesTouched.join(", ")}.`
        : "Fiche protocole trouvée dans vos PDF professionnels."
      : `Aucun PDF n'a été trouvé pour ${labelFr}.`,
    targetKind: fallbackTarget.targetKind,
    targetLabel: fallbackTarget.targetLabel,
    musclesTouched: fallbackTarget.musclesTouched,
    ventouseNumber: ventouse?.number,
  };
}

export function resolveClinicalFromPick(rawName: string): ClinicalMatch {
  const text = rawName.trim();
  if (/psycholog/i.test(text)) {
    return finalizeMatch("Psychologique", "psychologique", rawName);
  }
  // D'abord : le libellé est-il un muscle / point du PDF ?
  const byMuscle = pickVentouseByMuscle(text);
  if (byMuscle) {
    const point =
      byMuscle.applicationPoints.find((p) => normalizeToken(p).includes(normalizeToken(text))) ??
      byMuscle.applicationPoints[0] ??
      text;
    return finalizeMatch(point, "muscle-direct", rawName);
  }
  const translated = translateAnatomyLabel(rawName);
  const regionId = translated?.regionId ?? "upper-back";
  const labelFr = translated?.labelFr ?? (rawName ? humanizeEn(rawName) : "Zone sélectionnée");
  return finalizeMatch(labelFr, regionId, rawName);
}

export function resolveClinicalFromRegion(regionId: string, labelFr?: string): ClinicalMatch {
  if (regionId === "psychologique") {
    return finalizeMatch(labelFr ?? "Psychologique", "psychologique");
  }
  if (regionId === "muscle-direct" && labelFr) {
    return finalizeMatch(labelFr, "muscle-direct");
  }
  const label = labelFr ?? REGION_LABELS[regionId] ?? regionId;
  return finalizeMatch(label, regionId);
}

function humanizeEn(name: string) {
  return name
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Structures rapides : os + muscles PDF + entrée psychologique (stress). */
export const FRENCH_STRUCTURE_CHIPS: Array<{ label: string; regionId: string; hint: string }> = [
  { label: "Psychologique", regionId: "psychologique", hint: "Stress / mental (PDF)" },
  { label: "Trapèze supérieur", regionId: "muscle-direct", hint: "Muscle touché" },
  { label: "Rhomboïdes", regionId: "muscle-direct", hint: "Muscle touché" },
  { label: "Nuque", regionId: "muscle-direct", hint: "Muscle touché" },
  { label: "Zone interscapulaire", regionId: "muscle-direct", hint: "Muscle touché" },
  { label: "Région lombaire basse", regionId: "muscle-direct", hint: "Muscle touché" },
  { label: "Zone sacrée", regionId: "muscle-direct", hint: "Muscle touché" },
  { label: "Deltoïde", regionId: "muscle-direct", hint: "Muscle touché" },
  { label: "Fléchisseurs avant-bras", regionId: "muscle-direct", hint: "Muscle touché" },
  { label: "Os frontal", regionId: "forehead", hint: "Céphalée frontale" },
  { label: "Maxillaire", regionId: "jaw", hint: "Mâchoire / ATM" },
  { label: "Crâne", regionId: "head", hint: "Céphalée" },
  { label: "Cervicales", regionId: "neck", hint: "Nuque" },
  { label: "Thoraciques / dos", regionId: "upper-back", hint: "Dos supérieur" },
  { label: "Lombaires", regionId: "lower-back", hint: "Sciatique" },
  { label: "Sacrum", regionId: "lower-back", hint: "Lombaire" },
  { label: "Sternum / côtes", regionId: "chest", hint: "Respiratoire" },
  { label: "Clavicule", regionId: "shoulder-r", hint: "Épaule" },
  { label: "Humérus", regionId: "shoulder-r", hint: "Épaule / bras" },
  { label: "Fémur", regionId: "knee-l", hint: "Cuisse / genou" },
  { label: "Rotule", regionId: "knee-r", hint: "Genou" },
  { label: "Tibia", regionId: "knee-r", hint: "Jambe" },
  { label: "Orteil / phalange", regionId: "knee-r", hint: "Pied" },
  { label: "Bassin / hanche", regionId: "lower-back", hint: "Hanche" },
];
