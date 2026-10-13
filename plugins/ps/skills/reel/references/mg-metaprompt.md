# Motion-graphics metaprompt

Use this before writing any beat. It turns "add some graphics" into a repeatable design
process, so every reel gets the same quality and its graphics feel like one system.
Work through the four passes **in writing** (save them as `reels/<slug>/mg/brief.md`);
only then write the `beats` in reel.json.

---

## Pass 1: Style bible (once per reel, ~10 lines)

Answer:
1. **Brand tokens**: preset (`qcobro`…) and any overrides. One accent and one second
   accent at most.
2. **World**: what product surfaces the graphics borrow from (message logs, chat
   transcripts, call recordings, dashboards…). Graphics should look like *the product
   working*, not like slides.
3. **Recurring objects**: 3–5 objects that come back across beats (e.g. the message card,
   the status pill, the check stamp). Reuse beats consistency.
4. **Motion verbs**: the 3–4 moves this reel uses (pop-in, draw-a-line, flip-state,
   slow push-in). No other moves.
5. **Layout rhythm**: which stretches are split-panel, which use overlays on the full
   speaker, which (if any) get a full-screen cutaway.

## Pass 2: Beat sheet (one row per idea)

For each idea in the transcript:

| Field | Question |
| :--- | :--- |
| **Line** | the exact words being said (with their times from `words_out.json`) |
| **Idea** | the one thing the viewer must understand, in ≤ 8 words |
| **Metaphor** | what *happens on screen* that shows it (a message flies and gets saved; wires converge into evidence; a status flips to failed) |
| **Scene** | the stock scene that fits (table in motion-graphics.md) or `custom:<Name>` |
| **Layout** | `panel` (explaining, speaker still visible) · `overlay` (short emphasis over the speaker — card or pill, never covering the face) · `full` (≤ 3 s cutaway) |
| **Cues** | 2–4 moments tied to words: reveal → development → payoff (e.g. `converge` on "independientemente", `stamp` on "evidencia") |
| **Copy** | every on-screen string, in every language, ≤ 7 words per label |

Rules of thumb:
- **Every beat has a payoff cue** landing on the key word, not just an entrance.
  An entrance alone is decoration.
- **Use overlays** for the hook keyword, a single number, a one-line proof, and the close.
  Use a floating `recording`/`records`/`sent` stage as an overlay (`layout: "overlay"`,
  `position`, `props.scale` ~0.75–0.85) when the speaker should stay full-frame.
- Back-to-back panel beats share one panel (`exit: false` / `enter: false`).
- Invented but believable data; never real customer names, phones or client companies.

## Pass 3: Consistency check (before rendering)

Read the beat sheet top to bottom and fix anything that fails:
- Same object always looks the same (same card, same icon, same color for "ok"/"fail").
- Accent color means one thing (success/emphasis); the second accent means the AI/second actor.
- No two beats tell the same idea with different visuals.
- Cues follow the speech order; nothing lands before its word.
- Overlays alternate sides/positions sensibly and stay out of the face.
- Total on-screen text is readable at phone size in the time given (≥ 1.2 s settled per label).

## Pass 4: Self-critique after stills (`mg_render.py --stills`)

Look at the storyboard sheet as a viewer who has never seen the product:
1. Can I tell what each frame is saying with the sound off?
2. Does each graphic feel like the same product/brand as the others?
3. Is anything cut off, cramped, or competing with the captions or the face?
4. Which beat is the weakest? Rewrite its metaphor, not just its copy.

Record the answers and the changes in `mg/brief.md`, then render the full beats.
