/**
 * Focus anatomique protocole : corps entier (dos) + zoom sur la zone de pose.
 */

export type BodyFocusRegion =
  | "tete"
  | "nuque"
  | "trapeze"
  | "dorsal"
  | "lombaires"
  | "sacrum"
  | "epaule"
  | "bras"
  | "thorax"
  | "abdomen"
  | "hanche"
  | "jambe"
  | "genou"
  | "pied"
  | "corps";

/** Cadre de zoom dans le viewBox SVG 200×520 (corps entier vue postérieure). */
export type ZoomFrame = {
  /** centre X du zoom (0–200) */
  cx: number;
  /** centre Y du zoom (0–520) */
  cy: number;
  /** échelle (2 = zoom ×2) */
  scale: number;
  label: string;
};

export const REGION_ZOOM: Record<BodyFocusRegion, ZoomFrame> = {
  tete: { cx: 100, cy: 42, scale: 2.6, label: "Crâne / tête" },
  nuque: { cx: 100, cy: 78, scale: 2.8, label: "Nuque / cervicales" },
  trapeze: { cx: 100, cy: 115, scale: 2.5, label: "Trapèzes" },
  dorsal: { cx: 100, cy: 155, scale: 2.4, label: "Dos thoracique" },
  lombaires: { cx: 100, cy: 230, scale: 2.7, label: "Lombaires" },
  sacrum: { cx: 100, cy: 268, scale: 2.8, label: "Sacrum / bassin" },
  epaule: { cx: 148, cy: 118, scale: 2.6, label: "Épaules" },
  bras: { cx: 160, cy: 175, scale: 2.4, label: "Bras" },
  thorax: { cx: 100, cy: 145, scale: 2.3, label: "Thorax (dos)" },
  abdomen: { cx: 100, cy: 210, scale: 2.3, label: "Abdomen / flancs" },
  hanche: { cx: 100, cy: 290, scale: 2.5, label: "Hanches" },
  jambe: { cx: 100, cy: 380, scale: 2.2, label: "Cuisses / jambes" },
  genou: { cx: 100, cy: 410, scale: 2.6, label: "Genoux" },
  pied: { cx: 100, cy: 490, scale: 2.5, label: "Pieds" },
  corps: { cx: 100, cy: 260, scale: 1, label: "Corps entier" },
};

/** Positions relatives des marqueurs 1..n dans le cadre zoomé (0–1). */
export function markerLayout(count: number): Array<{ x: number; y: number }> {
  if (count <= 1) return [{ x: 0.5, y: 0.45 }];
  if (count === 2) return [{ x: 0.38, y: 0.4 }, { x: 0.62, y: 0.4 }];
  if (count === 3) return [{ x: 0.5, y: 0.32 }, { x: 0.36, y: 0.52 }, { x: 0.64, y: 0.52 }];
  if (count === 4)
    return [
      { x: 0.5, y: 0.28 },
      { x: 0.5, y: 0.45 },
      { x: 0.5, y: 0.62 },
      { x: 0.68, y: 0.48 },
    ];
  return Array.from({ length: count }, (_, i) => ({
    x: 0.35 + (i % 3) * 0.15,
    y: 0.3 + Math.floor(i / 3) * 0.18,
  }));
}

export function inferBodyRegion(points: string[], title = ""): BodyFocusRegion {
  const blob = `${title} ${points.join(" ")}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  // Spécifique d’abord
  if (/temporo|mandibul|masseter|bouche|machoire|atm/.test(blob)) return "tete";
  if (/cheville|malleol|entorse/.test(blob)) return "pied";
  if (/genou|patella|rotule|menisque/.test(blob)) return "genou";
  if (/lombalg|lombair|bas du dos|sciatique/.test(blob)) return "lombaires";
  if (/dorsalg|interscap|rhomboid/.test(blob)) return "dorsal";
  if (/anxi|stress|insomnie|sommeil|cephale|crane|tete|front|tempe|migraine/.test(blob)) return "tete";
  if (/nuque|cervical|scm/.test(blob)) return "nuque";
  if (/trapeze/.test(blob)) return "trapeze";
  if (/sacrum|sacree|sacr/.test(blob)) return "sacrum";
  if (/epaule|deltoide|deltoid/.test(blob)) return "epaule";
  if (/bras|biceps|triceps|avant.?bras|coude/.test(blob)) return "bras";
  if (/flanc|hanche|iliaque|fessier|glute/.test(blob)) return "hanche";
  if (/mollet|soleaire|gastroc/.test(blob)) return "jambe";
  if (/cuisse|quadriceps|ischio/.test(blob)) return "jambe";
  if (/pied|plante|talon/.test(blob)) return "pied";
  if (/abdomen|ventre|ombilic/.test(blob)) return "abdomen";
  if (/thorax|poitrine|pectoral/.test(blob)) return "thorax";
  if (/\bdos\b|dorsal/.test(blob)) return "dorsal";
  return "corps";
}
