/** Catalogue des ressources PDF professionnelles — organisation documentaire uniquement (contenu original inchangé). */

export type FormationChapter = {
  id: string;
  title: string;
  /** Première page du chapitre (1-indexée, fidèle au PDF). */
  page: number;
  /** Dernière page inclusive, si connue. */
  endPage?: number;
  note?: string;
};

export type FormationDocument = {
  id: string;
  category: "evaluation" | "protocoles" | "guide";
  title: string;
  subtitle: string;
  fileName: string;
  pageCount: number;
  chapters: FormationChapter[];
  /** Mise en avant visuelle (guide). */
  visualFocus?: boolean;
};

function pdfUrl(fileName: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/formation/${fileName}`;
}

export function formationPdfHref(doc: FormationDocument, page?: number) {
  const url = pdfUrl(doc.fileName);
  if (page && page > 1) return `${url}#page=${page}`;
  return url;
}

export const FORMATION_DOCUMENTS: FormationDocument[] = [
  {
    id: "evaluation-professionnelle",
    category: "evaluation",
    title: "Système d'évaluation professionnelle",
    subtitle: "Formulaires et outils d'anamnèse — document original (35 pages)",
    fileName: "evaluation-professionnelle.pdf",
    pageCount: 35,
    chapters: [
      { id: "intro", title: "Bienvenue & objectifs", page: 1, endPage: 2 },
      { id: "anamnese-essentielle", title: "Pourquoi l'anamnèse est essentielle", page: 2, endPage: 2 },
      { id: "inscription", title: "Formulaire d'inscription du client", page: 3, endPage: 3, note: "Informations personnelles" },
      { id: "historique", title: "Historique de santé — anamnèse médicale", page: 4, endPage: 4 },
      { id: "contre-indications", title: "Guide rapide des contre-indications", page: 5, endPage: 5 },
      { id: "medicaments", title: "Médicaments actuels et allergies", page: 5, endPage: 5 },
      { id: "restrictions", title: "Restrictions médicales", page: 5, endPage: 5 },
      { id: "mode-de-vie", title: "Évaluation du mode de vie", page: 6, endPage: 7 },
      { id: "carte-corporelle", title: "Carte corporelle — évaluation visuelle", page: 8, endPage: 9 },
      { id: "evaluation-initiale", title: "Formulaire d'évaluation initiale", page: 10, endPage: 11 },
      { id: "registre-seances", title: "Registre professionnel & notes de séance", page: 11, endPage: 12 },
      { id: "suivi-progres", title: "Suivi des progrès — 8 séances", page: 12, endPage: 12 },
      { id: "avant-apres", title: "Registre avant et après", page: 13, endPage: 13 },
      { id: "consentement", title: "Formulaire de consentement éclairé", page: 14, endPage: 14 },
      { id: "suivi-post", title: "Suivi post-traitement", page: 15, endPage: 15 },
      { id: "excellence", title: "Excellence professionnelle", page: 16, endPage: 35 },
    ],
  },
  {
    id: "protocoles-ventouses",
    category: "protocoles",
    title: "150 protocoles — thérapie par ventouses",
    subtitle: "Document original scanné (153 pages) — consultation page à page",
    fileName: "protocoles-ventouses.pdf",
    pageCount: 153,
    chapters: [
      { id: "msk", title: "1. Douleur musculo-squelettique", page: 3, endPage: 33, note: "Protocoles 1–31" },
      { id: "circulation", title: "2. Circulation et système lymphatique", page: 34, endPage: 48, note: "Protocoles 32–46" },
      { id: "respiratoire", title: "3. Système respiratoire", page: 49, endPage: 58, note: "Protocoles 47–56" },
      { id: "digestif", title: "4. Système digestif", page: 59, endPage: 68, note: "Protocoles 57–66" },
      { id: "immunitaire", title: "5. Système immunitaire et bien-être", page: 69, endPage: 78, note: "Protocoles 67–76" },
      { id: "stress", title: "6. Stress et bien-être mental", page: 79, endPage: 87, note: "Protocoles 77–85" },
      { id: "feminine", title: "7. Santé féminine", page: 88, endPage: 97, note: "Protocoles 86–95" },
      { id: "esthetique", title: "8. Beauté et esthétique", page: 98, endPage: 107, note: "Protocoles 96–105" },
      { id: "sport", title: "9. Récupération sportive", page: 108, endPage: 122, note: "Protocoles 106–120" },
      { id: "neuro", title: "10. Neurologique et posturale", page: 123, endPage: 132, note: "Protocoles 121–130" },
      { id: "senior", title: "11. Troisième âge et mobilité", page: 133, endPage: 142, note: "Protocoles 131–140" },
      { id: "combine", title: "12. Protocoles combinés", page: 143, endPage: 152, note: "Protocoles 141–150" },
    ],
  },
  {
    id: "guide-points",
    category: "guide",
    title: "Guide visuel des points thérapeutiques",
    subtitle: "Cartes illustrées — Série Praticiens · Volume 1 (document original)",
    fileName: "guide-points-therapeutiques.pdf",
    pageCount: 17,
    visualFocus: true,
    chapters: [
      { id: "couverture", title: "Couverture", page: 1, endPage: 1 },
      { id: "sommaire", title: "Sommaire", page: 2, endPage: 2 },
      { id: "ch01", title: "01 — Introduction à la cartographie", page: 3, endPage: 6 },
      { id: "ch02", title: "02 — Thérapie auriculaire", page: 7, endPage: 10 },
      { id: "ch03", title: "03 — Points des méridiens faciaux", page: 11, endPage: 14 },
      { id: "ch04", title: "04 — Graphiques par zones corporelles", page: 15, endPage: 17 },
    ],
  },
];

export const FORMATION_CATEGORIES = [
  {
    id: "evaluation" as const,
    title: "Formation / Évaluation professionnelle",
    description: "Formulaires, anamnèse et outils d'évaluation — organisés par chapitres, lecture reprise possible.",
    documentIds: ["evaluation-professionnelle"],
  },
  {
    id: "protocoles" as const,
    title: "Protocoles — Thérapie par ventouses",
    description: "Les 150 protocoles du document original, accessibles par plages de pages.",
    documentIds: ["protocoles-ventouses"],
  },
  {
    id: "guide" as const,
    title: "Guide des points thérapeutiques",
    description: "Guide visuel : schémas et cartes — navigation page par page.",
    documentIds: ["guide-points"],
  },
];

export type FormationProgress = {
  page: number;
  chapterId?: string;
  updatedAt: string;
};

const progressKey = (docId: string) => `campus-formation-progress:${docId}`;

export function loadFormationProgress(docId: string): FormationProgress | null {
  try {
    const raw = localStorage.getItem(progressKey(docId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FormationProgress;
    if (!parsed?.page || parsed.page < 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveFormationProgress(docId: string, progress: FormationProgress) {
  localStorage.setItem(progressKey(docId), JSON.stringify(progress));
}

export function getDocumentById(id: string) {
  return FORMATION_DOCUMENTS.find((d) => d.id === id) ?? null;
}
