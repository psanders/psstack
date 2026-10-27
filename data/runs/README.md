# Process run logs

The local, **git-ignored** logs written by `/ps:record`. The recorded session appends one
entry per step (Did, Result, Friction, Deviation) to `<run id>.md` here, and `/ps:retro`
adds a `## Learnings` section when it reviews the run.

## Why this is NOT version-controlled

Logs quote repo internals, unreleased work and command output from the recorded session.
psstack is a public repo, so only this `README.md` is tracked. What a run teaches leaves this
folder as commits to `plugins/ps/process/` and the skills, with the evidence in the commit
message.

**Consequence: local-only.** Back it up yourself if you want old runs to survive the machine.
