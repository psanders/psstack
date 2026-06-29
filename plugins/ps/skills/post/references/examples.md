# Annotated examples

The curated, human-readable view of Pedro's standout posts. The **source of truth is the
data store**: `../../../../data/social/posts.jsonl`, records with `exemplar: true`.
`/ps:post-pulse` keeps it current. This file was rebuilt from a real profile pull on
**2026-06-29** (impressions = trailing-365-day; reactions/comments = lifetime).

The store holds **~36 real posts across all four pillars** (LinkedIn). The `★` posts below
are the curated, annotated standouts; the rest of the `exemplar: true` records in
`posts.jsonl` are the broader **voice corpus** — all good examples of how Pedro writes, at a
range of reach. Read several in the target pillar before drafting, not just the `★` one.

When drafting: find the example whose **pillar** matches yours, mirror its scaffold (hook
type, header count, bullet density, close). Borrow the architecture, not the words. Note that
stored bodies are em-dash-free on purpose (see `data/social/README.md`) — never reintroduce
`—` when mirroring.

---

## Industry Take ★ — "The Voice AI industry is in desperate need of 𝙆𝘼𝙍𝙈𝘼."

- **Record:** `ln-2025-10-29-karma-desperate-need` · **6,285 impressions, 118 reactions, 39 comments** (top Industry Take).
- **Hook:** `industry-frustration`, bold-italic Unicode on `𝙆𝘼𝙍𝙈𝘼`.

**Why it worked:** the hook names a gap *and* an answer in one line. It takes a real side
(the industry is *missing* something), then backs it with a named `⟡` stack list and a
specific labor-market argument ("Kamailio? You basically need to be an alien"). Closed on an
authority CTA, not a hard sell.

**Scaffold to mirror:** industry-frustration hook + `↓` → 2–4 lines of framing → `⟡` list of
what's missing → `☑` problem / `☑` opportunity turn → one opinion paragraph → single close.

> Companion Industry Takes in the store: `smallest-voice-ai-company` (6,209, contrarian-flex),
> `nobody-knows-voice-ai` (5,088, contrarian-reframe), `99-percent-1999` (stat-shock),
> `duct-taping-karma` (confession-contrarian).

## Operator's Journal ★ — "True story… 'How much would you sell 𝘍𝘰𝘯𝘰𝘴𝘵𝘦𝘳 for?'"

- **Record:** `ln-2025-09-29-sell-fonoster-for` · **7,971 impressions, 71 reactions, 11 comments.** (Confirmed canonical URL.)
- **Hook:** `true-story-dialogue`.

**Why it worked:** opens on a real exchange and builds, beat by beat, to a single landed
line ("100 Million USD." / "He laughed. Nervously."). No CTA at all — the story is the
payload. This is the warm operator-journal register at its best.

**Scaffold to mirror:** "True story / someone asked me" open → short dialogue beats → a pause
→ the line that lands → optional one-line button. No bullet list, no `▶`.

> Companion Operator's Journal posts: `outlast-new-adventure` (8,817, his highest-reach;
> use only as a structural template for the "new adventure" announcement format),
> `on-the-road-dr` (5,403, operator-on-the-road), `suck-at-sales` (the best
> confession-voice template).

## Build-in-Public ★ — "𝘍𝘰𝘯𝘰𝘴𝘵𝘦𝘳 made it to the GitHub Trending. 🚀"

- **Record:** `ln-2025-09-29-fonoster-github-trending` · **4,160 impressions, 100 reactions, 7 comments.** (Body needs backfill on next pulse.)
- **Hook:** `milestone-trending`.

**Why it worked:** a clean, concrete milestone with a single celebratory emoji, named entity
in italic Unicode. Build-in-Public posts convert on specificity, not adjectives.

**Scaffold to mirror:** milestone hook + `⤵` → why it matters (1–2 lines) → optional `⟡` list
of what shipped → `▶` GitHub / Discord / qcobro.com CTA.

> Current Build-in-Public exemplar: `qcobro-v010-bet` (2,210) — the "boring vertical" QCobro
> launch, the most on-strategy recent post (Voice AI collections, DR, ship milestone, question close).

## Educational Tactical ★ — "What's the difference between 𝘍𝘰𝘯𝘰𝘴𝘵𝘦𝘳 and Vapi, Bland, Retell?"

- **Record:** `ln-2025-08-29-fonoster-vs-vapi-bland-retell` · **7,536 impressions, 88 reactions, 19 comments.** (Body needs backfill.)
- **Hook:** `comparison` ("someone asked me the difference between X and Y").

**Why it worked:** positions by contrast against the platforms the audience already knows.
Comparison + "someone asked me" framing invites the reader to weigh in (19 comments).

**Scaffold to mirror:** "someone asked me the difference" hook → honest contrast (where each
fits) → where Pedro's approach wins → save-this / repo close.

> Highest engagement-per-word Educational post: `voip-money-bag` — three lines, 104 reactions.
> Don't assume long = better.

---

## Twitter/X — _(awaiting first exemplar)_

No X data yet (LinkedIn-only research so far). When X posts accumulate, `/ps:post-pulse`
with `--network twitter` will seed them. Until then, apply `networks.md`: single tweet ≤280
or a numbered thread, light glyphs, link out of tweet 1.

---

### Promoting a new exemplar (for `/ps:post-pulse` and manual edits)

A post earns a spot here when it's `exemplar: true` in `posts.jsonl` (see the post-pulse
promotion bar). Add a short block: record id, performance, hook pattern, "why it worked", and
the scaffold to mirror. Keep ~1 sharp exemplar per pillar per network so this stays a
reference, not an archive. Several store records still need their **full body and canonical
URL back-filled** (marked in their `notes`) — the next pulse run that clicks through each
post should fill those in.
