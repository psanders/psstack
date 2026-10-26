---
name: today
description: Your morning radar for the current repo — where every issue and PR stands in the delivery pipeline with its next command, plus PRs needing you and pending releases that shouldn't pile up. Use when the user wants to know what to pay attention to today, triage, or pick work, or runs /ps:today.
license: MIT
metadata:
  author: psanders
  version: "1.0"
---

# Today — what needs your attention

Fan out across **the repo you're currently in** and surface the things worth a daily look — the **pipeline** (where each issue and PR stands, and the one command that moves it), other **issues** to pick up, **PRs** that need you, and **pending releases** that shouldn't pile up — then offer to act. Repo-agnostic: works in any git repo with a GitHub remote.

**Input**: Optional filter arg — one of: `pipeline`, `issues`, `prs`, `releases`, `mine`, `bug`, `feature`, `chore`, `P0`, `P1`. Default: scan every section.

---

## Steps

### 0. Detect the repo

Resolve the current GitHub repo so nothing is hardcoded:

```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
ME=$(gh api user -q .login)
```

If `gh repo view` fails, stop and tell the user: this skill must run inside a git repo with a GitHub remote, and `gh` must be authenticated (`gh auth status`). Use `$REPO` (or omit `--repo` to let `gh` infer) in every command below.

If a filter arg is given, run only the matching section(s): `pipeline` → Section 1 only; `issues` / `bug` / `feature` / `chore` / `P0` / `P1` → Section 2 only; `prs` → Section 3 only; `releases` → Section 4 only; `mine` → narrow every section to things assigned to / authored by / requested of `$ME`.

### 1. Pipeline — where each item stands

One GraphQL query fetches every issue carrying a process label (`labels.md`) with the open PRs that close it, and every open PR with its labels, closing issues and recent comments:

```bash
gh api graphql -F owner="${REPO%/*}" -F name="${REPO#*/}" -f query='
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    issues(states: OPEN, first: 100, labels: ["needs-triage", "needs-info", "ready", "not-ready", "blocked", "needs-human"]) {
      nodes { number title createdAt authorAssociation url
        labels(first: 20) { nodes { name } }
        assignees(first: 5) { nodes { login } }
        comments(last: 5) { nodes { body } }
        closedByPullRequestsReferences(first: 5, includeClosedPrs: false) { nodes { number state } } }
    }
    pullRequests(states: OPEN, first: 100) {
      nodes { number title createdAt url
        author { login }
        labels(first: 20) { nodes { name } }
        closingIssuesReferences(first: 5) { nodes { number } }
        comments(last: 20) { nodes { body } } }
    }
  }
}'
```

Put each item in the **first** group that matches:

| Group | Rule | Next |
| :--- | :--- | :--- |
| Stuck | Issue or PR labeled `blocked` or `needs-human` | Pedro decides; quote the latest blocker comment's **Needs:** line |
| Refused | `not-ready` | `/ps:report <n>` |
| In progress | `ready`, and an OPEN PR in `closedByPullRequestsReferences` | By that PR's latest `<!-- ps:event review-round -->` comment: none → `/ps:review <pr>`; "Changes needed" → `/ps:implement <n>`; "Ready for human review" → Pedro reviews and merges |
| Ready to build | `ready`, no open closing PR | `/ps:implement <n>` |
| Waiting on reporter | `needs-info` | none; nudge if older than 14 days |
| Waiting for triage | `needs-triage`; flag `external` when labeled so or `authorAssociation` is not OWNER/MEMBER/COLLABORATOR | `/ps:report <n>` (no agent acts on these) |
| PRs without an issue | Open PR labeled `needs-issue`, or with no `closingIssuesReferences` | `/ps:report <pr>` |

Age is days since `createdAt`. Skip empty groups. An issue shown here is left out of Section 2, and a PR shown here is left out of Section 3, so nothing is listed twice. If the repo has none of the process labels, skip this section silently. For `mine`, keep items assigned to or authored by `$ME`.

### 2. Issues — what to pick up

```bash
gh issue list --repo "$REPO" --state open --limit 50 --json number,title,labels,assignees,createdAt,url
```

Group by type label (`bug`, `enhancement`/feature, `documentation`/chore, unlabeled). Label names vary across repos — match common synonyms (`feature`→`enhancement`, `chore`→`documentation`/`maintenance`) and fall back to "unlabeled" when a type can't be determined.

Within each group, sort by priority: P0 first, then P1, P2, P3, unlabeled last. Extract priority from labels (`P0`/`priority:high`/etc.); otherwise infer from a title prefix like `[P0]`; otherwise mark `–`. For `mine`, keep only issues assigned to `$ME`.

### 3. PRs — what needs you

