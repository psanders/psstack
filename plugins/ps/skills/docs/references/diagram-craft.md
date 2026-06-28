# Diagram craft — building docs assets that match the dashboard

This is the metaprompt for stage 4 when an asset is a **diagram** (flow, architecture,
sequence, state). It teaches the architect mindset and binds it to the product's real
design system, so a generated diagram looks like the dashboard built it — same palette,
type, radii, icons, and components — not like a generic boxes-and-arrows tool.

**Golden rule:** don't improvise. Produce a *spec* first, confirm it, then render to the
design system. A diagram is an act of architecture, not decoration.

## The brief-then-render procedure

1. **Name the one message.** Write a single sentence: "This diagram shows how an outreach
   request fans out to voice and SMS channels." If you can't say it in one sentence, the
   diagram is doing too much — split it.
2. **Pick the archetype** (below) that fits the message. The archetype dictates layout.
3. **Write the node/edge spec in text** and confirm it with the user before drawing:
   ```
   Nodes:  Engine(service) · dispatchOutreach(process) · Fonoster Voice(external) ·
           Twilio SMS(external) · Contact log(datastore)
   Edges:  Engine → dispatchOutreach (solid, "trigger")
           dispatchOutreach ⇢ Fonoster Voice (dashed, "async call")
           dispatchOutreach ⇢ Twilio SMS (dashed, "async call")
           dispatchOutreach → Contact log (solid, "writes")
   Legend: solid = sync · dashed = async/event
   ```
4. **Render to the design system** in Pencil, following the visual grammar below.
5. **Check** against the quality bar, then export (see `assets.md` for size/format/path).

## Archetypes — pick one

| Archetype | Use when the message is… | Layout |
| :--- | :--- | :--- |
| **Flow / pipeline** | "data/requests move through stages" | left→right lanes |
| **Sequence** | "components talk in this order over time" | vertical actors, time down |
| **Component / architecture** | "these parts make up the system and how they connect" | grouped by boundary |
| **Layered** | "the stack has these tiers" | stacked horizontal bands |
| **State machine** | "an entity moves between states" | nodes + labelled transitions |
| **Hierarchy / tree** | "this contains that" | top→down tree |
| **Entity-relationship** | "these records relate like so" | boxes + cardinality edges |

If two archetypes tempt you, the message is split → two diagrams.

## Visual grammar — bound to the QCobro dashboard design system

Read the live values with `get_variables` and reuse the design-system components from the
active `.pen` (`batch_get` for `reusable: true`). The values below are the dashboard's
system as authored — treat them as the target, but prefer the live variables if they've
moved.

**Type** — everything is **Inter**.
- Node title: Inter 14–18, weight 600–800, color `--foreground` `#0F172A`.
- Node sub-label: Inter 12, weight 500, color `--muted-foreground` `#64748B`.
- Edge label: Inter 10–12, weight 500, `#64748B`, on a small white pill so it reads over
  lines.

**Palette** — emerald primary, slate neutrals, amber accent. Use color *semantically*,
2–3 hues max per diagram. Never decorative rainbow.
- Primary / "our system" / happy path: `--primary` / `--green-500` `#10B981`; deep
  emphasis (the brand mark) `--green-700` `#047857`.
- Neutral structure (most boxes): surface `#FFFFFF`, border `--border` `#E2E8F0`, text
  `#0F172A`, muted `#64748B`, canvas `--background` `#F8FAFC`.
- Accent / "needs attention" / human step: `--accent` `#F59E0B`, soft fill
  `--accent-soft` `#FEF3C7`. Sparingly.
- Semantic states (state machines, status): success `#10B981` on `#ECFDF5`; info `#059669`
  on `#ECFDF5`; warning `#D97706` on `#FFFBEB`; error `#DC2626` on `#FEF2F2`.

