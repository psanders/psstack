---
name: sdr
description: SDR (sales development) toolkit, invoked as /ps:sdr <subcommand>. Currently implements `signal-scan` — a LinkedIn buying-intent scan (keyword/hashtag pass + job-change pass) driven by claude-in-chrome against Pedro's own logged-in session, saved to the local, git-ignored data/sdr/signals.jsonl. Other subcommands from the original 31-skill SDR pipeline (intent-score, icp-match, dossier-build, voice-writer, sequence-builder, reply-classify, objection-tag, book-call, no-show-save, pipeline-report, sequence-audit) are planned but not yet built — running one reports that plainly rather than improvising. Use when Pedro wants to prospect on LinkedIn, scan for buying-intent signals, or runs /ps:sdr signal-scan.
license: MIT
metadata:
  author: psanders
  version: "0.2"
---

# sdr

One skill, many subcommands — routed on the first positional argument, the same way
`/ps:post-pulse` routes on its `window` arg. This keeps the `ps` plugin's skill list from
growing by a dozen entries while still giving each SDR capability its own invocation:
`/ps:sdr signal-scan`, `/ps:sdr <future-subcommand>`, etc.

## Subcommands

| Subcommand | Status | What it does |
| :--- | :--- | :--- |
| `signal-scan` | **built** | Scans LinkedIn for buying-intent signals (keyword/hashtag posts + job-change announcements), writes to `data/sdr/signals.jsonl`. |
| `intent-score` | planned | Ranks signals in the store by how likely they are to convert. |
| `icp-match` | planned | Filters signals against Pedro's ICP definition, sets `icp_match`. |
| `dossier-build` | planned | Researches a matched account before outreach. |
| `voice-writer` | planned | Drafts a DM in Pedro's voice for a signal (draft-only, never sends). |
| `sequence-builder` | planned | Plans opener/follow-up/backup touch sequence. |
| `reply-classify` | planned | Sorts inbound LinkedIn replies by intent. |
| `objection-tag` | planned | Flags and suggests answers to common objections. |
| `book-call` | planned | Drafts the booking message (Pedro sends it; never auto-sent). |
| `no-show-save` | planned | Drafts a re-book message for ghosted calls. |
| `pipeline-report` | planned | Weekly summary over the signal/outreach store. |
| `sequence-audit` | planned | Flags dead/stalled sequences. |

If Pedro runs a subcommand that isn't built yet, say so plainly (what it would do, that
it isn't implemented) rather than guessing at behavior.

## Guardrails (apply to every subcommand, present and future)

- **Read-only on LinkedIn itself.** No connection requests, no likes, no comments, no
  follows, ever. `signal-scan` only reads what's already visible on the page.
- **Never auto-send anything to a prospect.** Once `voice-writer`/`book-call` exist, they
  draft messages for Pedro to review and send himself — same rule as `/ps:post` never
  auto-publishing. Automating outbound messaging is also a LinkedIn ToS violation; drafting
  is not.
- **No PII in git.** `data/sdr/*.jsonl` is git-ignored (see `data/sdr/README.md`). Never
  suggest committing it, and never copy signal contents into a file that *would* get
  committed (issues, commit messages, this SKILL.md, etc.).
- **No captcha/checkpoint bypass.** If LinkedIn shows a security checkpoint, phone
  verification, or captcha, stop and tell Pedro — don't attempt to solve or work around it.
- **Stay focused.** If pages won't load, selectors don't resolve, or a login wall appears
  after 2–3 attempts, stop and report what you saw rather than thrashing (same rule as
  `/ps:post-pulse`).

---

## `signal-scan`

Finds buying-intent signals and, more importantly, **named decision-makers** to reach
out to. Four passes, tried in priority order — validated against a real 2026-07-28 test
prospecting the DR microfinance/collections sector, which rewrote the priority order from
v1:

1. **`people`** (primary, default, fastest) — direct search for executives/decision-makers
   by title + sector keywords. Found named 2nd-degree GMs/Presidents with warm mutual
   connections in testing; the highest signal-to-effort pass by far.
2. **`companies`** (default) — builds a target-account list via company search. Useful for
   cross-checking `org_fit` and for verticals where you don't yet know who the players are.
3. **`jobs`** (opt-in) — job-change announcements. Lower precision without Sales Navigator's
   filtered "changed jobs" view; the reliable read-only version is people's own "excited to
   announce" posts, which is noisy.
