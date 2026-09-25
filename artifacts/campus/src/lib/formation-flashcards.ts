/**
 * Flashcards & protocoles issus des PDF originaux (texte extrait, non reformulé).
 * Sources :
 * - Bienvenue-dans-Votre-Systeme-dEvaluation-Professionnelle.pdf
 * - Guide_Points_Therapeutiques_FR.pdf
 * Note : 150_Protocoles_Therapie_Ventouses_FR.pdf est un scan (peu de texte extractible) ;
 * les protocoles structurés ci-dessous reprennent le Guide (ch. 05) + zones du Guide.
 */

export type CardLevel = "debutant" | "intermediaire" | "avance";

export type FormationFlashcard = {
  id: string;
  category: "evaluation" | "protocoles" | "guide";
  deck: string;
  front: string;
  back: string;
  tags: string[];
  level: CardLevel;
  source: string;
};

export type ProtocolFlashcard = {
  id: string;
  category: "protocoles";
  title: string;
  condition: string;
  points: string;
  cupSize: string;
  technique: string;
  frequency: string;
  precautions: string;
  material?: string;
  indications: string[];
  steps: string[];
  tags: string[];
  level: CardLevel;
  source: string;
  /** Lien anatomie (région) */
  anatomyRegionIds?: string[];
};

