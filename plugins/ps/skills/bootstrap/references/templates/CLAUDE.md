# {{PROJECT}} — Agent Guide

<one line on what {{PROJECT}} is and who it's for>.

## How work is organized

- **Coding conventions (the HOW)** live in this file. They apply to every change.
<!-- keep the next two bullets only if OpenSpec was scaffolded -->
- **Product behavior (the WHAT)** lives in OpenSpec specs under `openspec/specs/`, changed
  through proposals in `openspec/changes/`. Use `/openspec:propose`, `/openspec:apply`,
  `/openspec:archive`. Specs describe observable, testable behavior — not coding style.
- **Shipping a change (the LOOP)** drives one change from design to archive with
  `/ps:ship <change>`: design → spec reconcile → build → tests → sync → archive,
  resumable via a per-change checkpoint.

## Repository layout

<!-- monorepo: list each workspace and its role; single package: describe src/ instead -->
- `{{COMMON_DIR}}` — shared Zod schemas, types, errors, utils; the single source of truth
  for contracts. Depends on no other workspace package.
- `<package>` — <role>.

## Coding conventions

### Validated functions (preferred pattern for service/data functions)

Business logic uses the **validated-function** pattern: a factory that injects dependencies
and wraps an inner `fn` with `withErrorHandlingAndValidation(fn, schema)`, so invalid input
throws a structured `ValidationError` before the operation runs and tests inject stubs with
no live services. Schemas and client interfaces live in `@{{SCOPE}}/common`. Apply it to
input-validating operations — not trivial pure helpers or framework glue.

Full guide, rationale, and scaffolding: `/ps:create-validated-function`
(source: github.com/psanders/psstack).

### General

- TypeScript strict; no `any` (ESLint enforces `@typescript-eslint/no-explicit-any`).
- ESM: relative imports carry the `.js` extension, even from `.ts` source.
- Share contracts via `@{{SCOPE}}/common`; don't duplicate types across packages.
<!-- keep if a web/mobile surface exists -->
- All user-facing text goes through the i18n layer, never hardcoded literals.

## Commits

Use **Conventional Commits** (`type(scope): subject`, e.g. `feat(api): add objectives router`).
A Husky `commit-msg` hook runs commitlint and rejects non-conforming messages.
