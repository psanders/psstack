# SDR signal data

The local, **git-ignored** store for LinkedIn buying-intent signals found by
`/ps:sdr signal-scan`. Future `/ps:sdr` subcommands read and enrich the same records:

- **`signal-scan`** (built) writes new records here: `status: "new"`, `score: null`, `icp_match: null`.
- **`icp-match`** (planned) will set `icp_match: true/false`.
- **`intent-score`** (planned) will fill `score`.
- **`dossier-build`**, **`voice-writer`**, **`sequence-builder`**, **`book-call`** (planned)
  will read the highest-scoring, ICP-matched records to move them toward outreach.

## Why this is NOT version-controlled (unlike `data/social/`)

`data/social/` is safe to commit because it only ever holds Pedro's **own** published
post text plus lightly-anonymized commenter first-names. `signals.jsonl`, in contrast,
holds **other people's** PII by design: full names, job titles, employers, LinkedIn
profile URLs, and — once `reply-classify`/`objection-tag`/`book-call` exist — excerpts
of real DM conversations with prospects. That doesn't belong in git history, even in a
private repo: history is forever, repos get shared/forked/reinstalled, and prospects
never consented to being in a version-controlled dataset.

So `signals.jsonl` (and any future `*.jsonl` under `data/sdr/`) is listed in `.gitignore`.
This `README.md` and `schema.json` stay tracked (no PII in either) so the store's shape
is documented even though its contents aren't.

**Consequence: this file is local-only and not backed up by git.** If the machine is
lost or the directory is deleted, the signal history is gone — signal-scan can be
re-run, but it can't recover past detections. If Pedro wants durability, that's on him
(Time Machine, an encrypted personal backup, etc.) — this skill doesn't solve that.

It still lives at `data/sdr/` at the psstack repo root (not inside the plugin) purely so
the path-resolution logic matches `data/social/` and a marketplace reinstall of `ps`
doesn't wipe it — it's just excluded from what git tracks.

## Location resolution

Skills resolve this directory as `data/sdr/` at the **root of the psstack repo** (the
repo containing the `ps` plugin). If a skill is running as an installed plugin and
cannot locate the checkout, it falls back to `~/Projects/psstack/data/sdr/` and, failing
that, asks Pedro for the path. Override with `PSSTACK_DIR` (the data dir is then
`$PSSTACK_DIR/data/sdr`).

## Files

| File | What it holds |
| :--- | :--- |
| `signals.jsonl` | One JSON object per **signal** (one line each). The source of truth. See `schema.json`. |
| `schema.json` | JSON Schema for a single `signals.jsonl` record. Validate against it before committing. |

## Provenance

Seeded empty on 2026-07-26 when `/ps:sdr signal-scan` (first `sdr` subcommand) was built.
No signals harvested yet — the first real run populates this file.

## Record shape

See `schema.json` for the authoritative contract. Two examples — `exec_search` is the
primary signal type as of 2026-07-28 (see `plugins/ps/skills/sdr/SKILL.md`); `keyword_post`
is the older, lower-signal type kept for competitive/topic monitoring:

```jsonc
{
  "id": "sig-2026-07-28-adopem-gerente-general",
  "type": "exec_search",                   // the primary pass: title + sector people search
  "detected_at": "2026-07-28",
  "source_url": "https://www.linkedin.com/in/...",
  "query_used": "\"Gerente General\" cooperativa",
  "snippet": "Gerente General en Cooperativa | Lider Estrategico Multifuncional...",
  "person": {
    "name": "Brigida Sarante",
    "title": "Gerente General",
    "company": "Cooperativa (Santiago de los Caballeros)",
    "profile_url": "https://www.linkedin.com/in/..."
  },
  "connection_degree": "2nd",
  "mutual_connections": ["Wilkys Rodriguez Ovalle", "Carolina Camacho"],
  "org_fit": "likely_fit",
  "score": null,       // /ps:sdr intent-score fills this later
  "icp_match": null,   // /ps:sdr icp-match fills this later
  "status": "new",
  "notes": null
}
```

```jsonc
{
  "id": "sig-2026-07-26-acme-voice-latency",
  "type": "keyword_post",                 // lower-signal: content/topic search, opt-in pass
  "detected_at": "2026-07-26",
  "posted_at": "2026-07-24",               // best-effort; null if unresolvable
  "source_url": "https://www.linkedin.com/posts/...",
  "keyword_matched": "voice agent latency",
  "snippet": "we keep hitting p95 latency issues with our IVR vendor...",
  "person": {
    "name": "Jane Doe",
    "title": "VP Engineering",
    "company": "Acme Corp",
    "profile_url": "https://www.linkedin.com/in/janedoe/"
  },
  "score": null,
  "icp_match": null,
  "status": "new",
  "notes": null
}
```

## How `/ps:sdr signal-scan` updates this file

1. De-dupe by `source_url` (fallback: `person.profile_url` + week) against existing records.
2. Append new signals only; never overwrite or delete existing records (later subcommands
   fill `score`/`icp_match`/`status` in place, but signal-scan itself is append-only).
3. Validate each record against `schema.json`. Keep one record per line.
