---
name: create-validated-function
description: Scaffold one function using the validated-function pattern — a factory that injects dependencies and wraps an inner fn with Zod validation + structured error handling, plus its sinon test. Use when adding a service/data function to an existing repo, or runs /ps:create-validated-function.
license: MIT
metadata:
  author: psanders
  version: "1.0"
---

# Create validated function — scaffold one the right way

Add a single unit of business logic using the validated-function pattern: a factory that
injects dependencies and wraps a typed inner `fn` with `withErrorHandlingAndValidation(fn,
schema)`, so invalid input throws a structured `ValidationError` before the operation runs
and tests inject stubs with zero mocking machinery. One function, one file, one test.

This is the on-demand counterpart to `/ps:bootstrap` (which stands up a whole repo). The
**canonical shapes live in bootstrap's templates** — reuse them, don't reinvent:

- `../bootstrap/references/templates/widget.schema.ts` — the schema shape
- `../bootstrap/references/templates/createCreateWidget.ts` — the function shape
- `../bootstrap/references/templates/createCreateWidget.test.ts` — the test shape
- `../bootstrap/references/conventions.md` § "THE validated-function pattern" — the rationale

## When to use

Adding an input-validating operation (DB write, service call, business logic) to an existing
repo. Skip for trivial pure helpers or framework glue — the pattern earns its keep only when
there's external input to validate.

## Detect the repo's conventions first

Don't hardcode paths — read them from the repo:

- **Shared package + scope**: find the `common` workspace and its package name (e.g.
  `@acme/common`) from the root `package.json` workspaces and `CLAUDE.md`. Schemas, types,
  errors, and the `withErrorHandlingAndValidation` util live there.
- **Domain home**: where service functions live (e.g. `src/api/<domain>/` or
  `mods/<service>/src/...`). Match the surrounding layout.
- **Spine present?**: confirm `withErrorHandlingAndValidation` and `ValidationError` already
  exist in the shared package. If not, copy them from
  `../bootstrap/references/templates/{withErrorHandlingAndValidation,ValidationError}.ts`
  first.

## Steps

1. **Schema** — in the shared package's `schemas/`. Use `zod/v4`; give every field a message;
   `.transform()` to normalize at the edge (trim, E.164, canonical forms). Derive the type with
   `z.infer` — never hand-write it. Add a separate `update*Schema` exposing only mutable fields
   if the operation needs one. Re-export from the schemas barrel.

2. **Client interface** — reuse an existing one from the shared package's `types/`; add a new
   minimal interface there only if needed. The factory depends on this interface, not a concrete
   client, so tests can stub it.

3. **Function** — `create<Name>.ts` in the domain dir. Factory takes the injected client; inner
   typed `fn` (`params: <Name>Input`) does the work with verbose entry/exit logging (ids and
   safe fields only — never secrets/PII); return `withErrorHandlingAndValidation(fn, <name>Schema)`.
   Re-export from the domain barrel `index.ts`.

4. **Transport (if applicable)** — if the repo exposes this over tRPC, add a thin procedure that
   picks the auth level, `.input(theSameSchema)`, and delegates to `create<Name>`. No business
   logic in the router.

5. **Test** — `create<Name>.test.ts`, one per function. Inject a sinon-stubbed client;
   Arrange/Act/Assert; `sinon.restore()` in `afterEach`. Always include a **validation-failure
   case** asserting `ValidationError` is thrown and the side effect never fired.

## Finish

- Follow the repo's own conventions (`CLAUDE.md`) for ESM `.js` import specifiers, copyright
  headers, and i18n — defer to them, don't restate.
- Run the repo's `typecheck` + `test`; the new test must pass. Report results honestly.

## Rules

- One function per file, `create<Name>.ts` — greppable, small blast radius.
- Factory + DI — no module-level singletons; the client is always injected.
- Schema is the single source of truth for the input type (`z.infer`).
- Every function ships with its test, including the validation-failure path.
