import { useEffect } from "react"

// When this app runs inside an iframe (e.g. the campaign landing page's HubSpot
// embed), report our real content height to the parent so the iframe can resize
// to fit — no gaps, no cut-off content, on any screen size. Per Kayla's spec;
// the parent listens for messages of type "pegasus-embed-height".
//
// Origin defaults to "*" for simplicity. Set VITE_EMBED_TARGET_ORIGIN to the
// exact embedding origin (e.g. "https://www.twelvelabs.io") to tighten this
// without a code change.
const TARGET_ORIGIN = import.meta.env.VITE_EMBED_TARGET_ORIGIN ?? "*"

export function EmbedResizer() {
  useEffect(() => {
    // Not in an iframe? Nothing to report — postMessage would just talk to
    // ourselves. Safe to leave mounted permanently.
    if (window.parent === window) return

    // Release the min-h-screen floor while embedded (see app.css). Standalone,
    // it pins the footer to the bottom of the viewport; embedded, it would pin
    // content to the iframe's height so the frame could grow but never shrink,
    // leaving a whitespace gap on desktop and after any content collapses.
    document.documentElement.setAttribute("data-embedded", "")

    const postHeight = () => {
      // Measure body, not documentElement: documentElement.scrollHeight is
      // floored at the iframe's viewport height, so it can grow but never
      // reports a shrink (a collapsed accordion or a shorter verdict would
      // leave a gap). body.scrollHeight tracks the true content both ways.
      const height = document.body.scrollHeight
      window.parent.postMessage({ type: "pegasus-embed-height", height }, TARGET_ORIGIN)
    }

    postHeight()
    window.addEventListener("load", postHeight)
    window.addEventListener("resize", postHeight)

    // Catch height changes not triggered by a window resize — e.g. content
    // expanding after a video loads or a QC verdict resolves.
    let observer: ResizeObserver | undefined
    let intervalId: number | undefined
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(postHeight)
      observer.observe(document.body)
    } else {
      intervalId = window.setInterval(postHeight, 1000)
    }

    return () => {
      window.removeEventListener("load", postHeight)
      window.removeEventListener("resize", postHeight)
      observer?.disconnect()
      if (intervalId !== undefined) window.clearInterval(intervalId)
      document.documentElement.removeAttribute("data-embedded")
    }
  }, [])

  return null
}
