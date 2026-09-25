/**
 * Upscale + sharpen anatomy-clean protocol diagrams for sharper UI display.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("../.tmp-sharp/node_modules/sharp");

const DIR = path.resolve("artifacts/campus/public/formation/protocoles/anatomy-clean");
const SCALE = 2.5;

const files = fs
  .readdirSync(DIR)
  .filter((f) => /^a-\d{3}\.jpg$/i.test(f))
  .sort();

// Skip already upscaled (~>=1800 wide)
const todo = [];
for (const file of files) {
  const meta = await sharp(path.join(DIR, file)).metadata();
  if ((meta.width || 0) < 1800) todo.push(file);
}
console.log(`Upscaling ${todo.length}/${files.length} images ×${SCALE}`);

for (const file of todo) {
  const input = path.join(DIR, file);
  const tmp = input + ".up.tmp.jpg";
  const meta = await sharp(input).metadata();
  const w = Math.round((meta.width || 960) * SCALE);
  await sharp(input)
    .resize({ width: w, kernel: "lanczos3", withoutEnlargement: false })
    .sharpen({ sigma: 1.1, m1: 0.8, m2: 0.4 })
    .modulate({ brightness: 1.02, saturation: 1.06 })
    .jpeg({ quality: 94, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(tmp);
  try {
    fs.copyFileSync(tmp, input);
    fs.unlinkSync(tmp);
  } catch (e) {
    console.warn(`retry later ${file}:`, e.message);
    continue;
  }
  const out = await sharp(input).metadata();
  console.log(`${file}: ${meta.width}×${meta.height} → ${out.width}×${out.height}`);
}
console.log("Done.");
