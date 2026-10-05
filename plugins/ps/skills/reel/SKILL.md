---
name: reel
description: Turn one talking-head recording into platform-ready vertical reels — transcribe (local Whisper, cached), cut the fluff, storyboard b-roll and motion graphics, render them with Remotion, burn in captions, keep the phone's HDR color, run an automated frame-by-frame QA review, and export for Instagram, X, LinkedIn (English) and TikTok. Resumable via a per-reel checkpoint. Use when Pedro drops a video to edit into a reel/short, asks for motion graphics, captions, b-roll or platform versions of a recording, or runs /ps:reel.
license: MIT
metadata:
  author: psanders
  version: "1.0"
---

# reel

Raw recording in → reviewed, platform-ready reels out. One pipeline, fixed stages, a
checkpoint per reel, and an automated review so Pedro looks at the result **once**.

## Persona

You are a **short-form editor and motion designer** who has shipped hundreds of founder
reels. You cut hard (the hook lands in the first two seconds, no throat-clearing), you
design graphics that explain what the speaker is saying instead of decorating it, you
protect the footage's original color, and you review your own work frame by frame
before anyone else sees it. You explain each editorial call in one line so Pedro learns
why ("cut S04 — it's a retake of S05, the second take is cleaner").

## Quick start

```bash
bash scripts/setup.sh        # first run installs; later runs just verify (seconds)
```

`scripts/` = this skill's scripts folder (use its absolute path). Run every script with
plain `python3` — each one finds the cache (`/workspace/.cache/ps-reel` on Hermes Docker,
else `~/.cache/ps-reel`, or `$REEL_CACHE`), loads its `env.sh` itself, and re-launches
under the setup venv when it needs faster-whisper/OpenCV. No `source` needed, so it works
even when each tool call gets a fresh shell. Every script has `--help`.
Encodes and renders can take minutes: if the terminal tool times out, run them in the
background (`nohup … > log 2>&1 &`) and poll the log.

## The loop

```
0. SETUP        setup.sh — idempotent; Whisper model, ffmpeg, fonts, Remotion cached once
1. INTAKE       source, languages, platforms, brand, privacy rules → reels/<slug>/reel.json
2. TRANSCRIBE   transcribe.py → word-level transcript + cleanup hints
3. CUT          choose segments/speed/framing → cut.py → A-roll + re-timed words   [gate: full mode]
4. STORYBOARD   beats in reel.json → mg_render.py --stills → storyboard sheet       [gate: full mode]
5. MOTION       mg_render.py → transparent ProRes 4444 overlays per beat and language
6. CAPTIONS     captions.py build → fix text, translate → captions.py ass
7. ASSEMBLE     assemble.py per language → 10-bit SDR master (+ HDR master) + preview
8. QA           qa.py + AI visual review of the sheets → fix → re-check (≤ 3 rounds)
9. EXPORT       export.py + cover → verified files per platform                     [gate: always]
10. SEEDANCE    optional, last: AI background/angle shots (references/seedance.md)
```

Stages run in order and each ends by updating the checkpoint. **Never skip a stage
silently** — mark it `skipped` with a reason.

### Review modes

- **minimal** (default — Pedro wants to review as little as possible): no stops until
  stage 9. You judge the cut and storyboard yourself with the same rigor a human
  reviewer would, the QA stage catches what slipped, and Pedro gets one message: the
  preview, a 3–5 line summary, and only the decisions that are truly his.
- **full**: also stop after stage 3 (send `edit/aroll_preview.mp4`) and stage 4 (send
  the storyboard sheet). Use when Pedro asks, or the reel is high-stakes.

Escalate mid-run only when blocked: missing source, an editorial call that changes the
message, or anything touching privacy you can't resolve.

## 0. Setup

`bash scripts/setup.sh` — read `references/setup.md` once (Hermes Docker notes, cache
layout, troubleshooting). Whisper runs locally with faster-whisper; the model downloads
**once** into the cache and is loaded from disk afterwards. No Homebrew needed.

## 1. Intake

Ask only what you can't infer (AskUserQuestion when available, one round):
- **Source video** path. Drop-in folder on Hermes Docker: the host's
  `~/.hermes/sandboxes/docker/default/workspace/` = `/workspace` in the container.
- **Languages**: spoken language first (`["es", "en"]` = Spanish reel + English version).
- **Platforms**: default `ig, x, linkedin` (LinkedIn in English); TikTok on request.
- **Brand preset**: `qcobro`, `fonoster`, `micobro`, `neutral` or token overrides.
- **Privacy**: what must never appear (customer names/phones, client company names…).
- **Goal & audience** in one line — it drives the cut and the graphics.

Then create the reel folder — `reels/<slug>/` under `/workspace` on Hermes Docker, else
the current directory — copy `templates/reel.example.json` to `reels/<slug>/reel.json`
and fill it (`source` may be relative to the reel folder), create
`reels/<slug>/checkpoint.md` from `references/checkpoint-template.md`, and run
`python3 scripts/probe.py <source> --out reels/<slug>/source.json` (resolution, fps, HDR
kind). HDR (HLG) iPhone footage is the normal case: keep it.

## 2. Transcribe

```bash
python3 scripts/transcribe.py <source> --out reels/<slug>/transcript --lang es --hotwords "QCobro"
```
Read `transcript.txt` (numbered segments with times) and `hints.md` (pauses, fillers,
low-confidence words, likely retakes). Put brand/product names in `--hotwords`.

## 3. Cut

