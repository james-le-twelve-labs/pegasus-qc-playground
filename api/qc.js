// Vercel serverless function — Verdict checks (sync prompt-based analyze).
import { runVerdictCheck, handleRequest } from "../server/handlers.mjs"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" })
  const { status, json } = await handleRequest(runVerdictCheck, req.body, process.env)
  res.status(status).json(json)
}
