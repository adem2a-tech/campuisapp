/**
 * 150 protocoles thérapie ventouses — données structurées depuis le PDF scanné.
 * Mapping PDF : page PDF = numéro protocole + 2 (couverture + sommaire).
 * Image : /formation/protocoles/p-NNN.jpg
 */

export type ProtocolCategoryId =
  | "msk"
  | "circulation"
  | "respiratoire"
  | "digestif"
  | "immunitaire"
  | "stress"
  | "feminine"
  | "esthetique"
  | "sport"
  | "neuro"
  | "senior"
  | "combine";

export type VentouseProtocol = {
  id: string;
  number: number;
  categoryId: ProtocolCategoryId;
  title: string;
  objective: string;
  indications: string[];
  contraindications: string[];
  material: string[];
  applicationPoints: string[];
  steps: Array<{ title: string; detail: string }>;
  proTip: string;
  /** Image de la fiche PDF complète (référence interne, ne pas afficher en UI détail) */
  imageSrc: string;
  /** Schéma anatomique extrait du PDF */
  anatomyImageSrc: string;
  /** Photo pratique extraite du PDF */
  photoImageSrc: string;
  /** Page dans le PDF (1-based, fichier protocoles-ventouses.pdf) */
  pdfPage: number;
  tags: string[];
};

export const PROTOCOL_CATEGORIES: Array<{
  id: ProtocolCategoryId;
  label: string;
  pageFrom: number;
  pageTo: number;
}> = [
  { id: "msk", label: "Douleur musculo-squelettique", pageFrom: 1, pageTo: 31 },
  { id: "circulation", label: "Circulation et système lymphatique", pageFrom: 32, pageTo: 46 },
  { id: "respiratoire", label: "Système respiratoire", pageFrom: 47, pageTo: 56 },
  { id: "digestif", label: "Système digestif", pageFrom: 57, pageTo: 66 },
  { id: "immunitaire", label: "Système immunitaire et bien-être", pageFrom: 67, pageTo: 76 },
  { id: "stress", label: "Stress et bien-être mental", pageFrom: 77, pageTo: 85 },
  { id: "feminine", label: "Santé féminine", pageFrom: 86, pageTo: 95 },
  { id: "esthetique", label: "Beauté et esthétique", pageFrom: 96, pageTo: 105 },
  { id: "sport", label: "Récupération sportive", pageFrom: 106, pageTo: 120 },
  { id: "neuro", label: "Neurologique et posturale", pageFrom: 121, pageTo: 130 },
  { id: "senior", label: "Troisième âge et mobilité", pageFrom: 131, pageTo: 140 },
  { id: "combine", label: "Protocoles combinés", pageFrom: 141, pageTo: 150 },
];

export function categoryForProtocol(n: number): ProtocolCategoryId {
  const cat = PROTOCOL_CATEGORIES.find((c) => n >= c.pageFrom && n <= c.pageTo);
  return cat?.id ?? "msk";
}

export function protocolImageSrc(n: number) {
  return `/formation/protocoles/p-${String(n).padStart(3, "0")}.jpg`;
}

export function protocolAnatomyImageSrc(n: number) {
  // HD upscaled diagrams (bleu CAMPUS)
  return `/formation/protocoles/anatomy-hd/a-${String(n).padStart(3, "0")}.jpg?v=1`;
}

export function protocolPhotoImageSrc(n: number) {
  return `/formation/protocoles/photo/ph-${String(n).padStart(3, "0")}.jpg`;
}

export function protocolPdfPage(n: number) {
  return n + 2;
}
