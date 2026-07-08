import { Text } from "@twelvelabs-io/react"

interface StepLabelProps {
  n: number
  title: string
}

// Bold, analyze-orange "STEP n" pill + title. Guides first-time users through
// the pick-a-clip → choose-a-check → run flow (standup feedback, 2026-07-07).
export function StepLabel({ n, title }: StepLabelProps) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 rounded-tlds-2 bg-surface-analyze px-2 py-0.5 font-tl-mono text-[11px] font-bold uppercase leading-4 tracking-wide text-foreground-analyze">
        Step {n}
      </span>
      <Text variant="title-small-bold">{title}</Text>
    </div>
  )
}
