# Pegasus QC Playground

QC your AI-generated video with [TwelveLabs Pegasus](https://docs.twelvelabs.io).
Pick an AI-slop clip, run a QC check, get a structured — and for Timeline
checks, **timestamped** — pass/fail verdict in seconds. Then open **See the
code** and steal the exact API call that produced it.

Built by the Self-Serve Tiger Team (Cohort 1: AI video QA, modeled on
Reve.art's production pipeline). Companion blog: *"The QA Node: why every AI
video pipeline needs a quality-control layer."*

## The two Pegasus 1.5 modes this demo teaches

| | Verdict (prompt-based `analyze`) | Timeline (Segment / `time_based_metadata`) |
|---|---|---|
| You send | An engineered prompt | A `segment_definition` schema — no prompt |
| You get | One JSON verdict for the whole clip | Timestamped, typed segments |
| Checks here | Brief-match, Content-verification | AV-defect, Lip-sync, Content-log |
| API | `POST /v1.3/analyze` (sync) | `POST /v1.3/analyze/tasks` (async + poll) |

## Run it locally (< 5 min)

```sh
# 1. UI kit (one-time — see note below)
#    TwelveLabs folks: drop the @twelvelabs-io/react tarball into vendor/
# 2. Then:
npm install
cp .env.example .env        # paste your TWELVELABS_API_KEY
npm run dev                 # → http://localhost:5173
```

No key? All 25 clip+check pairs ship with cached results, so the demo works
out of the box; live calls need the key.

> **Note on the UI kit:** the frontend uses `@twelvelabs-io/react`, TwelveLabs'
> internal component library, which is **not publicly distributable** (it lives
> on SSO-gated GitHub Packages). The dependency points at
> `vendor/twelvelabs-io-react-0.23.0.tgz`, which is deliberately not in this
> repo. TwelveLabs folks: `npm pack` it from the twelvelabs-ui repo (or install
> from GitHub Packages with a PAT) and drop the tarball into `vendor/`.
> External forkers: everything that matters for learning the QC patterns —
> `checks/checks.json`, the `api/` proxy, `server/handlers.mjs`, the cached
> results, and the [Colab notebook](notebooks/Pegasus_AI_Video_QC.ipynb) —
> works without the UI kit.

## Wiring up real clips (one-time)

```sh
# 1. Put your clips in public/clips/ and describe them in assets/clips/clips.json
# 2. Upload them as TwelveLabs assets (writes asset_ids back into clips.json)
npm run upload-assets
# 3. Pre-run the checks and cache the JSON (Timeline checks are async — never
#    make a visitor wait on polling)
npm run prerun-checks           # hero pairs only
npm run prerun-checks -- --all  # every clip × every check
```

## Forkable notebook

All five checks as a runnable Colab: [`notebooks/Pegasus_AI_Video_QC.ipynb`](notebooks/Pegasus_AI_Video_QC.ipynb).
It uses the same `checks/checks.json` definitions and the deployed demo's clip
URLs, so notebook, demo, and prompt pack can't drift apart.

## Repo map

```
src/                  React + Vite frontend (@twelvelabs-io/react UI kit)
notebooks/            Forkable Colab — the 5 checks, runnable end-to-end
api/                  Vercel functions — the key-safe proxy (never ship the key to the browser)
server/handlers.mjs   Shared proxy logic (Vite dev middleware + Vercel functions)
checks/checks.json    The 5 pre-baked checks: Verdict prompts + segment definitions
checks/cache/         Pre-run results, returned instantly by the API routes
assets/clips/         clips.json (ids + asset_ids) and PROVENANCE.md (model/prompt/seed per clip)
scripts/              upload-assets.mjs · prerun-checks.mjs
vendor/               @twelvelabs-io/react tarball (GitHub Packages is SSO-gated)
```

## Deploy

Vercel: `vercel deploy` from the repo root. Set `TWELVELABS_API_KEY` in the
project env. `vercel.json` bundles `checks/` + `assets/` into the functions and
raises `maxDuration` for the async Timeline fallback path.

## Gotchas we teach on purpose

- `prompt` is **not allowed** with `analysis_mode: "time_based_metadata"` —
  instructions live in the segment/field `description`s (400 otherwise).
- Every segment field needs a `description`.
- `finish_reason: "length"` → truncated JSON; raise `max_tokens` or trim fields.
- Keep `temperature` ≈ 0.2 for QC consistency.
- Pegasus 1.5 takes `asset_id` / `video_url` directly — no index required.
