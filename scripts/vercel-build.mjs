#!/usr/bin/env node
/**
 * Build CAMPUS for Vercel — always writes ./dist at repo root.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const campusDist = join(root, "artifacts", "campus", "dist");
const outDist = join(root, "dist");

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

process.env.BASE_PATH = process.env.BASE_PATH || "/";
process.env.NODE_ENV = "production";

run("pnpm", ["--filter", "@workspace/api-client-react...", "--filter", "@workspace/campus", "run", "build"]);

if (!existsSync(join(campusDist, "index.html"))) {
  console.error("Build failed: missing", join(campusDist, "index.html"));
  process.exit(1);
}

rmSync(outDist, { recursive: true, force: true });
mkdirSync(outDist, { recursive: true });
cpSync(campusDist, outDist, { recursive: true });

console.log("Vercel output ready:", outDist);
