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
  ScrollArea,
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
            <ScrollArea className="max-h-96 overflow-hidden rounded-tlds-3 bg-surface-secondary">
              <pre className="p-3 font-tl-mono text-[12px] leading-4">{snippet}</pre>
            </ScrollArea>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="md" onClick={copy}>
                {copied ? <CheckmarkIcon /> : <CopyIcon />}
                {copied ? "Copied" : "Copy code"}
              </Button>
              <Link
                href={`${docsUrl}?utm_source=demo&utm_medium=code_panel&utm_campaign=ai-video-qc`}
                target="_blank"
                rel="noreferrer"
                onClick={() => track("run_it_yourself", { clip: clip.id, check: check.id })}
              >
                Run this yourself →
              </Link>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
