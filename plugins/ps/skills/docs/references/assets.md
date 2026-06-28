# Assets — taxonomy, preset sizes, and the Pencil recipe

Assets are first-class but earn their place. Add one only when it does work prose can't:
a diagram that shows a flow or a model, an annotated screenshot that orients the reader,
an OG card so shared links look right. If a `<CardGroup>`, `<Steps>`, or an icon conveys
it, prefer that — don't draw.

## Asset taxonomy & preset dimensions

Use these encoded sizes. Do not invent new ones. All raster exports are at **2×** for
retina (design at the listed pixel size, which already bakes in 2×; the display width is
half).

| Asset | Use | Export size (px) | Format | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **OG / social card** | `og:image` for share previews | 1200 × 630 | PNG | Title + logo; one per major page or section. |
| **Diagram — 16:9** | concept / architecture in explanation pages | 1600 × 900 | SVG (fallback PNG) | Renders at content width; SVG stays crisp. |
| **Diagram — wide flow** | a left-to-right pipeline / sequence | 1600 × 600 | SVG (fallback PNG) | For dispatch/flow style diagrams. |
| **Diagram — square** | a small standalone model | 1000 × 1000 | SVG (fallback PNG) | Use sparingly; usually a card is enough. |
| **Screenshot — full** | a whole screen for orientation | 2560 × 1440 | PNG | Capture at 2×; let Mintlify scale responsively. |
| **Screenshot — detail** | a cropped UI region, often annotated | 1200 × 800 | PNG | Crop tight; annotate in Pencil. |
| **Inline icon** | a glyph in a card or callout | — | (none) | Use Mintlify's icon set, not a drawn asset. |

Mintlify content renders ~700–800px wide, so a 1600px-wide diagram displays at ~half size
and stays sharp on retina. Prefer **SVG** for diagrams (infinite crisp, theme-able);
PNG only when the design can't export clean SVG.

## Where assets live

- Save into `<docs-dir>/images/<slug>/` — e.g. `docs-site/images/create-a-campaign/`.
- Reference with a root-resolved path: `/images/create-a-campaign/flow.svg`.
- Always set descriptive `alt`. For light/dark variants, export both and use the site's
  existing light/dark pattern (`<Frame>` or `dark:hidden` / `hidden dark:block`).

## The Pencil drafting recipe

Draft diagrams and OG cards in Pencil when the repo has a `.pen` file. Never `Read`/`Grep`
a `.pen` file — use the `pencil` MCP only.

1. **Load the schema first**: `get_editor_state(include_schema: true)` if you don't already
   have the file's schema in context.
2. **Honor the project's Pencil conventions.** Read `CLAUDE.md` and any design memories
   before drawing — projects often have build workarounds (e.g. *copy an existing
   frame/screen and override it rather than adding raw frames, which can render blank or
   shifted*). Follow the project's idiom; don't reinvent it.
3. **Make a frame at the preset size** from the table above (e.g. 1600×900 for a 16:9
   diagram, 1200×630 for an OG card).
4. **Use the design system**: pull brand colors and type from the file's variables
   (`get_variables`) — match the product's palette, don't hardcode hexes.
5. **Keep diagrams legible at half size**: large labels, few boxes, clear arrows, generous
   spacing. A diagram that needs zooming has failed.
6. **Export** via `export_nodes` to the slug's image folder, as SVG for diagrams (PNG
   fallback) and PNG for OG cards.

## Screenshots

- Capture at 2× device-pixel-ratio so they stay crisp.
- Crop to what matters; don't ship a full browser chrome for a detail shot.
- Annotate (arrows, highlights, numbered callouts) in Pencil at the **detail** preset.
- Redact real customer data — use seeded/demo data only.

## Accessibility & weight

- Every image needs meaningful `alt` text describing what it shows, not "diagram".
- Keep PNGs reasonable; a docs page shouldn't ship multi-MB images. Compress exports.
