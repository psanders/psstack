# Voice & style guide

The full rulebook behind the "Voice signatures" section in `SKILL.md`, **calibrated to
Pedro's real posts** (researched 2026-06-29). When a draft feels off, it's usually breaking
one of these.

## The em-dash ban (hard rule)

**Generated posts contain zero em-dashes (`—`, U+2014).** It reads as AI-written and isn't
Pedro's current voice. (It's the long dash specifically, not the en-dash `–` or hyphen `-`.)

This is a real correction: many of Pedro's older posts used em-dashes and he wants them
gone going forward. Examples from his own feed to *stop* doing:
- "But it's still the heart of everything Voice**—**yes, including Voice AI."
- "You'll find an Asterisk pro**—**but never touched ARI."
- "Fast forward to today**—** We just finished testing interop…"
- "I needed to paint the picture for the team **—** fast."
- "PS **—** what's your idea-to-mock-to-code workflow…"

Rewrite each one:

| Instead of (em-dash) | Write |
| :--- | :--- |
| `the heart of everything Voice—yes, including Voice AI.` | `the heart of everything Voice, yes, including Voice AI.` (comma) |
| `an Asterisk pro—but never touched ARI.` | `an Asterisk pro, but never touched ARI.` (comma) |
| `paint the picture for the team — fast.` | `paint the picture for the team. Fast.` (period + new beat) |
| `We shipped one thing—barge-in.` | `We shipped one thing: barge-in.` (colon before the payoff) |
| `PS — what's your workflow?` | `PS: what's your workflow?` (colon) |

Default to the **period**: it matches Pedro's short-beat rhythm. A spaced hyphen ` - ` is
allowed but a period is almost always better. Scan every draft for `—` in the self-check.

## Unicode character set Pedro actually uses

Glyphs (structure, not decoration) — confirmed across his top posts:
- `⤵` and `↓` — pull the eye down past the hook (his most-used; nearly every post has one)
- `↳` — consequence / sub-step arrow
- `→` — inline "leads to" / link pointer
- `⟡` — parallel-item bullets (his default list bullet)
- `☑` — checklist / "here's the problem" + "here's the opportunity" section markers
- `▶` — final CTA marker

Italic Unicode (naming an entity on first mention, 1–2× per post). Pedro mixes a few styles:
- sans-serif italic: `𝘝𝘰𝘪𝘤𝘦 𝘈𝘐`, `𝘍𝘰𝘯𝘰𝘴𝘵𝘦𝘳`, `𝘙𝘰𝘶𝘵𝘳`, `𝘘𝘊𝘰𝘣𝘳𝘰`, `𝘱𝘴𝘴𝘵𝘢𝘤𝘬`, `𝘈𝘐`
- bold-italic for a flagship / emphasis: `𝙆𝘼𝙍𝙈𝘼`, `𝙌𝘾𝙤𝙗𝙧𝙤`, `𝙍𝙤𝙪𝙩𝙧 𝙃𝙖𝙣𝙙𝙗𝙤𝙤𝙠`
- serif-italic variant he also uses: `𝑲𝑨𝑹𝑴𝑨`, `𝑉𝑜𝑖𝑐𝑒 𝐴𝐼`, `𝐹𝑜𝑛𝑜𝑠𝑡𝑒𝑟 𝑣0.6`

Pick one style per post and stay consistent. Sans-serif italic is the safe default.

Bold Unicode (in-post headers, LinkedIn only, 1–3× in posts >600 chars):
- `𝗪𝗵𝗮𝘁 𝘆𝗼𝘂 𝗴𝗲𝘁:`, `𝐇𝐞𝐫𝐞'𝐬 𝐭𝐡𝐞 𝐜𝐨𝐧𝐜𝐥𝐮𝐬𝐢𝐨𝐧.`
- monospace-bold for command names: `/𝐩𝐬:𝐤𝐚𝐢𝐳𝐞𝐧`

Emoji — accents only, max ~2 per post, only when they carry meaning. Pedro's actual set:
`💰💰💰` ("make the money bag" sign-off), `🇩🇴` (Dominican Republic), `🚀` (launch),
`💡` (a take), `🤯` (something wild), `🌀` (full circle), `☎️` (calling), `😎`/`😆` (wink).

## Sentence rhythm

