/**
 * Cotations ventouses par zone (équivalent Bodymap Milo → AMK, adapté hors nomenclature sécu).
 */

import type { ZoneProtocol } from "@/lib/campus-protocols";

export type VentouseCotation = {
  code: string;
  label: string;
  unitPriceHt: number;
  durationMinutes: number;
  description: string;
};

const ZONE_BASE: Record<string, { code: string; price: number }> = {
  head: { code: "VEN-TET", price: 55 },
  forehead: { code: "VEN-TET", price: 55 },
  eye: { code: "VEN-VIS", price: 50 },
  jaw: { code: "VEN-MAC", price: 55 },
  ear: { code: "VEN-AUR", price: 45 },
  neck: { code: "VEN-NUQ", price: 60 },
  chest: { code: "VEN-THX", price: 65 },
  abdomen: { code: "VEN-ABD", price: 60 },
  "upper-back": { code: "VEN-DOS", price: 65 },
  "lower-back": { code: "VEN-LOM", price: 70 },
  "shoulder-r": { code: "VEN-EPA", price: 60 },
  "shoulder-l": { code: "VEN-EPA", price: 60 },
  "knee-r": { code: "VEN-GEN", price: 55 },
  "knee-l": { code: "VEN-GEN", price: 55 },
};

export function cotationForZone(
  zone: ZoneProtocol,
  opts?: { chronic?: boolean; operated?: boolean; defaultPrice?: number },
): VentouseCotation {
  const base = ZONE_BASE[zone.slug] || { code: "VEN-GEN", price: opts?.defaultPrice ?? 65 };
  let price = base.price;
  if (opts?.chronic) price = Math.round(price * 1.1);
  if (opts?.operated) price = Math.round(price * 1.05);

  const pathology = opts?.chronic ? "pathologie chronique" : "séance standard";
  const operatedNote = opts?.operated ? " · zone opérée (adaptation)" : "";

  return {
    code: base.code,
    label: `${base.code} · ${price.toFixed(2).replace(".", ",")} €`,
    unitPriceHt: price,
    durationMinutes: zone.durationMinutes,
    description: `Séance ventouses — ${zone.label} (${pathology}${operatedNote}). ${zone.technique.slice(0, 120)}${zone.technique.length > 120 ? "…" : ""}`,
  };
}

export function indicationOptions(zone: ZoneProtocol): string[] {
  const inds = zone.indications?.length ? zone.indications : ["Douleur", "Tension", "Récupération"];
  return inds.slice(0, 6);
}
