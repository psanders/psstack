# Asset system — consistency and rebrand-at-scale

The trap with generated diagrams is that each one becomes a one-off pile of shapes. You
can't tweak it without redrawing, and you can't rebrand a whole docs site at once. The
fix is a single principle:

> **A rendered asset is an artifact, not a source.** The source is
> `(shared design kit) + (per-asset spec)`. If you can regenerate the image from those
> two, you get consistency *and* scale for free.

This mirrors the memory model: a shared vocabulary, one file per item, and an index.

| Memory world | Asset world | Role |
| :--- | :--- | :--- |
| `CLAUDE.md` + conventions | **Diagram Kit** (reusable Pencil components, token-bound) | shared vocabulary — *rebrand here, once* |
| an individual memory file | **per-asset build doc** (`<slug>.md`) | how this asset was built; edit + re-export to change |
| `MEMORY.md` index | **`ASSETS.md` ledger** | one row per asset; the map for re-exporting at scale |

Ownership split: **this skill encodes the method**; the **project owns the instances** —
the kit lives in the project's `.pen`, the ledger and build docs live under the docs
image folder (e.g. `docs-site/images/`).

## 1. Diagram Kit (the rebrand lever)

In the project's `.pen`, a `Diagram Kit` frame holds reusable components — node card,
service node, external node, edge-label pill, step chip, arrowheads — each bound to a flat
set of **diagram tokens** (`dgm-*` colors + radii), *not* to raw hexes. Every asset
instances these. Editing a token or a component **propagates to every instance**, so a
brand change is one edit + a re-export pass.

Use flat, non-themed tokens for the kit. App design-system variables are often themed and
may not resolve on an unthemed diagram node — the dry run hit exactly this. A dedicated
`dgm-*` set (seeded from the app palette) is the clean, predictable binding surface.

## 2. Per-asset build doc (the tweak lever)

Each asset gets a sidecar `<slug>.md` next to the image, capturing the stage-4 brief plus
build metadata: one-message, archetype, **sources**, the node/edge spec, the kit
components/tokens used, the Pencil node id, the preset, and the kit version. To change
anything, edit the doc/kit and re-export — never reverse-engineer the PNG. See
`build-doc-template.md`.

## 3. Ledger + re-export (the scale lever)

`ASSETS.md` lists every asset (slug, type, preset, page, Pencil node id, kit version, link
to its build doc) and the kit's components/tokens. A rebrand walks this table:

1. Change a `dgm-*` token (or kit component) once.
2. Pencil propagates to all instances.
3. Re-export each listed node id. **There is no `pencil` CLI** — export is driven through
   the Pencil MCP `export_nodes(nodeIds:[...])`, then rename outputs to their slugs. Treat
   re-export as an agent/MCP step, not a shell script.

## How the docs skill uses this

- **Stage 4**, before drawing: read `ASSETS.md`; if a `Diagram Kit` exists, **instance its
  components** rather than drawing fresh. If not, offer to seed the kit + tokens (one-time).
- **Stage 4**, after drawing: write the per-asset build doc and add a ledger row.
- **Rebrand request** ("update all diagrams to the new accent"): change the token/kit, then
  walk the ledger re-exporting each node id. One change, every asset.
