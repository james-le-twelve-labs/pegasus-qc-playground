import {
  Chip,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@twelvelabs-io/react"
import { checks } from "../data/catalog"

interface CheckSelectorProps {
  value: string
  onChange: (checkId: string) => void
  disabled?: boolean
}

export function ModeChip({ mode }: { mode: "verdict" | "timeline" }) {
  return (
    <Chip size="sm" variant={mode === "timeline" ? "filled" : "outline"} uppercase>
      {mode === "timeline" ? "Timeline" : "Verdict"}
    </Chip>
  )
}

export function CheckSelector({ value, onChange, disabled }: CheckSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger size="large" className="w-full">
        <SelectValue placeholder="Pick a QC check" />
      </SelectTrigger>
      <SelectContent>
        {checks.map((check) => (
          <SelectItem key={check.id} value={check.id}>
            <span className="flex items-center gap-2">
              {check.label}
              <ModeChip mode={check.mode} />
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
