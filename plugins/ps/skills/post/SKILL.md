---
name: post
description: Draft social posts in Pedro Sanders' voice for LinkedIn or Twitter/X, aligned with his content strategy — Voice AI infra, Fonoster, KARMA training, and Voice AI consulting. Use this skill any time Pedro asks for a post, a draft, content for the week, a hook, a carousel/thread script, a "punch up" of a draft he wrote, repurposing content from a release/changelog/customer call/talk into a post, or whenever the work is content for his personal brand on social. Trigger even when he doesn't name a network — phrases like "write a post", "tweet this", "I want to share", "draft something about [Fonoster|KARMA|Voice AI|telecom]", or "turn this into content" should all invoke this skill. Network is chosen with --network linkedin|twitter (default linkedin). Do NOT use it for long-form essays, blog posts, newsletters longer than a paragraph, marketing copy for landing pages, or generic non-Pedro creator content. Runs /ps:post.
license: MIT
metadata:
  author: psanders
  version: "2.0"
---

# post

Draft social posts that sound like Pedro Sanders and convert attention into action — Fonoster signups, consulting/advisory inbound, and KARMA training waitlist signups. Works for **LinkedIn** (default) and **Twitter/X**, adapting format to the network while keeping the same voice and strategy.

## The North Star (read this first — it governs everything below)

Every post ladders up to Pedro's actual positioning — the words on his LinkedIn banner and tagline:

> **Building Fonoster and helping companies ship Voice AI without the legacy stack.**
>
> Rallying cry / short form: **Ship voice without the legacy stack.**

That positioning has a fixed structure. Hold it in your head while drafting:

- **Headline — Fonoster + Routr.** Open Voice AI infrastructure: the infra *beneath* the model, not the model. The way you ship voice *without* the legacy stack. This is what Pedro is known for and what the banner/tagline say.
- **Wedge — the legacy stack (KARMA).** KARMA (Kamailio, Asterisk, RTPEngine, Homer, ARI) **is** the legacy stack: the hard, duct-taped way voice has always been built. The contrarian angle is that you shouldn't have to hand-roll it anymore. (The KARMA training cohort serves the engineers still stuck running it — naming the pain is the wedge, Fonoster is the escape.)
- **Proof — QCobro.** It runs real collections calls in LATAM 🇩🇴. QCobro is *evidence the infra works*, never the headline on its own.

**Why this exists:** the four pillars below are **formats, not topics.** The *subject* is constant — open Voice AI infra — and only the *register* changes (build / take / story / teach). Without this rule the pillars drift into being four different topics, and the feed stops reading as one person with one thesis. A reader should be able to finish "Pedro is the guy who ___" the same way after any post.

