# psstack

Pedro's personal Claude Code toolbelt — a [plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces)
that bundles reusable skills so they live in one version-controlled place instead of
being copy-pasted between repos.

## Layout

```
psstack/
├── .claude-plugin/
│   └── marketplace.json        ← catalog: lists the plugins in this repo
└── plugins/
    └── ps/                     ← one plugin, many skills → /ps:<skill>
        ├── .claude-plugin/
        │   └── plugin.json
        └── skills/
            └── kaizen/
                └── SKILL.md
```

## Skills

| Skill | Invoke | What it does |
| :--- | :--- | :--- |
| **kaizen** | `/ps:kaizen [lens]` | Daily 1%-better pass — surveys a repo, picks ONE high-leverage improvement, proposes it, applies on approval, and logs to a per-repo ledger. |

## Install

```text
/plugin marketplace add psanders/psstack
/plugin install ps@psstack
```

Then use any skill as `/ps:<skill>`, e.g. `/ps:kaizen`.

## Develop locally

Test without installing:

```bash
claude --plugin-dir ./plugins/ps
```

Hot-reload after edits with `/reload-plugins`. Validate before publishing:

```bash
claude plugin validate ./plugins/ps
```

## Update

After pushing changes here, users refresh with:

```text
/plugin marketplace update psstack
```

Versioning: bump `version` in `plugins/ps/.claude-plugin/plugin.json` to cut a release.
If left unbumped, the git commit SHA is used as the version (every commit counts as an update).

## Add a new skill

1. `mkdir -p plugins/ps/skills/<name>`
2. Write `plugins/ps/skills/<name>/SKILL.md` with `name` + `description` frontmatter.
3. `/reload-plugins` (or restart) to pick it up; invoke as `/ps:<name>`.
