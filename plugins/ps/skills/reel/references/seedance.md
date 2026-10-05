# Seedance stage (optional, planned)

Status: **guidance only — no script yet.** Run it last, after Pedro approved the reel, on
selected shots, with a cost estimate he approved.

Models on fal (key in `FAL_KEY`; declare it as a required env var for Hermes):
- **Seedance 2.5** — `bytedance/seedance-2.5/reference-to-video` (use `task: editing` to
  re-shoot an existing clip), `…/image-to-video`. Up to ~30 s per generation (input
  1.8–30.2 s), 480p or 720p, 9:16 supported, native audio and lip sync to the reference.
- **Seedream 5** (Pro / Lite) — stills: the reference image for a new set/background, or
  the first frame of a new angle.

## What it's good for

| Use | How |
| :--- | :--- |
| New camera angles of the same take (coverage) | reference-to-video, `task: editing`, the original clip as `@Video1`, one still of the speaker as the identity reference; prompt "same performance, same timing, new camera position …", lips locked to the original audio |
| New background / set | Seedream 5 still of the set → reference-to-video editing with that still as the environment reference |
| B-roll inserts (hands, office, screens) | Seedream still → image-to-video, 3–6 s, no speaker |

## Limits that shape the plan

- **Resolution**: 720p max → upscale to 1080×1920 before assembly; it will look softer
  than the phone footage. Prefer short shots and cutaways over replacing the whole reel.
- **Color**: output is SDR. In an HDR master it's mapped into HLG like graphics and will
  look flatter than the real footage next to it. Keep AI shots away from real shots of the
  same framing, or grade the real ones to match only in the SDR exports.
- **Identity**: the model re-renders the face. Check likeness and lip sync on every
  shot (event sheets); reject anything uncanny. Never use it to make Pedro say
  something he didn't say.
- **Cost**: roughly $0.22/s at 480p and $0.47/s at 720p (2026 pricing on fal) — a 40 s
  pass at 720p is ~$20 before retries. Always show the estimate and wait for a yes.
- **Length**: chunk longer A-roll into ≤ 30 s pieces at cut points; keep the same
  references and seed so chunks match.

## Workflow sketch

1. Pick shots in the storyboard (`"seedance": {"mode": "angle"|"background"|"broll", "prompt": …}` on a segment).
2. Estimate seconds × rate → Pedro approves.
3. Generate references (Seedream 5), then clips (Seedance 2.5); keep the original audio.
4. Upscale, conform to 30 fps, drop into `edit/pieces/` in place of the originals, re-run
   assemble → QA (identity and lip-sync checks added to the AI review).

Turning this into `scripts/seedance.py` is the next step once the core pipeline has run on
a few real reels.
