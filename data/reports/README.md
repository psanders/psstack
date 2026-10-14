# Executive report archive

The local, **git-ignored** archive written by `/ps:executive-report`. Every report the
skill generates lands here so past reports can be searched and used as eval cases.

## Why this is NOT version-controlled

Reports name customers and describe unreleased customer work, and the raw notes in
`index.jsonl` are kept verbatim, before anonymization (teammate and customer names
included). psstack is a public repo, so only this `README.md` is tracked.

**Consequence: local-only, not backed up by git.** Back it up yourself (Time Machine etc.)
if you need it to survive the machine.

## Layout

| Path | What it holds |
| :--- | :--- |
| `pdf/<name>.pdf` | The canonical PDF for each report. |
| `index.jsonl` | One JSON record per report (see below), sorted by `period_end`. |

`<name>` is fixed by `save_report()` in
`plugins/ps/skills/executive-report/references/generate_report.py`:

```
executive-report_<customer-slug>_<period-start>_<period-end>
e.g. executive-report_acme-corp_2026-01-05_2026-01-16
```

Regenerating the same customer and period overwrites the PDF and replaces its record.

## Record shape

```jsonc
{
  "id": "executive-report_acme-corp_2026-01-05_2026-01-16", // = PDF name
  "customer": "Acme Corp",
  "customer_slug": "acme-corp",
  "period_start": "2026-01-05",
  "period_end": "2026-01-16",
  "generated_at": "2026-01-16T17:00:00-05:00",
  "skill_version": "0.25.0",
  "pdf": "pdf/executive-report_acme-corp_2026-01-05_2026-01-16.pdf",
  "input": { "raw_notes": "...verbatim...", "additional_risks": "" },     // eval input
  "report": {                                                            // eval output
    "executive_summary": "...",
    "accomplishments": [{ "group": "...", "items": ["..."] }],
    "metrics": [{ "category": "...", "items": ["..."] }],
    "risks": [{ "risk": "...", "mitigation": "..." }],
    "next_steps": ["..."]
  }
}
```

## Searching

```bash
jq -r 'select(.customer_slug=="acme-corp") | "\(.period_end)  \(.pdf)"' index.jsonl
grep -il "project-x" index.jsonl   # full-text over notes + report content
```

## Location resolution

`data/reports/` at the psstack repo root. `save_report()` tries `$PSSTACK_DIR`, then the
checkout the script runs from, then `~/.claude/plugins/marketplaces/psstack`, then
`~/Projects/psstack`.
