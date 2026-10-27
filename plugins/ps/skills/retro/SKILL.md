---
name: retro
description: Run a retrospective on a session recorded with /ps:record and turn what went wrong into fixes to psstack. Reads the run log, checks its claims against the session's transcript (found by the run id), finds the friction, deviations, user corrections and stalls that clear the bar, and proposes one fix each; on approval commits them on a findings branch in psstack and records them in the log. Use when the user wants a retro, to review or learn from a past run, find what went wrong in a session, improve the process from a run, or runs /ps:retro.
license: MIT
metadata:
  author: psanders
  version: "1.0"
---

# Retro

Come back to a recorded run, find what went wrong, and fix the process so it doesn't happen
again. You work in psstack, after the fact. The recorded session is evidence; never act
in its repo.

**Input:** a run id (`/ps:retro 2026-10-26-routr-config`). Without one, list the logs in
`~/Projects/psstack/data/runs/` that have no `## Learnings` section, newest first, and ask
which (`process/README.md` § Asking the user).

## 1. Gather the evidence

- **Log:** `~/Projects/psstack/data/runs/<run id>.md`. Read it whole.
- **Transcript:** the session file whose text contains the marker, excluding your own:

```bash
grep -l "ps-run: <run id>" ~/.claude/projects/*/*.jsonl | grep -v <your session id>
```

  Several matches mean the run was resumed; read them in time order. No match: work from the
  log alone and say so. Never guess a transcript by recency.

- **Version:** the log's `Plugin:` line names the version that ran. Diff it against the
  current `main` of psstack (`git log`, the plugin's version history) before proposing
  anything: a learning already fixed since that version is closed, not open.

## 2. Check the log against the transcript

The log is the session's own account; the transcript is what happened. Read the transcript's
user messages, questions, skill loads, `gh`/`git` commands and tool errors, not every
reasoning step, and look for what the log missed or softened:

- a user correction or frustration the log doesn't quote;
- a skill step skipped or reordered without a Deviation entry;
- an outward action taken without the confirmation its skill requires;
- a loop that repeated, or a stall where the agent asked, waited or refused without need;
- a tool error the agent worked around silently.

Add each to the findings with the transcript evidence (the quoted line, the command).

## 3. Decide what clears the bar

Apply `process/experts.md` § The bar, to the process: a skill that contradicts itself or the
user, a step that can't work as written, a gap the agent had to improvise around, a risky or
outward action, a loop that isn't stopping, or a user correction that will recur. Drop the
rest, including repo facts that belong in the repo's AGENTS.md (say so, for `/ps:adopt`) and
one-off mistakes the process already forbids.

Show the user the findings that remain, one per line: what happened, the evidence, and the
fix you propose (the file and the change). Then ask which to apply, as one multi-select
question.

## 4. Fix the process

In `~/Projects/psstack`, on branch `fix/<run id>` from an up-to-date `main` (or reuse it when
resuming the same run):

- One small commit per learning, with the run's evidence in the message, never the log
  itself: the log holds repo internals and psstack is public.
- Rules go in `process/`, procedure in the skill (`process/README.md` § Changing the process:
  replace the old rule, never keep both).
- Bump the plugin's patch or minor version once per run, not per commit.

## 5. Close

- Append a `## Learnings` section to the run log: each fix with its commit, each finding
  dropped with a one-line reason, and anything left open.
- Summarize for the user: what went wrong, what was fixed, what's still open. A fix applies to
  sessions started after the plugin updates, not to ones already running.
- Offer to push the findings branch and open one PR; push only when they say so.
