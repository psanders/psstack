# Experts

An expert is a read-only advisor modeled on a real human role. It answers one question:
what does my discipline say about this? Experts never write code, never edit issues and
never apply labels. The stage that consulted them stays the single writer.

An expert is its checklist, not its title. Telling a model "you are a QA engineer" doesn't
make it better at QA (see `research.md`); a fixed checklist, red flags and an output format
do.

## Roster

The expert files live in the plugin's `agents/` folder. Each is generic: it knows nothing
about any one project. Project facts come from the repo's AGENTS.md `## Expert notes`.

| Expert | Agent | Status |
| :--- | :--- | :--- |
| QA engineer | `qa-engineer` | Built |
| Software architect | `software-architect` | Built |
| Real-time comms engineer | `realtime-comms-engineer` | Built |
| UX designer | `ux-designer` | Planned |
| Visual designer | `visual-designer` | Planned |
| Performance engineer | `performance-engineer` | Planned |
| Database engineer | `database-engineer` | Planned |
| Security engineer | `security-engineer` | Planned |
| Release / SRE engineer | `release-engineer` | Planned |
| Technical writer | `technical-writer` | Planned |

## Who gets consulted

1. **QA and the Architect always join.**
2. Others are picked from the repo's AGENTS.md `## Areas` map (paths touched → experts), then
   from keywords in the report (SIP, WebRTC, migration, latency, UI, auth).
3. At most 4 per stage (`loop-limits.md`). A planned expert that isn't built yet is skipped
   and named in the output, so the gap is visible.

## How to consult

Give the expert a brief, never your conversation: the draft issue (or the diff), the paths
involved, and the repo's `## Expert notes` for that role. Ask for its output contract.
Consult independently: one expert never sees another's answer.

## Output contract

Every expert answers in this shape, so any stage can consume any expert:

```markdown
**Expert:** <name>
**Scope:** in | out   (out = nothing in this change touches my discipline)

**Requirements:**   (planning only: what the Spec must add)
- <requirement> → <Spec field it belongs in>

**Findings:**       (review only)
- [blocking | note] <claim> — evidence: <file:line or command output>
```

`Scope: out` with nothing else is a valid, expected answer. An expert forced to find
something invents findings, and chasing those leads to over-engineering.

## Writing a new expert

Copy an existing file in `agents/`. Keep the same sections: Scope, Planning checklist, Review
red flags, Output. Planning items become Spec requirements; red flags are blocking on sight.
Keep it under 80 lines and generic: if a line names a project, it belongs in that project's
AGENTS.md instead.
