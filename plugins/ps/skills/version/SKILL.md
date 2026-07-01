---
name: version
description: Report which version of the ps (psstack) plugin is currently running, so you can confirm whether recent skill changes have been picked up. Use when the user asks "what version", "which psstack version", "is my latest change live", or runs /ps:version.
license: MIT
metadata:
  author: psanders
  version: "1.0"
---

# Version — which psstack is running

Report the version of the **currently loaded** `ps` plugin so Pedro can confirm whether a
recent skill change has actually propagated into the running install (source → GitHub →
marketplace → cache).

## What to do

1. Resolve this skill's own directory (the `version` skill runs from inside the installed
   plugin copy — typically under `~/.claude/plugins/cache/psstack/ps/<version>/skills/version`
   or `.../marketplaces/psstack/...`). The plugin manifest sits two levels up at
   `../../.claude-plugin/plugin.json` relative to the skills directory.
2. Read that `plugin.json` and extract `"version"`. This is the **running** version, the one
   that matters, because the cache is keyed by version.
3. Also report, when available:
   - The **cache path** the running copy resolved from (shows cache vs marketplace vs source).
   - The **source repo** version at `~/Projects/psstack/plugins/ps/.claude-plugin/plugin.json`
     and its latest git commit (`git -C ~/Projects/psstack log --oneline -1`), so Pedro can
     see if source is ahead of what's installed.
4. If the source version is newer than the running version, say so plainly and remind that a
   plugin update + session restart is needed to pick it up (the cache is keyed by version,
   so a version bump is required for the new copy to be built).

## Output

Keep it to a few lines:

```
Running ps: 0.16.0  (cache: ~/.claude/plugins/cache/psstack/ps/0.16.0)
Source ps: 0.16.0   (~/Projects/psstack @ <short-sha> "<subject>")
Status: in sync ✓        # or: source is ahead — update + restart to pick it up
```
