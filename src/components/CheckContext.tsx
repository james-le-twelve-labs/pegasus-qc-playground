import { Text } from "@twelvelabs-io/react"
import type { CheckDef, ClipDef } from "../lib/types"

interface CheckContextProps {
  clip: ClipDef
  check: CheckDef
}

function Row({ label, value, quote }: { label: string; value: string; quote?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <Text
        variant="mono-paragraph-small"
        className="shrink-0 text-foreground-subtle sm:w-36"
      >
        {label}
      </Text>
      <Text variant="paragraph-small" className="min-w-0">
        {quote ? `“${value}”` : value}
      </Text>
    </div>
  )
}

// Shows what the selected clip is being checked *against* — the expected line,
// speaker, and originating brief. Without this, a "wrong speaker" FAIL looks
// arbitrary: the clip plays fine, but the viewer can't see that the brief asked
// for a different speaker. Surfacing the expectation makes every verdict legible
// (Travis, standup 2026-07-07).
export function CheckContext({ clip, check }: CheckContextProps) {
  const params = check.params ?? []
  const brief = clip.params.brief

  return (
    <div className="flex flex-col gap-1.5 rounded-tlds-3 border border-border-secondary bg-surface-secondary/40 px-3 py-2.5">
      <Text variant="all-caps" className="text-foreground-analyze">
        Checking against
      </Text>
      {params.includes("line") && clip.params.line && (
        <Row label="expected_line" value={clip.params.line} quote />
      )}
      {params.includes("speaker") && clip.params.speaker && (
        <Row label="expected_speaker" value={clip.params.speaker} />
      )}
      {brief && <Row label="generated_from" value={brief} quote />}
    </div>
  )
}
