/**
 * Mapping noms anatomiques (anglais Z-Anatomy) → zones CAMPUS / protocoles.
 */

import type { AnatomyZoneId } from "@/lib/anatomy-zones";
import { ANATOMY_ZONES, getAnatomyZone, resolveZoneProtocol } from "@/lib/anatomy-zones";

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Règles : premier match gagne (ordre = priorité). */
const MUSCLE_RULES: Array<{ match: RegExp; zoneId: AnatomyZoneId; labelFr: string }> = [
  { match: /trapezius|trap[eè]ze/, zoneId: "trapeze", labelFr: "Trapèze" },
  { match: /sternocleidomastoid|splenius|semispinalis.?capitis|levator.?scap/, zoneId: "nuque", labelFr: "Nuque" },
  { match: /masseter|temporalis|pterygoid|mandib|zygomatic|orbicularis.?oris|buccinator/, zoneId: "machoire", labelFr: "Mâchoire" },
  { match: /frontalis|occipitalis|epicranius|scalp|cranial/, zoneId: "crane", labelFr: "Crâne" },
  { match: /deltoid|supraspinatus|infraspinatus|teres|rotator/, zoneId: "epaule", labelFr: "Épaule" },
  { match: /rhomboid|latissimus|erector.?spinae|iliocostalis.?thorac|longissimus.?thorac|multifidus.?thorac|serratus.?posterior.?superior/, zoneId: "dorsal", labelFr: "Dos supérieur" },
  { match: /pectoralis|intercostal|serratus.?anterior|diaphragm/, zoneId: "thorax", labelFr: "Thorax" },
  { match: /biceps.?brachii|triceps.?brachii|brachialis|coracobrachialis/, zoneId: "bras", labelFr: "Bras" },
  { match: /anconeus|epicondyl/, zoneId: "coude", labelFr: "Coude" },
  { match: /flexor|extensor|brachioradialis|pronator|supinator|palmaris|carpi/, zoneId: "avant-bras", labelFr: "Avant-bras" },
  { match: /rectus.?abdominis|oblique|transversus.?abdomin|pyramidalis/, zoneId: "abdomen", labelFr: "Abdomen" },
  { match: /quadratus.?lumborum|iliocostalis.?lumb|longissimus.?lumb|multifidus.?lumb|psoas|iliacus/, zoneId: "lombaires", labelFr: "Lombaires" },
  { match: /gluteus|piriformis|gemellus|obturator|quadratus.?femoris|sacrum|sacral/, zoneId: "sacrum", labelFr: "Sacrum / fessiers" },
  { match: /tensor.?fascia|iliopsoas|hip/, zoneId: "hanche", labelFr: "Hanche" },
  { match: /quadriceps|vastus|rectus.?femoris|sartorius|adductor|gracilis|hamstring|biceps.?femoris|semitendinosus|semimembranosus/, zoneId: "cuisse", labelFr: "Cuisse" },
  { match: /popliteus|patell/, zoneId: "genou", labelFr: "Genou" },
  { match: /gastrocnemius|soleus|plantaris/, zoneId: "mollet", labelFr: "Mollet" },
  { match: /tibialis|peroneus|fibularis|calcane|achill|talus|malleol|plantar|flexor.?digitorum.?longus|flexor.?hallucis|abductor.?hallucis|ankle|foot/, zoneId: "pied", labelFr: "Pied / cheville" },
];

export type MuscleSelection = {
  meshName: string;
  nameEn: string;
  nameDetail: string;
  labelFr: string;
  zoneId: AnatomyZoneId | null;
  protocolNumber: number | null;
};

export function resolveMuscleSelection(userData: {
  name?: string;
  nameDetail?: string;
  type?: string;
}, meshName: string): MuscleSelection {
  const nameEn = userData.name || meshName || "Structure";
  const nameDetail = userData.nameDetail || "";
  const blob = norm(`${nameEn} ${nameDetail} ${meshName}`);

  for (const rule of MUSCLE_RULES) {
    if (rule.match.test(blob)) {
      const zone = getAnatomyZone(rule.zoneId);
      const protocol = zone ? resolveZoneProtocol(zone) : null;
      return {
        meshName,
        nameEn,
        nameDetail,
        labelFr: rule.labelFr,
        zoneId: rule.zoneId,
        protocolNumber: protocol?.number ?? zone?.preferredProtocol ?? null,
      };
    }
  }

  // Fallback : chercher dans les zones par mots-clés du protocole
  for (const zone of ANATOMY_ZONES) {
    const keys = zone.fallbackKeywords.map(norm);
    if (keys.some((k) => blob.includes(k) || k.includes(blob.slice(0, 8)))) {
      const protocol = resolveZoneProtocol(zone);
      return {
        meshName,
        nameEn,
        nameDetail,
        labelFr: zone.label,
        zoneId: zone.id,
        protocolNumber: protocol?.number ?? zone.preferredProtocol,
      };
    }
  }

  return {
    meshName,
    nameEn,
    nameDetail,
    labelFr: nameEn,
    zoneId: null,
    protocolNumber: null,
  };
}