**The one test every draft must pass** (it's also in the self-check):

> *Does this teach, argue, build, or recount something about **how voice gets built on open infrastructure**?*

If the honest answer is no — if the draft is really about procurement / Outlast AI, generic LLM-or-AGI hype not tied to voice, or psstack / Claude Code / kaizen / tooling meta — **it has drifted.** Reframe it through the voice-infra lens or don't post it. (The historical data is blunt on this: the on-niche infra + contrarian-founder posts hit 5–8k impressions; the off-niche tooling/meta posts died under 1k.)

## Input

- The prompt: a release note, a customer story, a hot take, a milestone, a half-finished draft, even a Slack rant.
- `--network linkedin|twitter` — which network to write for. **Default: `linkedin`.** Aliases: `x` = `twitter`, `li` = `linkedin`. This flag changes length, glyph density, threading, hashtag norms, and where the link goes. See "Network adaptation" below and `references/networks.md`.

## When you're invoked

Pedro is the founder of **Fonoster** (open-source Voice AI infra). He sells three things: (1) Fonoster to developers, voice AI builders, and CTOs; (2) Voice AI consulting / advisory engagements to founders, CTOs, and contact-center / CCaaS leaders; (3) KARMA training (cohort course on Kamailio + Asterisk + RTPEngine + Homer + ARI) to voice engineers. His audience is voice/telephony pros, voice AI builders, founders/CTOs, and operators evaluating voice agents in real environments — the same audience on both LinkedIn and X.

Your job is to take a prompt and turn it into a post that:

1. Belongs to one of four content pillars (described below).
2. Sounds like Pedro (voice signatures described below).
3. Is shaped for the target network (`--network`).
4. Ends with exactly one CTA that matches the pillar.
5. Includes an engagement question that baits comments naturally.

## Network adaptation (read the flag first)

Pick the network from `--network` (default `linkedin`). The pillars, voice, and strategy are identical across networks; the **container** changes. Full rules in `references/networks.md`. The essentials:

- **LinkedIn** (default): the rich format this skill was built around. 700–1,500 chars typical, Unicode glyphs/bold/italic as voice signatures, line-break rhythm, single long post or carousel-ready. Links are fine in the body.
- **Twitter/X**: tighter and more native.
  - Single tweet ≤ 280 chars when the idea fits; otherwise a **numbered thread** (`1/`, `2/`, …) with the hook as tweet 1.
  - **Go lighter on Unicode glyphs** — they render but read as spammy on X. Keep the hook and the rhythm; drop most `⟡`/`☑`/bold-header decoration. One italic-Unicode named entity in the hook is still fine.
  - **Links suppress reach** on X — put any link in the **last tweet or a reply**, not tweet 1.
  - No carousels on X; an Educational "carousel" becomes a thread.
  - Hashtags: 0–1, only a real community tag.

When `--network` is absent, default to LinkedIn but say so in your delivery note so Pedro can redirect.

## Never use the em-dash

**Generated posts must contain zero em-dashes (`—`, U+2014).** This is a standing rule for Pedro's content. The em-dash reads as AI-written and isn't his voice. Instead:

- Prefer a **period** and a new short line (this matches his beat rhythm).
- Or a **colon** when introducing a list or payoff.
- Or a **comma**, or **parentheses** for an aside.
- A spaced hyphen ` - ` is acceptable but use sparingly; the period is almost always better.

This applies to the post body only, not to this skill's own documentation. Check it explicitly in the self-check (step 5).

## The four content pillars

**The pillars are formats, not topics.** They are four *registers* for talking about the **same** subject (open Voice AI infra — see The North Star). Build = *what we shipped*. Industry = *what I think*. Operator = *what happened to me*. Educational = *how to do it*. The subject never changes; only the voice does. If picking a pillar makes you reach for a different topic, you've misread the pillar.

Every post belongs to exactly one pillar. The pillar determines hook, structure, and CTA.

1. **Build-in-Public — Fonoster & Voice AI infra.** Shipped features, architecture decisions, performance numbers, GitHub milestones, "we just fixed X" stories, beta program updates, demo videos. Buyer: developers, voice AI builders, CTOs. CTA: link to GitHub repo, Discord community, or Beta Program.

2. **Industry Take — opinions about Voice AI, telecom, and the open-source voice space.** Hot takes, contrarian predictions, "what nobody says out loud" framing, vertical-vs-horizontal arguments, what big platforms get wrong, hype-vs-reality. Buyer: operators, founders, technical buyers. CTA: newsletter signup, "DM me" for technical conversation, or follow-for-more.

3. **Operator's Journal — sales, founder, on-the-road, life-pivot stories.** Customer conversations (anonymized), what buyers said in the room, founder transitions, military-to-tech narrative, sales-trip insights, "I walked away from $4M VC". Buyer: humans (humanizes the founder; pre-sells consulting). CTA: "DM me" for consulting/advisory, discovery-call link, or newsletter. Picture the buyer cluster from `references/pillars.md` when writing.

4. **Educational Tactical — how-to, frameworks, methodology, named-stack explainers.** "How to start in Voice AI", "5 mistakes when building a voice agent", state-machine design, KARMA stack walkthroughs, VAD/EoT explainers. Buyer: voice/telecom engineers wanting to upskill. CTA: KARMA training waitlist, save-this-post, or repo link.

When in doubt, look at the prompt's center of gravity: is it about *what we shipped* (build-in-public), *what I think* (industry take), *what happened to me* (operator's journal), or *how to do X* (educational tactical)?

For deeper guidance, example prompts mapped to pillars, the buyer-cluster archetypes, and the Flexing Wednesday optional format, read `references/pillars.md`.

## Ask which day (LinkedIn cadence)

Pedro posts daily on LinkedIn on a fixed weekly cadence (see "Weekly cadence" below). Each day maps to a pillar. **For LinkedIn posts, before drafting, ask which day the post is for** — he may be drafting Friday's post on a Tuesday, so don't assume "today."

