# Clip provenance

Every clip in the gallery is a **real, unretouched AI generation** — no manual
editing, no injected defects in post. The defects you see are what the models
actually produced. This file logs exactly how each clip was made so anyone can
verify (or reproduce) the slop.

> **STATUS: generation pending.** The Fal.ai jobs below are finalized but
> blocked on account balance (2026-07-06). The `public/clips/*.mp4` files
> currently in the repo are ffmpeg-generated placeholders so the demo flow can
> be exercised — they are clearly labeled and will be replaced 1:1 by the
> generations below.

| # | Clip id | Fal.ai model | Duration | Seed | Injected-defect strategy |
|---|---------|--------------|----------|------|--------------------------|
| 1 | `talking-head` | `fal-ai/ltx-2.3/text-to-video/fast` (audio on) | 6s | n/a (model has no seed param) | Cheap audio-capable model; speech/mouth alignment is naturally imperfect → lip-sync drift |
| 2 | `product-broll` | `fal-ai/wan/v2.2-a14b/text-to-video/turbo` | ~5s | 2201 | Prompted with the FULL brief; budget model naturally drops elements (logo, steam, camera pan) |
| 3 | `card-shuffle` | `fal-ai/wan/v2.2-a14b/text-to-video/turbo` | ~5s | 3301 / 3302 (2 takes) | Rapid finger/card motion reliably induces warping + malformed anatomy |
| 4 | `dialogue` | `fal-ai/ltx-2.3/text-to-video/fast` (audio on) | 6s | n/a | Two characters + one scripted line; budget model commonly mis-attributes the speaker |
| 5 | `beach-dog` | `fal-ai/veo3.1/fast` (audio on) | 8s | 5501 | Deliberately well-prompted on a strong model → the clean PASS example |

## Exact generation prompts

1. **talking-head** — "A professional woman in a navy blazer sits for a corporate interview in a bright modern office, medium close-up, looking slightly off-camera. She speaks clearly: 'Our new product launches this Friday, and we could not be more excited about it.' Natural office ambience, static camera."
2. **product-broll** — "A red ceramic coffee mug with a white mountain logo printed on it, steam rising from the coffee, sitting on a rustic wooden desk next to an open silver laptop, camera slowly pans left to right, warm morning light through a window."
3. **card-shuffle** — "Close-up of a street magician's hands rapidly shuffling and fanning a deck of playing cards, fingers interleaving at high speed, cards riffling and flying between both hands, cafe interior background, shallow depth of field."
4. **dialogue** — "Two people sit across a kitchen table in daylight: a bearded man wearing a maroon vest, and a woman in a denim jacket. The bearded man says: 'The shipment arrives tomorrow at nine.' The woman nods and smiles. Static medium shot showing both characters."
5. **beach-dog** — "A golden retriever runs joyfully along a wide sandy beach at sunrise, kicking up sand, gentle waves rolling in on the right, cinematic side tracking shot, warm golden light, soft ambient ocean sounds."

Settings common to all: 16:9. WAN clips at 720p / video_quality=high /
acceleration=regular; LTX clips at 1080p / 25fps / generate_audio=true;
Veo at 720p / generate_audio=true.

After generation: record the delivered file URL, actual duration, and any
re-roll (new seed) here, then run `npm run upload-assets`.
