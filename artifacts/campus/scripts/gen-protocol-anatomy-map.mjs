import { writeFileSync } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const protocols = require("../src/data/ventouse-protocols-150.json");

function n(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function zoneFrom(title, points) {
  const t = n(title);
  if (/temporo|mandibul|bruxisme|masseter|contour du visage|drainage du visage/.test(t)) return "machoire";
  if (/cheville|plantaire|fasciite|achille|pieds froids|neuropathie peripherique|des chutes/.test(t)) return "pied";
  if (/genou|rotul/.test(t)) return "genou";
  if (/migraine|cephalee|cuir chevelu|sinus|nasale|allergies saisonnieres|nevralgie occipitale/.test(t)) return "crane";
  if (/cervicalgie|nuque|coup du lapin|vertige cervico|apnee|sommeil|irritabilite/.test(t) && !/dorsalg/.test(t))
    return "nuque";
  if (/lombalg|lombaire|hernie discale|douleur lombaire/.test(t)) return "lombaires";
  if (
    /sciatique|piriforme|sacrum|menstruel|menstruelle|cycle menstruel|fertilite|equilibre hormonal|syndrome premenstruel/.test(
      t,
    )
  )
    return "sacrum";
  if (/dorsalg|cyphose|scoliose|posture assise|dos complet|acne dorsale/.test(t)) return "dorsal";
  if (/epaule|coiffe|deltoide|nageur|post-vaccinal/.test(t)) return "epaule";
  if (/epicondyl|coude du tennisman/.test(t)) return "coude";
  if (/canal carpien|mains|poignet|avant-bras/.test(t)) return "avant-bras";
  if (/asthme|bronchite|respiratoire|thorac|intercostale|covid|toux persistante|costochondrite/.test(t)) return "thorax";
  if (
    /digestion|constip|colon|ballon|reflux|hepatique|nausee|detox digestive|gastrite|perte de poids|abdomen|vergeture|raffermissement|stimulation lymphatique abdominale/.test(
      t,
    )
  )
    return "abdomen";
  if (/hanche|bassin sport|arthrose de la hanche/.test(t)) return "hanche";
  if (/ilio-tibiale|essuie-glace|ischio|cuisse|cellulite/.test(t)) return "cuisse";
  if (
    /mollet|jambes lourdes|varices|insuffisance veineuse|crampe|periostite|circulation du senior|apres vol|apres un long voyage|post-effort|post-marathon/.test(
      t,
    )
  )
    return "mollet";
  if (/immobilisation/.test(t)) return "bras";
  if (
    /anxiete|stress|fibromyalgie|burnout|immunitaire|immunite|fatigue|convalescence|prevention saisonniere|energie|menopause|grossesse|qualite de vie|bien-etre|signature|preventif|executif|anti-age|texture de la peau|peau sensible|eclat du teint/.test(
      t,
    )
  )
    return "trapeze";
  const first = n((points || [])[0] || "");
  if (/malleole|cheville|plante|talon|pied/.test(first)) return "pied";
  if (/masseter|machoire|menton/.test(first)) return "machoire";
  if (/rotul|genou/.test(first)) return "genou";
  if (/lombaire/.test(first)) return "lombaires";
  if (/interscapulaire|rhomboide/.test(first)) return "dorsal";
  if (/trapeze|nuque et trapeze/.test(first)) return "trapeze";
  if (/nuque|crane|occip/.test(first)) return "nuque";
  if (/mollet/.test(first)) return "mollet";
  if (/deltoide/.test(first)) return "epaule";
  if (/epigastr|ombilical|colon|abdomen/.test(first)) return "abdomen";
  if (/sacree|hanche/.test(first)) return "sacrum";
  return "dorsal";
}

const lines = [];
const missing = [];
for (let i = 1; i <= 150; i++) {
  const proto = protocols.find((x) => x.number === i);
  if (!proto) {
    missing.push(i);
    continue;
  }
  const zone = zoneFrom(proto.title, proto.applicationPoints || []);
  const organs = (proto.applicationPoints || []).slice(0, 3);
  lines.push(
    `  ${i}: { zoneId: ${JSON.stringify(zone)}, legend: ${JSON.stringify(proto.title)}, organs: ${JSON.stringify(organs)} },`,
  );
}

const out = `/**
 * Mapping EXPLICITE des 150 protocoles Formation → zone Campus 3D.
 * Source : titre de chaque fiche (les points secondaires ne gagnent jamais).
 */

import type { AnatomyZoneId } from "@/lib/anatomy-zones";

export type ProtocolAnatomyEntry = {
  zoneId: AnatomyZoneId;
  legend: string;
  organs: string[];
};

export const PROTOCOL_ANATOMY_MAP: Record<number, ProtocolAnatomyEntry> = {
${lines.join("\n")}
};

export function anatomyEntryForProtocol(n: number): ProtocolAnatomyEntry | null {
  return PROTOCOL_ANATOMY_MAP[n] ?? null;
}
`;

writeFileSync(new URL("../src/lib/protocol-anatomy-map.ts", import.meta.url), out, "utf8");
console.log("wrote", 150 - missing.length, "missing", missing.join(",") || "none");
for (const n of [1, 4, 9, 10, 13, 14, 81, 108]) {
  const line = lines.find((l) => l.trim().startsWith(n + ":"));
  console.log(line);
}
