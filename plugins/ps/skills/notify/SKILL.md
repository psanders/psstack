---
name: notify
description: Call Pedro's attention when work is done or blocked — a beep, then a short spoken line (macOS `say`) saying what finished or how he can help. Invoked as /ps:notify [task] — with a task, do it and notify at the end; with none, notify at the end of the current work. Use when the user runs /ps:notify, or asks to "beep when done", "say when you finish", "let me know out loud", "call my attention when finished", or similar.
license: MIT
metadata:
  author: psanders
  version: "1.0"
---

# Notify — beep and say when done

Pedro steps away while long work runs. This skill makes sure he hears when it stops: a
**beep** to get his attention, then **`say`** to tell him, in one breath, what happened and
what (if anything) he needs to do.

## Arming it

- **`/ps:notify <task>`** — the argument is the task. Do it exactly as if he had asked for it
  directly (load any other skill it needs), then notify at the end. If the task starts with
  another command (`/ps:notify /ps:report the login page 500s`), invoke that skill with the
  rest as its arguments, and follow it as written; notify only adds the sounds.
- **`/ps:notify`** with no argument — notify at the end of the work already underway in this
  conversation, or of the next task he gives if nothing is underway.
- Mentioned in a prompt ("…and beep when you're done") — same as with a task.

Once armed, it stays armed until that task is over. It is not a standing rule for the rest of
the session unless he says so ("keep beeping", "do this for everything today").

## When to notify

Notify at every point where the turn ends and the next move is Pedro's:

1. **Finished** — the task is done (or done as far as it can go).
2. **Blocked** — you need a decision, an approval, a permission or a manual step from him
   before you can continue. Notify *before* asking (before `AskUserQuestion`, or before the
   final message that asks), so the sound arrives with the question.
3. **Failed** — something broke that you can't get past on your own.

Don't notify for intermediate progress, and don't notify more than once for the same stop.

## How

Run both as the **last tool call of the turn**, in one Bash call, beep first:

```bash
osascript -e 'beep' && say "<message>"
```

(There's no `beep` binary on macOS; `osascript -e 'beep'` plays the system alert sound.)

The message is spoken, so write it for the ear:

- **One or two short sentences**, under ~25 words. Start with the outcome.
- Plain words only: no paths, URLs, code, long numbers, markdown or emoji. Say "the review PR", not "pull request one two three four".
- Say what he needs to do, if anything: "Ready for your review", "I need you to pick a
  layout", "Tests are failing, take a look".
- Escape it for the shell: wrap in double quotes and avoid `"`, `$` and backticks inside.

Examples:

```bash
osascript -e 'beep' && say "Done. The migration ran and all tests pass."
osascript -e 'beep' && say "I'm blocked. I need you to approve the push to main."
osascript -e 'beep' && say "Finished, but two tests still fail. Details are in the terminal."
```

Then write the normal final message in the terminal — the spoken line is a pointer to it,
not a replacement.

## If it can't run

Not on macOS, or `say` / `osascript` missing or failing: skip the sound, don't retry or
install anything, and add one line to the final message saying the notification couldn't
play.