export const EVALUATION_FLASHCARDS: FormationFlashcard[] = [
  {
    id: "eval-pourquoi-anamnese",
    category: "evaluation",
    deck: "Fondamentaux",
    front: "Pourquoi l'anamnèse est-elle essentielle ?",
    back: "Une anamnèse adéquate est bien plus qu'un simple formulaire d'accueil. C'est l'outil clinique le plus puissant qu'un professionnel de la santé et du bien-être puisse utiliser pour garantir des traitements sûrs et des résultats exceptionnels. Sans ces informations, toute intervention devient une hypothèse. Avec elles, chaque séance devient un protocole de précision conçu spécifiquement pour la personne qui se trouve en face de vous.",
    tags: ["anamnèse", "sécurité", "évaluation"],
    level: "debutant",
    source: "Système d'évaluation professionnelle",
  },
  {
    id: "eval-objectifs",
    category: "evaluation",
    deck: "Fondamentaux",
    front: "Quels sont les 4 objectifs du système d'évaluation professionnelle ?",
    back: "✔ Recueillir des Informations — Enregistrez les données clés du client de manière systématique et professionnelle.\n✔ Identifier les Contre-indications — Détectez les conditions médicales pouvant influencer le traitement.\n✔ Suivre les Progrès — Mesurez les changements et les résultats dans le temps avec précision.\n✔ Plans Personnalisés — Adaptez les protocoles en fonction de l'historique unique de chaque client.",
    tags: ["évaluation", "objectifs"],
    level: "debutant",
    source: "Système d'évaluation professionnelle",
  },
  {
    id: "eval-inscription",
    category: "evaluation",
    deck: "Formulaires",
    front: "Quand remplir le formulaire d'inscription du client ?",
    back: "Le formulaire d'inscription initiale est le premier point de contact formel entre le professionnel et le client. Ce formulaire doit être rempli avant la première séance et mis à jour périodiquement afin de refléter tout changement pertinent dans les informations du client. Toutes les informations personnelles du client doivent être conservées de manière sûre et confidentielle, conformément aux réglementations sur la protection des données en vigueur dans votre région.",
    tags: ["inscription", "RGPD", "dossier"],
    level: "debutant",
    source: "Système d'évaluation professionnelle · PAGE 3",
  },
  {
    id: "eval-historique",
    category: "evaluation",
    deck: "Anamnèse",
    front: "Quel est le rôle de l'historique de santé (anamnèse médicale) ?",
    back: "L'historique de santé est la section la plus critique de l'évaluation clinique. Il permet au professionnel d'identifier les contre-indications absolues et relatives avant de commencer tout traitement. Cette information détermine si le traitement est sûr, si le protocole standard doit être modifié, ou si le client doit être orienté vers un médecin avant de procéder. Mettez à jour ce formulaire à chaque nouvelle phase du traitement.",
    tags: ["anamnèse", "contre-indications"],
    level: "debutant",
    source: "Système d'évaluation professionnelle · PAGE 4",
  },
  {
    id: "eval-ci-absolues",
    category: "evaluation",
    deck: "Contre-indications",
    front: "Quelles sont les contre-indications absolues (référence rapide) ?",
    back: "Grossesse, cancer actif, thrombose veineuse profonde, fièvre aiguë, plaies ouvertes dans la zone de traitement, pacemaker (pour les traitements avec des appareils électriques). Dans ces cas, interrompre le traitement et orienter vers un médecin.",
    tags: ["contre-indications", "sécurité", "absolues"],
    level: "debutant",
    source: "Système d'évaluation professionnelle · Guide rapide",
  },
  {
    id: "eval-ci-relatives",
    category: "evaluation",
    deck: "Contre-indications",
    front: "Quelles sont les contre-indications relatives ?",
    back: "Diabète, tension artérielle instable, varices sévères, médicaments anticoagulants, peau sensibilisée, maladies auto-immunes en phase aiguë. Elles nécessitent des modifications du protocole et un consentement médical préalable.",
    tags: ["contre-indications", "relatives"],
    level: "intermediaire",
    source: "Système d'évaluation professionnelle · Guide rapide",
  },
  {
    id: "eval-precautions",
    category: "evaluation",
    deck: "Contre-indications",
    front: "Quelles précautions spéciales documenter ?",
    back: "Cicatrices récentes, récupération post-opératoire, épilepsie, affections thyroïdiennes, ostéoporose sévère. Adaptez la technique, la pression et l'intensité en fonction de la condition spécifique du client et des antécédents médicaux documentés. En cas de doute sur une condition médicale signalée, demander une autorisation médicale écrite avant de procéder au traitement.",
    tags: ["précautions", "autorisation médicale"],
    level: "intermediaire",
    source: "Système d'évaluation professionnelle · Guide rapide",
  },
  {
    id: "eval-medicaments",
    category: "evaluation",
    deck: "Anamnèse",
    front: "Pourquoi enregistrer médicaments et allergies ?",
    back: "L'enregistrement détaillé des médicaments actuels est une partie indispensable du processus d'évaluation. De nombreux médicaments peuvent interagir avec des traitements esthétiques ou thérapeutiques, modifier la sensibilité de la peau, influencer la coagulation du sang ou changer la réponse du corps à diverses techniques. De même, connaître les allergies du client aide à prévenir des réactions indésirables potentiellement dangereuses lors de l'utilisation de produits cosmétiques, d'huiles essentielles ou de matériaux de traitement.",
    tags: ["médicaments", "allergies"],
    level: "debutant",
    source: "Système d'évaluation professionnelle",
  },
  {
    id: "eval-mode-vie",
    category: "evaluation",
    deck: "Mode de vie",
    front: "Que couvre l'évaluation du mode de vie (PAGE 6) ?",
    back: "PAGE 6 · MODE DE VIE — Une évaluation complète du mode de vie va au-delà des quatre piliers principaux. Les habitudes du client (sommeil, stress, activité, alimentation, hydratation, etc.) informent l'adaptation du protocole. Documenter les observations sur le mode de vie dans le dossier.",
    tags: ["mode de vie", "protocole"],
    level: "intermediaire",
    source: "Système d'évaluation professionnelle · PAGE 6",
  },
  {
    id: "eval-carte",
    category: "evaluation",
    deck: "Carte corporelle",
    front: "À quoi sert la carte corporelle ?",
    back: "La carte corporelle est un outil d'évaluation visuelle qui permet au professionnel de documenter les zones de douleur, de tension ou de traitement. Cette documentation visuelle est précieuse pour le suivi longitudinal du cas. La carte corporelle doit être mise à jour à chaque séance afin d'enregistrer l'évolution des symptômes. C'est un document clinique à conserver dans le dossier du client.",
    tags: ["carte corporelle", "suivi"],
    level: "debutant",
    source: "Système d'évaluation professionnelle · PAGE 8",
  },
  {
    id: "eval-consentement",
    category: "evaluation",
    deck: "Consentement",
    front: "Qu'est-ce que le consentement éclairé (PAGE 14) ?",
    back: "Le consentement éclairé est un pilier fondamental d'une pratique professionnelle éthique et juridiquement conforme. Le client doit comprendre la nature du traitement, les bénéfices attendus, les risques disponibles et ses droits tout au long du processus. La signature du formulaire de consentement formalise cet accord. Toujours obtenir le consentement écrit. Conservez une copie signée dans le dossier physique ou numérique. Le consentement doit être renouvelé lorsque le protocole change de manière significative.",
    tags: ["consentement", "éthique", "juridique"],
    level: "debutant",
    source: "Système d'évaluation professionnelle · PAGE 14",
  },
  {
    id: "eval-suivi-progres",
    category: "evaluation",
    deck: "Suivi",
    front: "Quel est le rôle du suivi des progrès (8 séances) ?",
    back: "Le suivi des progrès est l'outil qui transforme les données cliniques en un récit de résultats. En examinant les données accumulées au fil des séances, le professionnel peut ajuster et optimiser continuellement les protocoles de traitement — pas seulement comme registre.",
    tags: ["suivi", "progrès", "résultats"],
    level: "intermediaire",
    source: "Système d'évaluation professionnelle",
  },
  {
    id: "eval-avant-apres",
    category: "evaluation",
    deck: "Suivi",
    front: "Pourquoi tenir un registre avant / après (PAGE 13) ?",
    back: "Le registre avant et après est l'un des outils les plus puissants de la pratique clinique, car il fournit une comparaison objective. Obtenir le consentement pour les photos. Ce registre documente l'évolution visuelle et clinique.",
    tags: ["avant-après", "photos", "consentement"],
    level: "intermediaire",
    source: "Système d'évaluation professionnelle · PAGE 13",
  },
];

