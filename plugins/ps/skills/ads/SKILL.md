---
name: ads
description: Meta (Facebook/Instagram) ads toolkit with the media-buying strategy built in, invoked as /ps:ads <subcommand>. `new` is a select-driven campaign wizard (goal → objective, conversion event, audience/geo, budget with learning-phase math, naming, copy variants, assets) that builds the campaign, ad set, and ads through the Meta Ads MCP, always PAUSED. `creative` writes angle-based copy and designs placement-safe assets in Pencil (feed 4:5 + story/reel 9:16 with safe zones). `review` pulls performance, applies kill/keep/scale/iterate rules, marks winners and losers in a local JSON tracker (with a kept copy of every asset), regenerates per-brand learnings, and proposes the next single-variable test. Use when Pedro wants to create or launch a Meta/Facebook/Instagram ad campaign, write ad copy, design ad creatives, check how ads are doing, decide what to kill or scale, or runs /ps:ads.
license: MIT
metadata:
  author: psanders
  version: "1.1"
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
- `references/copy-frameworks.md` — angles, PAS/BAB/AIDA, field limits, CTA mapping, B2B framing, policy.
- `references/placements.md` — asset presets and safe zones.
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
  `copy-frameworks.md` → policy in one line. Pedro decides.

### Batch 3 — Money and time
- **Daily budget** — $5 / $10 (Recommended to start) / $15 / $20 per day, CBO.
- **Target cost per result** — "I know what a lead is worth" (then ask the number) /
  "Use industry benchmark" (`ads_insights_industry_benchmark`) / "No idea yet — learn first".
- **Start** — now (still paused until go-live) / specific date. **End** — none (Recommended) / date.

Then **show the learning-phase math** (`strategy.md` §2) with Pedro's numbers, and adjust the
optimization event if it can't produce signal. Explain the decision in 2–3 lines.

### Batch 4 — Creative plan
- **Angles** — multiSelect, pick 3 from `copy-frameworks.md` (recommend based on
  `learnings.md`, else pain + outcome + proof for B2B round 1).
- **Assets** — "Design them in Pencil (Recommended)" / "I have files" (ask for paths) /
  "Use an existing Instagram post" (`ads_get_ig_media`) / "Copy only for now, assets later".
- **Formats** — feed 4:5 + story 9:16 (Recommended) / feed only / video.

### Build the plan, then gate
1. **Names** per `naming.md`: campaign, ad set, and one ad per angle (round `r1`).
2. **Copy**: for each ad, primary text, headline, description, CTA, image headline, framework,
   hook type — per `copy-frameworks.md`, in the chosen language, within field limits.
3. **Assets**: if Pencil → run the `creative` flow inline for these ads. If files → verify each
   against `placements.md` (read the image; check size/safe zones) and flag problems.
4. **Plan summary** — one table: campaign (objective, event, budget/day, geo, category), ad set
   (targeting, placements), each ad (name, angle, headline, primary text first line, asset
   paths), plus expected events/week and the review date (launch + 3–7 days). Ask Pedro to
   approve, edit, or cancel. **Ask the AI-disclosure question here** (did any asset use
   generative AI?) — required before creative creation, can't be changed later.

### Create (only after approval)
In order, stopping on the first failure:
1. `ads_create_campaign` — `objective`, `buying_type: AUCTION`, `campaign_daily_budget` in
   cents, `special_ad_categories` per Pedro, name. (Created PAUSED.)
2. `ads_create_ad_set` — under the campaign; `optimization_goal` from the create-campaign
   response's valid list; `billing_event: IMPRESSIONS`; `promoted_object` with `pixel_id` +
   `custom_event_type` (or `custom_conversion_id`); `destination_type`; `targeting` =
   `{"geo_locations":{...}}` broad (+ `locales` only if language targeting is truly needed);
   no budget fields (CBO); Advantage+ placements (omit `placement`).
3. **Upload assets** with `ads_creative_upload_media`:
   - Preferred: `upload_source: LOCAL_FILE` (opens Meta's upload app for Pedro to pick the
     file). Tell Pedro exactly which file path to pick for which ad.
   - If the upload app can't open in this client: ask Pedro whether a public URL exists (e.g.
     the brand site's asset folder); only then use `upload_source: URL`. Otherwise ask him to
     upload the files in Ads Manager → Media library, then find them with `ads_get_ad_images`.
   - Record each `image_hash` (and hosted URL) per file.
