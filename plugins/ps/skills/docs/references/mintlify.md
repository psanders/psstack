# Mintlify — components & conventions

This skill is Mintlify-first. Pages are `.mdx` files; the site is configured by `docs.json`
(older sites: `mint.json`). Use these components instead of hand-rolling markup — they are
the opinionated layer.

## Frontmatter

Every page opens with YAML frontmatter:

```mdx
---
title: "Create a campaign"
description: "Set up an outreach campaign and launch it to a portfolio."
---
```

- `title` — the page title (sentence case; for how-tos, a task starting with a verb).
- `description` — comes straight from the stage-0 purpose narrative, trimmed to one line.
  It feeds SEO and the page subtitle.
- Optional: `icon`, `sidebarTitle` (shorter nav label), `mode: "wide"` / `"custom"`,
  `og:image` (the OG card from `assets.md`).

## Navigation — docs.json

Pages are wired into `navigation.pages`, grouped:

```json
{
  "navigation": {
    "pages": [
      { "group": "Get started", "pages": ["index", "quickstart"] },
      { "group": "Guides",      "pages": ["guides/create-a-campaign"] }
    ]
  }
}
```

- Page entries are paths **without** the `.mdx` extension, relative to the docs root.
- Map Diátaxis type → group: how-to→**Guides**, explanation→**Concepts**, reference→
  **Reference**, tutorial→**Get started**. Reuse existing groups; only add a new group
  when none fits (it reshapes the site IA — flag it).
- Larger sites use `tabs` and `groups`; match whatever the repo already does.

## Component cheat-sheet

**Steps** — sequential procedures (tutorials, how-tos):
```mdx
<Steps>
  <Step title="Start the services">
    A sentence on what this does.
    ```bash
    docker compose up -d
    ```
  </Step>
</Steps>
```

**Callouts** — `<Note>`, `<Tip>`, `<Warning>`, `<Check>`, `<Info>`. One idea each; don't
stack. See voice.md for which to use when.

**Cards / CardGroup** — navigation and choices, not body text:
```mdx
<CardGroup cols={2}>
  <Card title="Quickstart" icon="rocket" href="/quickstart">Run it locally.</Card>
</CardGroup>
```
Icons use Font Awesome / Lucide names — prefer an icon over a custom image for cards.

**Tabs** — genuine alternatives (OS, language, provider):
```mdx
<Tabs>
  <Tab title="macOS">…</Tab>
  <Tab title="Linux">…</Tab>
</Tabs>
```

**Accordion / AccordionGroup** — optional or advanced detail that would clutter the flow.

**CodeGroup** — the same operation in several languages, tabbed:
```mdx
<CodeGroup>
  ```ts index.ts
  ```
  ```bash cURL
  ```
</CodeGroup>
```

**Reference fields** — for reference pages:
- `<ParamField path="name" type="string" required>` — request params / config keys.
- `<ResponseField name="id" type="string">` — response fields.
- `<Expandable title="object">` — nested object fields.
- `<RequestExample>` / `<ResponseExample>` — paired API samples.

## Code blocks

- Always tag the language. Add a filename after it where it helps: ` ```ts call.ts `.
- Precede every block with a context sentence (voice.md).
- Use real values from the sourced behavior — no invented flags, endpoints, or fields.
- Show expected output after the command in tutorials.

## Images & assets

```mdx
<img src="/images/<slug>/diagram.png" alt="How outreach dispatch flows" />
```
Paths resolve at the site root. Assets live in `<docs-dir>/images/<slug>/`. Always set
descriptive `alt`. See assets.md for sizes and the drafting recipe. For light/dark pairs,
use `<Frame>` or the `className="block dark:hidden"` pattern the site already uses.

## Local check

Run the docs locally to catch MDX errors and broken links before wiring:
```bash
mintlify dev            # preview
mintlify broken-links   # link check
```
Use the repo's own docs script if it defines one.
