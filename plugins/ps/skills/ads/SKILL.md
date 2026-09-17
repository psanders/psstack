---
name: ads
description: Meta (Facebook/Instagram) ads toolkit with the media-buying strategy built in, invoked as /ps:ads <subcommand>. `new` is a select-driven campaign wizard (goal → objective, conversion event, audience/geo, budget with learning-phase math, naming, copy variants, assets) that builds the campaign, ad set, and ads through the Meta Ads MCP, always PAUSED. `creative` writes angle-based copy and designs placement-safe assets in Pencil (feed 4:5 + story/reel 9:16 with safe zones). `review` pulls performance, applies kill/keep/scale/iterate rules, marks winners and losers in a local JSON tracker (with a kept copy of every asset), regenerates per-brand learnings, and proposes the next single-variable test. Use when Pedro wants to create or launch a Meta/Facebook/Instagram ad campaign, write ad copy, design ad creatives, check how ads are doing, decide what to kill or scale, or runs /ps:ads.
license: MIT
metadata:
  author: psanders
  version: "1.2"
---

# ads

One skill, three subcommands, routed on the first positional argument (same pattern as
`/ps:sdr`):

| Subcommand | What it does |
| :--- | :--- |
| `new` | Campaign wizard → creates campaign + ad set + ads in Meta, PAUSED, and records them in the tracker. |
| `creative` | Copy variants + Pencil-designed, placement-safe assets. Standalone or called from `new`. |
| `review` | Performance pull → verdicts (winner/loser/fatigued/inconclusive) → learnings → next test. |

No argument → ask with AskUserQuestion which one. Unknown subcommand → say so and list these.

**The point of this skill is judgment, not API calls.** The Meta Ads MCP can create anything;
Pedro knows the product but not media buying. Every step should explain *why* in one line
("broad targeting, because at $10/day narrow audiences raise CPM") so he learns as it runs.
Read these before acting — they are the rulebook:

- `references/strategy.md` — objective chooser, learning-phase math, structure, testing ladder, kill/scale rules, diagnosis tree.
- `references/copy-frameworks.md` — angles, PAS/BAB/AIDA, CTA mapping, B2B framing.
- `references/canvases.md` — the canvases, safe zones, templates, Pencil build and export rules.
- `references/guardrails.md` — copy limits, policy, AI disclosure, enhancement defaults, creative craft, pre-publish checklist.
- `references/publishing.md` — image upload (headless and browser) and the UI build path for ads.
- `references/naming.md` — naming grammar for campaigns, ad sets, ads, asset files, tracker ids.

## Guardrails (every subcommand)

- **This spends real money.** Everything is created **PAUSED**. Activating anything
  (`ads_activate_entity`), raising a budget, or duplicating into a live ad set happens only
  after Pedro explicitly says so *for that action*. A "yes" to the plan is not a "yes" to go live.
- **Never invent interest IDs** or targeting IDs. Broad targeting by default.
- **Pedro's call, always asked, never inferred:** AI-content disclosure (`self_ai_disclosure`),
  special ad category, target cost per result, and any claim/number used in copy.
