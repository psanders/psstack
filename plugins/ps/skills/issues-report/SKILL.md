---
name: issues-report
description: Create a structured GitHub issue (bug, feature, or chore) in the current repo. Use when the user wants to file or report an issue, or runs /ps:issues-report.
license: MIT
metadata:
  author: psanders
  version: "1.0"
---

# Report Issue

Create a well-structured GitHub issue in **the repo you're currently in**. Repo-agnostic — works in any git repo with a GitHub remote.

**Input**: The argument (if any) is a free-form description of the issue. If none given, ask.

---

## Steps

### 0. Detect the repo

```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
```

If this fails, stop and tell the user: run inside a git repo with a GitHub remote, authenticated via `gh` (`gh auth status`). Use `$REPO` in the create command below.

### 1. Gather information

If no input was provided, use **AskUserQuestion** (one call):
- "What do you want to report?" (open text)
- "Type?" with options: Bug, Feature, Chore

If input was provided as args, infer the type from context ("broken", "error", "crash" → Bug; "add", "support", "allow" → Feature; "cleanup", "refactor", "update" → Chore). If ambiguous, ask.

### 2. Ask for priority (skip if already given)

Use **AskUserQuestion** — "Priority?": P0 – Blocking, P1 – High, P2 – Normal (Recommended), P3 – Low.

### 3. Draft the issue body

Use the matching template:

**Bug:**

```
## Summary
<one sentence>

## Steps to Reproduce
<numbered steps or "TBD">

## Expected Behavior
<what should happen>

## Actual Behavior
<what actually happens>

## Priority
<P0/P1/P2/P3>
```

**Feature:**

```
## Summary
<one sentence>

## Problem / Motivation
<pain point>

## Proposed Solution
<what to build>

## Acceptance Criteria
- [ ] <criterion>

## Priority
<P0/P1/P2/P3>
```

**Chore:**

```
## Summary
<one sentence>

## Why Now
<what it unblocks>

## Done When
- [ ] <criterion>

## Priority
<P0/P1/P2/P3>
```

### 4. Show preview and confirm

Print the title and body. Ask with **AskUserQuestion** — "Create this issue?": Yes, create it / Edit first / Cancel. On "Edit first": ask what to change, update, show again, confirm. On "Cancel": stop.

### 5. Create the issue

Map type to a label, but only apply labels that actually exist in this repo — different repos use different label sets. Check first:

```bash
gh label list --repo "$REPO" --json name -q '.[].name'
```

Default mappings (use the repo's nearest equivalent; skip the label if none exists): Bug → `bug`, Feature → `enhancement`, Chore → `documentation`/`chore`. Priority: apply a `P0`/`P1`/`P2`/`P3` (or `priority:*`) label only if the repo has one; otherwise the priority stays in the body.

```bash
gh issue create \
  --repo "$REPO" \
  --title "<title>" \
  --body "<body>" \
  --label "<label>"   # omit --label entirely if no matching label exists
```

Print the issue URL on success.

## Guardrails

- Title must start with `[Bug]`, `[Feature]`, or `[Chore]`.
- Never create the issue without user confirmation.
- Only pass `--label` for labels confirmed to exist in the repo.
- If `gh` fails, show the error and suggest `gh auth status`.
