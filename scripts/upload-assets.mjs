// Uploads every clip in public/clips/ as a TwelveLabs asset (direct upload),
// waits until each is ready, and writes the asset_id back into
// assets/clips/clips.json. Run once per clip set: `npm run upload-assets`.

import { readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const API_BASE = "https://api.twelvelabs.io/v1.3"
const CLIPS_JSON = path.join(ROOT, "assets", "clips", "clips.json")

async function loadEnv() {
  const envFile = path.join(ROOT, ".env")
  if (!existsSync(envFile)) return
  for (const line of (await readFile(envFile, "utf8")).split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

await loadEnv()
const API_KEY = process.env.TWELVELABS_API_KEY
if (!API_KEY) {
  console.error("TWELVELABS_API_KEY is not set — add it to .env first.")
  process.exit(1)
}

const data = JSON.parse(await readFile(CLIPS_JSON, "utf8"))

for (const clip of data.clips) {
  if (clip.assetId) {
    console.log(`✓ ${clip.id} already uploaded (${clip.assetId})`)
    continue
  }
  const file = path.join(ROOT, "public", clip.file)
  if (!existsSync(file)) {
    console.warn(`⚠ ${clip.id}: ${clip.file} not found — skipping`)
    continue
  }

  console.log(`↑ uploading ${clip.id}…`)
  const form = new FormData()
  form.append("method", "direct")
  form.append("file", new Blob([await readFile(file)], { type: "video/mp4" }), path.basename(file))
  const res = await fetch(`${API_BASE}/assets`, {
    method: "POST",
    headers: { "x-api-key": API_KEY },
    body: form,
  })
  const json = await res.json()
  if (!res.ok) {
    console.error(`✗ ${clip.id}: ${res.status} ${JSON.stringify(json)}`)
    continue
  }
  const assetId = json._id ?? json.id
  process.stdout.write(`  asset ${assetId} — waiting for ready`)
  for (;;) {
    const status = await fetch(`${API_BASE}/assets/${assetId}`, {
      headers: { "x-api-key": API_KEY },
    }).then((r) => r.json())
    if (status.status === "ready") break
    if (status.status === "failed") throw new Error(`asset ${assetId} failed to process`)
    process.stdout.write(".")
    await new Promise((r) => setTimeout(r, 3000))
  }
  console.log(" ready")
  clip.assetId = assetId
  await writeFile(CLIPS_JSON, JSON.stringify(data, null, 2) + "\n")
}

console.log("Done. asset_ids written to assets/clips/clips.json")
