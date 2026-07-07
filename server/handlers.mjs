// Thin proxy around the TwelveLabs API. The API key never reaches the browser.
//
// Two entry points, matching the two Pegasus 1.5 modes:
//   runVerdictCheck  → POST /v1.3/analyze            (sync, prompt-based)
//   runTimelineCheck → POST /v1.3/analyze/tasks      (async, time_based_metadata) + poll
//
// Both are cache-first: checks/cache/<clipId>__<checkId>.json is returned when
// present so the live demo answers instantly and never blocks on polling.

import { readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const CACHE_DIR = path.join(ROOT, "checks", "cache")
const API_BASE = "https://api.twelvelabs.io/v1.3"

const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 180_000

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}

async function loadJson(relPath) {
  return JSON.parse(await readFile(path.join(ROOT, relPath), "utf8"))
}

async function resolveClipAndCheck(body) {
  const { clipId, checkId } = body ?? {}
  if (!clipId || !checkId) throw new HttpError(400, "clipId and checkId are required")
  const [{ clips }, { checks }] = await Promise.all([
    loadJson("assets/clips/clips.json"),
    loadJson("checks/checks.json"),
  ])
  const clip = clips.find((c) => c.id === clipId)
  const check = checks.find((c) => c.id === checkId)
  if (!clip) throw new HttpError(404, `Unknown clip: ${clipId}`)
  if (!check) throw new HttpError(404, `Unknown check: ${checkId}`)
  return { clip, check }
}

function cachePath(clipId, checkId) {
  return path.join(CACHE_DIR, `${clipId}__${checkId}.json`)
}

async function readCache(clipId, checkId) {
  const file = cachePath(clipId, checkId)
  if (!existsSync(file)) return null
  return JSON.parse(await readFile(file, "utf8"))
}

async function writeCache(result) {
  try {
    const file = cachePath(result.clipId, result.checkId)
    await writeFile(file, JSON.stringify({ ...result, source: "cache" }, null, 2))
  } catch {
    // Read-only filesystem (e.g. Vercel) — serving the live result is enough.
  }
}

function fillTemplate(template, params) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => params?.[key] ?? `<${key}>`)
}

function requireKey(env) {
  const key = env?.TWELVELABS_API_KEY
  if (!key) {
    throw new HttpError(
      503,
      "No cached result for this clip+check and TWELVELABS_API_KEY is not set. " +
        "Add it to .env (see .env.example) or pre-run checks with `npm run prerun-checks`.",
    )
  }
  return key
}

function requireAssetId(clip) {
  if (!clip.assetId) {
    throw new HttpError(
      503,
      `Clip "${clip.id}" has no TwelveLabs assetId yet. ` +
        "Upload clips with `npm run upload-assets` first.",
    )
  }
  return clip.assetId
}

async function tlFetch(apiKey, pathname, init = {}) {
  const res = await fetch(`${API_BASE}${pathname}`, {
    ...init,
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      ...init.headers,
    },
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    const message = json?.message ?? json?.error ?? text
    throw new HttpError(res.status, `TwelveLabs API ${res.status}: ${message}`)
  }
  return json
}

// Model output is engineered to be pure JSON, but strip markdown fences defensively.
function parseModelJson(data) {
  const trimmed = String(data ?? "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
  return JSON.parse(trimmed)
}

function deriveVerdictStatus(check, verdict) {
  const rule = check.passRule ?? {}
  if (rule.type === "booleanField") return verdict?.[rule.field] ? "pass" : "fail"
  if (rule.type === "allBooleanFields")
    return rule.fields.every((f) => verdict?.[f]) ? "pass" : "fail"
  return "info"
}

function deriveTimelineStatus(check, segments) {
  const rule = check.passRule ?? {}
  if (rule.type === "noSegments") return segments.length === 0 ? "pass" : "fail"
  if (rule.type === "allSegmentsTrue")
    return segments.every((s) => s.metadata?.[rule.field]) ? "pass" : "fail"
  return "info"
}

export async function runVerdictCheck(body, env) {
  const { clip, check } = await resolveClipAndCheck(body)
  if (check.mode !== "verdict")
    throw new HttpError(400, `Check ${check.id} is a Timeline check — use /api/qc-segment`)

  const cached = await readCache(clip.id, check.id)
  if (cached) return cached

  const apiKey = requireKey(env)
  const assetId = requireAssetId(clip)
  const prompt = fillTemplate(check.promptTemplate, clip.params)

  const started = Date.now()
  const res = await tlFetch(apiKey, "/analyze", {
    method: "POST",
    body: JSON.stringify({
      model_name: "pegasus1.5",
      video: { type: "asset_id", asset_id: assetId },
      prompt,
      temperature: 0.2,
      stream: false,
    }),
  })

  const verdict = parseModelJson(res.data)
  const result = {
    clipId: clip.id,
    checkId: check.id,
    mode: "verdict",
    status: deriveVerdictStatus(check, verdict),
    source: "live",
    elapsedMs: Date.now() - started,
    verdict,
    raw: res,
  }
  await writeCache(result)
  return result
}

export async function runTimelineCheck(body, env) {
  const { clip, check } = await resolveClipAndCheck(body)
  if (check.mode !== "timeline")
    throw new HttpError(400, `Check ${check.id} is a Verdict check — use /api/qc`)

  const cached = await readCache(clip.id, check.id)
  if (cached) return cached

  const apiKey = requireKey(env)
  const assetId = requireAssetId(clip)

  const started = Date.now()
  // NOTE: `prompt` is not allowed in time_based_metadata mode — instructions
  // live in the segment definition's `description` fields (400 otherwise).
  const task = await tlFetch(apiKey, "/analyze/tasks", {
    method: "POST",
    body: JSON.stringify({
      model_name: "pegasus1.5",
      analysis_mode: "time_based_metadata",
      video: { type: "asset_id", asset_id: assetId },
      temperature: 0.2,
      min_segment_duration: check.minSegmentDuration ?? 2,
      response_format: {
        type: "segment_definitions",
        segment_definitions: [check.segmentDefinition],
      },
    }),
  })

  let taskState = task
  while (!["ready", "failed"].includes(taskState.status)) {
    if (Date.now() - started > POLL_TIMEOUT_MS)
      throw new HttpError(504, `Analyze task ${task.task_id} timed out after 180s`)
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    taskState = await tlFetch(apiKey, `/analyze/tasks/${task.task_id}`)
  }
  if (taskState.status === "failed")
    throw new HttpError(502, `Analyze task failed: ${taskState.error ?? "unknown error"}`)
  if (taskState.finish_reason === "length")
    console.warn(`[qc-segment] finish_reason=length for ${clip.id}/${check.id} — bump max_tokens`)

  const data = parseModelJson(taskState.result?.data)
  const rawSegments = data[check.segmentDefinition.id] ?? []
  const segments = rawSegments.map((s) => ({
    startTime: s.start_time,
    endTime: s.end_time,
    metadata: s.metadata ?? {},
  }))

  const result = {
    clipId: clip.id,
    checkId: check.id,
    mode: "timeline",
    status: deriveTimelineStatus(check, segments),
    source: "live",
    elapsedMs: Date.now() - started,
    segments,
    raw: taskState,
  }
  await writeCache(result)
  return result
}

// Adapter used by both the Vite dev middleware and the Vercel functions.
export async function handleRequest(handler, body, env) {
  try {
    return { status: 200, json: await handler(body, env) }
  } catch (err) {
    return { status: err.statusCode ?? 500, json: { error: err.message } }
  }
}
