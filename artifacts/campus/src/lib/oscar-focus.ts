/**
 * Mapping Formation → zone Campus 3D.
 * Table des 150 protocoles = source de vérité (titre / indication principale).
 */

import type { AnatomyZoneId } from "@/lib/anatomy-zones";
import { getAnatomyZone } from "@/lib/anatomy-zones";
import { anatomyEntryForProtocol } from "@/lib/protocol-anatomy-map";
import type { VentouseProtocol } from "@/lib/ventouse-protocols";

export type AnatomyFocus = {
  zoneId: AnatomyZoneId;
  zoneLabel: string;
  protocolNumber?: number;
  protocolTitle?: string;
  legendLabel: string;
  organHints: string[];
};

/** Compat anciens imports */
export type OscarFocus = AnatomyFocus & {
  searchQuery?: string;
  legendTerms?: string[];
};

export function anatomyFocusForZone(
  zoneId: AnatomyZoneId,
  protocol?: Pick<VentouseProtocol, "number" | "title">,
): AnatomyFocus {
  const zone = getAnatomyZone(zoneId);
  const entry = protocol?.number ? anatomyEntryForProtocol(protocol.number) : null;
  return {
    zoneId,
    zoneLabel: zone?.label ?? zoneId,
    legendLabel: entry?.legend ?? zone?.label ?? zoneId,
    organHints: entry?.organs ?? [zone?.label ?? zoneId],
    protocolNumber: protocol?.number,
    protocolTitle: protocol?.title,
    searchQuery: entry?.legend ?? zone?.label ?? zoneId,
    legendTerms: entry?.organs ?? [zone?.label ?? zoneId],
  };
}

export function anatomyFocusForProtocol(protocol: VentouseProtocol): AnatomyFocus {
  const entry = anatomyEntryForProtocol(protocol.number);
  if (entry) {
    const zone = getAnatomyZone(entry.zoneId);
    return {
      zoneId: entry.zoneId,
      zoneLabel: zone?.label ?? entry.legend,
      legendLabel: entry.legend,
      organHints: entry.organs,
      protocolNumber: protocol.number,
      protocolTitle: protocol.title,
      searchQuery: entry.legend,
      legendTerms: entry.organs,
    };
  }
  return anatomyFocusForZone("dorsal", protocol);
}

export function oscarFocusForProtocol(protocol: VentouseProtocol): OscarFocus {
  const f = anatomyFocusForProtocol(protocol);
  return { ...f, searchQuery: f.legendLabel, legendTerms: f.organHints };
}

export function oscarFocusForZone(
  zoneId: AnatomyZoneId,
  protocol?: Pick<VentouseProtocol, "number" | "title">,
): OscarFocus {
  const f = anatomyFocusForZone(zoneId, protocol);
  return { ...f, searchQuery: f.legendLabel, legendTerms: f.organHints };
}

export function resolveComplaintFocus(text: string) {
  const blob = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (/temporo|mandibul|machoire|masseter|bouche|bruxisme|\batm\b/.test(blob))
    return { zoneId: "machoire" as AnatomyZoneId, legend: "Mâchoire / ATM", organs: ["Masséter"] };
  if (/cheville|malleol|entorse|plantaire|achille/.test(blob))
    return { zoneId: "pied" as AnatomyZoneId, legend: "Cheville / pied", organs: ["Cheville"] };
  if (/genou|rotule|patella/.test(blob))
    return { zoneId: "genou" as AnatomyZoneId, legend: "Genou", organs: ["Rotule"] };
  if (/lombalg|lombair|bas du dos/.test(blob))
    return { zoneId: "lombaires" as AnatomyZoneId, legend: "Lombaires", organs: ["Lombaires"] };
  if (/migraine|cephale/.test(blob))
    return { zoneId: "crane" as AnatomyZoneId, legend: "Crâne", organs: ["Crâne"] };
  if (/dorsalg|\bdos\b/.test(blob))
    return { zoneId: "dorsal" as AnatomyZoneId, legend: "Dos", organs: ["Dos"] };
  return null;
}

export function resolveSmartFocus(text: string) {
  const r = resolveComplaintFocus(text);
  if (!r) return null;
  return {
    zoneId: r.zoneId,
    search: r.legend,
    organs: r.organs,
    legendTerms: r.organs,
  };
}

export function anatomyHrefForFocus(focus: AnatomyFocus | OscarFocus): string {
  const params = new URLSearchParams();
  params.set("zone", focus.zoneId);
  if (focus.protocolNumber) params.set("p", String(focus.protocolNumber));
  return `/anatomie?${params.toString()}`;
}

export function anatomyHrefForProtocol(protocol: VentouseProtocol): string {
  return anatomyHrefForFocus(anatomyFocusForProtocol(protocol));
}

export function oscarEmbedSrc() {
  const base = `${import.meta.env.BASE_URL || "/"}`.replace(/\/?$/, "/");
  return `${base}oscar3d/`;
}
