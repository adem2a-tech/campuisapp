/**
 * Build anatomy-hd/ from originals or existing .up.tmp.jpg (avoids locked file overwrite).
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("../.tmp-sharp/node_modules/sharp");

const SRC = path.resolve("artifacts/campus/public/formation/protocoles/anatomy-clean");
const OUT = path.resolve("artifacts/campus/public/formation/protocoles/anatomy-hd");
const SCALE = 2.5;

fs.mkdirSync(OUT, { recursive: true });

const files = fs.readdirSync(SRC).filter((f) => /^a-\d{3}\.jpg$/i.test(f)).sort();
console.log(`Building HD set for ${files.length} protocols → ${OUT}`);

for (const file of files) {
  const src = path.join(SRC, file);
  const tmp = path.join(SRC, `${file}.up.tmp.jpg`);
  const dest = path.join(OUT, file);
  const meta = await sharp(src).metadata();
  const w = meta.width || 0;

  if (fs.existsSync(tmp)) {
    fs.copyFileSync(tmp, dest);
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    console.log(`${file}: from tmp`);
    continue;
  }

  if (w >= 1600) {
    fs.copyFileSync(src, dest);
    console.log(`${file}: already large (${w})`);
    continue;
  }

  const targetW = Math.round(w * SCALE);
  await sharp(src)
    .resize({ width: targetW, kernel: "lanczos3" })
    .sharpen({ sigma: 1.1, m1: 0.8, m2: 0.4 })
    .modulate({ brightness: 1.02, saturation: 1.06 })
    .jpeg({ quality: 94, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(dest);
  console.log(`${file}: ${w} → ${targetW}`);
}

console.log("Done HD.");
