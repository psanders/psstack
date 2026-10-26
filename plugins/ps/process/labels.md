# Labels

One vocabulary for every repo. Skills apply only labels that exist in the repo
(`gh label list`). A missing one is skipped and mentioned, never created on the fly. Fonoster
repos sync their labels from `fonoster/.github/.github/labels.yml`, so add new ones there.

## Kind

Prefer the native **issue type** (Bug, Feature, Task) when the org has issue types. Fall back
to the repo's `type: bug` / `type: feature` / `type: chore` / `type: docs` labels.

## State

| Label | Meaning | Set by | Removed by |
| :--- | :--- | :--- | :--- |
| `needs-triage` | Filed, not yet shaped by the Reporter | Issue form | Reporter |
| `needs-info` | Waiting on the reporter for something only they know | Reporter | Reporter |
| `ready` | The plan is approved; agents may implement | **A human**, or an agent on a human's explicit word | Implementer (on refusal), or closing |
| `not-ready` | The Implementer refused; its comment says why | Implementer | Reporter, once fixed |
| `blocked` | An agent stopped on a blocker (see `loop-limits.md`) | Any agent | Human |
| `needs-human` | A loop limit was hit, or a decision only a human can make | Any agent | Human |
| `needs-issue` | A PR with no linked issue | PR check | When an issue is linked |

## Signals

| Label | Meaning |
| :--- | :--- |
| `breaking` | The Brief says Breaking change: Yes |
| `risk: high` | The Brief says Risk: High (until org issue fields replace it) |
| `external` | Opened by someone outside the org |
| `good first issue` | A ready issue a newcomer can take; agent-ready issues make the best ones |
| `help wanted` | We'd welcome an outside PR |

## Area

`area: <name>` labels map to paths in the repo's AGENTS.md `## Areas` section. The Reporter
applies them; the experts to consult come from the same map.
