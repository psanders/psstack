# Picking improvement work

Principles kept from the retired `/ps:kaizen` skill. They guide which repo-health work is
worth an issue; the work itself goes through the normal pipeline (Reporter, `ready`,
Implementer), never straight to a branch.

- **One improvement per change.** A small fix that lands beats a large one that stalls. If
  the best idea is large, file its first thin slice.
- **Score by leverage:** `impact / (effort × risk)`, each 1 to 5. Prefer high impact, low
  effort, low risk.
- **Evidence, not vibes.** Cite files, lines, CI runs or timings that show the friction.
- **Look across lenses**, not just code: developer experience, CI, deploy, code quality,
  tests, security, dependencies, docs, shared components, and dead weight to prune.
- **Pruning counts.** Removing dead code, zombie dependencies, unused features and
  gold-plated abstractions is improvement too.
- **Quality of life over features.** A feature isn't an improvement; it's a feature issue.
