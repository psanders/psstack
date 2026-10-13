# QA — automated review

Goal: Pedro reviews **once**, at the end, and only sees judgment calls. Everything a
careful editor would catch on a frame-by-frame pass is caught here first.

## 1. Machine checks (`qa.py`)

Runs on every sampled frame (5 fps by default) using the components of the edit — the
A-roll, each graphic's alpha, the caption mask — so it knows *what* collides, not just
that something looks off.

| Check | Severity | What it means / usual fix |
| :--- | :--- | :--- |
| cut-off | ERROR | a graphic touches the frame or panel edge → less content, smaller type, or `full` |
| safe-zone | WARN | a graphic sits where IG/TikTok/LinkedIn UI will cover it (top 220, bottom 400, right 130 px) |
| collision captions × graphic | ERROR | move the overlay (`position`) or the caption `y`; give panels more bottom room |
| collision graphic × graphic | ERROR | two overlays on screen at once overlap → shift one |
| face covered | ERROR | a caption or graphic sits on the speaker's face → reposition |
| framing | WARN | top of the head or face edge cropped → lower zoom, adjust `cy`/`cx`/`zoom_anchor` |
| faces | WARN | no face found in most of a segment → framing drifted off the speaker |
| edit | WARN | a cut lands inside a word → move in/out to the suggested time |
| split | ERROR | split segment with nothing in the top half → extend a panel beat |
| picture | ERROR/WARN | black frames / frozen picture |
| audio | ERROR/WARN | true peak > −1 dBTP, loudness off target by > 1.5 LU, silences ≥ 0.8 s |
| captions | WARN | chunk shown < 0.35 s, reading speed > 25 chars/s |

A check is only as good as its detector — a WARN can be a false positive (e.g. the
speaker looking down). Confirm on the sheets before changing the edit.

## 2. AI visual review (you)

`qa.py` writes contact sheets to `qa/<lang>/`:
- `timeline_NN.jpg` — one frame per second, time-stamped.
- `events_NN.jpg` — each beat's in / middle / out, and the frames on both sides of every cut.

Open **every** sheet (Read the image) and check:

**Graphics**
- [ ] No text cut off by a card, panel or frame edge; no text overflowing its card
- [ ] Every word spelled right, in the right language (EN master has no Spanish left)
- [ ] Emphasis colors on the intended words only; consistent style across beats
- [ ] Readable at phone size; nothing smaller than ~28 px on the 1080 canvas
- [ ] Graphics match what is being said at that moment (event frames)
- [ ] No real customer names, phone numbers, emails or client company names anywhere

**Speaker & framing**
- [ ] Head not cropped, eyes in the upper third (full) / face centered in the bottom half (split)
- [ ] No caption or graphic over the mouth or eyes
- [ ] Cuts: no visible jump that looks like a glitch (same pose both sides of a cut is
      fine at a tight push-in; a jarring jump wants a zoom change or a graphic over it)

**Captions**
- [ ] In sync with speech (compare to `edit/words_out.json` at a few timestamps)
- [ ] No orphan one-word chunks except emphasis; line breaks at natural phrases

**Overall**
- [ ] First frame is a strong frame (eyes open, mid-sentence energy) — it's the default cover
- [ ] Color looks like the phone's original (no yellow/washed skin in the SDR preview)
- [ ] Ending doesn't cut off the last word or hang on dead air

Record findings in `qa/<lang>/ai_review.md` as `AI-1 … AI-n` under a `## Round N`
heading, each with time, problem, fix and status (open / fixed / accepted). `qa.py`
creates that file once and never overwrites it; `report.md` is regenerated every run.

## 3. Fix loop

1. Fix ERRORs and real AI findings (edit reel.json / captions / custom scenes).
2. Re-run only what changed: `cut.py` (cached pieces), `mg_render.py --only …`,
   `captions.py ass`, then `assemble.py` and `qa.py`.
3. Repeat up to **3 rounds**. Log each round in the checkpoint (errors → 0?).
4. What remains (taste calls, unfixable source issues) goes to Pedro in the final message
   as explicit decisions with your recommendation — never as a surprise.

## Final message to Pedro (stage 9)

- The preview(s) and export list.
- QA: "0 errors, 2 warnings (both false positives: looking down at 0:14)", AI review summary.
- Open decisions, each with a recommended option.