4. **`keywords`** (opt-in) — generic pain-point/topic content search. **Validated as the
   weakest pass**: a real test run mostly surfaced vendor content marketing, a competitor's
   COO promoting their own product, and paid `#Ad` partnerships — not prospects expressing
   a pain point. Keep it for competitive/topic monitoring, not primary prospecting.

### Input

- **Passes** (positional, optional, comma-separated): any of `people`, `companies`, `jobs`,
  `keywords`. Omit to run the default: `people,companies`.
- `--keywords "phrase1, phrase2"` — override/extend the sector terms in
  `references/keywords.md` for this run only (doesn't edit the file).
- `--titles "title1, title2"` — override/extend the executive-title terms used by the
  `people` pass for this run only.
- `--limit N` — max signals to keep per query (default 10). Keeps runs bounded and avoids
  hammering LinkedIn.
- `--window recent|week|month` — applies to the `jobs`/`keywords` passes; maps to
  LinkedIn's own date-posted sort where available. Default `week`.
- `--dry-run` — scan and report, but don't write to the data store.

### Browser automation

Drives Chrome via `claude-in-chrome`, same pattern as `/ps:post-pulse`. If the tools are
deferred, load the core set in ONE `ToolSearch` call before starting:

```
ToolSearch select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__tabs_create_mcp
```

Call `tabs_context_mcp` first, then open a **new** tab (don't hijack Pedro's tabs). Pedro
must already be logged in to LinkedIn in Chrome — this skill does not log in for him. If a
page shows a logged-out view or a checkpoint, stop and ask him to sign in / clear the
checkpoint, then resume.

LinkedIn's UI and URL structure shift over time and vary by account. Treat any URL below
as a **starting point**, not a hardcoded contract: if it 404s, redirects, or shows an
unexpected layout, fall back to using LinkedIn's own search bar and filters interactively.

**Search mechanics learned from real-world testing (2026-07-28) — follow these or repeat
known failures:**

- **There is no Title/seniority filter on a standard LinkedIn account.** The People-search
  filter panel (Locations, Current companies, Past companies, Schools, Industries, Profile
  Languages, Connections, Verified, Actively hiring) has no title facet without Sales
  Navigator. Fold executive titles into the **keyword query itself** instead — that's the
  whole mechanism of the `people` pass below.
- **Keep boolean queries simple.** A nested query like
  `("Gerente General" OR "CEO") AND (cooperativa OR financiera)` reliably returned **"No
  results found"** — LinkedIn's parser chokes on it. Use **one quoted phrase + one plain
  sector word** per query (e.g. `"Gerente General" cooperativa`), and run several simple
  queries instead of one complex one.
- **Reapply the Locations filter after typing a fresh query into the global top search
  bar.** Submitting a new query from the top bar routes through `/search/results/all/` and
  drops filters (like the geo filter) that were set on the People-tab view. After that,
  click back into the **People** tab and re-check/re-apply Locations — don't assume the
  filter survived.
- **Wait ~1s after typing into the Locations (or Current companies) filter box** before
  clicking a suggestion. The autocomplete dropdown populates asynchronously; clicking
  immediately after typing can land on nothing or the wrong item.
- **A bare sector word is either too narrow or too broad — test before trusting it.** In
  testing, `"microfinanciera"` and `"microcrédito"` returned **zero** DR company results;
  `"financiera"` alone returned 363, dominated by stock brokerages and banking
  associations, not lenders. Specific legal-structure phrases (`"cooperativa de ahorro y
  credito"`) or direct known-brand name checks worked far better. Tune
  `references/keywords.md` per-segment rather than reusing one generic word list across
  verticals.

### Steps

#### 1. Resolve inputs
Parse the pass selection (default `people,companies`), `--limit`, `--window`, and any
`--keywords`/`--titles` overrides. Load `references/keywords.md` — organized **by
segment**, so use the segment matching what Pedro is prospecting for, not the whole file
blindly. Resolve the `data/sdr/` directory the same way `/ps:post-pulse` resolves
`data/social/`: repo root first, then `$PSSTACK_DIR/data/sdr`, then
`~/Projects/psstack/data/sdr`, then ask Pedro. Confirm the resolved absolute path out
loud. Load `signals.jsonl` if it exists (it may not, on a first run — treat the store as
empty).

#### 2. Pass — `people` (primary)
For each (executive title × sector term) pair from the relevant segment in
`references/keywords.md` (cap at ~5 combinations per run unless `--titles`/`--keywords`
narrow it — many simple queries beat one complex one, but still bound the total):

1. New tab → People search → type `"<title>" <sector term>` as the query (one quoted
   phrase + one plain word, no nested booleans) → Enter.
2. Confirm you're on the **People** tab (a fresh query from the global bar lands on "All"
   — click "People" if so), then apply the **Locations** filter to the target
   country/region: click Locations → click the input → type the location → **wait ~1s** →
   click the matching suggestion → Show results.