4. `ads_create_creative` per ad — `page_id`, `instagram_user_id`, `link_url`, `message`,
   `headline`, `description`, `call_to_action_type`, `image_hash` (feed45) and `name` = ad name,
   `self_ai_disclosure` per Pedro. If both feed45 and story916 exist, set them up as
   placement-customized assets when the tool supports it for images; otherwise use feed45 and
   note the story asset is kept for a later round.
5. `ads_create_ad` per ad with the `creative_id`. (PAUSED.)
6. `ads_get_ad_preview` for one ad; show it.

### Record
- **Copy every asset** into `data/ads/assets/<brand>/<ad_name>__<preset>.<ext>` (`cp`, then
  `shasum -a 256`; `sips -g pixelWidth -g pixelHeight` for dimensions).
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
`campaigns.jsonl`, or none), angles, formats (default feed45 + story916), language, variants
per angle (default 1), and whether to attach the results as new PAUSED ads to an existing ad set.

### 1. Copy
Per variant: primary text, headline, description, CTA, on-image headline (≤ ~7 words),
framework, hook type/text, hypothesis — per `copy-frameworks.md`. Show them as a table and let
Pedro edit before designing. Name each per `naming.md` (next round number if iterating; set
`parent_id` + `test_variable` when it descends from a tracked ad).

### 2. Verify the current specs
`ads_get_help_article` for Stories/Reels safe zones and image specs. If it disagrees with
`placements.md`, use Meta's numbers and mention the drift.

### 3. Design in Pencil
- `get_app_state`, then `read_skill` (and the `execute` doc it references) to learn the current
  Pencil API. Don't assume function names; the API is documented there. Never `Read`/`Grep` a
  `.pen` file.
- **Which file:** the brand repo's `.pen` (e.g. `~/Projects/qcobro/pencil.pen`) so brand
  tokens/components are available — ask before editing it; add a dedicated page/area named
  `Ads / <campaign or date>`. Use `get_style` / existing tokens for colors and type; read the
  brand repo's `CLAUDE.md` for brand rules.
- **Frames:** one per variant × preset at exact `placements.md` sizes, named
  `<ad_name>__<preset>`.
- **Safe-zone guides:** on every frame add a semi-transparent guide frame marking the unsafe
  top/bottom/side bands (named `safe-zone-guide`, `layoutPosition: "absolute"` so it doesn't
  disturb layout). Design with it visible; before export set `Update(guideId, {enabled: false})`.
- **Imagery:** use `Generate(nodeId, "stock", "<1-3 keywords>")` for photos or
  `Generate(nodeId, "ai", "<prompt>")` for AI images (async — check the placeholder flag before
  exporting). **Any `ai` generation means the asset is AI-generated**: record it and tell Pedro
  when asking the `self_ai_disclosure` question. Stock photos are not AI.
- **Composition:** one idea per frame carrying the angle; on-image headline large (≥ ~60px at
  1080 wide) inside the safe area; brand mark small; product UI or a person where it fits the
  angle; no fake buttons.
- **Verify visually** with `TakeScreenshot([frameId])` once per finished frame (with the guide
  still on, so safe-zone violations are visible), and `Get(frame, (n,c) => c.problems && Print(...))`
  for clipping.
- **Export** inside `execute`: `Export([frameIds], "png", "<abs path>/data/ads/assets/<brand>", {scale: 1})`.
  **`scale: 1` is mandatory** — the default is 2×, which would produce 2160×2700 instead of
  1080×1350. Export writes files as `<nodeId>.png`; rename each to
  `<ad_name>__<preset>.png` right after (`mv`), and confirm size with
  `sips -g pixelWidth -g pixelHeight`. Re-enable the guide afterwards if more edits are expected.

### 4. Self-check every export
Read each PNG (the Read tool shows images) and run the `placements.md` checklist: exact size,
text/logo inside safe area, headline legible when small, correct language, policy. Fix in
Pencil and re-export anything that fails. Show Pedro the final images.

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
