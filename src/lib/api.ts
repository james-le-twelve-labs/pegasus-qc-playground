import type { QcResult } from "./types"

export async function runQc(clipId: string, checkId: string, mode: string): Promise<QcResult> {
  const endpoint = mode === "timeline" ? "/api/qc-segment" : "/api/qc"
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clipId, checkId }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `Request failed with ${res.status}`)
  return json as QcResult
}