- **No ad data in git.** `data/ads/` contents are git-ignored because psstack is a public repo.
  Never commit, paste into issues, or copy numbers/IDs into tracked files (including this
  skill's references). Aggregated lessons go to the local `learnings.md` only.
- **Never publish creative to a public host** just to get an upload URL without asking.
- **Stay focused.** If an MCP call fails 2–3 times, stop and report the exact error
  (`ads_get_errors` helps) instead of thrashing.
- **Currency:** Meta budget fields are in **cents**; the tracker stores **units**. Convert on
  both directions and echo the human amount ("$10.00/day") before creating.

## Shared setup (run once per session, before any subcommand)

1. **Load tools in one ToolSearch call** (they are deferred):
   `select:mcp__claude_ai_Meta_Ads__ads_get_ad_accounts,mcp__claude_ai_Meta_Ads__ads_get_ad_account_pages,mcp__claude_ai_Meta_Ads__ads_get_ig_accounts,mcp__claude_ai_Meta_Ads__ads_get_datasets,mcp__claude_ai_Meta_Ads__ads_get_customconversions,mcp__claude_ai_Meta_Ads__ads_create_campaign,mcp__claude_ai_Meta_Ads__ads_create_ad_set,mcp__claude_ai_Meta_Ads__ads_creative_upload_media,mcp__claude_ai_Meta_Ads__ads_get_ad_images,mcp__claude_ai_Meta_Ads__ads_create_creative,mcp__claude_ai_Meta_Ads__ads_create_ad,mcp__claude_ai_Meta_Ads__ads_get_ad_preview,mcp__claude_ai_Meta_Ads__ads_activate_entity,mcp__claude_ai_Meta_Ads__ads_update_entity,mcp__claude_ai_Meta_Ads__ads_get_ad_entities,mcp__claude_ai_Meta_Ads__ads_get_field_context,mcp__claude_ai_Meta_Ads__ads_insights_performance_trend,mcp__claude_ai_Meta_Ads__ads_insights_anomaly_signal,mcp__claude_ai_Meta_Ads__ads_insights_industry_benchmark,mcp__claude_ai_Meta_Ads__ads_get_errors,mcp__claude_ai_Meta_Ads__ads_get_help_article,mcp__claude_ai_Meta_Ads__ads_get_creatives,mcp__claude_ai_Meta_Ads__ads_get_ig_media`
   Add `mcp__pencil__get_app_state,mcp__pencil__read_skill,mcp__pencil__execute,mcp__pencil__get_style`
   when `creative` will run. If the Meta Ads tools don't exist at all, stop: Pedro needs to
   connect the Meta Ads connector first.
2. **`client_conversation_id`:** generate one 20-char alphanumeric id and reuse it on every
   Meta Ads call this session. Fill `advertiser_request` with Pedro's own words.
3. **Account:** `ads_get_ad_accounts`. Drop accounts with `is_ads_mcp_enabled: false`. If more
   than one remains, ask which (by name + business). Remember the choice for the session.
4. **Identity:** `ads_get_ad_account_pages` (Page for the brand; note `leadgen_tos_accepted`)
   and `ads_get_ig_accounts` (so creatives deliver on Instagram — without `instagram_user_id`
   they won't).
5. **Pixel:** `ads_get_datasets` for the account; `ads_get_customconversions` for custom events.
6. **Data dir:** resolve `data/ads/` (psstack repo root → `$PSSTACK_DIR/data/ads` →
   `~/Projects/psstack/data/ads` → ask). Confirm the absolute path. Read `README.md` and the
   schemas if not in context. Create `campaigns.jsonl` / `creatives.jsonl` / `assets/` if missing.
7. **Past evidence:** if `learnings.md` has a section for this brand, read it and state the 2–3
   rules that apply ("pain angle has won 3 of 4 for QCobro"). Brand data beats generic defaults
   once a cell has n≥4.

### Account readiness (check before building anything, show as a table)

The pieces of an ad account are owned in different places and can quietly not belong to each
other. Run this once per account and show Pedro the result as a table with a ✅/⚠️ per row.
**Answer it before creative work, not at publish time:** two of these rows are effectively
unfixable later without opening a different ad account.

| Row | How to check | Why it matters |
| :--- | :--- | :--- |
| **Page** | `ads_get_ad_account_pages`; note `leadgen_tos_accepted` | Creatives can't be created without a Page. Ask which Page *speaks* — the advertiser Page is often the company while the product has its own name. |
| **Pixel owner** | `ads_get_datasets` for the ad account, and for the business as well — a pixel commonly lives under a business rather than the ad account, and won't show up otherwise | An unowned or unshared pixel means no conversion event to optimize for. |
| **Instagram** | `ads_get_ig_accounts` | Without `instagram_user_id`, creatives never deliver on Instagram. |
| **Payment method** | the account's funding source | Meta refuses to create **ads** — even PAUSED — without one (error 1359188). Campaigns, ad sets, uploads and creatives all work without it, so build those first and leave one call per ad. |
| **Billing country, currency, time zone** | the account's billing settings, checked **against the payer's actual card** | Set at account creation and effectively permanent. A card from a different country fails outright; changing the country warns it will close the account and open a new one, and can then fail anyway. A mismatch here means picking a different ad account or opening a support case — before any creative exists. |

A failing row blocks the **Create** step, not the direction and creative work. Say which row
failed, what it blocks, and keep going on everything it doesn't block.

---

## `new` — campaign wizard

Goal: Pedro answers a few batches of select questions; the skill turns them into a sound
campaign and builds it. Use **AskUserQuestion** for every batch (≤4 questions, 2–4 options,
recommended option first with "(Recommended)"). Pre-fill options from what's known (brand
repo, `learnings.md`, the account's Pixel events) so most answers are one click.

### Batch 1 — What and why
- **Brand/product** — options from known brands (QCobro, micobro, Mikro, Fonoster, KARMA) + Other. If the brand
  has a local repo (e.g. `~/Projects/qcobro`), skim its `CLAUDE.md`/README/site for the
  product pitch, audience, and language.
- **Goal** (Pedro's words) → map to objective using `strategy.md` §1. Options:
  "Get demo requests on the site (Recommended for B2B)", "Start WhatsApp conversations",
  "Send people to a page", "Build awareness". State the mapped objective + one-line why.
- **Landing page / destination** — offer known URLs (brand site) + Other.
- **Offer** — demo, free trial, WhatsApp chat, guide/content, Other.

### Batch 2 — Conversion, audience, geo
- **Optimization event** — list the Pixel's events / custom conversions found in setup.
  Recommend per `strategy.md` §2 once the budget is known (may revisit after Batch 3).
  If the objective is Leads-on-website and there's no `Lead`-type event, say so and offer
  Traffic → `LANDING_PAGE_VIEWS` instead.
- **Geo** — countries/cities (for QCobro default suggestion: Dominican Republic; ask, don't assume).
- **Language** of the ads — Spanish / English / both (both = separate ads, not mixed copy).
- **Special ad category** — "None (B2B software)" vs "Financial products & services"; explain
  `guardrails.md` §2 in one line. Pedro decides, and the reasoning gets recorded.

### Batch 3 — Money and time
- **Daily budget** — $5 / $10 (Recommended to start) / $15 / $20 per day, CBO.
- **Target cost per result** — "I know what a lead is worth" (then ask the number) /
  "Use industry benchmark" (`ads_insights_industry_benchmark`) / "No idea yet — learn first".
- **Start** — now (still paused until go-live) / specific date. **End** — none (Recommended) / date.

Then **show the learning-phase math** (`strategy.md` §2) with Pedro's numbers, and adjust the
optimization event if it can't produce signal. Explain the decision in 2–3 lines.

### Batch 4 — Creative direction
- **Audience awareness** — "Unaware: they don't know this category exists (Recommended for a
  new brand)" / "Category-aware: they know the category, not us" / "Brand-aware: they know us".
  This decides what every ad leads with, so ask it before angles.
  - **Unaware ⇒ every ad opens with the category**, in plain words, as the first thing read or
    seen. The offer moves later in the funnel; an offer-led ad to an unaware audience sells a
    discount on something nobody has heard of.
  - Category-aware ⇒ lead with the differentiator. Brand-aware ⇒ lead with the offer.
- **Angles** — multiSelect, pick 3 from `copy-frameworks.md` (recommend based on
  `learnings.md`, else pain + outcome + proof for B2B round 1). Filter the options by the
  awareness answer.
- **Assets** — "Design them in Pencil (Recommended)" / "I have files" (ask for paths) /
  "Use an existing Instagram post" (`ads_get_ig_media`) / "Copy only for now, assets later".
- **Canvases** — `feed-4x5` + `vertical-9x16` (Recommended) / feed only / video
  (`canvases.md`).

### Lock the look — show concepts, don't describe them

Before any finished asset, build **3–4 rough visual concepts** and show them as images. A look
approved in prose ("match the website") gets rejected on sight, because an editorial layout
that works on a landing page doesn't stop a thumb in a feed — and that answer only arrives when
there's something to look at.

- One `feed-4x5` frame per concept, rough: real headline, real palette, placeholder proof.
  Span the plausible range, e.g. photo-led (`tpl/photo-overlay`), type-led (`tpl/bold-type`),
  product-UI-led (`tpl/proof-card`).
- Export them (`canvases.md` → Export) and show the images, then ask which one to build the
  round in — with AskUserQuestion, options named after the concepts.
- Record the chosen direction in the brief so later rounds don't re-litigate it.

### Build the plan, then gate
1. **Names** per `naming.md`: campaign, ad set, and one ad per angle (round `r1`).
2. **Copy**: for each ad, primary text, headline, description, CTA, image headline, framework,
   hook type — per `copy-frameworks.md`, in the chosen language, within the `guardrails.md` §1
   lengths (written to the strictest placement, not to the field maximum).
3. **Assets**: if Pencil → run the `creative` flow inline for these ads. If files → verify each
   against `canvases.md` (read the image; check size/safe zones) and flag problems.
4. **Message match** — fetch the landing page and check three things against the plan:
   - the **offer** the ads promise is actually on the page, in the same words (an ad promising a
     pilot that lands on a "free demo" page loses the click it paid for);
   - the **conversion event** chosen in Batch 2 really fires there (the pixel is on the page and
     the form that fires it is the form the ad points at);
   - nothing on the page contradicts a claim in the copy.

   Then **decide launch timing from the result**: if the page needs a change, say whether the
   campaign waits for it or launches against the current page with the copy adjusted to match.
   Never launch against a page that can't count the event — there's nothing to optimize toward.
5. **Plan summary** — one table: campaign (objective, event, budget/day, geo, category), ad set
   (targeting, placements), each ad (name, angle, headline, primary text first line, asset
   paths), plus expected events/week and the review date (launch + 3–7 days). Ask Pedro to
   approve, edit, or cancel. **Ask the AI-disclosure question here** (did any asset use
   generative AI? — `guardrails.md` §3): required before creative creation, can't be changed
   later, and unavailable at all if the ad gets built in the UI.

### Create (only after approval)
In order, stopping on the first failure:
1. `ads_create_campaign` — `objective`, `buying_type: AUCTION`, `campaign_daily_budget` in
   cents, `special_ad_categories` per Pedro, name. (Created PAUSED.)
2. `ads_create_ad_set` — under the campaign; `optimization_goal` from the create-campaign
   response's valid list; `billing_event: IMPRESSIONS`; `promoted_object` with `pixel_id` +
   `custom_event_type` (or `custom_conversion_id`); `destination_type`; `targeting` =
   `{"geo_locations":{...}}` broad (+ `locales` only if language targeting is truly needed);
   no budget fields (CBO); Advantage+ placements (omit `placement`).
3. **Upload assets** per `publishing.md` — the three-step local-image flow (prepare → POST the
   bytes with the entity headers → finalize), which needs no picker and no public host. Upload
   the **JPEG**, not the PNG. Record each `image_hash` against its canvas.
4. `ads_create_creative` per ad — `page_id`, `instagram_user_id`, `link_url`, `message`,
   `headline`, `description`, `call_to_action_type`, `image_hash` (`feed-4x5`) and `name` = ad
   name, `self_ai_disclosure` per Pedro. Set the enhancement flags per `guardrails.md` §4.
   **The connector customizes placements for video only**, so a `vertical-9x16` *image* variant
   can't ride along here: when one exists, finish that ad through the UI build path in
   `publishing.md` instead of shipping feed-only.
5. `ads_create_ad` per ad with the `creative_id`. (PAUSED.) If the account has no payment
   method this is the one call that fails — everything above still lands, so finish these ads
   as UI drafts (`publishing.md`) rather than unwinding the campaign.
6. `ads_get_ad_preview` for one ad; show it. Then walk the `guardrails.md` §5 setup checklist.

### Record
- **Copy every asset** into `data/ads/assets/<brand>/<ad_name>__<canvas>.<ext>` (`cp`, then
  `shasum -a 256`; `sips -g pixelWidth -g pixelHeight` for dimensions). Store the uploaded
  JPEG, so the tracker holds the file Meta actually received.
- Append one `campaigns.jsonl` record (status `paused`, full brief, Meta IDs, `ad_ids`).
- Append one `creatives.jsonl` record per ad: all tags, context, copy, asset files, Meta IDs,
  `snapshots: []`, `verdict: "testing"`, `verdict_history: [{at: today, verdict: "testing",
  reason: "created"}]`. Validate against the schemas (a quick `node -e` / `python3 -c` check is fine).

### Hand-off
Tell Pedro: everything is paused in Ads Manager; what to eyeball there (preview, Page/IG
identity, URL); the exact go-live command ("say *activate QCOBRO_LEADS_…* and I'll turn it on");
and when to run `/ps:ads review` (launch + 3 days for a sanity check, + 7 days for verdicts).
Offer to schedule a reminder with the `schedule` skill.

On an explicit go-live: `ads_activate_entity` for campaign → ad set → ads, set `launched_at`
and `status: active` in both files.

---

## `creative` — copy + placement-safe assets

Inputs (ask what's unknown, via AskUserQuestion): brand, campaign (existing, from
`campaigns.jsonl`, or none), angles, canvases (default `feed-4x5` + `vertical-9x16`), language, variants
per angle (default 1), and whether to attach the results as new PAUSED ads to an existing ad set.

### 1. Copy
Per variant: primary text, headline, description, CTA, on-image headline (≤ ~7 words),
framework, hook type/text, hypothesis — per `copy-frameworks.md`. Show them as a table and let
Pedro edit before designing. Name each per `naming.md` (next round number if iterating; set
`parent_id` + `test_variable` when it descends from a tracked ad).

### 2. Verify the current specs
`ads_get_help_article` for Stories/Reels safe zones and image specs. If it disagrees with
`canvases.md`, use Meta's numbers and mention the drift.

### 3. Design in Pencil
`canvases.md` is the rulebook for this step — canvases, templates, slots, the Pencil gotchas
and the export sequence. What's specific to a run:

- **Which file:** the brand's ads `.pen` (the brand repo's, so its tokens and components are
  available) — ask before editing it, and **open it in Pen.app first**: `execute` writes to
  whatever file the app has open, which silently escapes a worktree. Confirm with
  `get_app_state`. Then `read_skill` (and the `execute` doc it references); don't assume
  function names. Never `Read`/`Grep` a `.pen` file.
- **Frames:** duplicate the right template per variant × canvas, rename to
  `<ad_name>__<canvas>`, fill the slots. Keep `safe-zone-guide` visible while designing.
- **Imagery:** `Generate(nodeId, "stock", "<1-3 keywords>")` for photos,
  `Generate(nodeId, "ai", "<prompt>")` for AI images (async — check the placeholder flag before
  exporting), written to the prompt rules in `guardrails.md` §6. **Any `ai` generation makes
  the asset AI-generated:** record it for the `self_ai_disclosure` question. Stock is not AI.
- **Composition:** one idea per frame carrying the angle; headline inside the content box at
  the canvas's size; brand mark small; no fake buttons; headline and image congruent
  (`guardrails.md` §6).
- **Board layout (default canvas organization, so this doesn't need to be re-requested):** lay
  the whole round out as a review board, one **row per ad**, not a scattered cascade —
  1. Row 1 for ad A: its canvas variants side by side, left to right in `canvases.md` order
     (`feed-4x5`, `square-1x1` if built, `vertical-9x16`), each at true size so the row height
     equals the tallest canvas.
  2. Directly under that row: one **copy card** frame spanning the row's width — a compact
     spec sheet with the ad name, angle/framework, hook, primary text, headline, description,
     and CTA as plain text fields (not an ad mock — a review artifact, styled simply: label +
     value pairs, brand mono for labels). This is what lets Pedro review creative and copy
     together without opening a separate file.
  3. Next ad's row starts below that copy card, same pattern, down the canvas.
  - Build each ad's frames first, then position the row + card with `FindEmptySpace`/explicit
    coordinates rather than letting frames land wherever — reposition with `Update(id, {x, y})`
    if frames already exist from an earlier step.
  - Reuse one `Copy Card` component (label/value row layout) instanced per ad with the fields
    overridden via `descendants`, so every card matches.
- **Export** per `canvases.md` → Export: separate `execute` call, guides off, `scale: 1`,
  rename, convert to JPEG, `sips` the dimensions, plus one guide-visible copy to a scratch
  directory for the visual check.

### 4. Self-check every export
Run the `guardrails.md` §5 checklist on every asset. Both halves of the safe-zone check are
mandatory: the **scripted** bounds dump of every text/icon/pill node against the canvas rule,
*and* reading back the **guide-visible** export to see whether a face or key subject inside a
photo sits in a band. Each catches what the other can't. Fix in Pencil and re-export anything
that fails, then show Pedro the final images.

### 5. Record / attach
- Standalone: tell Pedro the paths and the Pencil frame names; tracker records are written when
  the ads get created (via `new` or step below).
- Attach to an existing ad set (on approval): upload → create creative → create ad (PAUSED),
  exactly as in `new` → Create steps 3–6, then append `creatives.jsonl` records (fill
  `asset.pencil_file` + `pencil_node_ids`) and add ids to the campaign's `ad_ids`.
  **Warn** that adding ads to a live ad set can nudge it back into learning (`strategy.md` §5).

---

## `review` — iterate on evidence

Args: optional brand or campaign name; `--dry-run` (analyze, don't write or change anything).
No args → ask: all active campaigns (Recommended) / pick a campaign / hall of fame only.

### 1. Pull
- Scope: campaigns in `campaigns.jsonl` for the account plus any **live** campaign in the
  account not yet tracked (offer to adopt it).
- Fields: `ads_get_ad_entities` at `level: ad` with `date_preset: maximum` (and again with
  `last_7d` for trend), `limit: 200`, fields verified to exist (2026-09-14):
  `name, effective_status, campaign_name, adset_name, created_time, amount_spent, impressions,
  reach, frequency, ctr, cpc, cpm, results, cost_per_result, landing_page_view`.
  Look up anything else (link clicks, rankings, conversion events) with
  `ads_get_field_context` first — `inline_link_click_ctr` and `quality_ranking` do **not**
  resolve, so store those as `null` unless the field context offers an equivalent.
  Response quirks: money comes as strings like `"$1.68\u00a0USD"` (parse to a number);
  `results` is an object `{indicator, values:[{value}]}` — store `value` as `results` and the
  indicator (e.g. `landing_page_view`) as `result_type`; `ctr` is "CTR (all)", not link CTR.
- Run it for **every** account with `is_ads_mcp_enabled` (Pedro has more than one). Accounts
  whose name says read-only: report them, never propose changes there.
- Context: `ads_insights_performance_trend` (hide_ui), `ads_insights_anomaly_signal`, and
  `ads_insights_industry_benchmark` for the objective.
- Untracked ads in tracked campaigns: backfill a `creatives.jsonl` record (parse tags from the
  name per `naming.md`, including its legacy `BRAND | Theme | vN` form; pull copy + image via
  `ads_get_creatives` / `ads_get_ad_images`; download the image into `assets/` if a URL is
  available; infer `angle` from the copy only when it's obvious, else `null`).
- Also backfill the campaign into `campaigns.jsonl` (brief fields from what Meta returns; ask
  Pedro for `target_cpr` once per campaign, since the kill rules need it).

### 2. Snapshot
Append one `snapshots[]` entry per ad (`window: lifetime`, plus `days_live`), converting money to
units and computing `conversion_rate` = results / link clicks. Ask Pedro once for a lead-quality
read if results > 0 ("were these leads real?") and store it in `lead_quality_note`.

### 3. Judge
For each ad, apply `strategy.md` §5–6 in order: minimum evidence → kill rules → winner/scale →
fatigue → otherwise `testing`/`inconclusive`. Use the campaign's `target_cpr` (source noted in
`benchmark`). **Upstream-event campaigns** (optimizing for landing page views or link clicks):
cost per result there is cheap by design, so judge on CTR and frequency relative to the other
ads in the ad set, and flag in the diagnosis that the real test is what happens after the click
(recommend moving to a conversion event once the Pixel records one — `strategy.md` §2). If the verdict changes: set `verdict`, `verdict_reason` (rule + numbers),
`verdict_at`, `benchmark`, a one-sentence `learnings`, and **append** to `verdict_history`.
Set `stopped_at` when an ad gets paused for good.

Campaign level: walk the diagnosis tree (`strategy.md` §7) and name the single biggest
constraint (creative, landing page, budget, event choice, delivery error).

### 4. Report
- One table: ad name · angle · format · days · spend · impr · link CTR · results · CPR · freq ·
  verdict (Δ from last review).
- Diagnosis in 2–3 lines, plain language.
- **Proposed actions** table — pause X, keep Y, scale Z +20% (new daily budget in $), refresh W —
  each with the rule that justifies it. Execute via `ads_update_entity` **only on explicit
  approval, action by action or "approve all"**. Never during `--dry-run`.
- **Next test** (`strategy.md` §8): parent ad, the one variable to change, 2–3 concrete variants
  (named, with copy + visual direction). Offer to run `creative` for them now.

### 5. Learnings
Regenerate `data/ads/learnings.md` from **all** `creatives.jsonl` records, one section per brand:
- Counts: ads tested, winners, losers, fatigued, inconclusive; total spend; blended CPR.
- Tables by `angle`, `format`/aspect, `hook_type`, `framework`, `has_person`/`has_product_ui`,
  `offer`: n, win rate, median CPR, median link CTR. Mark **n<4 as directional**.
- `→ RULE:` / `→ WATCH:` lines under each table; call out where brand data contradicts
  `strategy.md` defaults (those contradictions are the most valuable output).
- **Hall of fame / wall of shame:** top 3 winners and bottom 3 losers with ad name, verdict
  reason, and the local asset path.
- Keep it ~1–2 screens. If a contradiction holds across 2+ reviews, *propose* an edit to the
  references in the report; don't edit the rulebook automatically, and never put numbers or IDs
  in tracked files.

Also append a `reviews[]` entry on each campaign (spend/results/CPR to date, diagnosis, actions
taken, next test). Finish with the absolute paths written. **Don't commit anything** — the
store is git-ignored by design.

### Hall-of-fame only
If Pedro just wants to see what's worked: read `creatives.jsonl`, show winners and losers per
brand (name, angle, format, CPR, reason, asset path — Read the images to show them), no API calls.