**Nodes** — reuse the design system; don't hand-draw new box styles.
- Default component/box = the **`Card` / `Card Plain`** component: white fill, 1px `#E2E8F0`
  inner stroke, the card's subtle shadow (`#0000000d`, blur ~1.75, y+1), corner radius
  `--radius-m` `16`. Title + optional sub-label inside.
- The **product/our-service node** = reuse **`Comp/Logo`** or its mark (green-700 `#047857`
  rounded square, radius 8, white "Q" Inter 800).
- **External system / third party** = same card but border-only/neutral, with the
  provider's name + a line icon; optionally a dashed border to read as "outside our
  boundary."
- **Datastore** = card with a small cylinder/database line icon; label it.
- **Tags / counts / status** = the **`Icon Label` / `Label`** pill components (radius
  `--radius-pill` `999`, fill `#F1F5F9` secondary, or `#ECFDF5` success / `#FEF3C7`
  accent), icon + text.
- **Boundary / grouping** = a large rounded rectangle (radius 16), `#F8FAFC` fill or just a
  1px dashed `#E2E8F0` outline, with a small muted title in the top-left ("Workspace",
  "QCobro engine").

**Connectors** — drawn as `line`/`path` nodes (this file has no special connection type),
1px, with small arrowheads.
- **Solid `#10B981`** (or `#475569` slate for plain structure) = synchronous call / direct
  flow / "writes".
- **Dashed `#94A3B8`** = asynchronous / event / optional / "outside boundary" call.
- Arrowhead points to the dependency/target. Label edges with a short **verb** on a white
  pill. Prefer orthogonal (right-angle) routing; keep lines from crossing — reorder nodes
  before you let lines cross.

**Icons** — match the dashboard: **16px line icons, 1px stroke** (Lucide/Feather family —
the same set Mintlify renders), colored `#0F172A` or the node's semantic color. Always
**icon + label**, never an icon alone. One icon per node, top-left or leading the title.

## Layout discipline

- **Reading order**: left→right for flows, top→down for hierarchy/sequence. Inputs on the
  left/top, outcomes on the right/bottom.
- **Grid & alignment**: snap to a grid; align node edges and centers. Equal gaps between
  peers. Misalignment is the #1 tell of an amateur diagram.
- **Whitespace**: generous padding inside the frame (≥48px margin) and between nodes. Let
  it breathe.
- **Restraint**: ≤ 7 primary nodes. More than that → introduce a boundary/group and
  abstract, or split the diagram.
- **Legend**: include one only when an encoding (dashed vs solid, a color) isn't
  self-evident; place it bottom-left, small and muted.

## Pencil build steps

1. `get_editor_state(include_schema: true)` if the schema isn't loaded; `get_variables`
   for live tokens; `batch_get(patterns:[{reusable:true}])` to list reusable components.
2. **Honor the project's Pencil build workaround** (read `CLAUDE.md` / design memories) —
   e.g. *copy an existing frame and override it rather than adding raw frames*, which can
   render blank or shifted. Do that here too: duplicate a clean frame at the preset size.
3. Make the frame at the `assets.md` preset (16:9 `1600×900`, wide flow `1600×600`).
4. Place nodes by **instancing the design-system components** (`Card`, `Comp/Logo`,
   `Label`/`Icon Label`) — don't redraw their styling. Bind colors to variables, not raw
   hexes, so theme changes carry through.
5. Draw connectors as 1px lines/paths with the solid/dashed semantics above; add arrowheads
   and verb labels on white pills.
6. Align to grid, equalize gaps, add the boundary group and legend if needed.

## Quality bar (reject and redo if any fail)

- One message, statable in a sentence.
- ≤ 7 primary nodes; nothing crosses that could be reordered.
- Reuses the design-system card/logo/label components and the Inter type.
- Emerald/slate/amber used semantically; ≤ 3 hues.
- Legible at half-size (it displays at ~half the export width) — read it zoomed to 50%.
- Every node labelled with a noun; every edge with a verb (where it carries meaning).
- Descriptive `alt` text written for the page.
