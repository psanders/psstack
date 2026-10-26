---
name: observe
description: Watch another Claude Code session run a psstack process (report, implement, review) and capture learnings live. Generates a run id, a log path and the prompt to paste into the session under test (it then keeps an append-only run log in a fixed format), finds that session's transcript by the run id, and follows the transcript, the run log and the repo's GitHub activity read-only. Turns the user's remarks and the run's friction into psstack fixes on a findings branch. Use when the user wants to test, observe, monitor or watch a process run, or runs /ps:observe.
license: MIT
metadata:
  author: psanders
  version: "1.0"
---

# Observe

Watch a process run in another session and turn what goes wrong into fixes to the process.
You are an observer: read-only toward the session under test. You never message it, never
act in its repo, and never approve anything on the user's behalf. Your output is fixes to
psstack and notes to the user.

**Input:** an optional run name (`/ps:observe routr-config`). Without one, ask for the repo
and a two-word name, one question at a time (`process/README.md` § Asking the user).

## 1. Set up the run

- **Run id:** `<YYYY-MM-DD>-<repo>-<name>`, lowercase, hyphens only.
- **Log path:** `~/Projects/psstack/data/runs/<run id>.md`. The folder is git-ignored apart
  from its README: logs hold repo internals, so learnings leave it only as process fixes.
- **Findings branch:** in `~/Projects/psstack`, branch `fix/<run id>` from an up-to-date
  `main` (or reuse it when resuming the same run).

## 2. Give the user the prompt

Print this, with the run id and log path filled in, for the user to paste as the first
message of the session under test:

```text
ps-run: <run id>

This is a test run of the psstack delivery process. Follow the skills exactly; don't take
shortcuts to make the run look good. Everything you create is real (issues, PRs, labels), so
the skills' own rules about confirmation and outward actions apply as written.

Keep an append-only run log at <log path> (create the folder if needed). One entry per step:

## <HH:MM> <stage> — <skill or action>
- Did: <what you ran or decided, with the command>
- Result: <outcome, with links to issues, PRs or comments>
- Friction: <what was unclear, missing, contradictory or slow in a skill or process file,
  naming the file and section> (or "none")
- Deviation: <where you didn't follow the skill as written, and why> (or "none")

Stages: report, gate-1, implement, review, gate-2. Also log every expert you consulted with a
one-line result, every loop counter you checked, and every time you stop or refuse. When the
process doesn't cover a situation, log it as Friction rather than improvising quietly.

Start with: <skill and input, e.g. /ps:report "<one-sentence idea>" or /ps:implement 458>
```

Ask the user for the `Start with:` line first (one question). Then say you'll start watching
once they've sent it.

## 3. Find the session

Session transcripts live in `~/.claude/projects/<project path with / replaced by ->/` as
`<session id>.jsonl`. The one under test is the transcript, other than yours, whose text
contains `ps-run: <run id>`:

```bash
grep -l "ps-run: <run id>" ~/.claude/projects/*/*.jsonl | grep -v <your session id>
```

No match yet: wait until the user confirms the prompt was sent, then look again. Never guess
a transcript by recency alone.

## 4. Watch

Arm three background monitors, each for the maximum duration, and re-arm each when it
expires until the run ends:

1. **Session:** `python3 ${CLAUDE_PLUGIN_ROOT}/skills/observe/scripts/watch_session.py <transcript>`
   streams one line per skill, subagent, `gh`/`git` command, question to the user and tool
   error.
2. **Run log:** `tail -n 0 -F <log path>`, filtered to step headings and to Friction or
   Deviation lines that aren't "none".
3. **GitHub:** poll the repo every 45 seconds for issues and PRs created or changed since the
   run started, plus check runs on open PRs; emit only what changed.

Catch up first: read the log and the transcript's tool calls so far.

## 5. Advise the user, fix the process

For each event, decide whether it clears the bar (`process/experts.md` § The bar, applied to
the process): a skill that contradicts itself or the user, a step that can't work as
written, a gap the agent had to improvise around, a risky or outward action, or a loop that
isn't stopping. Stay quiet otherwise.

- **Tell the user** in two or three lines: what happened, and why it matters.
- **When the user is answering the session's questions,** you may suggest an answer with
  evidence (a file, a pattern in a sibling repo, a standard). The user decides.
- **Fix the process** on the findings branch: one small commit per learning, with the run's
  evidence in the message. Rules go in `process/`, procedure in the skill. Bump the plugin's
  patch or minor version once per run, not per commit.
- **Never message the session under test**, even to relay the user. The run tests the process
  as written; a relayed note contaminates it and can't stand in for the user's approval.

## 6. Close the run

When the run reaches its last stage, or the user ends it:

- Stop the monitors.
- Append a `## Learnings` section to the run log: each fix with its commit, and anything left
  open.
- Summarize for the user: what worked, what was fixed, what's still open. Offer to push the
  findings branch and open one PR; push only when they say so.