Phrase it naturally: *"Which day is this post for? (Mon Industry / Tue Build / Wed Operator / Thu Educational / Fri Build / Sat Industry / Sun Operator)"*

Skip the question when:
- The prompt explicitly names a day or pillar.
- Pedro is asking for a full week of posts (follow the cadence directly).
- The prompt is a "punch up" of an existing draft (the draft determines the pillar).
- **The network is Twitter/X** — the daily-cadence map is a LinkedIn construct. For X, infer the pillar from the prompt; only ask if it's genuinely ambiguous.

## Voice signatures (non-negotiable)

Pedro has a recognizable style. These are *not* decorative — they are the part readers identify as "his". Use them, **scaled to the network** (full strength on LinkedIn, lighter on X — see `references/networks.md`):

- **Glyphs over emoji for bullet lists.** Use `⟡` for parallel-item lists, `↳` for consequence/step arrows, `↓` and `⤵` to pull the eye down past the hook line, `☑` for checklists, `▶` for the final CTA marker. Use emoji sparingly and only when they carry meaning (🚀 launch, 🇺🇸 / 🇩🇴 geography, 💡 a take, ✋ a hand-raise post).
- **Italic Unicode for naming.** When introducing a product/concept/named entity for the first time, italicize it with Unicode: `𝘝𝘰𝘪𝘤𝘦 𝘈𝘐`, `𝘍𝘰𝘯𝘰𝘴𝘵𝘦𝘳`, `𝙆𝘼𝙍𝙈𝘼`. This is Pedro's tell. Don't overdo it — once or twice per post.
- **Bold Unicode for headers inside a post.** `𝗪𝗵𝗮𝘁 𝘁𝗼 𝗲𝘅𝗽𝗲𝗰𝘁?` style headers break up longer LinkedIn posts. Use 1–3 in posts over ~600 characters. (Skip on X.)
- **Sentence rhythm.** Short. Then shorter. Then a single line that lands. Pedro writes in beats, not paragraphs. 1–2 sentence "lines" separated by line breaks, occasionally a 3-line burst for punch.
- **Mobile line width (no orphan wraps).** Most readers are on mobile, where a line wraps at ~30–35 characters. Keep every line (not just bullets) short enough to render on one mobile line, or split it at a natural pause so the wrap never leaves a 1–2 word orphan below it. See the mobile line-width rule in the style guide.
- **No hashtag spam.** One or two relevant hashtags max on LinkedIn, only when they map to a real community (e.g. `#VoiceAI`). Most posts can have zero. On X, 0–1.

Read `references/voice-style-guide.md` for the full rulebook (Unicode character set, sentence-rhythm rules, the em-dash ban with rewrite examples, the bullet-width rule, the mobile line-width rule, the two voice registers, and an anti-pattern list).

## Post structure (the proven template)

Pedro's highest-engagement Industry Take (the KARMA hot take, 6,285 impressions and 39 comments, recorded in the data store as an exemplar) followed this structure. Treat it as the spine for any LinkedIn post; compress it for X (see `references/networks.md`):

1. **One-line hook.** A claim, frustration, prediction, or milestone. Italic Unicode on the named entity. Examples: *"The Voice AI industry is in desperate need of 𝙆𝘼𝙍𝙈𝘼."*, *"𝘍𝘰𝘯𝘰𝘴𝘵𝘦𝘳 made it to GitHub Trending."*
2. **A line break, then `↓` or `⤵`** to pull the eye into the body. (LinkedIn only.)
3. **Plain-language framing** — 2–4 sentences on why the topic matters now or what's at stake.
4. **A clean bulleted body** — usually 3–5 items using `⟡` or `☑`. This is where the substance lives. Each bullet is 3–7 words and ≤ ~40 characters of content so it renders on a single line in LinkedIn's narrow column. Wrapping bullets break the rhythm — see `references/voice-style-guide.md` for the bullet-width rule.
5. **A real opinion, not a summary.** One short paragraph (2–4 lines) where Pedro takes a side, names what he's doing about it, or states what he believes. This is the difference between a thought leader and a recap.
6. **A single close.** Most drafts get this wrong. Every post has *one* close — either a `▶` link CTA *or* an engagement question, almost never both. Two asks dilute each other.
   - **`▶` link CTA** when the post has a specific destination worth driving to. Use when the purpose is conversion. (On X, the link goes in the last tweet / a reply, not the hook.)
   - **Engagement question** when the purpose is reach and authority — most Industry Takes and Operator's Journal posts. Ends with `?`, specific enough to answer in 30 seconds without research. Avoid yes/no; favor "what would you add?", "what broke first when you tried X?".
   - **Both, but only as one integrated line** for explicit launch / time-limited promo posts. E.g. *"▶ I'm running a free masterclass on KARMA next Saturday. Reply 'in' to grab a seat."*

   Default close by pillar (override when the post calls for it):
   - Industry Take → engagement question
   - Build-in-Public → `▶` link CTA
   - Operator's Journal → engagement question (or no close if the story lands on its own)
   - Educational Tactical → either, depending on teach ("what did I miss?") vs sell ("join the waitlist")

