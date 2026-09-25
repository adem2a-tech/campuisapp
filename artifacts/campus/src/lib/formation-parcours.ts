/**
 * Parcours de formation guidé — l'app dit quoi faire à chaque étape.
 * Contenu issu des PDF (évaluation + guide), organisé en méthode progressive.
 */

export type ParcoursStep = {
  id: string;
  title: string;
  action: string;
  detail: string;
  checklist: string[];
  source: string;
};

export type ParcoursModule = {
  id: string;
  track: "debutant" | "intermediaire" | "avance";
  title: string;
  subtitle: string;
  duration: string;
  steps: ParcoursStep[];
};

export const FORMATION_PARCOURS: ParcoursModule[] = [
  {
    id: "debut-securite",
    track: "debutant",
    title: "Module 1 — Sécurité avant tout",
    subtitle: "Avant de poser la moindre ventouse, le dossier doit être propre.",
    duration: "25–35 min",
    steps: [
      {
        id: "d1-s1",
        title: "Accueillir et ouvrir le dossier",
        action: "Remplissez le formulaire d'inscription AVANT la 1ʳᵉ séance.",
        detail:
          "Le formulaire d'inscription initiale est le premier point de contact formel. Recueillir des données personnelles complètes dès le départ. Mettre à jour périodiquement. Conserver les informations de manière confidentielle.",
        checklist: [
          "Nom, date de naissance, contacts, urgence",
          "Profession et « référé par »",
          "Confidentialité / stockage sécurisé rappelé",
        ],
        source: "Évaluation professionnelle · PAGE 3",
      },
      {
        id: "d1-s2",
        title: "Anamnèse médicale",
        action: "Faites cocher l'historique de santé — c'est la section la plus critique.",
        detail:
          "L'historique permet d'identifier les contre-indications absolues et relatives. Il détermine si le traitement est sûr, s'il faut modifier le protocole, ou orienter vers un médecin. Mettez à jour à chaque nouvelle phase.",
        checklist: [
          "Hypertension, grossesse, diabète, cardiaque…",
          "Anticoagulants / allergies notés",
          "Décision : OK / adapter / orienter médecin",
        ],
        source: "Évaluation professionnelle · PAGE 4",
      },
      {
        id: "d1-s3",
        title: "Contre-indications — décision",
        action: "Classez : absolue → STOP · relative → adapter · précaution → dose réduite.",
        detail:
          "Absolues : grossesse, cancer actif, TVP, fièvre aiguë, plaies ouvertes dans la zone, pacemaker (appareils électriques) → interrompre et orienter. Relatives : diabète, TA instable, varices sévères, anticoagulants, peau sensibilisée, auto-immun aigu → modifier + avis médical. En cas de doute : autorisation médicale écrite.",
        checklist: [
          "Aucune CI absolue ?",
          "CI relatives documentées + adaptations",
          "Autorisation médicale si doute",
        ],
        source: "Évaluation · Guide rapide CI + Guide points Ch. 01",
      },
      {
        id: "d1-s4",
        title: "Consentement éclairé",
        action: "Faites signer le consentement écrit avant tout protocole.",
        detail:
          "Le client doit comprendre nature, bénéfices, risques et droits. Signature des deux parties. Renouveler si le protocole change. Conserver une copie  dans le dossier.",
        checklist: ["Explications données", "Formulaire signé", "Copie classée"],
        source: "Évaluation professionnelle · PAGE 14",
      },
    ],
  },
  {
    id: "debut-premiere-seance",
    track: "debutant",
    title: "Module 2 — Première séance guidée",
    subtitle: "De la plainte au protocole : l'app vous tient la main.",
    duration: "40–50 min",
    steps: [
      {
        id: "d2-s1",
        title: "Écouter la plainte",
        action: "Notez localisation, intensité 0–10, depuis quand, ce qui aggrave / soulage.",
        detail:
          "Sans anamnèse, toute intervention est une hypothèse. Avec elle, chaque séance devient un protocole de précision.",
        checklist: ["Localisation précise", "Score douleur 0–10", "Objectif du client"],
        source: "Évaluation · Pourquoi l'anamnèse",
      },
      {
        id: "d2-s2",
        title: "Carte corporelle",
        action: "Marquez la zone sur la carte corporelle (vue antérieure + dorsale).",
        detail:
          "Outil d'évaluation visuelle pour documenter douleur / tension. À mettre à jour chaque séance pour le suivi longitudinal.",
        checklist: ["Zone marquée", "Vue dos si besoin", "Photo avant seulement avec consentement"],
        source: "Évaluation · PAGE 8",
      },
      {
        id: "d2-s3",
        title: "Choisir le protocole",
        action: "Allez dans Anatomie → cliquez la zone (ou tapez la plainte) → suivez le protocole affiché.",
        detail:
          "Ex. céphalée → BL10, GB20, LI4, ST8 · 3–5 cm · dos supérieur + cou. Lombalgie → BL23, 25, 40 ; GV4 ; GB30 · 6–8 cm · 15–20 min.",
        checklist: [
          "Protocole Guide ouvert",
          "Taille ventouse vérifiée",
          "Précautions lues à voix haute",
        ],
        source: "Guide points · Ch. 05",
      },
      {
        id: "d2-s4",
        title: "Appliquer puis documenter",
        action: "Posez selon les étapes du protocole, puis enregistrez la séance.",
        detail:
          "La constance dans l'enregistrement est la marque d'un excellent professionnel. Notez points, durée, réponse, effets secondaires.",
        checklist: ["Protocole appliqué", "Réponse notée", "Prochaine séance planifiée"],
        source: "Évaluation · Registre professionnel",
      },
    ],
  },
  {
    id: "inter-protocoles",
    track: "intermediaire",
    title: "Module 3 — Protocoles courants",
    subtitle: "Maîtriser les 4 protocoles du Guide les plus utilisés.",
    duration: "45 min",
    steps: [
      {
        id: "i1-s1",
        title: "Dos supérieur & cervical",
        action: "Mémorisez : BL10–13, GB21, GV14 · 4–6 cm · stationnaire 10 min puis glissement BL.",
        detail: "2×/semaine × 4 semaines. Éviter succion sur les processus épineux.",
        checklist: ["Points cités sans notes", "Précaution épineux rappelée"],
        source: "Guide · Ch. 05",
      },
      {
        id: "i1-s2",
        title: "Lombaire / sciatique",
        action: "Mémorisez : BL23, 25, 40 ; GV4 ; GB30 · 6–8 cm · 15–20 min + flash sacrum.",
        detail: "2×/sem. aigu, 1×/sem. chronique. Éviter grossesse sur sacrum/lombaire.",
        checklist: ["CI grossesse vérifiée", "Taille 6–8 cm choisie"],
        source: "Guide · Ch. 05",
      },
      {
        id: "i1-s3",
        title: "Céphalée",
        action: "Dos supérieur + cou (BL10, GB20, LI4, ST8). Micro-visage seulement en flash.",
        detail: "Au besoin + prévention. Visage : succion minimale, pas de stationnaire prolongé.",
        checklist: ["Micro-visage = flash uniquement", "Points céphalée listés"],
        source: "Guide · Conditions additionnelles",
      },
      {
        id: "i1-s4",
        title: "Digestif / SII",
        action: "BL20, 21, 25 ; ST25, CV12 ; ST36 · glissement abdominal horaire · pas d'estomac plein.",
        detail: "Sauter 2h après le repas. 1–2×/semaine.",
        checklist: ["Délai post-repas respecté", "Sens horaire abdominal"],
        source: "Guide · Ch. 05",
      },
    ],
  },
  {
    id: "avance-suivi",
    track: "avance",
    title: "Module 4 — Suivi & excellence",
    subtitle: "Transformer les séances en résultats mesurables.",
    duration: "30 min",
    steps: [
      {
        id: "a1-s1",
        title: "Suivi sur 8 séances",
        action: "Comparez douleur 0–10, mobilité et sommeil à chaque visite.",
        detail:
          "Le suivi des progrès transforme les données en récit de résultats pour ajuster le protocole.",
        checklist: ["Tableau 8 séances ouvert", "Ajustement noté"],
        source: "Évaluation · Suivi des progrès",
      },
      {
        id: "a1-s2",
        title: "Registre avant / après",
        action: "Photos + mesures uniquement avec consentement photos coché.",
        detail: "Outil puissant de comparaison objective (PAGE 13).",
        checklist: ["Consentement photos", "Comparaison classée"],
        source: "Évaluation · PAGE 13",
      },
      {
        id: "a1-s3",
        title: "Combiner corps + oreille",
        action: "Pour douleur chronique, ajoutez points auriculaires (Shen Men, etc.).",
        detail:
          "Donnée clinique (méta-analyse 2022) : combiner corporel + auriculaire améliore les résultats vs corporel seul pour la douleur chronique.",
        checklist: ["Oreille inspectée", "Points auriculaires documentés"],
        source: "Guide · Donnée clinique Ch. 05",
      },
    ],
  },
];

const progressKey = "campus-formation-parcours-v1";

export type ParcoursProgress = {
  moduleId: string;
  stepId: string;
  doneStepIds: string[];
  updatedAt: string;
};

export function loadParcoursProgress(): ParcoursProgress | null {
  try {
    const raw = localStorage.getItem(progressKey);
    return raw ? (JSON.parse(raw) as ParcoursProgress) : null;
  } catch {
    return null;
  }
}

export function saveParcoursProgress(p: ParcoursProgress) {
  localStorage.setItem(progressKey, JSON.stringify(p));
}

export function clearParcoursProgress() {
  localStorage.removeItem(progressKey);
}

export function trackLabel(track: ParcoursModule["track"]) {
  return track === "debutant" ? "Débutant" : track === "intermediaire" ? "Intermédiaire" : "Avancé";
}
