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

| Expert | Agent |
| :--- | :--- |
| QA engineer | `qa-engineer` |
| Software architect | `software-architect` |
| Real-time comms engineer | `realtime-comms-engineer` |
| UX designer | `ux-designer` |
| Visual designer | `visual-designer` |
| Performance engineer | `performance-engineer` |
| Database engineer | `database-engineer` |
| Security engineer | `security-engineer` |
| Release / SRE engineer | `release-engineer` |
| Technical writer | `technical-writer` |

## Who gets consulted

1. **QA and the Architect always join.**
2. Others are picked from the repo's AGENTS.md `## Areas` map (paths touched → experts), then
   from what the change touches:

   | The change touches | Expert |
   | :--- | :--- |
   | SIP, WebRTC, RTP, SDP, NAT, codecs, trunks | `realtime-comms-engineer` |
   | A screen, form, CLI prompt, error message people read | `ux-designer` |
   | Anything visual: components, layout, colors, a design file | `visual-designer` |
   | Hot paths, loops over unbounded data, I/O, caching, a latency target | `performance-engineer` |
   | Schemas, migrations, ORM models, queries on large tables | `database-engineer` |
   | Auth, secrets, untrusted input, dependencies, CI workflows, agent input | `security-engineer` |
   | Public surfaces, config and env vars, releases, deploys, logs and metrics | `release-engineer` |
   | Docs, CLI help, changelogs, anything users must learn | `technical-writer` |

3. At most 4 per stage (`loop-limits.md`). When more apply, keep the ones whose red flags the
   change is most likely to hit, and name the ones left out.

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
red flags, Output, References. Planning items become Spec requirements; red flags are blocking on sight.
Keep it under 80 lines, plus an optional References section of standards by URL, and generic: if a line names a project, it belongs in that project's
AGENTS.md instead.
