import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Banner,
  BannerContent,
  BannerIcon,
  CheckmarkFilledIcon,
  Chip,
  ScrollArea,
  Text,
  WarningFilledIcon,
} from "@twelvelabs-io/react"
import type { CheckDef, QcResult } from "../lib/types"

interface VerdictCardProps {
  check: CheckDef
  result: QcResult
}

const STATUS_COPY: Record<QcResult["status"], string> = {
  pass: "PASS — this clip clears the check",
  fail: "FAIL — Pegasus flagged this clip",
  info: "Structured metadata extracted",
}

function SourceChip({ result }: { result: QcResult }) {
  if (result.source === "sample")
    return (
      <Chip size="sm" variant="subtle" uppercase>
        sample result
      </Chip>
    )
  if (result.source === "cache")
    return (
      <Chip size="sm" variant="subtle" uppercase>
        cached
      </Chip>
    )
  return (
    <Chip size="sm" variant="outline" uppercase>
      live · {((result.elapsedMs ?? 0) / 1000).toFixed(1)}s
    </Chip>
  )
}

function ValueRow({ name, value }: { name: string; value: unknown }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <Text variant="mono-paragraph-small" className="text-foreground-subtle">
        {name}
      </Text>
      {typeof value === "boolean" ? (
        <Chip size="sm" variant={value ? "success" : "error"} mono>
          {String(value)}
        </Chip>
      ) : Array.isArray(value) ? (
        <div className="flex max-w-[70%] flex-wrap justify-end gap-1">
          {value.length === 0 ? (
            <Text variant="mono-paragraph-small">—</Text>
          ) : (
            value.map((v, i) => (
              <Chip key={i} size="sm" variant="gray-outline">
                {String(v)}
              </Chip>
            ))
          )}
        </div>
      ) : (
        <Text variant="paragraph-small" className="max-w-[70%] text-right">
          {String(value)}
        </Text>
      )}
    </div>
  )
}

export function VerdictCard({ check, result }: VerdictCardProps) {
  const bannerVariant =
    result.status === "pass" ? "info" : result.status === "fail" ? "warning" : "pegasus"

  return (
    <div className="flex flex-col gap-3">
      <Banner variant={bannerVariant}>
        <BannerIcon>
          {result.status === "pass" ? (
            <CheckmarkFilledIcon />
          ) : result.status === "fail" ? (
            <WarningFilledIcon />
          ) : undefined}
        </BannerIcon>
        <BannerContent>
          <span className="flex flex-wrap items-center gap-2">
            <Text variant="title-small-bold">{STATUS_COPY[result.status]}</Text>
            <Chip size="sm" variant="outline">
              {check.label}
            </Chip>
            <SourceChip result={result} />
          </span>
        </BannerContent>
      </Banner>

      {result.mode === "verdict" && result.verdict && (
        <div className="rounded-tlds-3 border border-border-secondary px-3 py-1 divide-y divide-border-secondary">
          {Object.entries(result.verdict).map(([name, value]) => (
            <ValueRow key={name} name={name} value={value} />
          ))}
        </div>
      )}

      {result.mode === "timeline" && result.segments && result.segments.length > 0 && (
        <div className="flex flex-col gap-1 rounded-tlds-3 border border-border-secondary px-3 py-2">
          {result.segments.map((seg, i) => (
            <div key={i} className="flex items-baseline gap-3 py-1">
              <Text variant="mono-paragraph-small" className="shrink-0 text-foreground-subtle">
                {seg.startTime.toFixed(1)}s–{seg.endTime.toFixed(1)}s
              </Text>
              <Text variant="paragraph-small">
                {String(
                  seg.metadata.description ??
                    seg.metadata.summary ??
                    seg.metadata.notes ??
                    JSON.stringify(seg.metadata),
                )}
              </Text>
            </div>
          ))}
        </div>
      )}

      <Accordion type="single" collapsible>
        <AccordionItem value="raw">
          <AccordionTrigger>
            <Text variant="title-small">Raw JSON response</Text>
          </AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="max-h-64 overflow-hidden rounded-tlds-3 bg-surface-secondary">
              <pre className="p-3 font-tl-mono text-[12px] leading-4 whitespace-pre-wrap">
                {JSON.stringify(
                  result.mode === "verdict"
                    ? result.verdict
                    : { [check.segmentDefinition?.id ?? "segments"]: result.segments },
                  null,
                  2,
                )}
              </pre>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
