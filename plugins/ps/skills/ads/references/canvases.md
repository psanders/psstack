# Canvases — sizes, safe zones, templates, export

Advantage+ placements (the default) show the same ad in Feed, Stories, Reels, Explore,
Marketplace, Messenger, WhatsApp Status and Audience Network. An asset designed only for Feed
gets cropped or covered everywhere else. This file is the geometry layer: what to design on,
what must stay clear, what the templates are called, and how to get files out of Pencil that
Meta will actually accept.

Copy limits, policy and the pre-publish checklist live in `guardrails.md`.

> **Verify before designing.** Meta changes UI overlays without notice. At the start of a
> `creative` run, call `ads_get_help_article` for current Stories/Reels safe-zone and
> aspect-ratio guidance. If it disagrees with the numbers below, use Meta's, tell Pedro this
> file needs an update, and never tune a single ad around the difference.

## Global rules

- **Design at 1440 px wide, export at 1×.** Meta's recommended sizes moved from 1080 to 1440;
  a 1440 asset also clears every 1080 minimum. (Older tracker records use 1080-era preset keys
  — see "Legacy preset keys" below.)
- **Safe zones are hard rules.** Text, logos, faces, product UI and the offer stay out of the
  unsafe bands. Background imagery may bleed into them.
- **One 9:16 asset delivers to every vertical placement**, so the vertical guide uses the
  strictest combination of Meta's numbers, not the most generous one.
- **Headline ≥ 80 px** at 1440 wide (≈ 60 px at 1080). Call-out ≥ 36 px.
- **One idea per frame.** The headline carries the angle; the proof shows it.
- **No fake UI:** no fake play buttons, notifications, close buttons or CTA buttons in the
  image. The platform draws the real CTA. A text pill is fine as long as it reads as a chip of
  type, not as a tappable button.

## Canvases

| Canvas key | Size | Covers | Unsafe bands (px at canvas size) | Content box `x, y, w, h` | Headline |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `vertical-9x16` | 1440 × 2560 | FB/IG Stories, FB/IG Reels, Messenger Stories, WhatsApp Status, IG Feed and Explore home video, AN video | top **358** (14%), bottom **896** (35%), sides **86** (6%). With an on-image disclaimer: bottom **1024** (40%) | 86, 358, 1268, 1306 | 124 |
| `feed-4x5` | 1440 × 1800 | FB Feed, IG Feed, IG Explore home, FB video feeds, lead-ad image | 86 on every edge (**heuristic** — Meta says keep bottom and sides clear but gives no number). Critical content between y **180–1620** so a 1:1 crop survives | 86, 180, 1268, 1440 | 116 |
| `square-1x1` | 1440 × 1440 | Marketplace, Search, Business Explore, Messenger inbox, AN native, carousel cards | 86 on every edge (**heuristic**) | 86, 86, 1268, 1268 | 104 |
| `landscape-191` | 1440 × 754 | FB Search, Business Explore, collection cover, IG profile feed video | 45 top/bottom, 86 sides (**heuristic**) | 86, 45, 1268, 664 (text left, proof right) | 76 |
| `widescreen-16x9` | 1920 × 1080 | FB in-stream video | 65 top, **216 bottom** (player controls), 115 sides (**heuristic**) | 115, 65, 1690, 799 (text left, proof right) | 96 |
| `thumb-1x1-notext` | 1440 × 1440 | FB right column, ads on FB Reels (overlay), in-stream image | **No on-image text at all** (renders too small to read) | subject only | — |

**Minimum set per ad concept: `feed-4x5` + `vertical-9x16`.** Meta picks the right one per
placement when both are supplied (placement asset customization). If only one asset is
possible, make it `feed-4x5` and keep all critical content inside the central 1:1 so the crop
survives.

