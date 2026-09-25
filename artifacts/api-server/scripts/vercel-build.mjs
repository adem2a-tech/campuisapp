#!/usr/bin/env node
/**
 * Build CAMPUS frontend for Vercel.
 * Works whether Root Directory is repo root, artifacts/campus, or (wrongly) api-server.
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

function findRoot(start) {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

const here = dirname(fileURLToPath(import.meta.url));
const root = findRoot(here);
const cwd = process.cwd();
const campusDist = join(root, "artifacts", "campus", "dist");
const targets = [join(root, "dist"), join(cwd, "dist")].filter(
  (v, i, a) => a.indexOf(v) === i,
);

function run(cmd, args, cwdDir) {
  const r = spawnSync(cmd, args, {
    cwd: cwdDir,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

process.env.BASE_PATH = process.env.BASE_PATH || "/";
process.env.NODE_ENV = "production";

console.log("Monorepo root:", root);
console.log("CWD:", cwd);

run(
  "pnpm",
  ["--filter", "@workspace/api-client-react...", "--filter", "@workspace/campus", "run", "build"],
  root,
);

if (!existsSync(join(campusDist, "index.html"))) {
  console.error("Build failed: missing", join(campusDist, "index.html"));
  process.exit(1);
}

for (const outDist of targets) {
  rmSync(outDist, { recursive: true, force: true });
  mkdirSync(outDist, { recursive: true });
  cpSync(campusDist, outDist, { recursive: true });
  console.log("Wrote", outDist);
}

writeFileSync(join(cwd, ".vercel-build-ok"), `ok ${new Date().toISOString()}\n`);
console.log("Vercel frontend build OK");
