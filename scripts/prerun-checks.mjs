// Pre-runs QC checks and caches the JSON so the live demo returns instantly
// (Timeline checks are async + polled — never make a visitor wait on that).
//
//   npm run prerun-checks             → the 5 hero clip+check pairs
//   npm run prerun-checks -- --all    → every clip × every check (25 runs)
//
// Existing sample fixtures are overwritten by real results.

import { readFile, unlink } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { runVerdictCheck, runTimelineCheck } from "../server/handlers.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

async function loadEnv() {
  const envFile = path.join(ROOT, ".env")
  if (!existsSync(envFile)) return
  for (const line of (await readFile(envFile, "utf8")).split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

await loadEnv()

const { clips } = JSON.parse(await readFile(path.join(ROOT, "assets/clips/clips.json"), "utf8"))
const { checks } = JSON.parse(await readFile(path.join(ROOT, "checks/checks.json"), "utf8"))

const all = process.argv.includes("--all")
const pairs = all
  ? clips.flatMap((clip) => checks.map((check) => ({ clip, check })))
  : clips.map((clip) => ({ clip, check: checks.find((c) => c.id === clip.defaultCheck) }))

for (const { clip, check } of pairs) {
  const cacheFile = path.join(ROOT, "checks/cache", `${clip.id}__${check.id}.json`)
  if (existsSync(cacheFile)) {
    const existing = JSON.parse(await readFile(cacheFile, "utf8"))
    if (existing.source !== "sample") {
      console.log(`✓ ${clip.id} × ${check.id} already cached`)
      continue
    }
    await unlink(cacheFile) // replace sample fixture with the real thing
  }
  process.stdout.write(`▶ ${clip.id} × ${check.id} (${check.mode})… `)
  try {
    const runner = check.mode === "timeline" ? runTimelineCheck : runVerdictCheck
    const result = await runner({ clipId: clip.id, checkId: check.id }, process.env)
    console.log(`${result.status.toUpperCase()} in ${((result.elapsedMs ?? 0) / 1000).toFixed(1)}s`)
  } catch (err) {
    console.log(`ERROR — ${err.message}`)
  }
}

console.log("Done. Results cached in checks/cache/.")