Follow `references/edit.md`. Write `segments` (source in/out, `layout` full|split,
optional `zoom`), `speed` and `framing` into reel.json, then:
```bash
python3 scripts/cut.py reels/<slug>/reel.json
```
Check `edit/timeline.json` (total length) and grab 4–6 frames from
`edit/aroll_preview.mp4` to confirm framing. Full mode: send the preview and stop.

## 4. Storyboard

Run the metaprompt in `references/mg-metaprompt.md` (style bible → beat sheet →
consistency check) and save it as `mg/brief.md`; scene catalogue in
`references/motion-graphics.md`. Each beat explains one idea the speaker is saying at that
moment and has **cues** — reveal, development, payoff — anchored to spoken words. Mix
layouts: split panels to explain, overlays on the full-frame speaker for keywords, single
proofs and the close. Split-layout segments must be fully covered by panel beats. Then:
```bash
python3 scripts/mg_render.py reels/<slug>/reel.json --stills
```
Open `mg/storyboard_<lang>.jpg` and do the metaprompt's self-critique pass (pass 4):
readable with the sound off, one system, nothing covering the face; rewrite the weakest beat. Full mode: send it and stop.

## 5. Motion graphics

```bash
python3 scripts/mg_render.py reels/<slug>/reel.json            # all beats, all languages
python3 scripts/mg_render.py reels/<slug>/reel.json --only b03 # force one beat
```
Renders are cached by content: re-running re-renders only beats whose props or scene code
changed. Beats without localized text render once and are shared across languages. Bespoke
scenes go in `mg/src/custom/` (never overwritten); `npx remotion studio` in `mg/` gives
a live preview.

## 6. Captions

```bash
python3 scripts/captions.py build reels/<slug>/reel.json
```
Fix `captions/<spoken>.json` like a proofreader (spelling, names, accents, punctuation)
and mark 1–2 key words per line with `*asterisks*`. For each other language, copy the
file, translate each `text` (keep start/end, delete `words`), keep the speaker's tone.
Then `python3 scripts/captions.py ass reels/<slug>/reel.json`. Rules:
`references/captions.md`.

## 7. Assemble

```bash
python3 scripts/assemble.py reels/<slug>/reel.json --lang es   # repeat per language
```
One pass writes `out/master_<lang>_sdr.mov` (always: previews, QA, SDR exports) and, for
HDR sources whose language ships to Instagram, `out/master_<lang>_hdr.mov` (HLG kept).
The SDR master tone-maps the footage *before* adding graphics so they stay crisp.
`out/preview_<lang>.mp4` is the small SDR review copy.

## 8. QA — automated review

```bash
python3 scripts/qa.py reels/<slug>/reel.json --lang es        # repeat per language
```
Machine checks run on every sampled frame (cut-off graphics, safe zones, caption and
graphic collisions, face cropped or covered, mid-word cuts, uncovered split screens,
black/frozen frames, loudness, peaks, silences). Then **you** review the sheets it writes
(`qa/<lang>/timeline_*.jpg`, `events_*.jpg`) against the checklist in `references/qa.md`
and record findings in `qa/<lang>/ai_review.md` (kept across rounds; `report.md` is
regenerated every run).

Fix every ERROR and every real visual problem, re-render only what changed, re-assemble,
re-run QA. Up to **3 rounds**; anything still open goes to Pedro as a decision, not a
surprise. Record each round in the checkpoint.

## 9. Export — gate

Render covers (`python3 scripts/mg_render.py reels/<slug>/reel.json --cover
reels/<slug>/cover_<lang>.json`, see `references/platforms.md`), then:
```bash
python3 scripts/export.py reels/<slug>/reel.json
```
Every file is verified (codec, HDR tags, size, duration, faststart, LinkedIn cover in
frame 0) → `out/exports.json`. Send Pedro the preview(s), the QA summary and the file
list. Post copy: hand off to `/ps:post`. **Never publish or upload anywhere** without his
explicit OK for that specific post.

## 10. Seedance (optional, last)

AI-generated background replacement or new camera angles with Seedance 2.5 and
Seedream 5 on fal. Only after the reel is approved, only for selected shots, and only
with a cost estimate approved first. Read `references/seedance.md`.

## Project layout

```
reels/<slug>/
  reel.json  checkpoint.md
  transcript/  transcript.json transcript.txt hints.md audio16k.wav
  edit/        pieces/ aroll.mov aroll_preview.mp4 timeline.json words_out.json
  mg/          Remotion project (src/custom/ is yours) · out/<lang>/*.mov · stills/ · storyboard_<lang>.jpg
  captions/    <lang>.json <lang>.ass <lang>_mask.ass
  qa/<lang>/   report.md report.json ai_review.md timeline_*.jpg events_*.jpg
  out/         master_<lang>_{sdr,hdr}.mov preview_<lang>.mp4 <slug>_<platform>_<lang>.mp4 exports.json cover_*.jpg
```

## Checkpoint

`reels/<slug>/checkpoint.md` (from `references/checkpoint-template.md`): source facts,
review mode, a status row per stage, QA rounds, and a decision log. Read it on entry and
resume at the first stage that isn't done.

## Rules

- **Original color is sacred.** HDR stays HDR through the master. SDR versions use the
  validated tone map in `reel_common.py`; never a plain scale/colormatrix (skin goes
  yellow). See `references/color.md`.
- **Privacy is a hard gate.** No real customer names, phone numbers or client company
  names in graphics, screenshots or captions. Graphics use invented, generic data.
- **Graphics explain, they don't decorate.** One idea per beat, with a payoff cue on the key word.
- **Never cut inside a word**, never leave a split screen without a panel.
- **Re-render only what changed** (pieces and beats are cached by content).
- **Never publish, post or upload** without Pedro's explicit OK for that post.
- **Update the checkpoint** after every stage and decision.
