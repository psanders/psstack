---
name: post-pulse
description: Recurring engagement harvest for Pedro's social posts. Opens a browser, sweeps a week or month of his LinkedIn and/or Twitter/X posts, reads each post's impressions, reactions, comments, and reposts plus a few notable comments, and saves it as structured time-series data in the psstack performance store. Promotes high performers to exemplars so /ps:post drafts from what actually works. Use when Pedro wants to measure post performance, run the weekly/monthly engagement pull, refresh the social data store, or runs /ps:post-pulse. Not for drafting posts (that's /ps:post).
license: MIT
metadata:
  author: psanders
  version: "1.1"
---

# post-pulse

Periodically harvest engagement for Pedro's social posts and save it as **structured,
version-controlled time-series data** that feeds `/ps:post`. Run it weekly or monthly. It
opens a browser (Claude in Chrome), finds the posts in the window, reads each one's
metrics, upserts a record per post, **appends** a timestamped snapshot, and promotes the
best performers to `exemplar: true`.

This is the measurement half of the pair. `/ps:post` writes; `/ps:post-pulse` measures and
closes the loop.

## Input

- **Window** (positional): `week` (last 7 days, default), `month` (last 30 days), or an explicit ISO range `YYYY-MM-DD..YYYY-MM-DD`.
- `--network linkedin|twitter|all` — which network(s) to sweep. Default `all`.
- `--dry-run` — scrape and report, but don't write to the data store.

## The data store

Everything is written to `data/social/` in the psstack repo. Read its `README.md` and
`schema.json` first if they aren't in context.

**Resolve the directory** as `data/social/` at the root of the psstack repo (the repo
containing the `ps` plugin). If running as an installed plugin and you can't locate it:
try `$PSSTACK_DIR/data/social`, then `~/Projects/psstack/data/social`, then ask Pedro.
Confirm the resolved absolute path out loud before writing.

`posts.jsonl` is the source of truth: one JSON object per line per post, with an
append-only `snapshots[]` time series inside each record. Validate any record you write
against `schema.json`.

## Browser automation

This skill drives Chrome via the `claude-in-chrome` MCP tools. If they're deferred, load
the core set in ONE `ToolSearch` call before starting:

```
ToolSearch select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__tabs_create_mcp
```

Then call `tabs_context_mcp` first to see existing tabs, and open a **new** tab for the
work (don't hijack Pedro's tabs). Pedro must be logged in to LinkedIn / X in Chrome already
— this skill reads his own activity feed; it does not log in for him. If a profile/activity
page shows a logged-out view, stop and ask him to sign in, then resume.

Stay focused: if pages won't load, selectors don't resolve, or you hit a login wall after
2–3 attempts, stop and report what you saw rather than thrashing. Never trigger JS dialogs.

## Steps

### 1. Resolve window, networks, and the data dir
Parse the window and `--network`. Resolve and confirm the `data/social/` absolute path.
Load `posts.jsonl` into memory (it may be large; read it once).

### 2. Re-measure pass — refresh recent posts already in the store (do this first)

Before sweeping the new window, re-snapshot posts **already** in `posts.jsonl` so the
time series actually grows. LinkedIn engagement keeps accruing for weeks, so a single
snapshot per post is nearly worthless for trend.

- Select records whose **latest** `snapshots[].captured_at` is **more than ~10 days ago**
  and whose `posted_at` is **within the last ~60 days** (old enough to have moved, recent
  enough to still be accruing). Skip anything already snapshotted in the last ~10 days.
- Visit each one's `url` and read the current counters. **Append** a fresh snapshot (Step 4);
  never overwrite. This is what turns single points into growth curves — the whole reason
  the schema is a time series.
- This pass reuses URLs you already have, so it's cheap. Cap it at ~15 posts per run if the
  list is long; prioritize the highest-engagement and most-recent ones.

### 3. Open the activity feed for each network
New tab, then navigate:
- **LinkedIn:** Pedro's profile → "Activity" → "Posts" (his own recent posts feed), e.g. `https://www.linkedin.com/in/<handle>/recent-activity/all/`. If the handle isn't known, ask once and remember it for the session.
- **Twitter/X:** Pedro's profile timeline filtered to his posts, e.g. `https://x.com/<handle>`.

Scroll to load posts until you pass the start of the window (posts older than the window
boundary). Use `get_page_text` / `read_page` to extract; scroll incrementally.

### 4. For each post in the window, capture
- `url` (canonical permalink — the dedupe key)
- `posted_at` (ISO date)
- `text` (the body as published)
- `impressions` (LinkedIn often shows this on your own posts; X shows "Views"). `null` if not visible.
- `reactions`, `comments`, `reposts`, and `saves`/`clicks` when shown (`null` otherwise)
- `top_comments`: notable comments (`author` + `text`) for qualitative signal.
  **Required for the ~5 highest-engagement posts of this run** (across both the
  re-measure and window passes): click into each and capture 2–3 comments. These are the
  posts whose comments are worth mining for voice, so this is not optional for them. For
  the rest, capture comments best-effort if they're already visible; don't click into
  every post. (Empty `top_comments` across the store is a known gap — this rule closes it.)
  **Privacy: never store a commenter's full name.** This file is committed to git, and
  these are third parties who never consented to being in a version-controlled dataset.
  Write `author` as first name + last initial only (e.g. "Jeff Pulver" → "Jeff P."). If
  only a single name/handle is visible, keep it as-is (nothing to truncate).

Best-effort classify `pillar`, `hook_pattern`, and `cta` by matching the text against the
`/ps:post` references (pillars / hook-library). Leave `hook_pattern: null` if unsure.

### 5. Upsert into `posts.jsonl`
For each captured post:
- **Match** an existing record by `url` (fallback: `id`). 
- **If found:** append a new `snapshots[]` entry with today's `captured_at` and the fresh metrics. **Never overwrite prior snapshots** — the time series is the point. Back-fill any previously-null top-level fields (e.g. the placeholder seed record) if you now have better data.
- **If not found:** create a record. Mint `id` as `<ln|tw>-<posted_at>-<slug>` (slug = 3–5 kebab words from the hook). Fill the fields, set `exemplar:false`, and add the first snapshot.
- Validate each record against `schema.json`. Keep one record per line.

Write the file back as JSONL (one object per line, newest-first by `posted_at` is fine but
not required). With `--dry-run`, skip writing and just show the diff you would make.

### 6. Promote exemplars
After updating, recompute exemplars. Promote a post to `exemplar: true` when, in its latest
snapshot, it clears the bar for its network:

- **LinkedIn:** impressions ≥ 3,000 **or** comments ≥ 15 **or** reactions ≥ 80. (Anchored to the KARMA hot take: 6,275 impressions / 39 comments.)
- **Twitter/X:** impressions ≥ 10,000 **or** comments ≥ 20 **or** reposts ≥ 30.

Keep roughly the top 1–2 exemplars per pillar per network so the example set stays sharp;
if a stronger post arrives, you may demote the weaker one (`exemplar:false`) and note it.
When you promote a post, also add or refresh its block in
`plugins/ps/skills/post/references/examples.md` (record id, performance, hook pattern, why
it worked, scaffold to mirror) so `/ps:post` picks it up.

### 7. Recompute the aggregate scorecard (`patterns.md`) — the learning loop
This is what feeds *strategy* (not just shape) back to `/ps:post`. After the store is
updated, regenerate `data/social/patterns.md` from **all** records in `posts.jsonl`:

- Recompute averages of engagement (reactions+comments+reposts, latest snapshot per post)
  broken down **by pillar, by CTA, by length bucket, and by day-of-week**, plus the current
  **engagement-rate baseline** (median + avg over posts with visible impressions) and the
  current **outliers** (highest ER, highest reach).
- Write each section as a short table followed by a plain-language `→ RULE:` / `→ WATCH:`
  line. Mark every cell with **n<4 as directional only** — do not state weak cells as rules.
- **Surface contradictions explicitly.** Wherever a data pattern conflicts with a rule in
  `/ps:post` (e.g. engagement-question underperforming the skill's "always end with a
  question" rule, or short posts beating its "700–1,500 chars typical" default), call it
  out in the relevant section. These contradictions are the highest-value output of the run.
- Keep the file to ~1 screen: it is a summary that `/ps:post` loads every draft, not an
  archive. Follow the existing structure in `patterns.md` if present.

Then **flag instruction rewrites**: if a contradiction has held across **two or more**
consecutive pulses, propose the concrete edit to `/ps:post` (SKILL.md or the relevant
`references/*.md`) in your report — but **don't edit the drafting skill's rules
automatically**; let Pedro approve the change. `patterns.md` and `examples.md` are yours to
regenerate; the skill's rulebook changes only on his say-so.

With `--dry-run`, show the `patterns.md` you would write but don't save it.

### 8. Report
Summarize to Pedro:
- How many posts captured, per network, and the window.
- A small table: post (short hook) · pillar · impressions · comments · reactions · reposts · Δ vs previous snapshot (if any).
- New exemplars promoted (and anything demoted).
- 2–3 **patterns** worth acting on, pulled straight from the refreshed `patterns.md`:
  which pillar/hook over- or under-performed, which CTA type pulled comments, best posting
  day if discernible. Keep it specific and honest; if the sample is too small to conclude,
  say so. Include any **instruction-rewrite proposals** from Step 7 (contradictions that
  held across ≥2 pulses).
- The absolute paths of the files written (`posts.jsonl`, `patterns.md`, and
  `examples.md` if you touched it).

### 9. Offer to commit the data to the repo
The data store is version-controlled, so a run isn't finished until it's saved. After
writing (and not on `--dry-run`):

1. Show what changed: `git -C <psstack repo> status --short data/social/` and a short
   `git diff --stat data/social/`.
2. **Propose a commit** and, on Pedro's go-ahead, make it. Stage `data/social/` (which
   includes both `posts.jsonl` and the regenerated `patterns.md`), plus
   `plugins/ps/skills/post/references/examples.md` if you promoted/demoted an exemplar there.
   Suggested message:
   `chore(social): post-pulse <window> — <N> posts, <M> new exemplars (<captured_at>)`.
   Follow the repo's commit conventions (sole-author; no Co-Authored-By trailer).
3. If the working tree isn't the psstack repo, or the data dir resolved outside a git repo,
   skip the commit and just tell Pedro the path so he can commit it himself.

Don't push unless Pedro asks. Committing keeps the engagement time-series durable and lets
`/ps:post` draft from the freshest exemplars.

## Running it on a schedule

This is a recurring job. Two good options Pedro can use:

- **In-session loop:** `/loop` to self-pace, or a fixed cadence. Best when he wants to watch it.
- **Scheduled cloud agent:** `/ps:schedule` (or the `schedule` skill) to run it weekly/monthly unattended. Suggested cron: weekly on Monday morning (`0 9 * * 1`) for a `week` sweep, or monthly (`0 9 1 * *`) for a `month` sweep.

Browser scraping needs a logged-in Chrome, so a fully-unattended cloud run only works if
that session has Pedro's authenticated browser. If not, schedule a reminder instead and run
the sweep interactively.

## Guardrails

- Read-only on the platforms. This skill **never posts, likes, comments, or follows** — it only reads Pedro's own activity.
- Only Pedro's own posts. Don't scrape other people's profiles.
- `--dry-run` before the first real write if you're unsure about selectors.
- Never fabricate metrics. If a number isn't visible, write `null`, don't guess.
- Append, don't overwrite. The value is the time series.

## Relationship to `/ps:post`

`/ps:post` reads `exemplar: true` records (via `references/examples.md` and the data store)
to draft from what works. `/ps:post-pulse` is what makes those exemplars real and current.
Run pulse on a cadence; the drafting skill gets smarter for free.
