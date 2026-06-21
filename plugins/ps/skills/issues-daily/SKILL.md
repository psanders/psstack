---
name: issues-daily
description: Pull open GitHub issues for the current repo grouped by type and priority, ready to pick work from. Use when the user wants to triage or pick today's work, or runs /ps:issues-daily.
license: MIT
metadata:
  author: psanders
  version: "1.0"
---

# Daily Issues

Fetch and display open GitHub issues for **the repo you're currently in** so the user can pick what to work on today. Repo-agnostic — works in any git repo with a GitHub remote.

**Input**: Optional filter arg — one of: `bug`, `feature`, `chore`, `P0`, `P1`, `mine`. Default: show all open.

---

## Steps

### 0. Detect the repo

Resolve the current GitHub repo so nothing is hardcoded:

```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
```

If this fails, stop and tell the user: this skill must run inside a git repo with a GitHub remote, and `gh` must be authenticated (`gh auth status`). Use `$REPO` (or omit `--repo` to let `gh` infer) in every command below.

### 1. Fetch issues

```bash
gh issue list --repo "$REPO" --state open --limit 50 --json number,title,labels,assignees,createdAt,url
```

### 2. Parse and group

Group issues by type label (`bug`, `enhancement`/feature, `documentation`/chore, unlabeled). Label names vary across repos — match common synonyms (`feature`→`enhancement`, `chore`→`documentation`/`maintenance`) and fall back to the "unlabeled" bucket when a type can't be determined.

Within each group, sort by priority: P0 first, then P1, P2, P3, unlabeled last. Extract priority from labels (`P0`/`priority:high`/etc.) if present; otherwise infer from a title prefix like `[P0]`; otherwise mark as `–`.

### 3. Apply filter (if arg given)

- `bug` → only the bug group
- `feature` → only the feature/enhancement group
- `chore` → only the chore group
- `P0` / `P1` → only that priority across all types
- `mine` → only issues assigned to `@me`

### 4. Display

Format as a clean table per group:

```
BUGS (N)
#123  P1  [Bug] Short title                  <url>
#117  P2  [Bug] Another bug                  <url>

FEATURES (N)
#130  P1  [Feature] Add export               <url>

CHORES (N)
#98   P3  [Chore] Update deps                <url>
```

Omit empty groups. If the total is 0, print: "No open issues. You're clear."

### 5. Offer to act

After displaying, ask with **AskUserQuestion** — "What do you want to do?":
- Work on an issue (enter number)
- Review an issue (assess status / linked PR)
- Report a new issue
- Nothing, just browsing

**If "Work on an issue":** ask for the number, then:

```bash
gh issue view <number> --repo "$REPO"
```

Show full details, then ask with **AskUserQuestion** — "How do you want to start?":
- Plan the approach first (Recommended)
- Jump straight to implementation
- Investigate / research only
- Close or comment on issue

For "Plan the approach first": if this repo provides a planning workflow (e.g. an `/opsx:explore` or `/opsx:propose` skill, or any spec/proposal skill), offer to invoke it with the issue title + summary as context; otherwise outline an approach in the current conversation before writing code. For "Jump straight to implementation": begin implementing (use a planning/proposal skill if one exists). For "Investigate / research only": investigate in the current conversation. For "Close or comment": ask for the comment text or confirmation, then run the appropriate `gh` command.

**If "Review an issue":** ask for the number, then assess current state instead of building:

```bash
gh issue view <number> --repo "$REPO" --json number,title,body,labels,state,url
gh pr list --repo "$REPO" --state all --search "<number>" --json number,title,state,url,headRefName
```

Then:
- Read the issue's acceptance criteria / expected behavior.
- Search the codebase (and any linked PR/branch) for the relevant implementation.
- Produce a verdict — **Done**, **Partial**, or **Not started** — checking each criterion against concrete evidence (cite `file:line`, commits, or PRs).
- Offer next steps with **AskUserQuestion**: Close as completed (post evidence comment, then close, on confirmation) / Comment with findings (leave open) / Start or continue work (fall through to "How do you want to start?") / Nothing.

**If "Report a new issue":** invoke the `/ps:issues-report` skill.

**If "Nothing":** done.

## Guardrails

- Never comment on or close an issue without explicit user confirmation.
- Max 50 issues per fetch; note if the list may be truncated.
- If `gh` fails, show the error and suggest `gh auth status`.
