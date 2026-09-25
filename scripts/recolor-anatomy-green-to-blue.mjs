/**
 * Recolor green application-point markers → CAMPUS primary blue on anatomy-clean JPGs.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("../.tmp-sharp/node_modules/sharp");

const DIR = path.resolve("artifacts/campus/public/formation/protocoles/anatomy-clean");
// hsl(199 85% 38%) ≈
const BLUE = { r: 15, g: 122, b: 179 };
const BLUE_DARK = { r: 10, g: 90, b: 140 };

function isGreenMarker(r, g, b) {
  // Skin / anatomy: usually R >= G
  if (r >= g - 5 && r > 90) return false;
  // Cream / paper background
  if (r > 200 && g > 200 && b > 180) return false;
  // Gold border-ish
  if (r > 160 && g > 120 && b < 100) return false;
  // Green-dominant (markers + legend text + title)
  const gLead = g - Math.max(r, b);
  if (gLead < 12) return false;
  if (g < 35) return false;
  // Avoid very light mint
  if (g > 200 && r > 150) return false;
  return true;
}

function mapGreenToBlue(r, g, b) {
  // Preserve relative lightness
  const lum = (0.2 * r + 0.7 * g + 0.1 * b) / 255;
  const base = lum < 0.28 ? BLUE_DARK : BLUE;
  // Keep some variation from original green luminance
  const factor = Math.max(0.55, Math.min(1.25, lum / 0.35));
  return {
    r: Math.round(Math.min(255, base.r * factor)),
    g: Math.round(Math.min(255, base.g * factor)),
    b: Math.round(Math.min(255, base.b * factor)),
  };
}

async function processFile(file) {
  const input = path.join(DIR, file);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = Buffer.from(data);
  let changed = 0;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    if (isGreenMarker(r, g, b)) {
      const nb = mapGreenToBlue(r, g, b);
      px[i] = nb.r;
      px[i + 1] = nb.g;
      px[i + 2] = nb.b;
      changed++;
    }
  }
  if (changed === 0) return { file, changed: 0 };
  const tmp = input + ".tmp.jpg";
  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(tmp);
  fs.renameSync(tmp, input);
  return { file, changed };
}

const files = fs.readdirSync(DIR).filter((f) => /^a-\d{3}\.jpg$/i.test(f)).sort();
console.log(`Processing ${files.length} images in ${DIR}`);
let total = 0;
for (const f of files) {
  const res = await processFile(f);
  total += res.changed;
  if (res.changed > 0) console.log(`${f}: ${res.changed} px`);
}
console.log(`Done. Total pixels recolored: ${total}`);
