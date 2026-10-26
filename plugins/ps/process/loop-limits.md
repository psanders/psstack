# Loop limits

Every agent and every coordinator must be able to stop. Each loop has a hard limit; hitting
it ends the loop with a blocker report. There are no silent retries, and an agent never works
around the obstacle it hit.

## Limits

| Loop | Limit | When it's hit |
| :--- | :--- | :--- |
| The same command fails with the same error | 2 attempts | Blocker report |
| Any step makes no progress (same diff, same failure, same finding) | 1 repeat | Blocker report |
| Reporter's cold read still lists questions | 3 rounds | File it with `needs-human` and the open questions |
| Reporter goes back to experts on an open point | 3 rounds | File it with `needs-human` and the open decision |
| Bisecting work into smaller issues | 2 levels deep, 6 issues total | Stop: too big for issues; propose a Discussion |
| Implementer refuses, Reporter fixes, Implementer refuses again | 2 refusals per issue | `needs-human` |
| Reviewer sends blocking findings back to the Implementer | 2 rounds per PR | `needs-human` |
| Expert consultations per stage | 4 experts | Pick the 4 most relevant; never all |

"Same error" means the same failing test, the same exit code and the same first error line.
Re-running in hope is not an attempt; changing something and re-running is.

## Counters live on the issue

Loops span sessions and agents, so their counters live where every agent can see them: on
the GitHub issue (or PR), as comments carrying a marker. A fresh session can't reset them by
accident.

```
<!-- ps:event implement-refused -->
<!-- ps:event review-round -->
<!-- ps:event cold-read-round -->
<!-- ps:event blocked -->
```

Before acting, a skill counts the markers that concern it
(`gh issue view <n> --json comments`). At the limit, it escalates instead of starting another
lap.

## The blocker report

Stopping has one shape. The agent posts this comment, applies `blocked` (or `needs-human`
when a limit was hit), and ends the session. It does not continue with other work in the
same issue.

- When **Needs** is a change to the issue (its Scope or Constraints are wrong or contradict
  each other), it also removes `ready`: the issue goes back through `/ps:report` and Gate 1.
  Otherwise `ready` stays, and the next run resumes once the blocker is cleared.
- Local work is committed on the issue's branch, never pushed, and the branch is named under
  **Tried**, so a later session can resume it or throw it away deliberately.

```markdown
<!-- ps:event blocked -->
**Blocked:** <one sentence: what stopped the work>

**Trying to:** <the step, and which acceptance criterion it serves>
**Tried:**
1. <attempt> → <result>
2. <attempt> → <result>

**Evidence:**
<the command and the relevant output, trimmed>

**Needs:** <what would unblock it> from <who: reporter, maintainer, a named expert>
```

## What counts as a blocker

- A loop limit above was hit.
- The work needs something outside the issue's Scope or Constraints to change.
- A required tool, credential, service or environment isn't available.
- The facts on the ground contradict the issue (the code moved, the bug no longer
  reproduces, the Verify command is wrong).
- A decision is needed that the issue, AGENTS.md and the process files don't settle.

Never a reason to stop: a style choice the repo's conventions already settle, or a question
the code answers.
