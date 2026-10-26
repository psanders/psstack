# psstack

Pedro's personal Claude Code toolbelt — a [plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces)
that bundles reusable skills so they live in one version-controlled place instead of
being copy-pasted between repos.

## Layout

```
psstack/
├── .claude-plugin/
│   └── marketplace.json        ← catalog: lists the plugins in this repo
└── plugins/
    └── ps/                     ← one plugin, many skills → /ps:<skill>
        ├── .claude-plugin/
        │   └── plugin.json
        ├── process/            ← the delivery process, plain Markdown (start at README.md)
        │   └── coding/         ← coding profiles a repo can declare, with templates
        ├── agents/             ← expert subagents → ps:<expert>
        └── skills/
            └── issues-report/
                └── SKILL.md
```

## The delivery process

`plugins/ps/process/` holds Pedro's generic engineering process: the issue format, readiness
gates, labels, loop limits, the expert roster, the AGENTS.md contract, coding profiles, and
the research behind them. It's plain Markdown any agent can read; the skills and subagents
just wire it up. Each repo keeps its own facts and decisions in its `AGENTS.md`, never in a
vendor-specific file. Start at [`plugins/ps/process/README.md`](plugins/ps/process/README.md).

```
/ps:adopt          set a repo up: draft its AGENTS.md
/ps:issues-report  report → agent-ready issue(s)        (human applies `ready`)
/ps:implement      ready issue → PR, or a refusal note   (human reviews and merges)
```

Pedro's social performance data (shared by `/ps:post` and `/ps:post-pulse`) lives
version-controlled at the repo root in `data/social/` — not inside the plugin, so a
marketplace reinstall never clobbers it. See `data/social/README.md` for the schema.

`/ps:sdr signal-scan`'s prospect data is the opposite case: it holds other people's PII
(names, titles, companies, and eventually reply content), so it is **not**
version-controlled. It's still written to a fixed local path at the repo root,
**`data/sdr/signals.jsonl`**, but that path is listed in `.gitignore` — a `git clone` or
marketplace reinstall will never include it, and it's on Pedro to back it up himself if he
wants durability. See `data/sdr/README.md` for the schema and the full rationale.

`/ps:ads` follows the same local-only rule for a different reason: psstack is a public repo
and the store holds ad spend, cost per lead, Meta account/campaign IDs, and unreleased
creative. It lives at **`data/ads/`** (campaigns, the `creatives.jsonl` winners/losers
tracker, kept asset copies, and derived `learnings.md`), all git-ignored except its
`README.md` and schemas. See `data/ads/README.md`.

`/ps:executive-report` archives every report it generates in **`data/reports/`**: the PDF
under a fixed name (`executive-report_<customer>_<start>_<end>.pdf`) plus an `index.jsonl`
record with the raw notes and the structured content, for search and evals. It is local-only
for the same reasons (customer names, unreleased work, unanonymized notes); only its
`README.md` is tracked. See `data/reports/README.md`.

## Skills

