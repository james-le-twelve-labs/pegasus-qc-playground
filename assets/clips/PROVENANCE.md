# Clip provenance

Every clip in the gallery is a **real AI generation** — no visual editing, no
injected visual defects in post. The defects you see are what the models
actually produced, or (clip 1 only, disclosed below) the result of a real
creator workflow reproduced end-to-end. This file logs exactly how each clip
was made so anyone can verify or reproduce it.

An honest finding from making these: **modern models are better than we
expected.** Several first takes *passed* their QC checks — LTX 2.3's native
lip-sync passed twice, WAN 2.2 fulfilled the entire first product brief, and
LTX attributed dialogue correctly on two of three takes. Where a first take
passed, we re-rolled with a harder brief (never by editing the video). All
takes, including the ones that beat us, are logged below.

## Final clip set (2026-07-06)

| # | Clip id | How it was made | Why it fails its check |
|---|---------|-----------------|------------------------|
| 1 | `talking-head` | `fal-ai/wan/v2.2-a14b/text-to-video/turbo`, seed 1102 (silent, lips closed) **+ macOS `say -v Samantha` voiceover muxed over it** (ffmpeg, +400ms delay) | Reproduces the most common real-world lip-sync failure: TTS narration laid over footage of someone who is not speaking. The video itself is unedited; the audio track is the disclosed post-step. |
| 2 | `product-broll` | `fal-ai/wan/v2.2-a14b/text-to-video/turbo`, seed 2202, prompted with the FULL brief | Generator drift: laptop rendered closed (ordered open), one croissant (ordered two), no camera pan. ("SUMMIT" text rendered correctly — credit where due.) |
| 3 | `card-shuffle` | `fal-ai/wan/v2.2-a14b/text-to-video/turbo`, seed 3301 (take A of 2) | Warping/malformed hands during rapid card shuffle — classic fast-finger-motion failure. |
| 4 | `dialogue` | `fal-ai/ltx-2.3/text-to-video/fast` (audio on), take 1 of 2 | The brief ordered the WOMAN to say the line; LTX gave it to the bearded man. Real attribution error, unedited. |
| 5 | `beach-dog` | `fal-ai/veo3.1/fast`, seed 5501 (audio on) | It doesn't — deliberately well-prompted on a strong model; the clean PASS + content-log example. |

Settings common to all: 16:9. WAN at 720p / video_quality=high /
acceleration=regular; LTX at 1080p / 25fps / generate_audio=true; Veo at 720p /
generate_audio=true. QC runs: Pegasus 1.5, temperature 0.2.

## Exact generation prompts (= the briefs used in the checks)

1. **talking-head** (visual) — "A professional woman in a navy blazer sits for a corporate interview in a bright modern office, medium close-up, facing slightly off-camera, lips closed in a calm confident smile, listening and nodding slightly, static camera."
   Voiceover text — "Our new product launches this Friday, and we could not be more excited about it."
2. **product-broll** — "A red ceramic coffee mug with the word \"SUMMIT\" printed on it in white capital letters, steam rising from the coffee, on a rustic wooden desk next to an open silver laptop and a small white plate holding two croissants, camera slowly pans left to right, warm morning light through a window."
3. **card-shuffle** — "Close-up of a street magician's hands rapidly shuffling and fanning a deck of playing cards, fingers interleaving at high speed, cards riffling and flying between both hands, cafe interior background, shallow depth of field."
4. **dialogue** — "Two people sit across a kitchen table in daylight: a bearded man wearing a maroon vest, and a woman in a denim jacket. The woman in the denim jacket says: \"The shipment arrives tomorrow at nine.\" The bearded man nods and smiles. Static medium shot showing both characters."
5. **beach-dog** — "A golden retriever runs joyfully along a wide sandy beach at sunrise, kicking up sand, gentle waves rolling in on the right, cinematic side tracking shot, warm golden light, soft ambient ocean sounds."

## Full take log (including the takes that passed QC)

| Take | Fal request id | Outcome |
|---|---|---|
| talking-head LTX 2.3 fast (native audio) | `019f3a09-4d69…d688a` | **Passed** lip-sync — genuinely well synced. Discarded. |
| talking-head LTX walking + fast speech | `019f3a0f-c106…41e09` | **Passed** lip-sync. Discarded. |
| talking-head Seedance 2.0 mini | `019f3a0f-b34e…00779` | **Passed** lip-sync. Discarded. |
| talking-head WAN talking (silent) + TTS | `019f3a13-8bbb…96c3ea` | **Passed** lip-sync (generic mouth motion read as plausible). Discarded. |
| talking-head WAN lips-closed (silent) + TTS | `019f3a16-1797…dad42e` | **FAIL** — final clip 1. |
| product-broll WAN seed 2201 | `019f3a09-54fd…9f48f2` | **Passed** brief-match (mug/logo/steam/laptop all present). Discarded. |
| product-broll WAN seed 2202, harder brief | `019f3a0f-c945…4d8691` | **FAIL** (closed laptop, 1 croissant, no pan) — final clip 2. |
| card-shuffle WAN seed 3301 (take A) | `019f3a09-5c96…89b0e8` | **FAIL** (warping) — final clip 3. |
| card-shuffle WAN seed 3302 (take B) | `019f3a09-6420…188bdb` | Warping less legible. Discarded. |
| dialogue LTX take 1 (man speaks, as ordered) | `019f3a09-6a05…0e518` | **Passed** content-verification. Discarded. |
| dialogue LTX take 2 (woman ordered to speak) | `019f3a0f-cf98…d8942e` | **FAIL** (man speaks her line) — final clip 4. |
| dialogue LTX take 3 (same order) | `019f3a0f-d689…31e378` | Passed. Discarded. |
| beach-dog Veo 3.1 fast seed 5501 | `019f3a09-7d97…9c13cf` | Clean — final clip 5. |

## Check-engineering note (feeds the tutorial)

The first lip-sync segment definition passed even a **closed-mouth clip with
TTS over it** — Pegasus segmented the "speaking" window by audio and answered
the booleans without attending to the mouth. Rewriting the field descriptions
to force visual attention ("True ONLY if the mouth visibly opens and closes
while the words are heard…", plus an explicit `mouth_visibly_articulating`
field) made the same model catch it, while still passing genuinely-synced
clips. Lesson: **in segment mode, your field descriptions are the prompt.**
