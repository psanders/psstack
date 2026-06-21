---
name: bootstrap
description: Scaffold a new TypeScript/Node project from a captured, opinionated baseline. Presents recurring dependency groups (Prisma SQLite/Postgres, tRPC, Vite+React+Tailwind, Tauri, Expo, CLI/oclif, LangChain LLM, Storybook, docs/media, Playwright/Maestro E2E) plus opt-in workflow tooling (psstack commands, OpenSpec) as choices, confirms the stack, then scaffolds Zod-validated functions with DI + mocha/sinon tests + tooling. Use when starting a new project or service from scratch, or runs /ps:bootstrap.
license: MIT
metadata:
  author: psanders
  version: "1.1"
---

# Bootstrap — capture the opinionated starting line

Stand up a new TypeScript/Node project the way I actually build them, so a fresh repo
starts from my conventions instead of a blank page. This is not a generic generator — it
encodes a specific, opinionated baseline.

**Read `references/conventions.md` and `references/dependency-groups.md` first.** Together they
are the source of truth for every choice below. The copyable code lives in `references/templates/`.

## When to use

Starting a new project or service from scratch (empty or near-empty directory). For
improving an existing repo, use `/ps:kaizen` instead.

## Step 1 — Pick the stack (interactive, BEFORE scaffolding)

The whole point of this skill is to assemble the right **dependency groups** for this project
and confirm them with the user before a single file is written. Drive it like this:

1. **State the always-on baseline** (don't ask): TypeScript (strict, ESM), Zod + the
   validated-function pattern, eslint + prettier + husky + lint-staged, mocha + chai + sinon,
   conventional commits, `@fonoster/logger`. These come with every project.

2. **Gather identity** with **AskUserQuestion** (batch): project name + package scope
   (`acme` → `@acme/...`), and org + license + year for the copyright header (default to the
   user's identity and MIT).

3. **Choose project surfaces** — **AskUserQuestion, `multiSelect: true`**: Backend API (tRPC),
   Web (Vite + React + Tailwind), Desktop (Tauri), Mobile (Expo), CLI, LLM/Agents. Surfaces imply
   groups: Desktop implies Web; any frontend implies the client data layer (`@tanstack/react-query`
   + tRPC client); **Mobile implies Maestro** for E2E (group L — a machine-level CLI, noted as a
   prerequisite, not installed). Since the tool caps at 4 options per question, split across two
   questions rather than dropping any surface.

4. **Choose the database** — **AskUserQuestion**: SQLite (simple/single-writer, default),
   Postgres (rich/relational/concurrent), or none. Prisma either way.

5. **Choose add-ons** — **AskUserQuestion, `multiSelect: true`**: Storybook, Documents & media
   (pdf/excel/qr/images), **E2E tests (Playwright)** — only offer Playwright when a Web or Desktop
   surface was chosen. Skip the question entirely if no surface would use any add-on.

6. **Choose workflow tooling** — **AskUserQuestion, `multiSelect: true`** (always ask): **psstack
   commands** (wire this toolbelt's `/ps:*` skills into the new repo via `.claude/settings.json`)
   and **OpenSpec** (`npx openspec@latest init --tools claude` → spec layer + `/openspec:*` slash
   commands). Both are opt-in; install only what's picked. See group M in `dependency-groups.md`.

7. **Infer layout**: more than one surface → **monorepo** (npm workspaces + Lerna) with a shared
   `common` package; a single surface → single package. State which you chose and why.

8. **Resolve and confirm.** Expand the selected surfaces + add-ons into the concrete package list
   using `references/dependency-groups.md`, then **echo the full resolved dependency set back to
   the user for confirmation before installing anything.** Do not scaffold until they confirm.

## Step 2 — Scaffold the baseline

Create the structure for the chosen shape. Match `references/conventions.md` exactly.

- **Root**: `package.json` (npm workspaces if monorepo, `"engines": { "node": ">=22" }`),
  `.nvmrc` (`22`), `tsconfig` (strict, ESM, `NodeNext`), `eslint.config.mjs` (flat),
  `.prettierrc`, `.gitignore` (include `dist/`, `node_modules/`, `**/src/generated/`),
  husky `pre-commit` → `lint-staged`, and—if monorepo—`lerna.json` with `conventionalCommits: true`.
- **Shared `common` package** (if monorepo): `src/{schemas,types,errors,utils}`. Drop in the
  validation spine from templates (rename `{{...}}` placeholders):
  - `utils/withErrorHandlingAndValidation.ts`
  - `errors/ValidationError.ts`
- **Prisma**: `prisma/schema.prisma` with the chosen `datasource` provider, client generator
  output to `src/generated/`, one example model (`Widget`) with enums `@@map`'d to snake_case.
  Wire `db:*` scripts (`generate`, `migrate`, `push`, `studio`, `seed`, `reset`).
- **A service** (`api` surface): `src/api/widgets/` containing the example validated function,
  its barrel `index.ts`, a `logger.ts`, and—if tRPC chosen—a thin router wiring `.input(schema)`
  to the function. Build (`tsc -b`), dev (`nodemon`), test (`mocha`) scripts.
- **One worked example end to end** so the pattern is copy-pasteable:
  - schema → `templates/widget.schema.ts`
  - function → `templates/createCreateWidget.ts`
  - test → `templates/createCreateWidget.test.ts`
- **Agent layer** (only if chosen): `tools/definitions.ts` + `tools/executor/` that route tool
  calls into the validated functions; an `agents` schema + a config file. See the optional
  section in `conventions.md`.
- **E2E** (only if chosen / implied): for **Playwright** (web/desktop), add `playwright.config.ts`,
  an `e2e/` dir with one example spec, and a `test:e2e` script; note `npx playwright install` in
  the README. For **Maestro** (mobile), add `.maestro/` with one example flow (`launch.yaml`), a
  `test:e2e` script (`maestro test .maestro`), and a README note that Maestro is a machine-level
  CLI to install once — never add it to `package.json`.
- **Workflow tooling** (only if chosen):
  - **psstack commands** → write `.claude/settings.json` (or merge) registering the marketplace
    and enabling the plugin (`extraKnownMarketplaces` for `psanders/psstack` + `enabledPlugins`
    for `ps@psstack`) so a fresh clone gets `/ps:*` without per-machine setup.
  - **OpenSpec** → run `npx openspec@latest init --tools claude` (scaffolds `openspec/` and the
    `/openspec:*` commands). Add `openspec` as a dev dependency and mention it in the README.

When copying a template, replace placeholders: `{{YEAR}}`, `{{ORG}}`, `{{LICENSE}}`, `{{SCOPE}}`.

## Step 3 — Make it run green

- Install deps. Generate the Prisma client. Run an initial migration (or `db:push` for SQLite).
- Run `lint`, `typecheck`, and `test` — the example function + its test must pass.
- E2E is the secondary tier: the Playwright/Maestro example must **typecheck/parse**, but don't
  block the green bar on a running browser/emulator — note `test:e2e` as a follow-up to run locally.
- Report honestly what passed; fix what didn't before declaring done.

## Step 4 — Initialize git + first commit

- `git init`, add a `.gitignore`, and make a conventional first commit (`chore: bootstrap project`)
  **only if the user wants it** — ask first.

## Step 5 — Hand off

Tell the user what was created and show the one rule that matters most going forward:

> New business logic = one `create<Name>.ts` file: a factory taking injected deps, an inner
> typed `fn`, returned wrapped in `withErrorHandlingAndValidation(fn, schema)`. Schema + type
> in `common`. One sinon test per function.

Point them at `references/conventions.md` as the living spec, and suggest `/ps:kaizen` for the
daily improvement loop once they're underway.

## Rules

- Conventions over preferences-of-the-moment: follow `references/conventions.md`; deviate only
  when the user asks, and say so.
- Produce a **working** example (green lint/typecheck/test), not just files.
- Never invent stack choices silently — surface the SQLite-vs-Postgres and layout decisions.
- Keep the scaffold minimal: one worked vertical slice, not a kitchen sink.
