/** Protocoles cliniques issus du Guide Points Thérapeutiques (PDF). */

export type TechniqueDetail = {
  id: string;
  label: string;
  duration: string;
  holdSeconds?: number;
  durationMinutes?: number;
  cupType: string;
  cupSize: string;
  material: string;
  suction: string;
  technique: string;
  points: string[];
  steps: string[];
  frequency: string;
  precautions: string;
  indications: string[];
};

export type AnatomyRegion = {
  id: string;
  label: string;
  group: "tête" | "cou" | "tronc" | "membre" | "dos";
  /** Position relative au corps 3D (mètres) */
  position: [number, number, number];
  size: [number, number, number];
  shape?: "box" | "sphere";
  techniques: TechniqueDetail[];
};

export const ANATOMY_REGIONS: AnatomyRegion[] = [
  {
    id: "eye",
    label: "Œil",
    group: "tête",
    position: [0.12, 1.58, 0.18],
    size: [0.08, 0.05, 0.05],
    shape: "sphere",
    techniques: [
      {
        id: "eye-cupping",
        label: "Technique ventouse",
        duration: "Flash 2–3 s · jamais > 3 s stationnaire",
        holdSeconds: 3,
        cupType: "Micro / Visage — ventouse goutte silicone",
        cupSize: "1–3 cm (idéalement goutte < 2 cm)",
        material: "Silicone médical + tampon alcoolisé + stylo dermographique",
        suction: "Minimale — compression douce uniquement",
        technique: "Ventouse goutte sous / autour de l'orbite, succion minimale, passages courts sans stationnaire prolongé.",
        points: ["BL2 Zanzhu (sourcil médial)", "GB14 Yangbai (au-dessus de la pupille)", "Œil 1 & 2 (lobe auriculaire)", "ST8 Touwei"],
        steps: [
          "Évaluer contre-indications (infection oculaire, chirurgie récente, peau fragile).",
          "Nettoyer la zone ; marquer BL2 / GB14 si besoin.",
          "Appliquer micro-ventouse silicone goutte sous l'œil : succion minimale.",
          "Flash 2–3 secondes maximum — ne jamais laisser stationnaire > 3 s.",
          "Drainage lymphatique léger vers les tempes / oreille.",
          "Retirer, nettoyer, documenter points et réponse.",
        ],
        frequency: "Selon plainte · souvent associé au protocole céphalée / facial douleur",
        precautions: "Peau péri-oculaire très fine : micro-ventouses uniquement. Pas de succion forte. Contre-indiqué si infection oculaire active.",
        indications: ["Fatigue oculaire", "Cernes / gonflement", "Céphalée frontale", "Sinus", "Paralysie faciale (appui)"],
      },
      {
        id: "eye-auricular",
        label: "Auriculothérapie",
        duration: "5–20 minutes",
        durationMinutes: 15,
        cupType: "Micro-ventouse auriculaire ou perle",
        cupSize: "1–2 cm",
        material: "Micro-ventouse silicone / perle d'acupression / sonde détecteur",
        suction: "Légère à modérée sur le lobe",
        technique: "Points Œil 1 & 2 sur le lobe + Shen Men si douleur associée.",
        points: ["Œil 1 & 2 (lobe zone 5)", "Shen Men", "Thalamus (si douleur)"],
        steps: [
          "Inspecter l'oreille (couleur, sensibilité).",
          "Localiser Œil 1 & 2 sur le lobe.",
          "Appliquer micro-ventouse ou perle 5–20 min.",
          "Observer érythème ; retirer ; nettoyer à l'alcool.",
        ],
        frequency: "1–2× / semaine selon plainte",
        precautions: "Oreille infectée ou plaie : reporter.",
        indications: ["Fatigue oculaire", "Douleur projetée", "Céphalée"],
      },
    ],
  },
  {
    id: "head",
    label: "Tête / crâne",
    group: "tête",
    position: [0, 1.62, 0],
    size: [0.28, 0.28, 0.28],
    shape: "sphere",
    techniques: [
      {
        id: "head-cupping",
        label: "Technique ventouse",
        duration: "12 minutes (dos supérieur + cou)",
        durationMinutes: 12,
        cupType: "Silicone ou verre",
        cupSize: "3–5 cm (visage : micro < 3 cm)",
        material: "Ventouses silicone 3–5 cm · micro-ventouses visage · alcool · huile de glissement",
        suction: "Légère à moyenne (corps) · minimale (visage)",
        technique: "Protocole céphalée : dos supérieur + cou. Points BL10, GB20, LI4, ST8.",
        points: ["BL10 Tianzhu", "GB20 Fengchi", "LI4 Hegu", "ST8 Touwei", "GV20 Baihui"],
        steps: [
          "Anamnèse céphalée (localisation, intensité 0–10).",
          "Ventouses 3–5 cm sur dos supérieur et nuque, ~10–12 min.",
          "Optionnel : micro-ventouses faciales flash si tension frontale.",
          "Documenter réponse et points traités.",
        ],
        frequency: "Au besoin en crise + prévention",
        precautions: "Visage : jamais > 3 s stationnaire. Éviter succion forte.",
        indications: ["Céphalée", "Migraine", "Tension cervico-céphalique"],
      },
    ],
  },
  {
    id: "forehead",
    label: "Front",
    group: "tête",
    position: [0, 1.68, 0.16],
    size: [0.18, 0.08, 0.06],
    techniques: [
      {
        id: "forehead-cupping",
        label: "Technique ventouse",
        duration: "Passages horizontaux · flash < 3 s",
        holdSeconds: 3,
        cupType: "Micro / Visage silicone",
        cupSize: "1–3 cm",
        material: "Micro-ventouses silicone · alcool",
        suction: "Minimale",
        technique: "Passages horizontaux du centre vers l'extérieur. Organe associé : Vessie / Intestins (supérieur), Cœur (inférieur).",
        points: ["GB14 Yangbai", "BL2 Zanzhu", "GV24 (appui)"],
        steps: [
          "Micro-ventouse silicone.",
          "Passages horizontaux front, sans stationnaire prolongé.",
          "Drainage lymphatique vers les tempes.",
        ],
        frequency: "Selon protocole facial",
        precautions: "Succion minimale — risque d'ecchymose.",
        indications: ["Céphalée frontale", "Tension", "Rajeunissement"],
      },
    ],
  },
  {
    id: "ear",
    label: "Oreille",
    group: "tête",
    position: [0.22, 1.55, 0],
    size: [0.06, 0.1, 0.06],
    shape: "sphere",
    techniques: [
      {
        id: "ear-cupping",
        label: "Technique ventouse",
        duration: "10–20 minutes",
        durationMinutes: 15,
        cupType: "Micro-ventouse auriculaire",
        cupSize: "1–2 cm",
        material: "Micro-ventouse silicone · perle · sonde · alcool",
        suction: "Légère",
        technique: "Auriculothérapie : Shen Men, Point Zéro, Sympathique, Thalamus selon plainte.",
        points: ["Shen Men", "Point Zéro", "Sympathique", "Thalamus"],
        steps: [
          "Évaluation client + inspection des deux oreilles.",
          "Localiser points actifs à la sonde.",
          "Micro-ventouse ou perle 10–20 min.",
          "Nettoyer et documenter.",
        ],
        frequency: "Selon protocole (douleur / émotion / général)",
        precautions: "Infection ou plaie auriculaire : reporter.",
        indications: ["Douleur", "Anxiété", "Insomnie", "Régulation systémique"],
      },
    ],
  },
  {
    id: "jaw",
    label: "Mâchoire / ATM",
    group: "tête",
    position: [0.14, 1.42, 0.12],
    size: [0.1, 0.08, 0.08],
    techniques: [
      {
        id: "jaw-cupping",
        label: "Technique ventouse",
        duration: "5–10 minutes",
        durationMinutes: 8,
        cupType: "Micro / Visage",
        cupSize: "1–3 cm",
        material: "Micro-ventouses silicone",
        suction: "Minimale",
        technique: "Facial — Douleur : ST7, GB3, BL2, SI18.",
        points: ["ST7 Xiaguan", "GB3 Shangguan", "BL2 Zanzhu", "SI18 Quanliao"],
        steps: [
          "Contour mâchoire : glissement vers le haut.",
          "Flash sur points ATM.",
          "Ne pas stationner > 3 s.",
        ],
        frequency: "Selon plainte ATM / céphalée",
        precautions: "Succion minimale sur visage.",
        indications: ["ATM", "Céphalée", "Sinus", "Spasme facial"],
      },
    ],
  },
  {
    id: "neck",
    label: "Nuque & cou",
    group: "cou",
    position: [0, 1.28, -0.02],
    size: [0.16, 0.16, 0.14],
    techniques: [
      {
        id: "neck-cupping",
        label: "Technique ventouse",
        duration: "10 minutes stationnaire + glissement",
        durationMinutes: 10,
        cupType: "Silicone ou verre",
        cupSize: "4–6 cm",
        material: "Ventouses 4–6 cm · huile · alcool · gants",
        suction: "Moyenne — éviter processus épineux",
        technique: "BL10–13, GB21, GV14. Stationnaire 10 min puis glissement le long du canal BL.",
        points: ["BL10", "BL11", "BL12", "BL13", "GB21 Jianjing", "GV14 Dazhui"],
        steps: [
          "Positionner ventouses 4–6 cm de part et d'autre de la colonne.",
          "Stationnaire 10 min.",
          "Glissement le long du méridien Vessie.",
          "2×/semaine × 4 semaines puis réévaluer.",
        ],
        frequency: "2×/semaine pendant 4 semaines",
        precautions: "Éviter succion directe sur les processus épineux.",
        indications: ["Douleur cervicale", "Céphalée", "Tension nuque"],
      },
    ],
  },
  {
    id: "upper-back",
    label: "Haut du dos",
    group: "dos",
    position: [0, 1.05, -0.12],
    size: [0.36, 0.28, 0.12],
    techniques: [
      {
        id: "upper-back-cupping",
        label: "Technique ventouse",
        duration: "10–15 minutes",
        durationMinutes: 12,
        cupType: "Silicone ou verre / pompe",
        cupSize: "4–6 cm",
        material: "Ventouses 4–6 cm · huile · allumettes si feu (opérateur formé)",
        suction: "Moyenne",
        technique: "Dos supérieur : BL10–15, GV14, GB21. Stationnaire puis glissement.",
        points: ["BL12", "BL13 Feishu", "BL15", "GV14", "GB21"],
        steps: [
          "Schéma le long du canal BL ou en éventail si respiratoire.",
          "Stationnaire 10–15 min.",
          "Éviter clavicules et colonne directe.",
        ],
        frequency: "2×/semaine, 4 semaines",
        precautions: "Éviter succion sur clavicules / épineuses.",
        indications: ["Douleur dos supérieur", "Respiratoire", "Épaules"],
      },
    ],
  },
  {
    id: "chest",
    label: "Thorax",
    group: "tronc",
    position: [0, 1.05, 0.12],
    size: [0.32, 0.24, 0.14],
    techniques: [
      {
        id: "chest-cupping",
        label: "Technique ventouse",
        duration: "10 minutes",
        durationMinutes: 10,
        cupType: "Silicone (préféré) ou pompe",
        cupSize: "4–5 cm",
        material: "Ventouses silicone 4–5 cm · succion légère",
        suction: "Légère",
        technique: "CV17, CV14, LU1, PC6, HT7 — glissement doux autour du sternum.",
        points: ["CV17 Danzhong", "LU1 Zhongfu", "PC6 Neiguan", "HT7 Shenmen"],
        steps: ["Succion très légère zone sternale.", "Glissement doux 8–10 min.", "Surveiller confort respiratoire."],
        frequency: "1–2×/semaine",
        precautions: "Succion très légère sur zone sternale.",
        indications: ["Anxiété", "Respiration courte", "Stress"],
      },
    ],
  },
  {
    id: "abdomen",
    label: "Abdomen",
    group: "tronc",
    position: [0, 0.72, 0.1],
    size: [0.28, 0.22, 0.14],
    techniques: [
      {
        id: "abdomen-cupping",
        label: "Technique ventouse",
        duration: "5–10 minutes",
        durationMinutes: 8,
        cupType: "Silicone",
        cupSize: "4–5 cm",
        material: "Ventouses silicone 4–5 cm · huile",
        suction: "Légère à moyenne",
        technique: "Glissement abdominal horaire + dorsal stationnaire. ST25, CV12, ST36, BL20–25.",
        points: ["ST25 Tianshu", "CV12 Zhongwan", "ST36 Zusanli", "BL20", "BL21", "BL25"],
        steps: ["À jeun ou 2 h après repas.", "Glissement horaire abdomen.", "Compléter points dorsaux si indiqué."],
        frequency: "1–2×/semaine",
        precautions: "Éviter 1er trimestre grossesse. Pas d'estomac plein.",
        indications: ["Digestion", "SII", "Ballonnements"],
      },
    ],
  },
  {
    id: "lower-back",
    label: "Lombaires",
    group: "dos",
    position: [0, 0.72, -0.12],
    size: [0.28, 0.22, 0.12],
    techniques: [
      {
        id: "lower-back-cupping",
        label: "Technique ventouse",
        duration: "15–20 minutes",
        durationMinutes: 18,
        cupType: "Verre ou silicone moyen",
        cupSize: "6–8 cm",
        material: "Ventouses 6–8 cm · huile · option flash cupping",
        suction: "Moyenne à forte (selon tolérance)",
        technique: "BL23, BL25, BL40, GV4, GB30. Stationnaire 15–20 min ; flash sur sacrum si indiqué.",
        points: ["BL23 Shenshu", "BL25 Dachangshu", "BL40 Weizhong", "GV4 Mingmen", "GB30 Huantiao"],
        steps: [
          "Ventouses 6–8 cm lombaires / sacrum.",
          "Stationnaire 15–20 min.",
          "Flash cupping sacrum si sciatique.",
        ],
        frequency: "2×/sem. aigu · 1×/sem. chronique",
        precautions: "Éviter sacrum/lombaire pendant grossesse.",
        indications: ["Lombalgie", "Sciatique", "Douleur hanche"],
      },
    ],
  },
  {
    id: "shoulder-r",
    label: "Épaule droite",
    group: "membre",
    position: [0.32, 1.22, 0],
    size: [0.14, 0.14, 0.14],
    shape: "sphere",
    techniques: [
      {
        id: "shoulder-r-cupping",
        label: "Technique ventouse",
        duration: "8–12 minutes",
        durationMinutes: 10,
        cupType: "Silicone ou pompe",
        cupSize: "3–5 cm",
        material: "Ventouses 3–5 cm · huile",
        suction: "Moyenne",
        technique: "GB21, LI15, SI9, BL11 — stationnaire + glissement autour de l'articulation.",
        points: ["GB21 Jianjing", "LI15 Jianyu", "SI9 Jianzhen", "BL11 Dazhu"],
        steps: ["Stationnaire 8–12 min.", "Glissement autour de l'épaule.", "Adapter intensité."],
        frequency: "2×/semaine",
        precautions: "Adapter à la sensibilité / inflammation aiguë.",
        indications: ["Coiffe des rotateurs", "Tension épaule", "Épicondylite associée"],
      },
    ],
  },
  {
    id: "shoulder-l",
    label: "Épaule gauche",
    group: "membre",
    position: [-0.32, 1.22, 0],
    size: [0.14, 0.14, 0.14],
    shape: "sphere",
    techniques: [
      {
        id: "shoulder-l-cupping",
        label: "Technique ventouse",
        duration: "8–12 minutes",
        durationMinutes: 10,
        cupType: "Silicone ou pompe",
        cupSize: "3–5 cm",
        material: "Ventouses 3–5 cm · huile",
        suction: "Moyenne",
        technique: "GB21, LI15, SI9, BL11 — stationnaire + glissement.",
        points: ["GB21 Jianjing", "LI15 Jianyu", "SI9 Jianzhen", "BL11 Dazhu"],
        steps: ["Stationnaire 8–12 min.", "Glissement autour de l'épaule."],
        frequency: "2×/semaine",
        precautions: "Adapter à la sensibilité.",
        indications: ["Coiffe des rotateurs", "Tension épaule"],
      },
    ],
  },
  {
    id: "knee-r",
    label: "Genou droit",
    group: "membre",
    position: [0.12, 0.28, 0.06],
    size: [0.12, 0.12, 0.12],
    shape: "sphere",
    techniques: [
      {
        id: "knee-r-cupping",
        label: "Technique ventouse",
        duration: "8–12 minutes",
        durationMinutes: 10,
        cupType: "Silicone",
        cupSize: "5–7 cm",
        material: "Ventouses 5–7 cm · huile",
        suction: "Légère à moyenne",
        technique: "Glissement autour du genou — jamais stationnaire sur la rotule. ST36, BL40, GB34, SP9.",
        points: ["ST36 Zusanli", "BL40 Weizhong", "GB34 Yanglingquan", "SP9 Yinlingquan"],
        steps: ["Glissement périphérique du genou.", "Éviter rotule directe.", "Compléter points distaux."],
        frequency: "2×/semaine",
        precautions: "Ne pas poser en stationnaire sur la rotule.",
        indications: ["Douleur genou", "Gonflement", "Récupération sportive"],
      },
    ],
  },
  {
    id: "knee-l",
    label: "Genou gauche",
    group: "membre",
    position: [-0.12, 0.28, 0.06],
    size: [0.12, 0.12, 0.12],
    shape: "sphere",
    techniques: [
      {
        id: "knee-l-cupping",
        label: "Technique ventouse",
        duration: "8–12 minutes",
        durationMinutes: 10,
        cupType: "Silicone",
        cupSize: "5–7 cm",
        material: "Ventouses 5–7 cm · huile",
        suction: "Légère à moyenne",
        technique: "Glissement autour du genou — jamais stationnaire sur la rotule.",
        points: ["ST36 Zusanli", "BL40 Weizhong", "GB34 Yanglingquan", "SP9 Yinlingquan"],
        steps: ["Glissement périphérique.", "Éviter rotule directe."],
        frequency: "2×/semaine",
        precautions: "Ne pas poser en stationnaire sur la rotule.",
        indications: ["Douleur genou", "Gonflement"],
      },
    ],
  },
];

