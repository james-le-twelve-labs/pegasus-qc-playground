// Vercel serverless function — Timeline checks (async time_based_metadata).
// Cache-first: pre-run results return instantly; a cache miss falls back to
// creating an analyze task and polling (up to ~3 min — pre-run in production).
import { runTimelineCheck, handleRequest } from "../server/handlers.mjs"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" })
  const { status, json } = await handleRequest(runTimelineCheck, req.body, process.env)
  res.status(status).json(json)
}