export const GUIDE_FLASHCARDS: FormationFlashcard[] = [
  {
    id: "guide-cartographie",
    category: "guide",
    deck: "Cartographie",
    front: "Qu'est-ce que la cartographie des points thérapeutiques ?",
    back: "La cartographie des points thérapeutiques est une approche systématique pour identifier, localiser et traiter des sites anatomiques spécifiques qui correspondent à des organes, systèmes et zones fonctionnelles du corps. Enracinée dans des millénaires de médecine traditionnelle et affinée par la recherche clinique moderne, ces cartes constituent le fondement de la ventousothérapie, de l'auriculothérapie et de l'acupression faciale.",
    tags: ["cartographie", "points"],
    level: "debutant",
    source: "Guide des points thérapeutiques · Ch. 01",
  },
  {
    id: "guide-3-systemes",
    category: "guide",
    deck: "Cartographie",
    front: "Quels sont les trois systèmes primaires de cartographie ?",
    back: "Carte Auriculaire — Points sur l'oreille — Organes, douleur, dépendances.\nCarte Faciale — Points sur le visage — Système nerveux, émotions, tête.\nCarte Zones Corporelles — Zones tronc & membres — Musculo-squelettique, organes internes.",
    tags: ["auriculaire", "facial", "zones"],
    level: "debutant",
    source: "Guide des points thérapeutiques · Ch. 01",
  },
  {
    id: "guide-5-principes",
    category: "guide",
    deck: "Cartographie",
    front: "Citez les 5 principes fondamentaux de la cartographie.",
    back: "1. SPÉCIFICITÉ — Chaque point a une position définie et un effet thérapeutique documenté.\n2. BILATÉRALITÉ — La plupart des points existent des deux côtés ; traiter bilatéralement.\n3. PROPORTIONNALITÉ — La localisation est à l'échelle de l'anatomie individuelle.\n4. BASE NEUROLOGIQUE — Les points correspondent aux distributions dermatomériques et des nerfs crâniens.\n5. DOCUMENTATION — Enregistrer points utilisés, réponse observée et retour du client.",
    tags: ["principes"],
    level: "intermediaire",
    source: "Guide des points thérapeutiques · Ch. 01",
  },
  {
    id: "guide-ci-therapie",
    category: "guide",
    deck: "Sécurité",
    front: "Contre-indications — quand NE PAS appliquer la thérapie (Guide) ?",
    back: "Plaies ouvertes / lésions — Risque d'infection — Traiter uniquement les points distaux.\nInfection cutanée active — Propagation pathogène — Reporter la séance.\nAnticoagulants — Hématomes / ecchymoses — Réduire l'intensité de la succion.\nGrossesse (1er trimestre) — Points réflexes utérins — Éviter abdomen et zone lombaire.\nChirurgie récente (< 6 sem.) — Intégrité tissulaire — Autorisation médicale requise.",
    tags: ["contre-indications", "sécurité"],
    level: "debutant",
    source: "Guide des points thérapeutiques · Ch. 01",
  },
  {
    id: "guide-bl23",
    category: "guide",
    deck: "Points Bei Shu",
    front: "BL23 Shenshu — localisation et indication ?",
    back: "Point BL 23 · Shenshu · Niveau L2 · Organe Rein · Indication : Lombalgie, fatigue, oreilles.",
    tags: ["BL23", "rein", "lombaire"],
    level: "intermediaire",
    source: "Guide des points thérapeutiques · Méridien Vessie",
  },
  {
    id: "guide-li4",
    category: "guide",
    deck: "Points membres",
    front: "LI4 Hegu — localisation et indication ?",
    back: "LI4 — Espace pouce/index — Méridien Gros Intestin — Indication : Douleur, immunité, céphalée.",
    tags: ["LI4", "céphalée", "douleur"],
    level: "debutant",
    source: "Guide des points thérapeutiques · Points des membres",
  },
  {
    id: "guide-st36",
    category: "guide",
    deck: "Points membres",
    front: "ST36 Zusanli — localisation et indication ?",
    back: "ST36 — 4 cm sous genou latéral — Méridien Estomac — Indication : Fatigue, digestion, immunité.",
    tags: ["ST36", "digestion"],
    level: "debutant",
    source: "Guide des points thérapeutiques · Points des membres",
  },
  {
    id: "guide-types-ventouses",
    category: "guide",
    deck: "Matériel",
    front: "Micro/Visage — matériau, diamètre, meilleur pour ?",
    back: "Type Micro/Visage — Matériau Silicone — Diamètre 1–3 cm — Meilleur pour : Visage, oreilles — Contrôle succion : Compression douce — Stérilisation : Ébullition.",
    tags: ["matériel", "visage", "micro"],
    level: "debutant",
    source: "Guide des points thérapeutiques · Types de ventouses",
  },
  {
    id: "guide-conseil-eval",
    category: "guide",
    deck: "Bonnes pratiques",
    front: "Conseil d'expert avant de cartographier un nouveau client ?",
    back: "Toujours remplir le Formulaire d'Évaluation Initiale (voir Chapitre 6) avant de cartographier la première séance avec un nouveau client.",
    tags: ["évaluation", "premier rendez-vous"],
    level: "debutant",
    source: "Guide des points thérapeutiques · Ch. 01",
  },
];

