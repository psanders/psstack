# Platforms, covers and delivery

| Export | Language | Video | Notes |
| :--- | :--- | :--- | :--- |
| `ig` | spoken | HEVC Main10 **HLG** (HDR kept), AAC 256k | Reels; pick the cover in the app (or upload `cover_<lang>.jpg`) |
| `x` | spoken | H.264 SDR, ≤ 12 Mb/s, AAC 192k | same cut as IG; X's HDR handling is inconsistent, so SDR |
| `linkedin` | **en** | H.264 SDR, ≤ 10 Mb/s, AAC 160k, **cover baked into frame 0** | see below |
| `tiktok` | spoken | H.264 SDR, ≤ 15 Mb/s, AAC 192k | safe zones matter most here (right rail, bottom caption block) |

All exports: 1080×1920, 30 fps, 48 kHz stereo, `+faststart`, metadata stripped.
`export.py` verifies each file (codec, tags, size, fps, duration vs master, faststart,
size limit, cover frame) and writes `out/exports.json`.

## Safe zones (1080×1920)

Keep text and faces out of: top 220 px (profile/title), bottom 400 px (caption, handle,
music), right 130 px (like/comment rail). QA checks against these numbers; the
motion-graphics layouts pad a little inside them (230 / 430 / 150 px).

## Covers and thumbnails

Render with the `Cover` composition. Write `reels/<slug>/cover_en.json` (paths are relative
to the reel folder):

```json
{"title": "Can you *audit* every collection your AI makes?",
 "chips": ["Recorded", "Transcribed", "Traceable"],
 "images": ["out/frames/f04.jpg", "out/frames/f10.jpg", "out/frames/f21.jpg"],
 "layout": "fan", "out": "out/cover_en.jpg"}
```
`python3 scripts/mg_render.py reels/<slug>/reel.json --cover reels/<slug>/cover_en.json`

- Title ≤ 9 words, one emphasized word, readable at thumbnail size.
- Grab candidate frames at full resolution from the SDR master (not the 540 px previews):
  `ffmpeg -ss T -i out/master_<lang>_sdr.mov -frames:v 1 -q:v 2 out/frames/fNN.jpg`, look at
  them, and keep speaker frames with **eyes open** and an expressive face plus 1–2
  graphics frames.
- No logo or "edited with" badges unless Pedro asks.
- 4:5 variant for feeds: `"width": 1080, "height": 1350`.

## LinkedIn specifics

- The web composer often fails silently when a custom thumbnail is added, and the
  thumbnail **can't be changed after posting**. The feed uses frame 0, so `export.py`
  bakes the cover into frame 0 (one frame, 1/30 s — invisible in playback). Post
  **without** a custom thumbnail.
- If uploads keep failing: try the mobile app, another browser, or wait for the preview
  to finish processing before posting. The file itself is verified, so it's rarely the cause.

## Delivery

- Post copy is `/ps:post`'s job (Pedro's voice, per-network shaping). Hand it the reel's
  goal, the key lines from the transcript and the platform list.
- **Never** publish, upload or share without Pedro's explicit OK for that specific post.
