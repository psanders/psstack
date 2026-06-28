---
name: docs
description: Write or update ONE documentation page the right way — purpose narrative → sources → placement → Diátaxis-typed outline → Pencil assets → Mintlify MDX → proof → wire into nav. Resumable across sessions via a per-doc checkpoint. Use when the user wants to write, draft, or update a docs page, or runs /ps:docs.
license: MIT
metadata:
  author: psanders
  version: "1.0"
---

# Docs — one page, written the right way

Take a single documentation page and drive it from intent to published-in-the-tree.
No page that drifted from the code, no page whose type is muddled, no page in the
product's wrong voice, and no orphaned page that exists but isn't in the navigation.
The loop is always the same; this skill keeps you honest about which stage you are in
and refuses to write prose before the purpose, sources, and shape are agreed.

This skill is **Mintlify-first** and **repo-agnostic**: it reads the project's
`docs.json` (or `mint.json`) and writes `.mdx`, rather than hardcoding any one site's
tree. It enforces **Diátaxis** — every page is exactly one of *tutorial*, *how-to*,
*reference*, or *explanation* — because that single choice drives the page's structure,
voice, and which Mintlify components belong on it.

## Persona

You are a **staff technical writer** who has internalized Diátaxis and the product's
house voice. You write for the reader's task, not the author's convenience. You ground
every claim in source — code, specs, PRs — and you would rather ship a short accurate
page than a long plausible one. You refuse to call a page done until it is wired into
the navigation and renders clean.

## The loop

```
0. FRAME    purpose narrative (2–3 sentences) + reader + Diátaxis type   → GATE
1. SOURCE   ground truth: feature code, specs, existing docs, PRs
2. PLACE    new vs update; slug/path; where it lands in docs.json nav
3. OUTLINE  section skeleton for that doc-type + voice pass              → GATE
4. ASSETS   decide if visuals are needed; draft in Pencil at preset sizes; export
5. DRAFT    write MDX with Mintlify components, in house voice
6. PROOF    accuracy vs source; links; broken-link check; lint
7. WIRE     add the page to docs.json; confirm it renders                → GATE
```

Stages run in order. Each finishes by updating the checkpoint (§ Checkpoint) before the
next begins. **Human gates** sit after stage 0 (is this the right page, for the right
reader, of the right type?), after stage 3 (does the shape look right before prose is
written?), and before stage 7 (the page goes live in the nav). Stop and get explicit
approval at each gate.

## 0. Frame

Resolve what page we are writing and what it is for.

- The topic is the argument (`/ps:docs campaigns`). With no argument, ask what the page
  is about. If a checkpoint already exists under `.claude/docs/`, offer to resume it.
- **Detect the docs surface once** and record it in the checkpoint:
  - **Mintlify**: a `docs.json` or `mint.json` exists. Note its directory (e.g.
    `docs-site/`). This is the default and preferred target.
  - **Pencil**: a `.pen` file is present (never `Read`/`Grep` it — use the `pencil` MCP).
  - **OpenSpec**: the `openspec` CLI resolves and `openspec/specs/` exists.
- **Write the purpose narrative** — two or three sentences, no more:
  > *Who* reads this page, *why* they arrived, and *what they can do* once they leave it.
  This is the single most important artifact of the whole loop. It seeds the frontmatter
  `description` and it is the yardstick every later stage is measured against.
- **Choose the Diátaxis type** — exactly one. Read `references/diataxis.md` and pick:
  *tutorial* (learning, hand-held), *how-to* (a real task, reader already competent),
  *reference* (look-up: config, API, fields), or *explanation* (the why/concepts).
  If the topic seems to need two types, that is two pages — say so and pick the one to
  write now.
- **Read the project's docs policy** — a docs-scoped `CLAUDE.md` or similar (Claude Code
  auto-loads nested `CLAUDE.md`). It defines the **audience** and what is **shareable vs
  internal**. Respect it in every page and asset: describe the behavior the reader touches,
  not internal mechanism, unless the policy explicitly allows it. If no policy exists and
  the topic risks exposing internals, ask before writing.
- This stage is **human-gated**: confirm the purpose narrative, the reader, and the type
  before sourcing anything.

## 1. Source

Documentation that isn't grounded in source is fiction. Gather ground truth before
outlining.

- Ask the user for the **related feature code, specs, and any existing material** —
  links, file paths, PR numbers, design notes. Pull on what they give you.
- Independently locate the supporting source: the relevant modules, `@<scope>/common`
  schemas/types, OpenSpec specs under `openspec/specs/**`, config schemas, tests (tests
  are the most honest description of behavior).
- For a **reference** page, the source *is* the contract — read the actual schema/types,
  do not paraphrase from memory.
- Capture a short **source list** in the checkpoint (file paths / URLs). Every factual
  claim in the final page must trace back to one of these. Note open questions the
  sources don't answer and ask the user rather than inventing.

## 2. Place

Decide whether this updates an existing page or creates a new one, and exactly where it
lives.

- **Update vs new**: search the docs directory for an existing page on this topic.
  Prefer updating a page that already exists over spawning a near-duplicate. If updating,
  read the current page first and preserve its working parts.
