// Funnel events per the game plan: instrument "Run QC", "See the code" and
// "Run this yourself" so we can see acquisition, not just traffic.
// Swap console.debug for the real tracker (PostHog/GA) before public launch.

type QcEvent = "run_qc" | "see_the_code" | "run_it_yourself"

export function track(event: QcEvent, props: Record<string, string> = {}) {
  const utm = Object.fromEntries(
    [...new URLSearchParams(window.location.search)].filter(([k]) => k.startsWith("utm_")),
  )
  console.debug("[analytics]", event, { ...props, ...utm })
}
