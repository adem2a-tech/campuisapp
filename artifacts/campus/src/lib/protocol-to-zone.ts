/**
 * Zone Formation → anatomie : table des 150 protocoles.
 */

import { ANATOMY_ZONES, type AnatomyZoneId } from "@/lib/anatomy-zones";
import { anatomyEntryForProtocol } from "@/lib/protocol-anatomy-map";
import type { VentouseProtocol } from "@/lib/ventouse-protocols";

export function zoneIdForProtocol(protocol: VentouseProtocol): AnatomyZoneId {
  return anatomyEntryForProtocol(protocol.number)?.zoneId ?? "dorsal";
}

export function zoneLabelForId(id: AnatomyZoneId) {
  return ANATOMY_ZONES.find((z) => z.id === id)?.label ?? id;
}
