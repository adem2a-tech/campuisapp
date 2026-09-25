/**
 * Aide diagnostique — matching UNIQUEMENT sur le catalogue des protocoles ventouses CAMPUS.
 * Pas d’invention hors PDF / fiches : si ce n’est pas dans les protocoles, on ne trouve rien.
 */

import { VENTOUSE_PROTOCOLS, type VentouseProtocol } from "@/lib/ventouse-protocols";

export type DiagnosticInput = {
  age: number | null;
  where: string;
  since: string;
  /** Notes libres : symptômes, contexte, remarques — prises en compte dans la recherche catalogue. */
  notes: string;
  /**
   * true  = orientation psycho (anxiété, stress, sommeil…) → boost catégorie « stress »
   * false = plainte plutôt physique / zone
   * null  = non précisé
   */
  psychological: boolean | null;
};

export type DiagnosticMatch = {
  protocol: VentouseProtocol;
  score: number;
  reasons: string[];
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ZONE_SYNONYMS: Record<string, string[]> = {
  tete: ["tete", "crane", "front", "tempe", "cephalee", "migraine", "visage", "sinus", "maux de tete"],
  nuque: ["nuque", "cou", "cervical", "cervicaux", "trapeze", "cervicales"],
  epaule: ["epaule", "deltoide", "scapula", "omoplate", "epaules"],
  dos: ["dos", "dorsal", "interscapulaire", "thoracique", "haut du dos"],
  lombaire: ["lombaire", "lombaires", "bas du dos", "sciatique", "sacrum", "lombalgie"],
  genou: ["genou", "rotule", "menisque", "genoux"],
  hanche: ["hanche", "fessier", "piriforme", "hanches"],
  ventre: ["ventre", "abdomen", "digestion", "estomac", "ballonnement"],
  jambe: ["jambe", "mollet", "jambes", "pied", "cheville"],
  bras: ["bras", "avant bras", "poignet", "coude", "main"],
};

const PSYCHO_TOKENS = [
  "anxiete",
  "stress",
  "insomnie",
  "sommeil",
  "tension nerveuse",
  "nervosite",
  "detente",
  "relaxation",
  "bien etre",
  "mental",
  "angoisse",
  "panique",
  "fatigue mentale",
  "burn out",
  "emotion",
];

function expandQuery(where: string, since: string, notes: string, psychological: boolean | null): string[] {
  const base = normalize([where, since, notes].filter(Boolean).join(" "));
  const tokens = new Set(base.split(" ").filter((t) => t.length >= 2));

  for (const [key, syns] of Object.entries(ZONE_SYNONYMS)) {
    if (syns.some((s) => base.includes(normalize(s))) || base.includes(key)) {
      syns.forEach((s) => tokens.add(normalize(s)));
      tokens.add(key);
    }
  }

  if (psychological === true) {
    PSYCHO_TOKENS.forEach((t) => tokens.add(normalize(t)));
    tokens.add("stress");
    tokens.add("anxiete");
  } else if (
    psychological !== false &&
    PSYCHO_TOKENS.some((t) => base.includes(normalize(t)))
  ) {
    PSYCHO_TOKENS.forEach((t) => tokens.add(normalize(t)));
  }

  return [...tokens];
}

function haystack(p: VentouseProtocol) {
  return normalize(
    [
      p.title,
      p.objective,
      p.categoryId,
      ...p.indications,
      ...p.applicationPoints,
      ...p.contraindications,
      ...p.steps.map((s) => `${s.title} ${s.detail}`),
      p.proTip,
      ...(p.tags || []),
    ].join(" "),
  );
}

function ageBlocks(protocol: VentouseProtocol, age: number | null): string | null {
  if (age == null) return null;
  const ci = normalize(protocol.contraindications.join(" "));
  if (age < 12 && /(enfant|pediatr|mineur)/.test(ci)) {
    return "Précaution / âge (mention fiche)";
  }
  if (age >= 65 && /(age|fragile|peau fine|senior)/.test(ci)) {
    return "Précaution âge / peau (mention fiche)";
  }
  return null;
}

function phraseHits(hay: string, phrases: string[]): string[] {
  const hits: string[] = [];
  for (const p of phrases) {
    const n = normalize(p);
    if (n.length >= 4 && hay.includes(n)) hits.push(p.trim());
  }
  return hits;
}

/** Recherche dans le catalogue ventouses uniquement. */
export function diagnoseFromProtocols(input: DiagnosticInput): {
  matches: DiagnosticMatch[];
  emptyReason: string | null;
} {
  const where = input.where.trim();
  const notes = input.notes.trim();
  const hasComplaint = where.length >= 2 || notes.length >= 3 || input.psychological === true;

  if (!hasComplaint) {
    return {
      matches: [],
      emptyReason: "Indiquez où le patient a mal, des notes, ou précisez si c’est plutôt psychologique.",
    };
  }

  const tokens = expandQuery(where, input.since, notes, input.psychological);
  const freePhrases = [where, notes].filter((s) => s.trim().length >= 3);
  const scored: DiagnosticMatch[] = [];

  for (const protocol of VENTOUSE_PROTOCOLS) {
    const hay = haystack(protocol);
    let score = 0;
    const reasons: string[] = [];

    for (const t of tokens) {
      if (t.length < 3) continue;
      if (!hay.includes(t)) continue;

      score += t.length >= 5 ? 3 : 2;

      if (normalize(protocol.title).includes(t)) {
        score += 5;
        reasons.push(`Titre : « ${protocol.title} »`);
      } else {
        const ind = protocol.indications.find((i) => normalize(i).includes(t));
        if (ind) {
          score += 4;
          reasons.push(`Indication : ${ind}`);
        } else {
          const pt = protocol.applicationPoints.find((p) => normalize(p).includes(t));
          if (pt) {
            score += 2;
            reasons.push(`Point d’application : ${pt}`);
          }
        }
      }
    }

    for (const hit of phraseHits(hay, freePhrases)) {
      score += 10;
      reasons.push(`Correspondance avec « ${hit.slice(0, 60)}${hit.length > 60 ? "…" : ""} »`);
    }

    // Orientation psychologique → fiches stress / anxiété du catalogue
    if (input.psychological === true) {
      const titleN = normalize(protocol.title);
      const psychoTitle =
        /(anxiete|stress|burnout|burn out|detente|sommeil|irritabil|bruxisme|nerveux|mental|angoisse)/.test(
          titleN,
        );
      if (psychoTitle) {
        score += 22;
        reasons.push(`Fiche orientée stress / mental : « ${protocol.title} »`);
      } else if (protocol.categoryId === "stress") {
        score += 10;
        reasons.push("Catégorie catalogue : Stress et bien-être mental");
      } else if (/(anxiete|stress|sommeil|detente|relax|nerveux|mental|angoisse)/.test(hay)) {
        score += 8;
        reasons.push("Mentions stress / anxiété dans la fiche");
      }
    } else if (input.psychological === false && protocol.categoryId === "stress") {
      const first = normalize(where.split(/\s+/)[0] || "");
      if (!first || first.length < 3 || !hay.includes(first)) {
        score = Math.max(0, score - 6);
      }
    }

    // Chronique / aigu (depuis combien de temps)
    const sinceN = normalize(input.since);
    if (sinceN.includes("chronique") && /chronique|persistant|permanent/.test(hay)) {
      score += 3;
      reasons.push("Correspondance durée (chronique)");
    }
    if ((sinceN.includes("aigu") || sinceN.includes("aujourdhui")) && /aigu|recent|soudain/.test(hay)) {
      score += 2;
    }

    const ageNote = ageBlocks(protocol, input.age);
    if (ageNote) {
      score -= 3;
      reasons.push(ageNote);
    }

    if (score > 0) {
      const uniqueReasons = [...new Set(reasons)].slice(0, 5);
      scored.push({ protocol, score, reasons: uniqueReasons });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.protocol.number - b.protocol.number);
  const top = scored.filter((m) => m.score >= 4).slice(0, 8);

  if (top.length === 0) {
    return {
      matches: [],
      emptyReason:
        "Aucun protocole ventouse du catalogue CAMPUS ne correspond assez clairement. On ne propose que ce qui est écrit dans les fiches — rien n’est inventé. Reformulez la zone, les notes, ou cochez « psychologique » si c’est du stress / anxiété.",
    };
  }

  return { matches: top, emptyReason: null };
}
