import { Chip, Text, cn } from "@twelvelabs-io/react"
import { clips } from "../data/catalog"
import { StepLabel } from "./StepLabel"

interface ClipGalleryProps {
  selectedClipId: string
  onSelect: (clipId: string) => void
}

export function ClipGallery({ selectedClipId, onSelect }: ClipGalleryProps) {
  return (
    <div className="flex flex-col gap-2">
      <StepLabel n={1} title="Pick a clip" />
      <Text variant="paragraph-small" className="text-foreground-subtle">
        Each is a real AI generation with a known defect (or a clean beat).
      </Text>
      {clips.map((clip) => {
        const selected = clip.id === selectedClipId
        return (
          <button
            key={clip.id}
            type="button"
            onClick={() => onSelect(clip.id)}
            aria-pressed={selected}
            className={cn(
              "flex cursor-default items-center gap-3 rounded-tlds-3 border p-2 text-left transition-colors",
              selected
                ? "border-border-primary bg-surface-secondary"
                : "border-border-secondary bg-transparent hover:bg-surface-secondary",
            )}
          >
            <img
              src={clip.poster ?? undefined}
              alt=""
              className="h-12 w-20 shrink-0 rounded-tlds-2 bg-surface-secondary object-cover"
            />
            <div className="flex min-w-0 flex-col gap-1">
              <Text variant="title-small" className="truncate">
                {clip.title}
              </Text>
              <Chip
                size="sm"
                variant={clip.expected === "pass" ? "success" : "warning"}
                className="w-fit"
              >
                {clip.defectLabel}
              </Chip>
            </div>
          </button>
        )
      })}
      <Text variant="paragraph-small" className="mt-1 text-foreground-subtle">
        Real AI generations — model, prompt and seed logged per clip in PROVENANCE.md.
      </Text>
    </div>
  )
}