**`square-1x1` alone is not Advantage+-complete.** It's a carousel-card and fallback canvas,
not a substitute for `feed-4x5`: a 1:1 asset loses real estate in feed placements that render
4:5, and Advantage+ crops or letterboxes it in slots designed for the taller ratio. If a
session has already built `square-1x1` + `vertical-9x16` (because that's what was asked for),
treat the set as incomplete and add `feed-4x5` before calling it placement-ready. Two formats
are not automatically "all placements". `landscape-191` and `widescreen-16x9` are rarely
needed — build them only for right-column/link placements, Audience Network classic, or FB
in-stream video.

### Legacy preset keys

Tracker records and asset files written before this file used the 1080-era keys `feed45`,
`square`, `story916`, `link191`, `video916`. `review` accepts them when reading old records —
map `feed45 → feed-4x5`, `square → square-1x1`, `story916 → vertical-9x16`,
`link191 → landscape-191`, `video916 → video-9x16`. New assets always use the canvas keys
above. Don't rename files that are already joined to a tracker record.

## Templates

Templates live in the brand's ads `.pen` file (see "Building in Pencil"). A starter file with
sections `00 read-me`, `01 Guide/*` (safe-zone components), `02 tpl/*` (these templates) and
`03 sequences` ships with the brand repo that first builds it; new brands copy those sections
and re-point the `brand-*` variables. Never `Read`/`Grep` a `.pen` file — drive it through the
Pencil MCP.

Each template exists once per canvas, named `tpl/<template>__<canvas>`. Building an ad is a
copy + rename + fill job: duplicate the template, rename to `<ad_name>__<canvas>`, fill the
slots.

| Template | Background | When to use |
| :--- | :--- | :--- |
| `tpl/photo-overlay` | Full-bleed image, may bleed into the unsafe bands | A person or scene carries the idea |
| `tpl/bold-type` | Flat brand fill, or generated art with an empty text zone | Type carries the idea; no photo, no icons |
| `tpl/proof-card` | Brand fill with a proof panel | Product UI or offer facts carry the idea |

### Slots

Named layers inside the template's `content` group, top to bottom. A template uses the subset
it needs; delete what it doesn't.

| Slot | Purpose | Rule |
| :--- | :--- | :--- |
| `bg/image` | Full-bleed photo (`tpl/photo-overlay`) | May bleed into unsafe bands; faces may not |
| `bg/art` \| `bg/fill` | Generated art or flat brand fill (`tpl/bold-type`) | Art must leave an empty zone the size of the content box |
| `scrim` | Gradient over `bg/image` so type reads | `layoutPosition: "absolute"`; never covers a face |
| `slot/callout` | Self-selection line: who the ad is for | Names a business role, never a personal attribute (`guardrails.md` §2) |
| `slot/headline` | The one idea | ≤ 7 words, display face, per-canvas size above |
| `slot/sub` | Optional supporting fact | One line; delete it when space is tight |
| `slot/proof` | What makes the claim believable (`tpl/proof-card`) | Product UI, a real call, or offer facts; fills remaining height |
| `slot/pill` | Offer or category chip | Type in a chip, not a button (no fake UI) |
| `slot/wordmark` | Brand mark | Small, inside the content box, never the hero |
| `safe-zone-guide` | Instance of the `Guide/<canvas>` component | `layoutPosition: "absolute"`, visible while designing, `enabled:false` for export |

The guide layer sits **last in the content group, above everything**, so bands are visible over
photos while designing. It is the same component instance on every frame of a canvas, which is
what makes the scripted bounds check in `guardrails.md` §5 possible.

## Sequences

| Sequence | Card size | Where | Rules |
| :--- | :--- | :--- | :--- |
| `carousel-1x1` | 1440 × 1440 | FB Feed, Marketplace, Search, Business Explore, Messenger, AN | 2–10 cards. Each card must stand alone: Meta may reorder cards, show only card 1 (right column), or turn the set into a slideshow. Card 1 carries the call-out. |
| `carousel-4x5` | 1440 × 1800 | IG Feed | Images only. One video card forces the whole carousel to 1:1. |
| `carousel-9x16` | 1440 × 2560 | IG Stories, FB Reels (image tiles) | IG Stories auto-plays 1–3 cards, then "Expand"; video cards ≤ 15 s. FB Stories carousel: no video, 3–10 cards. |

## Video

Canvas `video-9x16`: same geometry as `vertical-9x16` plus a caption band. For a feed cut,
reuse the `feed-4x5` geometry.

| Rule | Value | Why |
| :--- | :--- | :--- |
| Length | **≤ 15 s** | FB/Messenger Stories split longer videos into cards; in-stream cuts at 15 s; in-stream Reels ads are 5–15 s |
| Hook | First 0–2 s | Most placements autoplay muted in a scrolling feed |
| Beats | 0–2 s hook · 2–12 s proof · 12–15 s offer | One storyboard frame per beat |
| Captions | **Burned in**, ≤ 2 lines, inside the content box, above the 35% line (`slot/captions`, y 1450–1640) | Muted autoplay; Audience Network doesn't support caption files |
| Encoding | MP4, H.264, square pixels, fixed frame rate, progressive, AAC stereo ≥ 128 kbps, no edit lists or special boxes | Every video placement |
| Music | No licensed music on IG Reels; original or Meta Sound Collection audio only | IG Reels ad rule |
| Effects | No face or camera effects, no GIFs, no product tags on IG Reels | IG Reels ad rule |
| Primary text | Write for **40** characters visible | Reels truncate hardest |

## Building in Pencil

- **Open the target `.pen` in Pen.app before touching it.** `execute` silently targets whatever
  file the app has open when the `filePath` isn't open, which quietly writes into the wrong
  file — including out of a worktree and into a main checkout. Confirm with `get_app_state`
  first, and check the file's mtime before committing.
- `read_skill` (and the `execute` doc it references) before the first call — don't assume
  function names.
- **Verify bounds by script, not by eye.** `Get(frame, (n, c) => …)` the bounds of every text,
  icon and pill node and compare them to the canvas rule. Screenshots of freshly-built content
  can come back stale or blank; a bounds dump can't.
- **Generated art beats icons.** Emoji export as outlines and thin line icons are too weak to
  stop a scroll. For an icon-led ad, generate 3D art as the background with an empty zone where
  the text goes (`Generate(nodeId, "ai", "<prompt>")`, prompt rules in `guardrails.md` §6).
- Any `ai` generation makes the asset AI-generated — record it for the disclosure question
  (`guardrails.md` §3). Stock photos are not AI.
- **Palette is brand tokens only.** Use the brand's `.pen` variables for every fill, and name
  the same colors inside generated-art prompts. Off-palette color is a defect, not a choice
  (`guardrails.md` §6).

## Export

0. **Export in a separate `execute` call from the one that built or edited the frame.**
   Exporting in the same call can capture a half-rendered frame: missing component instances,
   or faded text.
1. In each frame to export, set `safe-zone-guide` → `enabled:false`.
2. `Export([frameIds], "png", "<abs dir>", {scale: 1})`. **`scale: 1` is mandatory** — the
   default is 2× and would produce a 2880-wide file.
3. Files land as `<nodeId>.png`. Rename to `<ad_name>__<canvas>.png`.
4. **Convert to JPEG before uploading.** Meta rejects Pencil's 8-bit RGBA PNG with "Invalid
   image format". `sips -s format jpeg -s formatOptions 92 in.png --out out.jpg` — no alpha,
   and ~0.3–0.6 MB instead of 2–5 MB. The JPEG is the file that gets uploaded and stored in the
   tracker.
5. Verify with `sips -g pixelWidth -g pixelHeight`: it must match the canvas size exactly.
6. Export a second copy **with the guide still visible**, into a scratch directory, for the
   visual half of the safe-zone check (`guardrails.md` §5). Don't upload that copy.
7. Re-enable the guides.
8. Read every exported image and run the checklist in `guardrails.md` §5.