```bash
gh pr list --repo "$REPO" --state open --limit 50 --json number,title,author,isDraft,reviewDecision,reviewRequests,createdAt,updatedAt,mergeable,url
```

Bucket each open PR into the **first** category that applies, so nothing is listed twice:

- **Review requested of you** — `$ME` appears in `reviewRequests`. These are blocking someone else; surface first.
- **Yours, ready to merge** — author is `$ME`, not a draft, `reviewDecision == "APPROVED"` and `mergeable == "MERGEABLE"`. Land these to clear the deck.
- **Yours, needs work** — author is `$ME`, `reviewDecision == "CHANGES_REQUESTED"` or draft. Your court.
- **Stale** — `updatedAt` older than 7 days, any author. Going quiet; nudge or close.

Omit empty buckets. For `mine`, drop the "Stale, other authors" entries (keep only your own).

### 4. Pending releases — don't let it pile up

Surface two signals so unreleased work doesn't accumulate:

```bash
# Latest release/tag, and how many commits have landed since it
gh release view --repo "$REPO" --json tagName,publishedAt -q '.tagName' 2>/dev/null
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null)
git log --oneline "${LAST_TAG}..HEAD" 2>/dev/null | wc -l
git log --oneline "${LAST_TAG}..HEAD" 2>/dev/null | head -20

# Any draft releases sitting around
gh release list --repo "$REPO" --limit 10 --json tagName,isDraft,isPrerelease,publishedAt
```

Report: the last released tag, the count of unreleased commits since it (with a quick conventional-commit-type breakdown — feat/fix/etc. — when the messages support it), and any **draft** releases. If there are no commits since the last tag and no drafts, say "Nothing pending — last release is current." If the repo has no tags yet, note that it has never been released.

### 5. Display

One compact briefing, sections in order, empty sections omitted:

```
TODAY · <repo>

PIPELINE
  stuck                #141  9d  Flaky SIP timer test      needs: a decision on the timeout
  refused              #138  4d  Add OPTIONS keepalive     → /ps:report 138
  in progress          #135  6d  Fix WS header case        PR #454 → /ps:review 454
  ready to build       #142  1d  Trim log noise            → /ps:implement 142
  waiting on reporter  #120 20d  Crash on reINVITE         nudge
  waiting for triage   #144  0d  No audio behind NAT (external)  → /ps:report 144
  PR without issue     #431  1d  WhatsApp interconnect     → /ps:report 431

ISSUES (N)
  #123  P1  Short title                             <url>
  #130  P1  Add export                               <url>

PRS NEEDING YOU (N)
  ↳ review requested   #88  Fix race in scheduler    <url>
  ↳ ready to merge     #91  Bump deps                 <url>
  ↳ needs work         #93  WIP export (draft)        <url>
  ↳ stale 12d          #70  Old refactor              <url>

PENDING RELEASE
  last: v0.13.0 · 7 commits unreleased (4 feat, 2 fix, 1 chore)
  draft: v0.14.0
```

Stuck items go first in the briefing because only Pedro can move them. If every section is empty, print: "All clear — no open issues, no PRs needing you, nothing to release."

### 6. Offer to act

After displaying, ask with **AskUserQuestion** — "What do you want to do?". Offer only actions relevant to what was surfaced:

- **Run the next command** for a pipeline item (enter number)
- **Work on an issue** (enter number)
- **Review an issue** (assess status / linked PR)
- **Review a PR** (open one needing you)
- **Cut a release** (when commits are pending)
- **Report a new issue**
- **Nothing, just browsing**

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

**If "Review a PR":** ask for the number (or take the obvious one if only a single PR needs you). If this repo provides a review workflow (e.g. a `/code-review` or `/review` skill), offer to invoke it; otherwise show the diff with `gh pr view <number> --repo "$REPO"` and `gh pr diff <number> --repo "$REPO"` and assess it in the conversation. Never approve, merge, or comment without explicit confirmation.

**If "Cut a release":** if this repo provides a release workflow (e.g. a `/ps:release-card` skill or a release script), offer to invoke it; otherwise summarize the unreleased commits as draft release notes grouped by conventional-commit type, and confirm before running any `gh release` command.

**If "Report a new issue":** invoke the `/ps:report` skill.

**If "Nothing":** done.

## Guardrails

- Read-only by default. Never comment, close, approve, merge, tag, or publish a release without explicit user confirmation.
- Max 50 issues and 50 PRs per fetch; note if a list may be truncated.
- An issue or PR appears in at most one group or bucket across the whole briefing (first match wins) so it stays scannable.
- If `gh` fails, show the error and suggest `gh auth status`. If `git describe` finds no tags, treat the repo as never-released rather than erroring.
