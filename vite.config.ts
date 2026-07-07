import { defineConfig, loadEnv, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// Serves the same handlers as the Vercel functions in `api/` during `vite dev`,
// so `npm run dev` is the only process you need locally.
function apiDevServer(env: Record<string, string>): Plugin {
  return {
    name: "qc-api-dev-server",
    configureServer(server) {
      const routes: Record<string, string> = {
        "/api/qc": "runVerdictCheck",
        "/api/qc-segment": "runTimelineCheck",
      }
      server.middlewares.use(async (req, res, next) => {
        const route = routes[req.url?.split("?")[0] ?? ""]
        if (!route) return next()
        if (req.method !== "POST") {
          res.statusCode = 405
          return res.end(JSON.stringify({ error: "POST only" }))
        }
        // Plain-JS module shared with the Vercel functions — no types shipped.
        // @ts-expect-error — untyped .mjs import
        const handlers = await import("./server/handlers.mjs")
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        let body: unknown = {}
        try {
          body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")
        } catch {
          res.statusCode = 400
          return res.end(JSON.stringify({ error: "Invalid JSON body" }))
        }
        const { status, json } = await handlers.handleRequest(
          handlers[route as "runVerdictCheck" | "runTimelineCheck"],
          body,
          env,
        )
        res.statusCode = status
        res.setHeader("Content-Type", "application/json")
        res.end(JSON.stringify(json))
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  return {
    plugins: [react(), tailwindcss(), apiDevServer(env)],
  }
})
