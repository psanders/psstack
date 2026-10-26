# The AGENTS.md contract

Every repo keeps its own facts and decisions in one file, `AGENTS.md` at the repo root
([agents.md](https://agents.md/)). Large monorepos may add a nested AGENTS.md per package; the
nearest one wins. The skills read the sections below by name. A missing section falls back to
the generic default and the skill says so, except `## Conventions`, which the Implementer
requires (see `readiness.md`).

`/ps:adopt` drafts this file from the repo for a human to review.

## Sections

```markdown
# AGENTS.md

## Overview
One paragraph: what this repo is, who uses it.

## Commands
Install, build, test, lint, and how to run one package's tests.
Default Verify per area when an issue doesn't give a narrower one.

## Conventions
Profile: typescript | repo-native
Overrides: <deviations from the profile, each with its reason>
Examples: <2-3 files that show the house style, for repo-native>

## Areas
| Area label | Paths | Experts |
| area: sip-core | mods/edgeport, mods/dispatcher | realtime-comms-engineer |

## Compatibility
What counts as a breaking change here: public APIs, CLI flags, env vars,
config schemas, database schemas, wire behavior.

## Risk hotspots
Paths where Risk defaults to High, and why.

## Release
How merges become releases, and anything to avoid (e.g. merge one PR at a time).

## Expert notes
### realtime-comms-engineer
Facts only true here: RFCs followed, interop targets, known quirks.

## Decisions
Dated one-liners of settled choices agents must not reopen.
- 2026-10-26: Issues that can't be stated in one sentence are closed as not planned.
```

## Rules

- **Facts and decisions only.** No generic advice ("write clean code") and nothing the
  process files already say.
- **`Profile: repo-native`** means: follow the style of the files under `Examples`, and
  never introduce a psstack profile's patterns. Older repos use this.
- **`Profile: typescript`** loads `process/coding/typescript.md` and its templates.
- **Decisions** replace each other. When one changes, edit the line and let git history keep
  the old one; never leave both.
- **No vendor files.** Don't add `CLAUDE.md`, `.cursorrules`, `copilot-instructions.md` or
  similar. Claude Code reads AGENTS.md only when there is no `CLAUDE.md`.
