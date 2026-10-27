---
name: record
description: Record THIS session while it runs a psstack process (report, implement, review) or any other task, so it can be reviewed later with /ps:retro. Starts a run id and an append-only log in a fixed format — one short entry per step with what was done, the result, the friction and any deviation from the skill — and puts a marker in the transcript so the session can be found again. Logs decisions and problems, not the conversation. Use when the user wants to record a session, log this session, keep a run log, or runs /ps:record.
license: MIT
metadata:
  author: psanders
  version: "1.0"
---

# Record

Log this session as it works, so that someone can come back later, read the log and the
transcript, and find what went wrong (`/ps:retro`). The log is evidence, not a diary: it
records what was decided and what got in the way, never the conversation itself.

Recording changes nothing about the work. Follow the skills exactly, as you would without it;
don't take shortcuts to make the log look good, and don't skip a skill's own rules about
confirmation and outward actions.

**Input:** an optional run name and the work to start (`/ps:record routr-config /ps:report
"..."`). Without a name, derive a two-word one from the work; don't ask.

## 1. Start the log

- **Run id:** `<YYYY-MM-DD>-<repo>-<name>`, lowercase, hyphens only.
- **Log path:** `~/Projects/psstack/data/runs/<run id>.md` (create the folder if needed). It is
  git-ignored apart from its README: logs hold repo internals.
- **Marker:** print `ps-run: <run id>` in your reply, on its own line, so `/ps:retro` can find
  this transcript by grepping for it.
- **Header:** write it once:

```markdown
# <run id>

- Plugin: ps <version> (<path of the plugin this session loaded skills from>)
- Repo: <owner/name>, branch `<branch>` at `<short sha>`
- Started with: <the user's request or command, verbatim>
- Log is append-only.
```

The plugin path is in the `Base directory for this skill:` line of this skill's load. Record
it: two sessions on one machine can run different versions, and a fix is judged against the
version that actually ran.

If the log already exists (the same run, resumed in a new session), append a `## <HH:MM>
resumed` entry instead of a new header.

## 2. Log each step

Append one entry per step of the process you are running (a numbered step of a skill, a
gate, a stop), not per tool call:

```markdown
## <HH:MM> <stage> — <skill and step, or action>
- Did: <what you ran or decided, with the command>
- Result: <outcome, with links to issues, PRs or comments>
- Friction: <what was unclear, missing, contradictory or slow in a skill or process file,
  naming the file and section> (or "none")
- Deviation: <where you didn't follow the skill as written, and why> (or "none")
```

Stages: report, gate-1, implement, review, gate-2, or `task` outside the delivery process.

Always log, even when it seems minor:

- every expert consulted, with a one-line result;
- every loop counter checked, and every stop, refusal or blocker report;
- every question to the user, and the answer in one line;
- every outward action (an issue, a label, a comment, a push, a PR) with its link;
- every correction from the user, quoted: it is the strongest evidence a run produces.

When the process doesn't cover a situation, log it as Friction rather than improvising
quietly.

**Keep it lean.** One to four lines per field. Name files and commands; don't paste their
contents, diffs or command output. Don't restate what the skill already says. A step that
went as written is two lines (`Friction: none`, `Deviation: none`) and that's fine.

Write the entry when the step ends, before the next one starts, so a crash or a cleared
context loses at most one step.

## 3. Close

When the work ends, or the user stops it, append:

```markdown
## <HH:MM> end
- Outcome: <where the work stands, with links>
- Worst friction: <the one or two things that cost the most, or "none">
```

Then tell the user the run id and the log path, and that `/ps:retro <run id>` reviews it.
Never fix psstack from this session: the recorded session stays a test of the process as
written.