/** Protocoles du Guide ch. 05 — texte source, organisés en cards. */
export const PROTOCOLE_FLASHCARDS: ProtocolFlashcard[] = [
  {
    id: "proto-dos-cervical",
    category: "protocoles",
    title: "Douleur du dos supérieur et cervicale",
    condition: "Douleur du Dos Supérieur et Cervicale",
    points: "BL 10, 11, 12, 13, GB 21, GV 14",
    cupSize: "4–6 cm silicone ou verre",
    technique: "Stationnaire 10 min, puis glissement le long du canal BL",
    frequency: "2x/semaine pendant 4 semaines, puis réévaluer",
    precautions: "Éviter succion directe sur les processus épineux vertébraux",
    material: "Ventouses silicone ou verre 4–6 cm",
    indications: ["Douleur cervicale", "Tension dos supérieur", "Céphalée cervicogène"],
    steps: [
      "Évaluer contre-indications et plainte.",
      "Appliquer ventouses 4–6 cm sur points BL 10–13, GB 21, GV 14.",
      "Stationnaire 10 min, puis glissement le long du canal BL.",
      "Fréquence : 2×/semaine pendant 4 semaines, puis réévaluer.",
    ],
    tags: ["cervical", "dos", "nuque"],
    level: "debutant",
    source: "Guide des points thérapeutiques · Ch. 05",
    anatomyRegionIds: ["neck", "upper-back", "head"],
  },
  {
    id: "proto-lombaire",
    category: "protocoles",
    title: "Douleur lombaire / sciatique",
    condition: "Douleur Lombaire / Sciatique",
    points: "BL 23, 25, 40 ; GV 4 ; GB 30",
    cupSize: "6–8 cm verre ou silicone moyen",
    technique: "Stationnaire 15–20 min ; flash cupping sur sacrum",
    frequency: "2x/sem. aigu, 1x/sem. chronique",
    precautions: "Éviter pendant grossesse sur sacrum/lombaire",
    material: "Ventouses 6–8 cm verre ou silicone moyen",
    indications: ["Lombalgie", "Sciatique", "Douleur hanche"],
    steps: [
      "Anamnèse lombaire / sciatique.",
      "Ventouses 6–8 cm sur BL 23, 25, 40 ; GV 4 ; GB 30.",
      "Stationnaire 15–20 min ; flash cupping sur sacrum si indiqué.",
      "2×/sem. en aigu, 1×/sem. en chronique.",
    ],
    tags: ["lombaire", "sciatique"],
    level: "debutant",
    source: "Guide des points thérapeutiques · Ch. 05",
    anatomyRegionIds: ["lower-back"],
  },
  {
    id: "proto-respiratoire",
    category: "protocoles",
    title: "Support respiratoire (asthme / toux)",
    condition: "Support Respiratoire (Asthme/Toux)",
    points: "BL 13, BL 12, CV 17, LU 1, DU 14",
    cupSize: "4–5 cm, succion légère",
    technique: "Schéma en éventail sur le dos supérieur, 10–12 min",
    frequency: "3x/sem. en aigu ; 1x/sem. maintenance",
    precautions: "Éviter succion directe sur clavicules ou colonne",
    material: "Ventouses 4–5 cm",
    indications: ["Asthme", "Toux", "Support respiratoire"],
    steps: [
      "Succion légère uniquement.",
      "Schéma en éventail dos supérieur 10–12 min sur BL 13, BL 12, CV 17, LU 1, DU 14.",
    ],
    tags: ["respiratoire", "thorax"],
    level: "intermediaire",
    source: "Guide des points thérapeutiques · Ch. 05",
    anatomyRegionIds: ["chest", "upper-back"],
  },
  {
    id: "proto-digestif",
    category: "protocoles",
    title: "Problèmes digestifs / SII",
    condition: "Problèmes Digestifs / SII",
    points: "BL 20, 21, 25 ; ST 25, CV 12 ; ST 36",
    cupSize: "4–5 cm silicone",
    technique: "Glissement abdominal dans le sens horaire ; dorsal stationnaire",
    frequency: "1–2x/semaine",
    precautions: "Éviter à estomac plein ; sauter 2h après repas",
    material: "Ventouses silicone 4–5 cm",
    indications: ["Digestion", "SII", "Ballonnements"],
    steps: [
      "Vérifier que le client n'a pas mangé récemment (2h).",
      "Glissement abdominal horaire + dorsal stationnaire sur points listés.",
    ],
    tags: ["digestion", "abdomen", "SII"],
    level: "intermediaire",
    source: "Guide des points thérapeutiques · Ch. 05",
    anatomyRegionIds: ["abdomen"],
  },
  {
    id: "proto-cephalee",
    category: "protocoles",
    title: "Céphalée",
    condition: "Céphalée",
    points: "BL10, GB20, LI4, ST8",
    cupSize: "3–5 cm",
    technique: "Dos supérieur + cou",
    frequency: "Au besoin + prévention",
    precautions: "Visage : micro-ventouses, succion minimale, pas de stationnaire prolongé",
    material: "Ventouses 3–5 cm · micro-ventouses visage si tension frontale",
    indications: ["Céphalée", "Migraine", "Tension cervico-céphalique", "Céphalée frontale"],
    steps: [
      "Anamnèse céphalée (localisation, intensité).",
      "Ventouses 3–5 cm dos supérieur + cou (BL10, GB20, LI4, ST8).",
      "Optionnel : micro-ventouses faciales flash si tension frontale.",
    ],
    tags: ["céphalée", "tête", "front", "migraine"],
    level: "debutant",
    source: "Guide des points thérapeutiques · Ch. 05 · Conditions additionnelles",
    anatomyRegionIds: ["head", "forehead", "eye", "neck"],
  },
  {
    id: "proto-insomnie",
    category: "protocoles",
    title: "Insomnie",
    condition: "Insomnie",
    points: "HT7, BL15, KD3, Yintang",
    cupSize: "3–5 cm",
    technique: "Stationnaire légère 10 min",
    frequency: "3x/sem. x 3 sem.",
    precautions: "Succion légère",
    material: "Ventouses 3–5 cm",
    indications: ["Insomnie"],
    steps: ["Stationnaire légère 10 min sur HT7, BL15, KD3, Yintang.", "3×/semaine pendant 3 semaines."],
    tags: ["insomnie", "sommeil"],
    level: "intermediaire",
    source: "Guide des points thérapeutiques · Ch. 05",
  },
  {
    id: "proto-anxiete",
    category: "protocoles",
    title: "Anxiété / stress",
    condition: "Anxiété / Stress",
    points: "PC6, HT7, CV17, GV20",
    cupSize: "3–5 cm",
    technique: "Glissement doux",
    frequency: "2x/sem. x 4 sem.",
    precautions: "Technique douce",
    material: "Ventouses 3–5 cm",
    indications: ["Anxiété", "Stress"],
    steps: ["Glissement doux sur PC6, HT7, CV17, GV20.", "2×/semaine pendant 4 semaines."],
    tags: ["anxiété", "stress"],
    level: "intermediaire",
    source: "Guide des points thérapeutiques · Ch. 05",
  },
  {
    id: "proto-sport",
    category: "protocoles",
    title: "Récupération sportive",
    condition: "Récupération Sportive",
    points: "Zone lésion + BL40",
    cupSize: "5–8 cm",
    technique: "Flash ; puis glissement",
    frequency: "24–48h post-événement",
    precautions: "Respecter le délai 24–48h post-événement",
    material: "Ventouses 5–8 cm",
    indications: ["Récupération sportive", "Zone lésionnelle"],
    steps: ["Flash puis glissement sur zone lésion + BL40.", "Intervenir 24–48h après l'événement."],
    tags: ["sport", "récupération"],
    level: "avance",
    source: "Guide des points thérapeutiques · Ch. 05",
    anatomyRegionIds: ["knee-r", "knee-l", "shoulder-r", "shoulder-l"],
  },
  {
    id: "proto-zone1",
    category: "protocoles",
    title: "Zone 1 — Dos supérieur & cou",
    condition: "Zone 1 Dos supérieur & cou",
    points: "Méridiens BL, GB, GV",
    cupSize: "4–6 cm",
    technique: "Selon cartographie zone 1",
    frequency: "10–15 min",
    precautions: "Voir contre-indications Guide ch. 01",
    material: "Ventouses 4–6 cm",
    indications: ["Douleur cervicale", "Céphalée", "Insomnie"],
    steps: ["Ventouses 4–6 cm, 10–15 min.", "Méridiens BL, GB, GV."],
    tags: ["zone 1", "cou", "dos"],
    level: "debutant",
    source: "Guide des points thérapeutiques · Zones corporelles",
    anatomyRegionIds: ["neck", "upper-back"],
  },
  {
    id: "proto-zone3",
    category: "protocoles",
    title: "Zone 3 — Lombaire & sacrum",
    condition: "Zone 3 Lombaire & sacrum",
    points: "Méridiens BL, KD, GV",
    cupSize: "6–8 cm",
    technique: "Selon cartographie zone 3",
    frequency: "15–20 min",
    precautions: "Éviter grossesse sur sacrum/lombaire",
    material: "Ventouses 6–8 cm",
    indications: ["Lombalgie", "Sciatique", "Hanche"],
    steps: ["Ventouses 6–8 cm, 15–20 min.", "Méridiens BL, KD, GV."],
    tags: ["zone 3", "lombaire"],
    level: "debutant",
    source: "Guide des points thérapeutiques · Zones corporelles",
    anatomyRegionIds: ["lower-back"],
  },
];