LinkedIn posts shorter than ~350 chars can collapse steps 3–5 into one line. Posts over ~1,200 chars should add 1–2 bold Unicode headers. Keep typical LinkedIn length 700–1,500 chars. On X, see the length rules in `references/networks.md`.

## Weekly cadence — LinkedIn (2 Build / 2 Industry / 2 Operator / 1 Educational)

| Day | Pillar | Default CTA |
|---|---|---|
| Mon | Industry Take | Engagement question (or newsletter once Featured) |
| Tue | Build-in-Public | GitHub / Discord |
| Wed | Operator's Journal | DM-me / advisory |
| Thu | Educational Tactical | KARMA waitlist |
| Fri | Build-in-Public | Repo / discussion |
| Sat | Industry Take | Engagement question (or newsletter) |
| Sun | Operator's Journal | Engagement question (or no close) |

When Pedro asks for "a week of posts", produce 7 drafts following this mix unless he says otherwise. Vary hook patterns; don't repeat the same one twice in a week. Full cadence detail (including the optional Flexing Wednesday slot) lives in `references/pillars.md`. The cadence is LinkedIn-specific; for a week of X content, follow the same pillar *mix* but format each as a tweet/thread.

## CTA mapping (one CTA per post — never two)

Mismatched CTAs are why most posts don't convert. Match the CTA to the pillar:

| Pillar | Default CTA | Backup CTA |
|---|---|---|
| Build-in-Public | `▶ Get started with Fonoster: [link]`, `▶ Join our Discord: [link]`, or `▶ See it live: https://qcobro.com` | `▶ Like and re-share if this is relevant to your network.` |
| Industry Take | `▶ I write about building voice without the legacy stack here: https://pedrosanders.me/` | `▶ DMs are open if you want to talk shop.` |
| Operator's Journal | `▶ If you're building Voice AI in [vertical] and want a second pair of eyes, my DMs are open. I take on a few advisory engagements each quarter.` | `▶ If you're hiring or building in voice, my DMs are open.` |
| Educational Tactical | `▶ I'm packaging this into a course (KARMA training). Comment "in" or join the waitlist: [link]` | `▶ Save this for later. And tell me, did I miss anything?` |

If the user supplies their own CTA, use it. Otherwise pick from the table. **On X**, render the `▶` CTA as plain text in the final tweet (drop the glyph if it crowds the 280 budget) and keep the link out of tweet 1.

### Monetization order (which paid offer to lean on)

When a post needs the weekly paid-offer mention, prioritize (matches revenue-per-hour):

1. **Voice AI consulting / advisory** — Operator's Journal posts default-lean here.
2. **KARMA training cohort** — Educational Tactical posts default-lean here.
3. **Fonoster paid tier (Cloud beta / enterprise support)** — Build-in-Public posts lean here when an update warrants.
4. **Newsletter sponsorships** — compounding asset; Industry Takes route to the newsletter signup itself (free, not a paid offer yet).

## The four monetization-aware rules (always baked in)

Not optional polish — they shape what gets drafted.

1. **Mention a paid offer at least once a week.** The Friday or Saturday post should explicitly name a paid offer in its CTA.
2. **One post per week is a hyper-specific lead magnet.** The Thursday Educational Tactical slot is the natural home — a tight checklist or framework that's save-worthy on its own.
3. **Every other post carries an instantly applicable tip.** Even Industry Takes and Operator's Journal posts should leave the reader with one specific thing to do tomorrow.
4. **Every post connects to the niche.** No drift. The niche is Voice AI infra + the operators who build it. If a draft could be written by any LinkedIn founder, rewrite until it could only have been written by Pedro.

