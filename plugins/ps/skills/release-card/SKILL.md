---
name: release-card
description: Generate a branded release-notes card (PNG) for a repo's latest GitHub release — groups the actual commit messages by conventional-commit type and renders them as a white, social-ready changelog image with satori. Use when the user wants a shareable release image, or runs /ps:release-card.
license: MIT
metadata:
  author: psanders
  version: "1.0"
---

# Release Card

Build a branded, shareable release-notes image for **the repo you're currently in**. Groups the actual commit messages from the release range by conventional-commit type (🎉 Features, 🐛 Bug Fixes, …) and renders them as a single white, social-ready card (1080×1350, 4:5) — a branded take on GitHub's release-notes view — via `satori` + `@resvg/resvg-js` (the renderer inside `@vercel/og`, run standalone in Node). Repo-agnostic.

**Input**: Optional args —
- A release tag (e.g. `v2.1.0`). Default: the latest release.
- `--color` / `--theme`: `fonoster-green` (default), `fonoster-blue`, or `fonoster-orange`.
- `--logo "<wordmark>"`: product name shown on the card (e.g. `Routr`, `QCobro`, `Goodtook`, `Fonoster`). Default: the repo name.
- `--max <n>`: max commits to list before truncating with "+N more" (default 16).

---

## Steps

### 0. Detect the repo

```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
```

If this fails, stop: this skill must run inside a git repo with a GitHub remote, with `gh` authenticated (`gh auth status`).

### 1. Resolve the release range

If a tag was passed, use it; otherwise take the latest release:

```bash
TAG=$(gh release view --repo "$REPO" --json tagName -q .tagName)        # or the passed tag
DATE=$(gh release view "$TAG" --repo "$REPO" --json publishedAt -q .publishedAt | cut -dT -f1)
```

Find the previous tag to diff against (the release immediately before `$TAG`):

```bash
PREV=$(gh api "repos/$REPO/releases" -q '[.[].tag_name] | .['"$(gh api "repos/$REPO/releases" -q '[.[].tag_name] | index("'"$TAG"'")')"' + 1]' 2>/dev/null)
```

If there's no previous release (first release), diff from the start of history — leave `PREV` empty and use the full `git log` up to `$TAG`.

### 2. Pull the commits in the range

Get each commit's short SHA + first line. Prefer the GitHub compare API (covers the merged range); fall back to local `git log` if needed:

```bash
if [ -n "$PREV" ]; then
  gh api "repos/$REPO/compare/$PREV...$TAG" \
    -q '.commits[] | (.sha[0:7]) + "\t" + (.commit.message | split("\n")[0])' > /tmp/release-commits.tsv
  AUTHORS=$(gh api "repos/$REPO/compare/$PREV...$TAG" -q '.commits[].author.login' | sort -u | grep -c .)
  TOTAL=$(gh api "repos/$REPO/compare/$PREV...$TAG" -q '.total_commits')
else
  git log "$TAG" --pretty='%h%x09%s' > /tmp/release-commits.tsv
  AUTHORS=$(git log "$TAG" --pretty=%an | sort -u | grep -c .)
  TOTAL=$(git log "$TAG" --oneline | grep -c .)
fi
```

### 3. Group commits by conventional-commit type

Read `/tmp/release-commits.tsv` (one `SHA<TAB>subject` per line) and route each commit by the prefix on its subject. Match case-insensitively against `^<type>(\(scope\))?!?:` — tolerate a scope and the `!` breaking marker (e.g. `feat(api)!: …`). Strip the `type(scope)!:` prefix so only the human-readable message remains; keep the original casing of the message.

Known types (others fall through and are skipped): `feat`, `fix`, `perf`, `refactor`, `docs`, `build`, `ci`, `test`, `chore`, `style`. The renderer supplies each type's emoji + heading and the section order — you only emit `type` + `items`.

Assemble the notes JSON (omit empty sections; the renderer orders and truncates):

```bash
cat > /tmp/release-notes.json <<JSON
{
  "repo": "$REPO",
  "tag": "$TAG",
  "date": "$DATE",
  "contributors": <AUTHORS>,
  "commits": <TOTAL>,
  "sections": [
    { "type": "feat", "items": [ { "message": "Implement conditional field-level encryption with Cloak", "sha": "96ef709" } ] },
    { "type": "fix",  "items": [ { "message": "Allow IP addresses as the inboundUri at the CTL", "sha": "063fc8e" } ] }
  ]
}
JSON
```

### 3b. Pick the theme (if not passed)

If no `--color`/`--theme` arg, ask with **AskUserQuestion** — "Brand color?": Fonoster Green (Recommended), Fonoster Blue, Fonoster Orange. Map to `fonoster-green` / `fonoster-blue` / `fonoster-orange`. The logo wordmark defaults to the repo name unless `--logo` was given.

### 4. Render the PNG

Set up a throwaway workspace, install the two deps, and run the bundled renderer (`references/render-card.mjs`). `$SKILL_DIR` is this skill's directory:

```bash
WORKDIR=$(mktemp -d)
( cd "$WORKDIR" \
  && npm init -y >/dev/null 2>&1 \
  && npm install satori @resvg/resvg-js >/dev/null 2>&1 )
cp "$SKILL_DIR/references/render-card.mjs" "$WORKDIR/"

node "$WORKDIR/render-card.mjs" \
  --data /tmp/release-notes.json \
  --theme "$THEME" \
  --logo "$LOGO" \
  --out "$PWD/release-$TAG.png"
```

On first run the script fetches the fonts (Inter body, Poppins wordmark, JetBrains Mono chips) and the Twemoji SVGs for the section emoji (all cached in a temp dir). If the machine is offline, set `FONT_PATH=/path/to/font.ttf` before the `node` call; missing emoji degrade gracefully to no image.

### 5. Report

Print the output path (`release-<tag>.png`) and a one-line summary of what was rendered (e.g. "1 feat · 1 fix · 4 docs across 6 commits"). Note if any commits were truncated by `--max`. Offer to open it or attach it to the GitHub release.

## Guardrails

- Read-only against GitHub — never edits the release or repo. Writing the PNG into the current directory is the only side effect; don't overwrite an unrelated existing file without noting it.
- Grouping is best-effort on conventional commits; if **zero** commits match any known type, say so (the repo likely doesn't use conventional commits) and offer to render a flat list of recent commit subjects instead.
- Colors use the official Fonoster palette (`THEMES` in `references/render-card.mjs`): green Primary `#39E19E`, blue Secondary `#5FCFCE`, orange Tertiary `#FF9965`. Accent is intentionally sparing — band, logo mark, tag pill — with neutral Base grays for everything else. The wordmark uses Poppins (brand primary typeface); body stays Inter. Section emoji/labels and dimensions also live there.
- If `gh` fails, show the error and suggest `gh auth status`.
