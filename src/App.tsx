import { useState } from "react"
import {
  Banner,
  BannerContent,
  BannerIcon,
  Button,
  PlayFilledIcon,
  Spinner,
  Text,
  TwelveLabsLogo,
} from "@twelvelabs-io/react"
import { ClipGallery } from "./components/ClipGallery"
import { CheckSelector } from "./components/CheckSelector"
import { PlayerWithTimeline } from "./components/PlayerWithTimeline"
import { VerdictCard } from "./components/VerdictCard"
import { CodePanel } from "./components/CodePanel"
import { clips, getCheck, getClip } from "./data/catalog"
import { runQc } from "./lib/api"
import { track } from "./lib/analytics"
import type { QcResult } from "./lib/types"

export default function App() {
  const [clipId, setClipId] = useState(clips[0].id)
  const [checkId, setCheckId] = useState(clips[0].defaultCheck)
  const [result, setResult] = useState<QcResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clip = getClip(clipId)
  const check = getCheck(checkId)

  const selectClip = (id: string) => {
    setClipId(id)
    setCheckId(getClip(id).defaultCheck)
    setResult(null)
    setError(null)
  }

  const selectCheck = (id: string) => {
    setCheckId(id)
    setResult(null)
    setError(null)
  }

  const run = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    track("run_qc", { clip: clipId, check: checkId })
    try {
      setResult(await runQc(clipId, checkId, check.mode))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between">
        <TwelveLabsLogo className="h-6" />
        <Text variant="mono-paragraph-small" className="text-foreground-subtle">
          Pegasus QC Playground
        </Text>
      </header>

      <div className="flex flex-col gap-2">
        <Text variant="display-small" as="h1">
          QC your AI-generated video
        </Text>
        <Text variant="paragraph-large" className="max-w-2xl text-foreground-subtle">
          AI video generators produce slop at scale. Pegasus is the QA node that catches it before
          compositing — pick a broken clip, run a check, and get a structured, timestamped verdict
          in seconds. Then steal the exact API call behind it.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <ClipGallery selectedClipId={clipId} onSelect={selectClip} />
        </aside>

        <main className="flex flex-col gap-4 lg:col-span-8">
          <PlayerWithTimeline
            clip={clip}
            check={check}
            segments={result?.mode === "timeline" ? (result.segments ?? []) : null}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <CheckSelector value={checkId} onChange={selectCheck} disabled={loading} />
            <Button size="lg" onClick={run} disabled={loading} className="sm:w-40">
              {loading ? <Spinner size="sm" /> : <PlayFilledIcon />}
              {loading ? "Running…" : "Run QC"}
            </Button>
          </div>

          {error && (
            <Banner variant="warning">
              <BannerIcon />
              <BannerContent>{error}</BannerContent>
            </Banner>
          )}

          {!result && !loading && !error && (
            <Banner variant="pegasus">
              <BannerIcon />
              <BannerContent>
                Pick a clip, pick a check, hit <strong>Run QC</strong>. Timeline checks return
                clickable, timestamped defect segments; Verdict checks return one pass/fail JSON.
              </BannerContent>
            </Banner>
          )}

          {result && <VerdictCard check={check} result={result} />}

          <CodePanel check={check} clip={clip} />
        </main>
      </div>

      <footer className="mt-auto flex items-center justify-between border-t border-border-secondary pt-4">
        <Text variant="paragraph-small" className="text-foreground-subtle">
          Built on TwelveLabs Pegasus 1.5 — prompt-based analyze + time-based metadata.
        </Text>
        <Text variant="paragraph-small" className="text-foreground-subtle">
          Every clip is a real AI generation — provenance logged per clip.
        </Text>
      </footer>
    </div>
  )
}
