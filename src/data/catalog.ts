import checksJson from "../../checks/checks.json"
import clipsJson from "../../assets/clips/clips.json"
import type { CheckDef, ClipDef } from "../lib/types"

export const checks = checksJson.checks as CheckDef[]
export const clips = clipsJson.clips as ClipDef[]

export function getCheck(id: string): CheckDef {
  const check = checks.find((c) => c.id === id)
  if (!check) throw new Error(`Unknown check: ${id}`)
  return check
}

export function getClip(id: string): ClipDef {
  const clip = clips.find((c) => c.id === id)
  if (!clip) throw new Error(`Unknown clip: ${id}`)
  return clip
}

export function fillTemplate(template: string, params: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => params[key] || `<${key}>`)
}
