import type { CheckDef, ClipDef } from "./types"
import { fillTemplate } from "../data/catalog"

// Generates the exact Python call that produced the on-screen result, per mode.
// This is the teaching surface: Verdict = sync analyze, Timeline = segment task.

function pyString(value: string): string {
  if (value.includes("\n")) return `"""${value.replace(/"""/g, '\\"\\"\\"')}"""`
  return JSON.stringify(value)
}

function pyLiteral(value: unknown, indent: number): string {
  const pad = " ".repeat(indent)
  const inner = " ".repeat(indent + 4)
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string") && value.length <= 6)
      return `[${value.map((v) => JSON.stringify(v)).join(", ")}]`
    return `[\n${value.map((v) => inner + pyLiteral(v, indent + 4)).join(",\n")},\n${pad}]`
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => `${inner}${JSON.stringify(k)}: ${pyLiteral(v, indent + 4)}`,
    )
    return `{\n${entries.join(",\n")}\n${pad}}`
  }
  if (typeof value === "string") return pyString(value)
  if (typeof value === "boolean") return value ? "True" : "False"
  return String(value)
}

export function buildSnippet(check: CheckDef, clip: ClipDef): string {
  if (check.mode === "verdict") {
    const prompt = fillTemplate(check.promptTemplate ?? "", clip.params)
    return `import json
from twelvelabs import TwelveLabs

client = TwelveLabs(api_key=API_KEY)

PROMPT = ${pyString(prompt)}

res = client.analyze(
    video={"type": "asset_id", "asset_id": ${JSON.stringify(clip.assetId ?? "<YOUR_ASSET_ID>")}},
    model_name="pegasus1.5",
    prompt=PROMPT,
    temperature=0.2,  # low = deterministic, better for QC
)
verdict = json.loads(res.data)  # prompt is engineered to return JSON only
print(verdict)`
  }

  const definition = pyLiteral(check.segmentDefinition, 0)
  return `import json, time
from twelvelabs import TwelveLabs

client = TwelveLabs(api_key=API_KEY)

# Instructions live in the segment/field descriptions —
# \`prompt\` is NOT allowed in time_based_metadata mode.
SEGMENT_DEFINITION = ${definition}

task = client.analyze_async.tasks.create(
    video={"type": "asset_id", "asset_id": ${JSON.stringify(clip.assetId ?? "<YOUR_ASSET_ID>")}},
    model_name="pegasus1.5",
    analysis_mode="time_based_metadata",
    temperature=0.2,
    min_segment_duration=${(check.minSegmentDuration ?? 2).toFixed(1)},
    response_format={
        "type": "segment_definitions",
        "segment_definitions": [SEGMENT_DEFINITION],
    },
)
while True:
    task = client.analyze_async.tasks.retrieve(task.task_id)
    if task.status in ("ready", "failed"):
        break
    time.sleep(5)

data = json.loads(task.result.data)
for seg in data[${JSON.stringify(check.segmentDefinition?.id ?? "segments")}]:
    print(f"{seg['start_time']}s–{seg['end_time']}s", seg["metadata"])`
}