| Skill | Invoke | What it does |
| :--- | :--- | :--- |
| **docs** | `/ps:docs [topic]` | Write or update ONE documentation page through fixed stages — purpose narrative → sources → placement → Diátaxis-typed outline → Pencil assets → Mintlify MDX → proof → wire into nav. Mintlify-first, repo-agnostic; resumable via a per-doc checkpoint. |
| **today** | `/ps:today [filter]` | Morning radar for the current repo — open issues, PRs that need you, and pending releases that shouldn't pile up, grouped and ready to act on. (Alias: `/ps:issues-daily`.) |
| **issues-report** | `/ps:issues-report [desc\|#issue]` | The Reporter: turns a report or an existing issue into agent-ready issues (a Brief for humans, a Spec with a Verify command), or into nothing. Investigates the code, consults experts, bisects big work, runs an advocate and a premortem critic, and cold-reads the result. Never applies `ready` on its own. |
| **implement** | `/ps:implement <issue>` | The Implementer: runs the refusal check and marks unclear issues `not-ready` with a note; otherwise loads the repo's declared coding profile, writes the failing test first, makes Verify pass, and opens a PR on approval. Stops with a blocker report at any loop limit. |
| **adopt** | `/ps:adopt` | Drafts or completes a repo's `AGENTS.md` from the code (commands, conventions profile, areas, compatibility, risk hotspots, release, decisions) and migrates vendor files like `CLAUDE.md` into it. |
| **release-card** | `/ps:release-card [tag] [--color fonoster-green\|blue\|orange] [--logo Routr]` | Generate a branded release-notes image (PNG) for a repo's latest GitHub release — groups the actual commit messages by conventional-commit type (🎉 Features, 🐛 Bug Fixes, …) with short-SHA chips, on a white 1080×1350 social card, via satori + resvg. |
| **post** | `/ps:post [--network linkedin\|twitter]` | Draft a social post in Pedro's voice for LinkedIn (default) or Twitter/X — picks the content pillar, applies the voice signatures, adds one matching CTA, and shapes length/glyphs/threading to the network. Never uses the em-dash. Drafts from the proven exemplars in the performance store. |
| **post-pulse** | `/ps:post-pulse [week\|month] [--network linkedin\|twitter\|all]` | Recurring engagement harvest — opens a browser, sweeps a window of Pedro's posts, reads impressions/reactions/comments/reposts, and saves it as structured time-series data in `data/social/`. Promotes high performers to exemplars so `/ps:post` drafts from what works. Run weekly/monthly. |
| **executive-report** | `/ps:executive-report` | Turn raw project notes into a polished, branded biweekly executive report PDF — anonymizing teammate and customer names along the way. Files get a fixed name and are archived, git-ignored, in `data/reports/` for search and evals. |
| **sdr** | `/ps:sdr <subcommand>` | SDR toolkit routed by subcommand, `/ps:sdr signal-scan` built first — prospects LinkedIn via a people-first executive/decision-maker search (title + sector keywords), saved **locally, not version-controlled**, to `data/sdr/signals.jsonl` (see above). Other subcommands (intent-score, icp-match, dossier-build, voice-writer, sequence-builder, reply-classify, objection-tag, book-call, no-show-save, pipeline-report, sequence-audit) are planned, not yet built. |
| **ads** | `/ps:ads <new\|creative\|review>` | Meta (FB/IG) ads with the media-buying strategy built in. `new` is a select-driven campaign wizard (objective, conversion event, geo, budget with learning-phase math, naming, copy) that builds everything **paused** via the Meta Ads MCP; `creative` writes angle-based copy and designs placement-safe assets (feed 4:5 + story 9:16) in Pencil; `review` applies kill/keep/scale rules, marks winners and losers in a local JSON tracker with a kept copy of every asset, and proposes the next single-variable test. Data is **local, not version-controlled** (see above). |

All skills auto-detect the current repo — nothing is hardcoded to a single project.

## Install

```text
/plugin marketplace add psanders/psstack
/plugin install ps@psstack
```

Then use any skill as `/ps:<skill>`, e.g. `/ps:today`.

## Develop locally

Test without installing:

```bash
claude --plugin-dir ./plugins/ps
```

Hot-reload after edits with `/reload-plugins`. Validate before publishing:

```bash
claude plugin validate ./plugins/ps
```

## Update

After pushing changes here, users refresh with:

```text
/plugin marketplace update psstack
```

Versioning: bump `version` in `plugins/ps/.claude-plugin/plugin.json` to cut a release.
If left unbumped, the git commit SHA is used as the version (every commit counts as an update).

## Add a new skill

1. `mkdir -p plugins/ps/skills/<name>`
2. Write `plugins/ps/skills/<name>/SKILL.md` with `name` + `description` frontmatter.
3. Add a row for the skill in the **Skills** table above.
4. Bump `version` in `plugins/ps/.claude-plugin/plugin.json`.
5. `/reload-plugins` (or restart) to pick it up; invoke as `/ps:<name>`.

## Add an expert

Copy a file in `plugins/ps/agents/`, keep its sections (Scope, Planning checklist, Review red
flags, Output, References with checked links), keep it generic, and add it to the roster and keyword map in `plugins/ps/process/experts.md`.
