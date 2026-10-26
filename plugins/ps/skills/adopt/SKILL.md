---
name: adopt
description: Adopt the psstack delivery process in the current repo by drafting (or completing) its AGENTS.md from the code — overview, commands, conventions profile, area map, compatibility surface, risk hotspots, release, expert notes, decisions — for a human to review. Migrates a vendor-specific CLAUDE.md into AGENTS.md. Use when the user wants to set up a repo for the process, write or refresh AGENTS.md, or runs /ps:adopt.
license: MIT
metadata:
  author: psanders
  version: "1.0"
---

# Adopt

Give a repo the one file the process reads: `AGENTS.md`, with every section in
`${CLAUDE_PLUGIN_ROOT}/process/agents-md-contract.md`. Read that contract first; this skill
only fills it in. Draft from evidence in the repo, never from guesses, and leave a section
out rather than invent it.

## 1. What exists

- `AGENTS.md`: read it. List which contract sections are present, missing or thin.
- Vendor files: `CLAUDE.md`, `CLAUDE.local.md`, `.cursorrules`, `.github/copilot-instructions.md`,
  `GEMINI.md`. Each one's facts move into AGENTS.md sections; the file itself is deleted once
  the user approves, because the process keeps no vendor files and Claude Code ignores
  AGENTS.md while a `CLAUDE.md` exists.
- Nested AGENTS.md files in packages: note them; they stay.

## 2. Survey the repo

Gather evidence per section:

| Section | Evidence |
| :--- | :--- |
| Overview | README, package descriptions |
| Commands | `package.json` scripts, Makefile, CI workflows (what CI actually runs), per-package test commands |
| Conventions | Search for `withErrorHandlingAndValidation`, Zod schemas, the `create<Name>.ts` layout. Present → propose `Profile: typescript`. Absent → `Profile: repo-native` with 2-3 representative files as `Examples`. Never propose `typescript` for code that doesn't use it. |
| Areas | `area:` labels (`gh label list`) matched to directories; experts per area from `${CLAUDE_PLUGIN_ROOT}/process/experts.md` |
| Compatibility | Public APIs and protos, CLI commands and flags, env vars read at startup, config and DB schemas, wire protocols |
| Risk hotspots | Auth, migrations, protocol cores, release and deploy scripts; files with many recent fix commits (`git log --format= --name-only --grep '^fix'`) |
| Release | Release workflows, versioning tools, branch protection |
| Expert notes | Facts per expert role found in docs or code (RFCs referenced, interop targets) |
| Decisions | Existing docs and ADRs; anything the user states |

If you hold notes about this project from earlier sessions, propose the ones that are project
decisions (not personal preferences) as `## Decisions` lines, and say where each came from.

## 3. GitHub templates

Check where the repo's issue forms come from. If the org has a `.github` repo with the
process forms (`${CLAUDE_PLUGIN_ROOT}/templates/github/`), the repo should have no
`.github/ISSUE_TEMPLATE` folder and no `pull_request_template.md` of its own; propose deleting
them. If the org has none, propose installing the templates there first (filling in the
product links in `config.yml`), and merging `templates/github/labels.yml` into the org's label
source. Each is a pull request the user approves.

## 4. Draft and confirm

Show the full draft, section by section, marking each line's evidence source. Ask what to
change. Write `AGENTS.md` only after the user approves, and delete migrated vendor files only
with explicit approval.

Suggest a branch (`chore/agents-md`) and a commit; don't commit or push unless asked.

## Rules

- Facts and decisions only; no generic advice, nothing the process files already say.
- Every section is short. A reader should finish the whole file in two minutes.
- Unknown is fine: omit the section and list it under "Still missing" in your summary.
