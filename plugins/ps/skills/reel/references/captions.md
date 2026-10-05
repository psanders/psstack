# Captions

Burned-in, big, center-weighted, one short phrase at a time — most people watch muted.

## Style (defaults in reel.json `captions`)

| Key | Default | Notes |
| :--- | :--- | :--- |
| `font` | `Poppins ExtraBold` | from `$REEL_FONTS` |
| `size` | 76 | px on the 1080×1920 canvas |
| `y` | 965 | center of the caption; 965 = the split seam, clear of faces in both layouts |
| `max_chars` / `max_words` | 22 / 4 | per on-screen chunk |
| `accent` | brand accent | color for `*emphasis*` |
| `emphasis` | `{"es": [...]}` | phrases auto-wrapped in `*…*` by `captions.py build` |

Chunks pop in (108 % → 100 %), white text with black outline and soft shadow. Captions
hide automatically during `full` beats (set `"captions": true` on a beat to keep them).

## Workflow

1. `captions.py build` → `captions/<spoken>.json`: one line per phrase, word timings kept.
2. **Proofread** every line: names and brands (QCobro, not "Q Cobro"), accents
   (súper, auditoría), numbers, punctuation. Fix the transcript's mishearings using
   context — you know what the speaker meant.
3. Emphasis: 1–2 words per line max, the words that carry the idea.
4. **Translate** for each extra language: copy the file to `captions/<lang>.json`, rewrite
   each `text` naturally (not word-for-word), keep `start`/`end`, delete `words`. Keep the
   speaker's register — casual stays casual.
5. `captions.py ass` → `<lang>.ass` + `<lang>_mask.ass` (alpha pass; libass can't write alpha).

If you change a word's text but not the word count, word timings still apply; otherwise
chunks are timed proportionally to characters within the line.
