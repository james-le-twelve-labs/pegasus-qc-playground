export type CheckMode = "verdict" | "timeline"
export type QcStatus = "pass" | "fail" | "info"
export type ResultSource = "live" | "cache" | "sample"

export interface SegmentField {
  name: string
  type: string
  description: string
  enum?: string[]
  items?: { type: string }
}

export interface SegmentDefinition {
  id: string
  description: string
  fields: SegmentField[]
}

export interface CheckDef {
  id: string
  label: string
  tagline: string
  mode: CheckMode
  promptTemplate?: string
  params?: string[]
  minSegmentDuration?: number
  segmentDefinition?: SegmentDefinition
  passRule?: Record<string, unknown>
}

export interface ClipDef {
  id: string
  title: string
  defectLabel: string
  expected: "pass" | "fail"
  file: string
  poster?: string
  durationSec: number
  defaultCheck: string
  assetId: string | null
  params: Record<string, string>
}

export interface QcSegment {
  startTime: number
  endTime: number
  metadata: Record<string, unknown>
}

export interface QcResult {
  clipId: string
  checkId: string
  mode: CheckMode
  status: QcStatus
  source: ResultSource
  elapsedMs?: number
  verdict?: Record<string, unknown>
  segments?: QcSegment[]
  raw: unknown
}
