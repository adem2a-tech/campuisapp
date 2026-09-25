/**
 * Rappels contextuels issus du suivi pas à pas (PDF évaluation + guide),
 * affichés selon l’écran pour guider sans revenir à Formation à chaque fois.
 */

export type CoachingContext =
  | "dashboard"
  | "clients-list"
  | "client-add"
  | "client-detail"
  | "agenda"
  | "session-new"
  | "sessions"
  | "formation"
  | "facturation";

export type CoachingTip = {
  id: string;
  context: CoachingContext;
  title: string;
  teaser: string;
  body: string[];
  checklist?: string[];
  source: string;
};

export const COACHING_TIPS: CoachingTip[] = [
  {
    id: "dashboard-overview",
    context: "dashboard",
    title: "Vue d’ensemble",
    teaser: "Vérifiez les RDV du jour et les dossiers incomplets avant de démarrer.",
    body: [
      "Commencez par l’agenda du jour : chaque client doit avoir un dossier à jour.",
      "Si un formulaire d’inscription ou un consentement manque, complétez-le avant la séance.",
    ],
    source: "Suivi pas à pas · Module 1 — Sécurité",
  },
  {
    id: "client-add-inscription",
    context: "client-add",
    title: "Formulaire d’inscription",
    teaser: "Remplissez le formulaire complet AVANT la 1ʳᵉ séance.",
    body: [
      "Le formulaire d’inscription initiale est le premier point de contact formel.",
      "Recueillir des données personnelles complètes dès le départ établit un suivi sûr et conforme.",
      "Mettez à jour périodiquement pour refléter tout changement pertinent.",
    ],
    checklist: [
      "Nom complet",
      "Date de naissance / âge",
      "Genre",
      "Téléphone",
      "E-mail",
      "Adresse / ville",
      "Contact d’urgence",
      "Profession",
      "Référé par",
    ],
    source: "Évaluation professionnelle · PAGE 3",
  },
  {
    id: "client-add-confidentialite",
    context: "client-add",
    title: "Confidentialité",
    teaser: "Conservez les informations de manière sûre et confidentielle.",
    body: [
      "Toutes les informations personnelles du client doivent être conservées de manière sûre et confidentielle, conformément aux réglementations en vigueur.",
    ],
    source: "Évaluation professionnelle · PAGE 3",
  },
  {
    id: "clients-list-anamnese",
    context: "clients-list",
    title: "Pourquoi l’anamnèse compte",
    teaser: "Le dossier client n’est pas qu’un carnet d’adresses — ouvrez-le avant de traiter.",
    body: [
      "Une anamnèse adéquate est l’outil clinique le plus puissant pour des traitements sûrs.",
      "Sans ces informations, toute intervention devient une hypothèse.",
    ],
    source: "Évaluation professionnelle · Anamnèse",
  },
  {
    id: "client-detail-historique",
    context: "client-detail",
    title: "Historique de santé",
    teaser: "Vérifiez contre-indications et antécédents à chaque phase.",
    body: [
      "L’historique de santé est la section la plus critique de l’évaluation clinique.",
      "Il permet d’identifier les contre-indications absolues et relatives avant tout traitement.",
      "Mettez à jour ce formulaire à chaque nouvelle phase.",
    ],
    checklist: [
      "Hypertension / hypotension",
      "Grossesse",
      "Diabète / cardiaque / thyroïde",
      "Anticoagulants / allergies",
      "Chirurgie récente / pacemaker",
    ],
    source: "Évaluation professionnelle · PAGE 4",
  },
  {
    id: "agenda-prep",
    context: "agenda",
    title: "Avant le rendez-vous",
    teaser: "Dossier + consentement à jour avant la séance.",
    body: [
      "Vérifiez que le client a un dossier d’inscription complet.",
      "Le consentement éclairé doit être signé avant tout protocole.",
      "En cas de doute médical : autorisation écrite avant de procéder.",
    ],
    source: "Évaluation · Consentement & contre-indications",
  },
  {
    id: "session-ci",
    context: "session-new",
    title: "Contre-indications — décision rapide",
    teaser: "Absolue = stop · Relative = adapter · Doute = avis médical.",
    body: [
      "Contre-indications absolues : grossesse, cancer actif, TVP, fièvre aiguë, plaies ouvertes, pacemaker (appareils électriques). Interrompre et orienter.",
      "Relatives : diabète, TA instable, varices sévères, anticoagulants, peau sensibilisée — adapter le protocole.",
    ],
    source: "Suivi pas à pas · Module 1 · Contre-indications",
  },
  {
    id: "session-carte",
    context: "session-new",
    title: "Documenter la séance",
    teaser: "Remplissez zones, ressenti avant/après et notes — c’est le suivi clinique.",
    body: [
      "Documentez la zone de douleur à chaque séance.",
      "Notez le ressenti avant / après pour suivre l’évolution.",
      "Conservez ces infos dans le dossier client.",
    ],
    source: "Évaluation professionnelle · Carte corporelle & suivi",
  },
  {
    id: "sessions-evolution",
    context: "sessions",
    title: "Lire l’évolution",
    teaser: "Comparez les scores avant/après pour ajuster le prochain protocole.",
    body: [
      "L’évolution (ex. 7/10 +2) montre si le protocole est efficace.",
      "Si la tendance stagne, revisitez le suivi pas à pas et le choix de protocole.",
    ],
    source: "Suivi pas à pas · Suivi des séances",
  },
  {
    id: "formation-parcours",
    context: "formation",
    title: "Suivi pas à pas",
    teaser: "Suivez les modules dans l’ordre — chaque étape dit quoi faire concrètement.",
    body: [
      "Le suivi pas à pas structure votre pratique : sécurité → anamnèse → protocole → suivi.",
      "Cochez les étapes au fur et à mesure ; les rappels ailleurs dans l’app s’y réfèrent.",
    ],
    source: "Formation · Suivi pas à pas",
  },
  {
    id: "facturation-trace",
    context: "facturation",
    title: "Traçabilité",
    teaser: "Facturez après une séance documentée — le dossier reste la preuve du soin.",
    body: [
      "Associez la facture à une séance enregistrée pour une traçabilité claire.",
      "Les notes cliniques restent dans le dossier client, séparées de la facturation.",
    ],
    source: "Bonnes pratiques CAMPUS",
  },
];

export function tipsFor(context: CoachingContext) {
  return COACHING_TIPS.filter((t) => t.context === context);
}

/** Mappe l’URL courante vers un contexte de rappel. */
export function coachingContextFromPath(path: string): CoachingContext | null {
  if (path === "/dashboard" || path === "/") return "dashboard";
  if (path === "/agenda") return "agenda";
  if (path === "/clients") return "clients-list";
  if (path.startsWith("/clients/")) return "client-detail";
  if (path === "/sessions/new") return "session-new";
  if (path === "/sessions" || path.startsWith("/sessions/")) return "sessions";
  if (path.startsWith("/formation")) return "formation";
  if (path === "/facturation") return "facturation";
  return null;
}