export const ALL_FLASHCARDS: FormationFlashcard[] = [...EVALUATION_FLASHCARDS, ...GUIDE_FLASHCARDS];

export const LEVEL_LABEL: Record<CardLevel, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

export function searchFlashcards(query: string, category?: FormationFlashcard["category"] | "protocoles" | "all") {
  const q = query.trim().toLowerCase();
  const flash = ALL_FLASHCARDS.filter((c) => (category && category !== "all" && category !== "protocoles" ? c.category === category : true));
  const protocols =
    !category || category === "all" || category === "protocoles"
      ? PROTOCOLE_FLASHCARDS
      : [];

  const matchText = (s: string) => !q || s.toLowerCase().includes(q);

  return {
    cards: flash.filter(
      (c) =>
        matchText(c.front) ||
        matchText(c.back) ||
        c.tags.some((t) => matchText(t)) ||
        matchText(c.deck),
    ),
    protocols: protocols.filter(
      (p) =>
        matchText(p.title) ||
        matchText(p.condition) ||
        matchText(p.points) ||
        matchText(p.precautions) ||
        p.indications.some((i) => matchText(i)) ||
        p.tags.some((t) => matchText(t)),
    ),
  };
}

export function protocolsForAnatomyRegion(regionId: string): ProtocolFlashcard[] {
  return PROTOCOLE_FLASHCARDS.filter((p) => p.anatomyRegionIds?.includes(regionId));
}

export function findProtocolsByComplaint(complaint: string): ProtocolFlashcard[] {
  const { protocols } = searchFlashcards(complaint, "protocoles");
  return protocols;
}
