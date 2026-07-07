import { useRef, useState } from "react"
import { Chip, Text, cn } from "@twelvelabs-io/react"
import type { CheckDef, ClipDef, QcSegment } from "../lib/types"

interface PlayerWithTimelineProps {
  clip: ClipDef
  check: CheckDef
  segments: QcSegment[] | null
}

function segmentLabel(check: CheckDef, segment: QcSegment, index: number): string {
  const meta = segment.metadata
  if (check.id === "av-defect") return String(meta.defect_type ?? "defect")
  if (check.id === "lip-sync") return meta.lips_match_words ? "sync ok" : "sync broken"
  return `scene ${index + 1}`
}

function segmentIsBad(check: CheckDef, segment: QcSegment): boolean {
  const meta = segment.metadata
  if (check.id === "av-defect") return true
  if (check.id === "lip-sync") return !meta.lips_match_words
  return false
}

const fmt = (s: number) => `${s.toFixed(1)}s`

export function PlayerWithTimeline({ clip, check, segments }: PlayerWithTimelineProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(clip.durationSec)

  const seekTo = (time: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = time
    video.play().catch(() => {})
  }

  return (
    <div className="flex flex-col gap-2">
      <video
        ref={videoRef}
        key={clip.id}
        src={clip.file}
        poster={clip.poster}
        controls
        playsInline
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration
          if (Number.isFinite(d) && d > 0) setDuration(d)
        }}
        className="aspect-video w-full rounded-tlds-3 bg-black"
      />

      {segments && (
        <>
          {/* Defect timeline under the scrubber — each span maps to a flagged segment */}
          <div className="relative h-2 w-full overflow-hidden rounded-tlds-2 bg-surface-secondary">
            {segments.map((seg, i) => {
              const left = (seg.startTime / duration) * 100
              const width = Math.max(((seg.endTime - seg.startTime) / duration) * 100, 1.5)
              return (
                <button
                  key={i}
                  type="button"
                  title={`${fmt(seg.startTime)}–${fmt(seg.endTime)}`}
                  onClick={() => seekTo(seg.startTime)}
                  className={cn(
                    "absolute top-0 h-full cursor-default",
                    segmentIsBad(check, seg)
                      ? "bg-surface-destructive hover:bg-surface-destructive/80"
                      : "bg-tl-system-color-dark-green hover:bg-tl-system-color-dark-green/80",
                  )}
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              )
            })}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {segments.length === 0 ? (
              <Text variant="paragraph-small" className="text-foreground-subtle">
                No segments flagged — clean clip.
              </Text>
            ) : (
              segments.map((seg, i) => (
                <Chip
                  key={i}
                  asChild
                  mono
                  size="md"
                  variant={segmentIsBad(check, seg) ? "error" : "gray-outline"}
                >
                  <button type="button" onClick={() => seekTo(seg.startTime)}>
                    {fmt(seg.startTime)}–{fmt(seg.endTime)} · {segmentLabel(check, seg, i)}
                  </button>
                </Chip>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