export function getRegion(id: string) {
  return ANATOMY_REGIONS.find((r) => r.id === id);
}

/** Compatibilité ancienne API sessions / body-map */
export type ZoneProtocol = {
  slug: string;
  label: string;
  region: string;
  view: "front" | "back";
  x: number;
  y: number;
  width: number;
  height: number;
  durationMinutes: number;
  cupSize: string;
  technique: string;
  frequency: string;
  points: string[];
  indications: string[];
  precautions: string;
  muscles?: string[];
};

export const BODY_ZONE_PROTOCOLS: ZoneProtocol[] = ANATOMY_REGIONS.map((r, i) => {
  const tech = r.techniques[0];
  return {
    slug: r.id,
    label: r.label,
    region: r.group,
    view: r.group === "dos" ? "back" : "front",
    x: 40 + (i % 5) * 4,
    y: 10 + Math.floor(i / 5) * 15,
    width: 12,
    height: 10,
    durationMinutes: tech.durationMinutes ?? Math.max(1, Math.round((tech.holdSeconds ?? 60) / 60)),
    cupSize: tech.cupSize,
    technique: tech.technique,
    frequency: tech.frequency,
    points: tech.points,
    indications: tech.indications,
    precautions: tech.precautions,
  };
});

export function getProtocolBySlug(slug: string): ZoneProtocol | undefined {
  return BODY_ZONE_PROTOCOLS.find((z) => z.slug === slug);
}

