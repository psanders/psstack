# Cut, pacing and framing

The cut decides whether anyone watches past second two. Edit for the message, then for rhythm.

## What to remove

- **False starts and retakes** — keep the last complete take (it's usually the cleanest);
  `hints.md` lists likely pairs.
- **Throat-clearing intros** ("hola, bueno, hoy les quiero hablar de…") — open on the
  first sentence that carries the idea. The hook must land in the first 2 seconds.
- **Fillers** (eh, este, o sea, um, like, you know) when they sit at a phrase boundary.
  Leave them when cutting would break a word or the breath sounds unnatural.
- **Long pauses** — tighten to 0.15–0.25 s. Keep a slightly longer beat (0.3–0.4 s)
  before a key line; it lands harder.
- **Tangents** that don't serve the one-line goal from intake.

## How to place cuts

- Use word timestamps from `transcript.json`. Start a segment ~0.07 s before the first
  word and end it ~0.12 s after the last word (breath and consonant tails).
- **Never cut inside a word**: QA flags it, and it sounds like a glitch.
- Merge segments separated by ≤ 0.10 s — micro-cuts read as jitter.
- Each piece gets 12–15 ms audio fades automatically (no clicks).
- Target length: 30–45 s for founder reels unless Pedro asked otherwise.

## Speed

`speed` applies to the whole reel (a segment may override it). Talking heads read well at
**1.10–1.15×**; above 1.20× voices start to sound processed. 1.0× for slow, emotional
content.

## Framing (9:16 from any source)

`framing.full` / `framing.split` define the crop window as fractions of the source:
`cx`, `cy` (center) and `h` (height fraction). The crop keeps the output aspect.

- **full** — the speaker fills the frame (1080×1920). Eyes around 30–38 % from the top;
  leave room above the head.
- **split** — the speaker sits in the bottom half (1080×960); a motion-graphics panel
  takes the top half. Crop tighter (`h` ≈ 0.65–0.75) so the face reads at half size.
  Every split segment **must** be covered by panel beats — QA errors on a black top half.
- **zoom** `[z0, z1]` — a slow push-in across the segment (`[1.0, 1.06]`). Use it on the
  hook and the closing line; chain segments (`[1.0, 1.05]`, `[1.05, 1.1]`) for a
  continuous push. `zoom_anchor` `[x, y]` (default `[0.5, 0.35]`) picks the point the
  zoom favors; lower `y` if the head gets cropped.

### When to use which layout

| Moment | Layout |
| :--- | :--- |
| Hook (first 2–4 s), personal or emotional lines, the close | full (+ push-in) |
| Explaining a feature, a process, a list, numbers | split + panel graphics |
| One keyword or stat worth pausing on | full speaker + overlay card, or a full-screen beat |
| Long list (3+ items) | split + checklist/channels panel |

Alternate rhythm: full → split → full keeps attention; long unbroken split sections feel
like a slideshow.

## reel.json — segments

```json
"speed": 1.15,
"framing": {"full": {"cx": 0.46, "cy": 0.5, "h": 1.0},
            "split": {"cx": 0.48, "cy": 0.36, "h": 0.71, "position": "bottom"}},
"segments": [
  {"in": 0.11, "out": 2.32, "layout": "full", "zoom": [1.0, 1.05]},
  {"in": 20.34, "out": 26.42, "layout": "split"}
]
```

`cut.py` caches each piece by its exact spec, so changing one segment re-encodes only that piece.
