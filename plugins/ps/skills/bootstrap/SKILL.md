---
name: bootstrap
description: Scaffold a new TypeScript/Node project using a captured, opinionated engineering baseline — Prisma (SQLite or Postgres), Zod-validated functions with dependency injection, tRPC, mocha/sinon tests, and standard tooling. Use when starting a new project or service from scratch, or runs /ps:bootstrap.
license: MIT
metadata:
  author: psanders
  version: "1.0"
---

# Bootstrap — capture the opinionated starting line

Stand up a new TypeScript/Node project the way I actually build them, so a fresh repo
starts from my conventions instead of a blank page. This is not a generic generator — it
encodes a specific, opinionated baseline.

**Read `references/conventions.md` first.** It is the source of truth for every choice
below. The copyable code lives in `references/templates/`.

## When to use

Starting a new project or service from scratch (empty or near-empty directory). For
improving an existing repo, use `/ps:kaizen` instead.

## Step 1 — Decide the shape

Ask the user with **AskUserQuestion** (batch the questions). Infer sensible defaults from
anything they already said and only ask what's genuinely open:

1. **Project name + package scope** (e.g. `acme` → packages named `@acme/...`).
2. **Domain complexity → database.** Simple/single-writer → **SQLite** (`@prisma/adapter-better-sqlite3`).
   Rich/relational/concurrent → **Postgres**. When unsure, default SQLite (migration later is mechanical).
3. **Layout.** Single package (one simple service) or **monorepo** (multiple surfaces:
   API + agents + CLI + web). Monorepo always gets a shared `common` package.
4. **Surfaces to include.** Any of: tRPC API server, agent/LLM layer, CLI, web app.
5. **Org + license + year** for the copyright header (default to the user's identity and MIT).

Confirm the resulting plan in one short summary before writing anything.

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

When copying a template, replace placeholders: `{{YEAR}}`, `{{ORG}}`, `{{LICENSE}}`, `{{SCOPE}}`.

## Step 3 — Make it run green

- Install deps. Generate the Prisma client. Run an initial migration (or `db:push` for SQLite).
- Run `lint`, `typecheck`, and `test` — the example function + its test must pass.
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