export function matchProtocolFromComplaint(text: string): ZoneProtocol | undefined {
  const t = text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const rules: Array<{ keys: string[]; slug: string }> = [
    { keys: ["oeil", "yeux", "oculaire", "cerne", "vue"], slug: "eye" },
    { keys: ["tete", "cephalee", "migraine", "mal a la tete", "cranien"], slug: "head" },
    { keys: ["front"], slug: "forehead" },
    { keys: ["oreille", "auricul"], slug: "ear" },
    { keys: ["machoire", "atm", "temporo"], slug: "jaw" },
    { keys: ["nuque", "cou", "cervical"], slug: "neck" },
    { keys: ["dos haut", "haut du dos"], slug: "upper-back" },
    { keys: ["thorax", "poitrine", "respiratoire", "toux"], slug: "chest" },
    { keys: ["ventre", "abdomen", "digestion"], slug: "abdomen" },
    { keys: ["lombaire", "sciatique", "bas du dos"], slug: "lower-back" },
    { keys: ["epaule droite"], slug: "shoulder-r" },
    { keys: ["epaule gauche"], slug: "shoulder-l" },
    { keys: ["epaule"], slug: "shoulder-r" },
    { keys: ["genou droit"], slug: "knee-r" },
    { keys: ["genou gauche"], slug: "knee-l" },
    { keys: ["genou"], slug: "knee-r" },
  ];
  for (const rule of rules) {
    if (rule.keys.some((k) => t.includes(k))) return getProtocolBySlug(rule.slug);
  }
  return undefined;
}