3. Extract up to `--limit` results via `get_page_text`: name (as LinkedIn displays it —
   respect its own truncation for non-1st-degree profiles, e.g. "Jane D…"), title, org,
   connection degree (1st/2nd/3rd+), and any mutual-connection names shown. Mutuals are a
   **warm-intro signal** — always capture them when present, they're high-value for
   prioritization.
4. Best-effort set `org_fit`: `likely_exclude` if the org matches an exclusion pattern in
   `references/keywords.md` (e.g. employer-affiliated employee coops that share a legal
   form with real lenders but aren't lenders themselves); `likely_fit` if it matches a
   known-good account (from this file or a prior `companies` pass); otherwise
   `needs_verification`.

#### 3. Pass — `companies`
For each sector term, company search with the geo filter and, where it narrows results
without over-filtering, an Industry filter. Extract name, location, size/followers, tag
`type: "company_match"`. Builds an account list and helps cross-check `org_fit` in the
`people` pass — but `people` alone often already surfaces good contacts directly, so don't
treat this as a required prerequisite to running it.

#### 4. Pass — `jobs` and `keywords` (opt-in, lower priority)
Same mechanics as before: `jobs` searches announcement language ("new role", "excited to
announce") combined with target titles; `keywords` searches pain-point phrases via
content/post search sorted by latest. Keep `--limit` small; expect lower signal-to-noise
(validated in testing) — only run these when Pedro asks explicitly, or wants competitive/
topic monitoring rather than direct prospecting.

#### 5. De-dupe against the existing store
Before adding anything, check `source_url`/`person.profile_url` (fallback: name + org +
the current week) against records already in `signals.jsonl`. Skip anything already
present rather than logging the same person/company twice.

#### 6. Write new records
For each new signal, build a record matching `data/sdr/schema.json`:
`id` = `sig-<yyyy-mm-dd>-<slug>` (today's date, 3–5 kebab words from company/topic),
`type` (`exec_search`/`company_match`/`job_change`/`keyword_post`), `detected_at` (today),
`posted_at` (best-effort or null, `keyword_post`/`job_change` only), `source_url`,
`query_used` (the exact query that found it), `snippet` (verbatim, never fabricated),
`person` object where applicable, `connection_degree`/`mutual_connections`/`org_fit` for
`exec_search`, `company_size`/`followers` for `company_match`, `score: null`,
`icp_match: null`, `status: "new"`, `notes: null`. **Append** to `signals.jsonl`; never
overwrite existing lines. Validate each record against `schema.json`. With `--dry-run`,
show what would be written instead of writing it.

#### 7. Report
- Counts per pass, and how many were new vs. already in the store.
- A table of new signals, **sorted by connection degree then org_fit** (1st/2nd +
  `likely_fit` first — these are worth acting on first): name/org · title · connection
  degree · mutual connections · org_fit · link.
- Note the `query_used` per signal (or group by query) so Pedro can see what's actually
  working — and flag any query that returned zero or mostly noise, since that's exactly
  what should feed back into tuning `references/keywords.md`.
- The absolute path of `signals.jsonl` (or that nothing was written, on `--dry-run`).
- **Do not offer to commit this file** — unlike `/ps:post-pulse`, this data is git-ignored
  by design (see `data/sdr/README.md`). If Pedro wants durability, that's a local backup
  question, not a git one.

## Running it on a schedule

Same options as `/ps:post-pulse`: an in-session `/loop` to self-pace, or `/ps:schedule`
for an unattended cadence. Note the same constraint applies — LinkedIn scraping needs a
logged-in Chrome, so a fully unattended cloud run only works if that session has Pedro's
authenticated browser; otherwise schedule a reminder and run it interactively.
