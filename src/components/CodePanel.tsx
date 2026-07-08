import { useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  CheckmarkIcon,
  Chip,
  CopyIcon,
  Link,
  Text,
} from "@twelvelabs-io/react"
import type { CheckDef, ClipDef } from "../lib/types"
import { buildSnippet } from "../lib/snippets"
import { track } from "../lib/analytics"
import { ModeChip } from "./CheckSelector"

const SEGMENT_QUICKSTART =
  "https://github.com/twelvelabs-io/twelvelabs-developer-experience/blob/main/quickstarts/TwelveLabs_Quickstart_Segment.ipynb"
const ANALYZE_DOCS = "https://docs.twelvelabs.io/docs/guides/analyze-videos"

interface CodePanelProps {
  check: CheckDef
  clip: ClipDef
}

export function CodePanel({ check, clip }: CodePanelProps) {
  const [copied, setCopied] = useState(false)
  const snippet = buildSnippet(check, clip)
  const docsUrl = check.mode === "timeline" ? SEGMENT_QUICKSTART : ANALYZE_DOCS

  const copy = async () => {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    track("copy_code", { clip: clip.id, check: check.id })
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Accordion
      type="single"
      collapsible
      onValueChange={(open) => {
        if (open) track("see_the_code", { clip: clip.id, check: check.id })
      }}
    >
      <AccordionItem value="code">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            <Text variant="title-small-bold">See the code</Text>
            <ModeChip mode={check.mode} />
            <Chip size="sm" variant="gray-outline" mono>
              {check.mode === "timeline" ? "analyze_async · segment" : "analyze · sync"}
            </Chip>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-2">
            <Text variant="paragraph-small" className="text-foreground-subtle">
              {check.mode === "timeline"
                ? "Timeline checks define a segment schema — no prompt — and get back timestamped, typed segments."
                : "Verdict checks send one engineered prompt and get back a single JSON verdict for the whole clip."}
            </Text>

            {/* IDE-style block: filename + always-visible Copy, full code scrollable on both axes */}
            <div className="overflow-hidden rounded-tlds-3 border border-border-secondary bg-surface-secondary">
              <div className="flex items-center justify-between gap-2 border-b border-border-secondary px-3 py-1.5">
                <Text variant="mono-paragraph-small" className="text-foreground-subtle">
                  qc_check.py
                </Text>
                <Button variant="secondary" size="sm" onClick={copy}>
                  {copied ? <CheckmarkIcon /> : <CopyIcon />}
                  {copied ? "Copied!" : "Copy code"}
                </Button>
              </div>
              <pre className="max-h-[32rem] overflow-auto p-3 font-tl-mono text-[12px] leading-4">
                {snippet}
              </pre>
            </div>

            {/* "Want this in your app?" hook (Ani, standup 2026-07-08): make it
                explicit the snippet is copy-paste-and-run in the customer's own
                app, with a direct path to an API key. */}
            <div className="flex flex-col gap-3 rounded-tlds-3 border border-border-secondary bg-surface-analyze/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex flex-col gap-0.5">
                <Text variant="title-small-bold">Want this in your app?</Text>
                <Text variant="paragraph-small" className="text-foreground-subtle">
                  This snippet is the whole integration — copy it, drop in your API key, and
                  it runs against your own videos.
                </Text>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`${docsUrl}?utm_source=demo&utm_medium=code_panel&utm_campaign=ai-video-qc`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track("run_it_yourself", { clip: clip.id, check: check.id })}
                >
                  Run this yourself →
                </Link>
                <Button asChild variant="primary" size="sm">
                  <a
                    href="https://playground.twelvelabs.io?utm_source=demo&utm_medium=code_panel&utm_campaign=ai-video-qc"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      track("want_it_in_your_app", { clip: clip.id, check: check.id })
                    }
                  >
                    Get your API key →
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
