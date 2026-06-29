# Network adaptation: LinkedIn vs Twitter/X

The pillars, voice, hooks, and strategy are identical across networks. The **container**
changes. Resolve `--network` first (default `linkedin`), then apply the rules below.

`--network` accepts: `linkedin` / `li` (default), `twitter` / `x`.

## What stays the same on every network

- The four pillars and which one a post belongs to.
- The hook patterns (from `hook-library.md`).
- One pillar, one close, one CTA per post.
- The em-dash ban.
- First-person, niche-locked, no fluff, no fabricated numbers.
- Italic-Unicode on the named entity in the hook (once).

## LinkedIn (default)

The rich format this skill was built around.

- **Length:** 700–1,500 chars typical. Very short hot takes (~150) and deep tactical posts (~1,800) both fine when warranted.
- **Glyphs:** full strength. `⟡ ↳ ↓ ⤵ ☑ ▶`, bold-Unicode headers for posts >600 chars.
- **Structure:** the full proven template (hook → `↓` → framing → bulleted body → opinion → single close).
- **Bullets:** obey the ≤40-char bullet-width rule (narrow column).
- **Links:** fine in the body. The `▶` CTA line carries the link.
- **Hashtags:** 0–2, real communities only.
- **Cadence:** the daily 2/2/2/1 weekly map applies. Ask which day before drafting.
- **"Threads":** LinkedIn has none. A multi-part technical piece becomes one long post with bold-Unicode headers, or a carousel-ready outline.
- **Newsletter:** once set up, attach via the profile "Featured / View my newsletter" so it shows above every post. That unlocks the question-only close as the default for Industry Takes and removes the need for a `▶ newsletter:` line in most bodies.

## Twitter/X

Tighter, faster, more native. The biggest mistakes are too many glyphs and a link in the
first tweet.

- **Length:**
  - If the idea fits in **≤ 280 chars**, ship a single tweet. Tightest possible.
  - Otherwise a **numbered thread**: `1/`, `2/`, … Tweet 1 is the hook and must stand alone (it's what gets reshared). Each subsequent tweet ≤ 280 and should also make sense if quoted alone.
  - Don't pad a thread. 3–7 tweets is plenty; if it wants to be 15, it's a LinkedIn post or a blog.
- **Glyphs: go light.** They render but read as spammy on X. Keep the hook and the line-break rhythm. Drop most `⟡ / ☑ / ↓` decoration and skip bold-Unicode headers. One italic-Unicode named entity in tweet 1 is still good. A plain `-` or `•` bullet beats `⟡` here.
- **Links suppress reach.** X down-ranks tweets with external links in the main tweet. Put any link in the **last tweet or the first reply**, never tweet 1. Tell Pedro in the delivery note where the link goes.
- **CTA:** render the `▶` CTA as plain text in the final tweet; drop the `▶` glyph if it crowds the 280 budget. "Reply 'in'" and "RT if useful" work natively as engagement CTAs.
- **Hashtags:** 0–1, only a real community tag (e.g. `#VoiceAI`). Most tweets: zero.
- **No carousels.** An Educational "carousel" becomes a thread.
- **Cadence:** the daily LinkedIn day-map does not apply. Infer the pillar from the prompt; only ask if genuinely ambiguous. For a week of X content, follow the same pillar *mix* (2 Build / 2 Industry / 2 Operator / 1 Educational) but format each as tweet/thread.
- **Self-check additions:** within length budget? Tweet 1 link-free and reshare-worthy on its own? Glyphs trimmed? Thread numbered?

## Quick cross-reference

| Dimension | LinkedIn | Twitter/X |
| :--- | :--- | :--- |
| Default length | 700–1,500 chars | ≤280, else 3–7-tweet thread |
| Glyph density | Full (`⟡ ↳ ⤵ ☑ ▶`, bold headers) | Light; hook + rhythm only |
| Bold-Unicode headers | Yes (posts >600) | No |
| Links | In body / `▶` line | Last tweet or reply, never tweet 1 |
| Hashtags | 0–2 | 0–1 |
| Long technical piece | One long post / carousel | Numbered thread |
| Day cadence | Daily 2/2/2/1 map (ask the day) | Infer pillar; same weekly mix |

## Delivering for each network

- **Single tweet or LinkedIn post:** one fenced code block.
- **Thread:** one fenced code block, each tweet numbered and separated by a `---` line, with a final note saying which tweet holds the link.
- Always note the network used and, if you defaulted to LinkedIn, say so.
