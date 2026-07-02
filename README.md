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
        └── skills/
            └── kaizen/
                └── SKILL.md
```

Pedro's social performance data (shared by `/ps:post` and `/ps:post-pulse`) lives
version-controlled at the repo root in `data/social/` — not inside the plugin, so a
marketplace reinstall never clobbers it. See `data/social/README.md` for the schema.

## Skills

| Skill | Invoke | What it does |
| :--- | :--- | :--- |
| **ship** | `/ps:ship [change]` | Drive ONE OpenSpec change to production-ready through fixed stages — design (Pencil) → spec reconcile → build (Storybook-first) → tests (unit + e2e) → sync → archive. Resumable across sessions via a per-change checkpoint. |
| **docs** | `/ps:docs [topic]` | Write or update ONE documentation page through fixed stages — purpose narrative → sources → placement → Diátaxis-typed outline → Pencil assets → Mintlify MDX → proof → wire into nav. Mintlify-first, repo-agnostic; resumable via a per-doc checkpoint. |
| **kaizen** | `/ps:kaizen [lens]` | Daily 1%-better pass — surveys a repo, picks ONE high-leverage improvement, proposes it, applies on approval, and logs to a per-repo ledger. |
| **today** | `/ps:today [filter]` | Morning radar for the current repo — open issues, PRs that need you, and pending releases that shouldn't pile up, grouped and ready to act on. (Alias: `/ps:issues-daily`.) |
| **issues-report** | `/ps:issues-report [desc]` | File a structured GitHub issue (bug/feature/chore) in the current repo. |
| **release-card** | `/ps:release-card [tag] [--color fonoster-green\|blue\|orange] [--logo Routr]` | Generate a branded release-notes image (PNG) for a repo's latest GitHub release — groups the actual commit messages by conventional-commit type (🎉 Features, 🐛 Bug Fixes, …) with short-SHA chips, on a white 1080×1350 social card, via satori + resvg. |
| **post** | `/ps:post [--network linkedin\|twitter]` | Draft a social post in Pedro's voice for LinkedIn (default) or Twitter/X — picks the content pillar, applies the voice signatures, adds one matching CTA, and shapes length/glyphs/threading to the network. Never uses the em-dash. Drafts from the proven exemplars in the performance store. |
| **post-pulse** | `/ps:post-pulse [week\|month] [--network linkedin\|twitter\|all]` | Recurring engagement harvest — opens a browser, sweeps a window of Pedro's posts, reads impressions/reactions/comments/reposts, and saves it as structured time-series data in `data/social/`. Promotes high performers to exemplars so `/ps:post` drafts from what works. Run weekly/monthly. |
| **create-validated-function** | `/ps:create-validated-function` | Scaffold one validated function (factory + DI + Zod validation + structured errors) and its sinon test in an existing repo. Reuses bootstrap's canonical templates. |
| **bootstrap** | `/ps:bootstrap` | Scaffold a new TS/Node project from my opinionated baseline. Presents recurring dependency groups (Prisma SQLite/Postgres, tRPC, Vite+React+Tailwind, Tauri, Expo, oclif CLI, LangChain LLM, Storybook, docs/media, Playwright/Maestro E2E) plus opt-in workflow tooling (psstack commands, OpenSpec) as choices, confirms the stack, then scaffolds Zod-validated functions with DI + mocha/sinon tests + tooling. |
| **executive-report** | `/ps:executive-report` | Turn raw project notes into a polished, branded biweekly executive report PDF — anonymizing teammate and customer names along the way. |

All skills auto-detect the current repo — nothing is hardcoded to a single project.

## Install

```text
/plugin marketplace add psanders/psstack
/plugin install ps@psstack
```

Then use any skill as `/ps:<skill>`, e.g. `/ps:kaizen`.

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