## Hook library

Pedro's hooks fall into a small number of named patterns. Pick one that matches the pillar, then customize. The full library — 50+ tested patterns, examples from Pedro's actual top posts, and anti-patterns — lives in `references/hook-library.md`. Read it when you need a hook and the prompt doesn't imply one.

The five highest-leverage patterns to memorize:

1. **industry-frustration** (Industry Take): *"The [industry] is in desperate need of [X]."* / *"I'll say what most people in [field] won't:"*
2. **build-milestone** (Build-in-Public): *"𝘍𝘰𝘯𝘰𝘴𝘵𝘦𝘳 just [verb]. ⤵"* / *"We just shipped [feature]. Here's why it matters."*
3. **operator-on-the-road** (Operator's Journal): *"I spent [N] [days/weeks] with [type of buyer] in [place]. Here's what I heard."*
4. **educational-roadmap** (Educational Tactical): *"How to [verb] in [field] as a [role]. [N] steps ⤵"*
5. **demand-validation** (cross-pillar, used sparingly): *"Raise your hand if [training/product] would help. I'm gauging demand."*

## Examples (from the data store) — always read before drafting

The **source of truth for examples is the performance data store** at
`data/social/posts.jsonl` (resolve it as `data/social/` at the root of the psstack repo;
see `data/social/README.md` for the path-resolution rule). It is kept fresh by
`/ps:post-pulse`, so the examples get better as real engagement comes in. `references/examples.md`
is a curated, annotated companion to it.

**This is a required step, not optional.** Before drafting any post:

1. Read `data/social/posts.jsonl` and select the `exemplar: true` records that match the
   target **pillar** (and prefer the same **network** you're drafting for). Each line is one
   post; see the schema in `data/social/schema.json`.
2. From those records, study the `text` (the real published body), the `hook_pattern`, the
   `cta`, and the `snapshots` (real impressions/comments) to see what actually performed.
   Mind each record's `notes` — some say "use only as a structural template" or flag a body
   that still needs back-filling.
3. Pick the closest exemplar and mirror its scaffold (hook type, header count, bullet
   density, close). Borrow the architecture, not the words. Then read the matching block in
   `references/examples.md` for the annotated "why it worked."

If `posts.jsonl` has no exemplar for the pillar/network yet, fall back to the proven
template in this file and `references/examples.md`, and tell Pedro the store is thin there
(a `/ps:post-pulse` run would fill it).

## Workflow when invoked

Follow this order. It keeps drafts on-strategy and minimizes back-and-forth.

1. **Resolve the network.** Read `--network` (default `linkedin`). Load the matching rules from `references/networks.md`. If you defaulted, note it in delivery.
2. **Ask which day the post is for** (LinkedIn only, unless the prompt is clear — see "Ask which day"). Map the day to its pillar via the cadence table.
3. **Identify the pillar.** Decide which of the four fits. If two fit equally, briefly state both options and ask before drafting.
4. **Load exemplars from the data store.** Read `data/social/posts.jsonl` and pull the `exemplar: true` records matching this pillar (and network) — see "Examples (from the data store)" above. Use the closest one as the scaffold for this draft.
5. **Pick the hook pattern.** From the prompt, pillar, and the exemplars you just loaded, choose a hook from `references/hook-library.md`. If the prompt implies a hook, honor it.
6. **Draft.** Follow the post structure, shaped for the network, mirroring the chosen exemplar's architecture. Use the voice signatures (scaled to network). Bake in any monetization-aware rules for this slot. **Write zero em-dashes.**
7. **Self-check before delivering.** Run this silently; fix anything that fails:
   - **North Star test: does it teach/argue/build/recount something about how voice gets built on open infrastructure?** If it's really about procurement, generic AI/AGI hype, or psstack/Claude-Code/tooling meta, it has drifted — reframe through the voice-infra lens or don't post it.
   - One pillar?
   - **One close — `▶` link CTA *or* engagement question, almost never both.**
   - **Zero em-dashes (`—`)?** Scan the draft; rewrite any (see "Never use the em-dash").
   - Italic Unicode on at least one named entity?
   - At least one `⟡`-style bulleted list on LinkedIn (unless intentionally short)? On X, glyphs trimmed appropriately?
   - **Every LinkedIn bullet ≤ ~40 characters** so it fits one line.
   - **Mobile check: read the draft as a narrow column. Does any line (not just bullets) wrap a 1–2 word orphan onto the next line?** If so, shorten it or split at a natural pause. Every line ≤ ~35 chars or deliberately broken.
   - For X: within length budget (single tweet ≤ 280, or a clean numbered thread), link out of tweet 1?
   - Would Pedro stop scrolling at the hook?
   - For this slot: does it satisfy any required rule (paid-offer mention if it's the weekly paid slot; lead magnet if Thursday; instantly-applicable tip)?
   - No motivational filler, no marketing-speak ("synergy", "leverage", "unlock value").
8. **Deliver in a fenced code block** so Pedro can copy-paste cleanly. For a thread, put each tweet in the block separated by a `---` line and numbered. Follow with a 1–2 sentence note: network used (and whether it was the default), the hook choice, which exemplar you mirrored, and any tradeoffs. For a weekly batch, label each draft with its day and pillar.

## Common Pedro requests and how to handle them

- *"Draft a post about [thing we shipped]"* → Resolve network; confirm the day (LinkedIn). Build-in-Public, milestone hook, Discord/GitHub CTA.
- *"Tweet this"* / *"--network twitter"* → X format. Infer pillar from the prompt; single tweet or thread; link out of tweet 1.
- *"Write a hot take about [Voice AI topic]"* → Industry Take, frustration/contrarian-prediction hook, newsletter CTA or engagement question.
- *"Turn this customer call into a post"* → Operator's Journal, on-the-road / "what I heard" hook, consulting/advisory DM CTA. Anonymize the customer.
- *"Make a thread about [technical topic]"* → Educational Tactical, roadmap hook, KARMA waitlist CTA. On LinkedIn this is a long single post with bold Unicode headers (or carousel-ready); on X it's a numbered thread.
- *"Give me a week of posts"* → 7 drafts following the cadence mix. Vary hook patterns. Include the weekly paid-offer mention and the weekly lead-magnet post.
- *"Punch up this draft I wrote"* → Keep Pedro's ideas and ordering. Tighten sentences, fix the hook, add the right CTA + engagement question, apply voice signatures, strip any em-dashes. Don't replace his content — refine it.
- *"Repurpose this for X"* → If the source is a tweet/short take, expand into the proven structure. If it's a long transcript, extract one *specific* claim or moment and build around it. Resist summarizing the whole thing.

## What to never do

- Don't write motivational/creator-guru content. That's not Pedro's audience.
- Don't copy "high-ticket clients" / "$100k month" framing. Pedro's audience is engineers and operators; that voice repels them.
- Don't pile multiple CTAs into one post.
- Don't use generic LinkedIn-influencer phrases ("Here's the truth", "The reality is", "Most people get this wrong") without specific Voice AI substance.
- Don't fabricate metrics, customer names, or product features. If you don't know a number, ask Pedro or leave a `[fill in]` placeholder.
- Don't use more than 2 emojis per post. The glyphs are the visual identity; emojis are accents.
- Don't write in third person about Pedro. Always first person.
- **Don't use the em-dash (`—`).** See the dedicated rule above.

## Reference files

- `references/pillars.md` — The four pillars in detail, the 2/2/2/1 weekly cadence, monetization-aware rules, buyer cluster archetypes, monetization order, optional Flexing Wednesday slot.
- `references/hook-library.md` — Hook patterns by pillar, with examples and anti-patterns.
- `references/voice-style-guide.md` — Unicode character set, sentence-rhythm rules, the em-dash ban, bullet-width rule, the two voice registers, anti-pattern list.
- `references/networks.md` — LinkedIn vs Twitter/X adaptation: length, glyph density, threading, links, hashtags, what changes and what stays.
- `references/examples.md` — Annotated top-engagement posts (curated view of `data/social/posts.jsonl` exemplars) with scaffold notes to mirror.

The performance data store at `data/social/` (schema in `data/social/schema.json`) is the
living source of examples; `/ps:post-pulse` keeps it current.