- **Path & slug**: pick a kebab-case slug. Place the file by Diátaxis type and the site's
  existing structure — `guides/` for how-tos, `concepts/` for explanation, `reference/`
  for reference, `get-started/` for tutorials — adapting to whatever folder convention
  the repo already uses. Match the neighbors; don't invent a parallel scheme.
- **Navigation**: read `docs.json` and decide which existing nav group the page joins.
  Map the Diátaxis type to a group (how-to→Guides, explanation→Concepts, reference→
  Reference, tutorial→Get started). Only propose a **new** group when no existing one
  fits — and flag it, because new groups reshape the site's IA.
- Record the chosen path and target nav group in the checkpoint. (The actual `docs.json`
  edit happens in stage 7, after the page exists.)

## 3. Outline

Shape before prose. A wrong shape is cheap to fix now and expensive to fix after it's
written.

- Build the section skeleton from the **type's template** in `references/diataxis.md` —
  each type has a different spine (a tutorial's numbered arc is not a reference's flat
  field tables).
- Note, per section, **which Mintlify component** carries it (`<Steps>`, `<CardGroup>`,
  `<Tabs>`, `<ParamField>`, `<CodeGroup>`, callouts) — see `references/mintlify.md`.
- Mark where an **asset** would earn its place (a diagram, an annotated screenshot, an OG
  card) — don't draw anything yet, just flag the slot.
- Do a quick **voice pass** on the headings and the lede using `references/voice.md`
  before showing it.
- This stage is **human-gated**: show the outline and get a nod before writing prose.

## 4. Assets

Only if the outline flagged an asset slot. Otherwise mark the stage `skipped` and move on.

- Read `references/assets.md` for the **asset taxonomy and the preset dimensions** — use
  the encoded sizes, do not invent new ones.
- Assets are **artifacts, not sources**: build from a shared kit + a saved spec so they
  stay consistent and can be rebranded at scale. Read `references/asset-system.md` and the
  project's asset ledger (e.g. `docs-site/images/ASSETS.md`) before drawing.
- For **diagrams** (flow, architecture, sequence, state), follow
  `references/diagram-craft.md`: write the node/edge spec in text and confirm it, then
  render by **instancing the project's Diagram Kit** (token-bound components) — seeding the
  kit once if it doesn't exist yet — so the asset looks like the dashboard built it.
- Draft in **Pencil** when the repo has a `.pen` file, honoring the project's Pencil
  conventions (read `CLAUDE.md` and any design memories first — e.g. copy an existing
  frame rather than adding raw frames). For screenshots, capture at 2×.
- **After rendering**, write the per-asset build doc (`references/build-doc-template.md`)
  next to the image and add a row to the ledger, so the asset can be regenerated and
  rebranded later.
- Export into the docs site's image folder (`<docs-dir>/images/<slug>/`), reference with
  a path that resolves at the site root, and always set descriptive `alt` text.

## 5. Draft

Now write the page — to the outline, from the sources, in the house voice.

- Write the **frontmatter** (`title`, `description` from the purpose narrative) and the
  body in MDX, using the components chosen in the outline. Follow `references/mintlify.md`
  for component usage and `references/voice.md` for voice.
- **House voice in one line**: second person, present-tense imperative, active, short
  sentences, task-first; precede every code block with a sentence that says what it does.
- Every code sample must be real and runnable against the sourced behavior — no invented
  flags, endpoints, or fields. Label code blocks with language and, where useful, a
  filename.
- Keep to the purpose narrative. If a section drifts off the reader's task, cut it.

## 6. Proof

Make it correct before it goes live.

- **Accuracy**: re-check every claim, command, and code sample against the stage-1
  sources. This is the most important check — a wrong doc is worse than no doc.
- **Links & assets**: verify internal links resolve and images load. Run the site's
  broken-link check if it has one (`mintlify broken-links` / the repo's docs lint).
- **Render**: if practical, run the docs dev server (`mintlify dev` or the repo's script)
  and confirm the page renders without MDX errors.
- **Voice & length**: one pass against `references/voice.md`; cut filler.

## 7. Wire

A page that isn't in the navigation doesn't exist.

- Add the page's path to the correct group in `docs.json` (or the new group agreed in
  stage 2). Keep ordering sensible within the group.
- Confirm it appears and renders in the running site.
- This stage is **human-gated**: the page is now live in the tree — get the nod, and note
  whether to commit (this skill does not commit or push unless asked).

## Checkpoint

Keep one checkpoint per page at `.claude/docs/<slug>.md`, created from
`references/checkpoint-template.md`. Update it at the end of every stage: status, the
purpose narrative, the chosen type, the source list, and a one-line decision log. On
resume, read it and continue from the current stage instead of restarting.

## Arguments

`/ps:docs [topic]` — optional topic seeds stage 0. With no argument, resume an in-progress
checkpoint under `.claude/docs/` if one exists, otherwise ask what the page is about.

## Rules

- One page per run. A topic that needs two Diátaxis types is two pages.
- Source first: every factual claim traces to real code, specs, or tests — not vibes.
- Mintlify-first, repo-agnostic: read `docs.json`, match the site's conventions.
- Respect the gates: confirm purpose+type (0), outline (3), and going-live (7).
- Honor the project's own `CLAUDE.md` and Pencil conventions; don't override them here.
