# Motion graphics

Rendered with Remotion from `templates/remotion` (copied into `reels/<slug>/mg/`). Each
**beat** in reel.json becomes one transparent ProRes 4444 clip laid over the A-roll.

## What separates polished from amateur

1. **One idea per beat.** A beat says one thing the speaker is saying *right now*. If you
   need two sentences to describe a beat, split it.
2. **Sync to the words.** Anchor `start` to the spoken word, 0.15–0.25 s *before* it
   (`{"word": "grabación", "offset": -0.2}`) so the graphic lands as the word does.
   Kinetic type is aligned word by word automatically.
3. **Big, short type.** Titles ≤ 7 words, card labels ≤ 3 words, never paragraphs. If it
   can't be read in under a second, it's too long.
4. **Motion with intent.** Everything enters with the house blur-up spring, settles, and
   holds still long enough to read (≥ 1.2 s settled). No constant wiggle.
5. **Continuity.** Back-to-back panel beats share one panel: set `"exit": false` on the
   earlier beat and `"enter": false` on the next, so only the content changes.
6. **Hierarchy and restraint.** One accent color for emphasis (`*word*`), the second
   accent only for a second actor (AI turns, a second series). Dark surfaces, generous padding.
7. **Sound.** Panel/full entrances get a soft whoosh and overlays a pop (procedural,
   mixed at −20 dB, `audio.sfx`). Set `"sfx": false` on a beat to silence it.
8. **Real-looking, invented data.** Product UIs look believable with realistic times,
   statuses and amounts, but **never real customer names, phone numbers or client
   companies**. Use generic names ("Cliente", "Customer") or none.

## Layouts

| Layout | Canvas | Use for |
| :--- | :--- | :--- |
| `panel` | opaque top half over a split segment, seam glow | explaining while the speaker stays visible (most beats) |
| `overlay` | transparent; card at `position` top/center/bottom | one keyword/stat/checklist over a full-frame speaker |
| `full` | opaque full screen, slow camera push | a 1–3 s cutaway (big stat, kinetic line). Captions hide automatically. |

Overlay placement: keep cards out of the face. With full framing the face is in the upper
half, so overlays usually go `bottom` (they stay above the platform UI). QA errors if a
graphic covers the face or a caption.

## Scenes (props)

Design every reel with `references/mg-metaprompt.md` first. Any string can be localized
(`{"es": "…", "en": "…"}`); `*asterisks*` = accent emphasis (works inside words: `*Q*Cobro`).

### Story scenes — choreographed, cue-driven (the default for explaining)

Small stories with named **cues** that land on spoken words. Drawn on a 1080×960 stage:
fills the top half in `panel`, floats over the speaker in `overlay` (`position`, `props.scale`),
centered in `full`.

| scene | props | cues |
| :--- | :--- | :--- |
| `evidence` | `title`, `channels: [{icon, label}]` (≤ 7), `result: {label, icon?}` | `converge` (wires draw into the card), `stamp` (check lands) |
| `sent` | `chip`, `preview`, `title`, `message`, `metaLeft`, `metaRight`, `saved?` | `send` (plane flies, record slides in), `highlight` (bubble pulse), `saved` |
| `chat` / `transcript` | `title`, `channel?`, `messages: [{from: human\|ai, name?, text, at?}]` (≤ 4) | `m1…mN` (each message), `human`, `ai` (light up turns), `push` (slow zoom) |
| `recording` | `title`, `meta`, `length` (s) | `play` (button press; waveform fills to the end of the beat) |
| `records` / `metadata` | `title`, `icon?`, `rows: [{icon, k, v, tone: ok\|fail\|info\|warn, flip?: {v, tone, icon}, change?: {v}}]`, `pulseRow?` | `row1…rowN` (skeleton → value), `flip`, `change`, `push`, `pulse` |
| `pill` | `text`, `icon?`, `y?`, `drift?`, `endcard?: {wordmark, tagline}` | `brand` (end card rises). Overlay keyword pill / closing card. |

### Building-block scenes

| scene | props |
| :--- | :--- |
| `kinetic` | `text` — words pop in as spoken (aligned to the transcript). Best in `full`. |
| `title` | `kicker?`, `title`, `subtitle?`, `align?` — glass card in `overlay` |
| `checklist` | `title?`, `items: [{label, sub?, at?, state?: ok\|fail}]` |
| `stat` | `value`, `from?`, `prefix?`, `suffix?`, `decimals?`, `label`, `sublabel?`, `ring?` |
| `channels` | `title?`, `items: [{icon, label, at?}]`, `highlight?`, `columns?` |
| `lowerthird` | `name`, `role?` |
| `cta` | `title`, `subtitle?`, `button?`, `url?` |
| `custom:<Name>` | your component in `mg/src/custom/` (copy a Story scene as the starting point) |

Icons: sms, whatsapp, chat, phone, mail, voice/voicemail, mic, bot/ai, user/human,
agent/headset, send, play, check, ok, fail, x, clock, duration, alert, route, file,
evidence, audit, shield.

## Beat fields

```json
{"id": "b04", "scene": "chat", "layout": "panel",
 "start": {"word": "conversacionales", "offset": -0.2}, "end": {"word": "grabación", "offset": -0.3},
 "enter": false, "exit": false, "sfx": "auto",
 "cues": {"human": {"word": "humano"}, "ai": {"word": "inteligencia"}, "push": {"rel": 3.5}},
 "props": {"title": {"es": "Transcripción · WhatsApp", "en": "Transcript · WhatsApp"}, "channel": "whatsapp",
           "messages": [{"from": "ai", "name": "QCobro", "text": {"es": "…", "en": "…"}}]}}
```

`cues` values: word anchors, absolute seconds, or `{"rel": s}` from the beat start.
`start`/`end` accept seconds on the output timeline or word anchors
(`{"word": "...", "nth": 2, "offset": -0.1, "edge": "start|end"}`); use `dur` for a fixed
length. Minimum useful beat: 1.8 s. `still_at` picks the storyboard frame.

## Custom scenes

When a stock scene can't show the idea (a flow diagram, a product-specific UI), write a
component in `mg/src/custom/` and register it in `mg/src/custom/index.ts`. Build it from
`../motion` (`useSpringAt`, `enter`, `between`, `staggerAt`) and `../ui` (`Card`, `Icon`,
`RichText`, `Kicker`) so it moves and looks like the rest. Rules: deterministic only
(`rand(seed)` / `noise2D`, never `Math.random()`), no network assets, sizes in px for a
1080×1920 canvas, everything animated from `useCurrentFrame()`.

Live preview: `cd reels/<slug>/mg && npx remotion studio` (pick the Beat composition and
paste a beat's props from `mg/jobs.json`).

## Rendering

- `mg_render.py --stills` renders one PNG per beat in seconds — use it for the storyboard.
- Full renders are ProRes 4444 with alpha, tagged BT.709. `assemble.py` maps them into
  HLG for HDR masters (graphics white at HLG reference white, not peak).
- Renders are cached by content: only beats whose props or scene code changed re-render.
- Typical speed: 3–6 frames/s per CPU core at 1080×1920. Set `--concurrency` to the core count.
