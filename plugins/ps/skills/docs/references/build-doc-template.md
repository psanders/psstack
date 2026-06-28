# Asset build doc — {{SLUG}}

**Artifact:** `{{SLUG}}.png` (this folder)
**Used on:** {{PAGE}}
**Type:** {{diagram · flow / architecture / sequence / state | og card | screenshot}}
**Preset:** {{e.g. 16:9 1600×900 (exported 2× → 3200×1800)}}
**Diagram Kit version:** {{v1}}
**Pencil node id:** `{{NODE_ID}}` (file: {{.pen path}})

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then
> re-export the node id (see **Re-export**).

## One message

{{single sentence the asset communicates}}

## Sources (ground truth)

- {{spec / code / PR / URL}} — {{what it establishes}}

## Node / edge spec

```
Nodes: ...
Edges: ...
Legend: ...
Caption: ...
```

## Built from (Diagram Kit {{version}})

| Component | id | Used for |
| :--- | :--- | :--- |
| {{Diagram/Node}} | {{id}} | {{...}} |

Colors come only from `dgm-*` tokens (see the ledger).

## How to change it

- **Minor content:** edit the instance in the `.pen` via the Pencil MCP, re-export.
- **Structure:** update the spec above, mirror it in the `.pen`, re-export.
- **Brand / style:** change the `dgm-*` token or kit component (not this asset); re-export all.

## Re-export

```
export_nodes(filePath: "{{.pen}}", nodeIds: ["{{NODE_ID}}"],
             outputDir: "{{image folder}}", format: "png")
```
Then rename the output to `{{SLUG}}.png`.
