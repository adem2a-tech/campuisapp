import raw from "@/data/ventouse-protocols-150.json";
import {
  PROTOCOL_CATEGORIES,
  categoryForProtocol,
  protocolAnatomyImageSrc,
  protocolImageSrc,
  protocolPdfPage,
  protocolPhotoImageSrc,
  type ProtocolCategoryId,
  type VentouseProtocol,
} from "@/lib/ventouse-protocols-meta";

export {
  PROTOCOL_CATEGORIES,
  categoryForProtocol,
  protocolAnatomyImageSrc,
  protocolImageSrc,
  protocolPdfPage,
  protocolPhotoImageSrc,
  type ProtocolCategoryId,
  type VentouseProtocol,
};

type RawProtocol = {
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
};

const list = (raw as RawProtocol[]).map((p): VentouseProtocol => ({
  ...p,
  id: `ventouse-${String(p.number).padStart(3, "0")}`,
  categoryId: p.categoryId || categoryForProtocol(p.number),
  imageSrc: protocolImageSrc(p.number),
  anatomyImageSrc: protocolAnatomyImageSrc(p.number),
  photoImageSrc: protocolPhotoImageSrc(p.number),
  pdfPage: protocolPdfPage(p.number),
  tags: [
    p.title,
    ...p.indications,
    ...p.applicationPoints,
    PROTOCOL_CATEGORIES.find((c) => c.id === (p.categoryId || categoryForProtocol(p.number)))?.label ?? "",
  ]
    .join(" ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 40),
}));

export const VENTOUSE_PROTOCOLS: VentouseProtocol[] = list;

export function getVentouseProtocol(n: number) {
  return VENTOUSE_PROTOCOLS.find((p) => p.number === n);
}

function normalizeSearch(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function searchVentouseProtocols(query: string, categoryId?: ProtocolCategoryId | "all") {
  const q = normalizeSearch(query.trim());
  return VENTOUSE_PROTOCOLS.filter((p) => {
    if (categoryId && categoryId !== "all" && p.categoryId !== categoryId) return false;
    if (!q) return true;
    const hay = normalizeSearch(
      [
        p.title,
        p.objective,
        p.proTip,
        ...p.indications,
        ...p.contraindications,
        ...p.material,
        ...p.applicationPoints,
        ...p.steps.map((s) => `${s.title} ${s.detail}`),
        String(p.number),
      ].join(" "),
    );
    return hay.includes(q);
  });
}