Short. Then shorter. Then a line that lands.

- Write in beats, not paragraphs. 1–2 sentences per line, separated by a line break.
- Occasionally a 3-line burst for punch ("Real calls. Real blockers. Real wins."), then back to single lines.
- White space is a feature on LinkedIn. Don't fear the line break.
- Read it out loud. If you run out of breath, split the line.

The shortest posts can be the strongest: *"VoIP engineer? Learn how to integrate Voice AI
with legacy systems. Make the money bag. 💰💰💰"* is three lines and pulled 104 reactions.

## The bullet-width rule (LinkedIn)

LinkedIn's feed column is narrow. A bullet over ~40 characters of content **wraps**, which
breaks the rhythm. Pedro's real bullets are tight:

```
⟡ SIP signaling
⟡ Bi-directional stream
⟡ Speech: STT + TTS
⟡ Latency? Handled
⟡ Open source, yours to run
```

Keep each bullet 3–7 words, ≤ ~40 characters. Tighten, don't wrap.

## The mobile line-width rule (LinkedIn) — no orphan wraps

The same narrow column that wraps bullets also wraps **prose lines**. Most of Pedro's
readers are on mobile, where a line runs ~30–35 characters before it wraps. A line that
runs just past that wraps a single word (or two) onto its own line. That dangling
"orphan" looks broken and kills the beat rhythm.

Apply this to **every line, not just bullets**:

- Keep each visual line ≤ ~35 characters so it renders on one mobile line, **or**
- If the thought is longer, split it into two balanced short lines at a natural pause
  (comma, conjunction, or clause boundary), so neither line leaves a 1–2 word orphan.
- Never end a line so the wrap leaves one or two words alone below it. Break earlier.

```
# Bad — wraps to a two-word orphan on mobile
And everywhere means scale most voice infra was never built to survive.

# Good — split at the clause boundary, both lines land
And everywhere means scale
most voice infra was never built to survive.
```

Read the draft as a tall, thin column. If any line looks like it will spill a fragment
onto the next line, break it yourself. White space is free; orphan words are not.

## Two voice registers

Pedro writes in two distinguishable registers. Match the register to the pillar.

**Industry-take voice** — sharp, opinionated, provocative. Takes a side. Short declaratives.
"I'll say it." Confident, not hedged. Real example: the KARMA "desperate need" post and
"99% of phone systems are stuck in 1999." Used for Industry Take and most Educational Tactical.

**Operator-journal voice** — warmer, first-person, scene-driven. Slower open. Lets a moment
breathe before the point. Vulnerable where it earns trust. Real example: *"Confession: I
suck at sales. So I retreat into building."* and the "How much would you sell Fonoster for?"
story. Used for Operator's Journal and the human side of Build-in-Public.

Both are still Pedro: concrete, niche, no fluff. The difference is temperature.

## Closes Pedro actually uses

- **Engagement question** (most Industry / Operator posts): *"What's the most boring vertical you'd point Voice AI at first?"*, *"Which layer broke first for you?"*, *"what do you build to avoid the thing you should be doing?"*, *"Is anyone working on this problem?"* Specific, answerable in 30 seconds.
- **`▶` link CTA** (Build / conversion posts): *"▶ See it live: https://qcobro.com"*, *"▶ I write about building voice without the legacy stack here: https://pedrosanders.me/"*, *"▶ Join our Discord."*
- **No close** when the story lands on its own (some Operator's Journal posts).
- One close per post. Never stack a `▶` line *and* a separate question.

## Anti-patterns (never write these)

- The em-dash (`—`). See above.
- Motivational filler: "believe in yourself", "the journey is the destination", "trust the process". Pedro's audience reads him for signal in voice AI.
- Marketing-speak: "synergy", "leverage" (verb), "unlock value", "best-in-class", "game-changer".
- Creator-guru framing: "high-ticket clients", "$100k month", "here's how I 10x'd…".
- Generic openers with no payoff: "Here's the truth", "The reality is" (unless immediately backed by a specific voice-AI fact).
- Hashtag spam (more than 1–2 real-community tags).
- More than ~2 emojis (the glyphs are the identity; emojis are accents).
- Third person about Pedro. Always first person.
- Two CTAs in one post.
- Fabricated metrics, customer names, or features. Use `[fill in]` and ask.
