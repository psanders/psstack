# Diagram craft — building docs assets that match the dashboard

This is the metaprompt for stage 4 when an asset is a **diagram** (flow, architecture,
sequence, state). It teaches the architect mindset and binds it to the product's real
design system, so a generated diagram looks like the dashboard built it.

Two golden rules:
- **Don't improvise.** Produce a *spec* first, confirm it, then render. A diagram is an act
  of architecture, not decoration.
- **The image is an artifact, not the source.** Build from the **Diagram Kit** + a saved
  spec so the asset can be tweaked and rebranded at scale — see `asset-system.md`.

## The brief-then-render procedure

1. **Name the one message.** One sentence. If you can't, the diagram does too much — split.
2. **Pick the archetype** (below). It dictates layout.
3. **Write the node/edge spec in text** and confirm it before drawing:
   ```
   Nodes:  Engine(service) · dispatchOutreach(process) · Fonoster(external) · …
   Edges:  Engine → dispatchOutreach ("trigger") · dispatchOutreach → Fonoster ("VOICE")
   Legend: action vs input · Boundary: providers outside our system
   ```
4. **Render to the Diagram Kit** (below). Reuse the kit's components and tokens.
5. **Save + register**: write the per-asset build doc, add a ledger row (`asset-system.md`).
6. **Check** against the quality bar, then export (size/format/path in `assets.md`).

## Archetypes — pick one

| Archetype | Message is… | Layout |
| :--- | :--- | :--- |
| **Flow / pipeline** | "things move through stages" | left→right |
| **Sequence** | "components talk in order over time" | vertical actors, time down |
| **Component / architecture** | "these parts connect" | grouped by boundary |
| **Layered** | "the stack has tiers" | stacked bands |
| **State machine** | "an entity changes state" | nodes + labelled transitions |
| **Hierarchy / tree** | "this contains that" | top→down |
| **Entity-relationship** | "records relate" | boxes + cardinality |

Two archetypes tempting you = the message is split → two diagrams.

## Visual grammar — bound to the QCobro dashboard

Color comes from flat **`dgm-*` diagram tokens** seeded from the dashboard palette (read
with `get_variables`; if absent, seed them once — see `asset-system.md`). Do **not** bind
diagram nodes to the app's themed design-system variables — they may not resolve on an
unthemed node (a real failure seen in practice). Use color *semantically*, ≤ 3 hues.

| Token | Value | Meaning |
| :--- | :--- | :--- |
| `dgm-ink` / `dgm-muted` | `#0F172A` / `#64748B` | titles / sub-labels |
| `dgm-surface` / `dgm-canvas` / `dgm-border` | `#FFFFFF` / `#F8FAFC` / `#E2E8F0` | node fill / boundary fill / borders |
| `dgm-our` / `dgm-our-deep` / `dgm-our-soft` / `dgm-our-ink` | `#10B981` / `#047857` / `#ECFDF5` / `#065F46` | our service & its action edges; step chips |
| `dgm-edge-input` | `#94A3B8` | edges feeding in |
| `dgm-icon` / `dgm-icon-box` | `#475569` / `#F1F5F9` | external icon + chip |
| `dgm-radius-node` / `dgm-radius-inner` / `dgm-pill` | `16` / `12` / `999` | geometry |

**Type** — everything is **Inter**. Node title 14–18 / 600–800 `dgm-ink`; sub 12 / 500
`dgm-muted`; edge label 11 / 700 on a white pill.

**Nodes** — reuse the **card *style*** (white, 1px `dgm-border`, radius `dgm-radius-node`,
soft shadow), **not** the app's full `Card` component — its Header/Content/Actions slots
and 24px padding are too heavy for a diagram node. The kit's `Diagram/Node`,
`Diagram/External`, and `Diagram/Service` already encode this. The "our service" node
carries the brand mark (green-`dgm-our-deep` rounded "Q", from `Comp/Logo`).

**Icons** — native `icon` nodes, `library: "lucide"`, 16–18px, `dgm-ink`/`dgm-icon`. This
matches the dashboard's line icons and Mintlify. Always **icon + label**, never alone.

**Edges & connectors** — `.pen` has **no dashed strokes and no connection node type**.
So:
- Draw connectors as thin `frame`/`rectangle` segments (1–2px) filled with an edge token;
  route orthogonally (right angles), reorder nodes before letting lines cross.
- Encode meaning by **color + a label pill**, not by dash: `dgm-our` = the subject's own
  action / return; `dgm-edge-input` = data feeding in. Label edges with a short verb/term
  on a white pill; note async in the legend if it matters.
- Arrowheads are small `path` triangles (kit: `Diagram/Arrow R`, `Diagram/Arrow D`),
  filled with the edge token.

**Tags / counts / status** — pill components (`Diagram/Step`, or the app `Label`/
`Icon Label`), radius `dgm-pill`.

**Boundary / grouping** — a rounded frame (`dgm-radius-node`), `dgm-canvas` fill or 1px
`dgm-border`, with a small muted top-left title ("INPUTS", "PROVIDERS · OUTSIDE QCOBRO").

## Layout discipline

- Reading order: left→right for flows, top→down for hierarchy/sequence.
- Snap to a grid; align edges/centers; equal gaps. Misalignment is the #1 amateur tell.
- Generous padding (≥ 48px frame margin) and space between nodes.
- ≤ 7 primary nodes; beyond that, group into a boundary and abstract, or split.
- Legend only when an encoding isn't self-evident; bottom-left, small, muted.

## Pencil build steps (the real procedure)

1. `get_editor_state(include_schema: true)` if the schema isn't loaded; `get_variables`;
   `batch_get(patterns:[{reusable:true}])` to find the `Diagram Kit` components.
2. **No kit yet?** Seed it once: define the `dgm-*` tokens (`SetVariables`) and build the
   reusable components in a `Diagram Kit` frame (see `asset-system.md`). Then instance.
3. **Honor the project's Pencil build workaround** (`CLAUDE.md` / design memories) — e.g.
   *copy an existing frame rather than adding raw frames*, which can render blank/shifted.
4. Make the diagram frame at the `assets.md` preset (16:9 `1600×900`, wide flow `1600×600`).
   Use `layout: "none"` so zones can be absolutely positioned.
5. **Place the zones first** by instancing kit components (inputs, service, providers,
   output, boundaries). Override only content (`descendants`) and width.
6. **`snapshot_layout` the frame** to read the exact rectangles, then draw connectors to
   those measured anchors (stubs + a vertical bus for fan-outs) with arrowhead instances
   and edge-label pills. Drawing connectors blind, before measuring, is the main source of
   misalignment.
7. Add the legend and caption. Screenshot to verify; fix in place (don't delete-and-redo).

## Quality bar (reject and redo if any fail)

- One message, statable in a sentence.
- ≤ 7 primary nodes; nothing crosses that could be reordered.
- Built from kit components; color only from `dgm-*` tokens; Inter throughout; ≤ 3 hues.
- Legible at 50% (it displays at ~half the export width).
- Nouns on nodes, verbs on edges (where edges carry meaning).
- Build doc written and ledger row added; descriptive `alt` text drafted for the page.
