# The delivery process

How Pedro takes work from a report to a merged PR, written once and reused in every repo.
Everything here is plain Markdown that any agent or person can read. The `ps` plugin only
wires these files into skills and subagents; no rule lives in a vendor-specific file.

## Where decisions live

| Kind of decision | Home | Example |
| :--- | :--- | :--- |
| How Pedro engineers, everywhere | `process/*.md` (this folder) | Every PR needs a `ready` issue |
| How Pedro writes code | `process/coding/<profile>.md` | The validated-function pattern |
| What is true in one repo | That repo's `AGENTS.md` | "Merge routr PRs one at a time" |
| What must never break | A CI check or a hook | "No PR without a linked issue" |

The repo's AGENTS.md wins over this folder where they overlap. A request in the
conversation wins over both. Repos never get a `CLAUDE.md`, `.cursorrules`,
`copilot-instructions.md` or similar: AGENTS.md is the cross-tool standard, and Claude Code
reads it directly when no `CLAUDE.md` exists.

## The pipeline

```
report or idea
  -> Reporter     /ps:report          asks, triages, investigates, consults experts, bisects
  -> Gate 1       human               applies `ready` to the plan
  -> Implementer  /ps:implement       refuses unclear work; the only agent that writes code
  -> Reviewer     /ps:review          committee of experts with clean context; reruns Verify
  -> Gate 2       human               approves and merges
```

Experts (`../agents/`) advise every stage and never write. Each stage has exactly one writer.

## Files

| File | What it defines |
| :--- | :--- |
| [issue-format.md](issue-format.md) | The Brief (for humans) and the Spec (for the implementer) |
| [readiness.md](readiness.md) | The gates: what `ready` means, the Implementer's refusal check |
| [labels.md](labels.md) | The label vocabulary every skill uses |
| [loop-limits.md](loop-limits.md) | Hard limits on retries and rounds, and the one way to stop |
| [experts.md](experts.md) | The expert roster, how experts are picked, their output contract |
| [agents-md-contract.md](agents-md-contract.md) | The AGENTS.md sections the skills read |
| [improvement.md](improvement.md) | How to pick repo-health work worth an issue |
| [research.md](research.md) | Why the process looks like this, with sources |
| [coding/](coding/) | Coding profiles a repo can declare, their templates and stack menus |

## Changing the process

A change here is a commit with the reason in its message, and a version bump of the plugin.
When a rule changes, replace the old rule; never keep both. If a rule must always hold, add a
check that enforces it, because text is advice.
