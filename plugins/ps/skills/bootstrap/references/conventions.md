# Engineering conventions — the captured playbook

The opinionated baseline this bootstrap encodes. Read it before scaffolding so the
generated project is internally consistent. These are defaults with reasons, not laws —
override per project, but override deliberately.

## Stack

| Layer | Default | Notes |
| :--- | :--- | :--- |
| Runtime | Node **≥ 22**, pinned in `.nvmrc` | `"engines": { "node": ">=22" }` in root package.json |
| Language | TypeScript, **strict**, **ESM** | Relative imports carry the `.js` extension (ESM requires it, even from `.ts` source) |
| ORM | **Prisma** | Client generated into `src/generated/` (gitignored). Enums `@@map` to snake_case table names |
| Database | **SQLite** (simple) / **Postgres** (complex) | See decision rule below |
| Validation | **Zod** (`zod/v4`) | The spine of the validated-function pattern |
| Transport | **tRPC** | `publicProcedure` / `protectedProcedure` / `adminProcedure`; `.input(schema)` wires the same schemas |
| Tests | **mocha + chai + sinon** | Unit vs integration split (`test/integration/**`) |
| Build | `tsc -b --force` | Dev loop via `nodemon` (watch `src`, rebuild + run); `tsx` for one-off scripts |
| Lint/format | **eslint** (flat config) + **prettier** | `husky` pre-commit → `lint-staged` on staged files |
| Monorepo | **npm workspaces + Lerna** | Conventional commits; Lerna versions/publishes the publishable packages |

### Database decision rule

- **SQLite** when the domain is simple: single-writer, embeddable, no separate server, easy
  local + container persistence (a mounted volume). Use `@prisma/adapter-better-sqlite3`.
- **Postgres** when the domain is rich/complex: concurrent writers, relational depth,
  advanced types, analytical queries, or you expect to scale out.
- When unsure, start SQLite — migrating Prisma to Postgres later is mechanical.

## Project shape

- **Single package** for a simple service.
- **Monorepo** (`packages/*` or `mods/*`) once there is more than one surface — e.g. an
  API server, an agent/worker layer, a CLI, a web app. Always carve out a **shared package**
  (call it `common`) that owns: Zod **schemas**, their inferred **types**, **error classes**,
  and pure **utils**. Everything else depends on `common`; `common` depends on nothing app-specific.
- Inside a service, group by **domain** under `src/api/<domain>/` (e.g. `customers`, `loans`),
  each with one `create<Fn>.ts` file per operation plus a barrel `index.ts`.

## THE validated-function pattern (the crown jewel)

Every unit of business logic is written this way. See `templates/createCreateWidget.ts`.

```
export function create<Name>(deps) {           // factory — inject dependencies
  const fn = async (params: <Name>Input): Promise<Result> => {
    logger.verbose("doing X", { ...safeFields });
    const out = await deps.client.<model>.<op>({ ... });
    logger.verbose("did X", { id: out.id });
    return out;
  };
  return withErrorHandlingAndValidation(fn, <name>Schema);  // validate at the door
}
```

Why each rule exists:
- **One function per file, `create<Name>.ts`** — greppable, reviewable, small blast radius.
- **Factory + dependency injection** — no module-level singletons. The db client and any
  service are passed in, so a test injects a sinon stub with zero mocking machinery.
- **Typed inner `fn`** — params type is `z.infer` of the schema; one source of truth.
- **`withErrorHandlingAndValidation(fn, schema)`** — input is `safeParse`d before `fn` runs;
  on failure it throws a structured `ValidationError` (field-level errors fit for an API response).
  See `templates/withErrorHandlingAndValidation.ts` and `templates/ValidationError.ts`.
- **Verbose logging at entry + exit** — never log secrets/PII; log ids and safe fields.
- **Barrel `index.ts`** re-exports each `create<Name>` for clean imports.

## Schemas (in the shared package)

See `templates/widget.schema.ts`.
- `zod/v4`. Every field has a message.
- `.transform()` **normalizes at the edge** (trim, E.164 phone, canonical formats).
- Derive the type with `z.infer` — never hand-write the input type.
- A `create*Schema` and a separate `update*Schema` exposing only mutable fields.

## Transport (tRPC) is thin

Procedures only: pick the auth level (`public`/`protected`/`admin`), `.input(theSameSchema)`,
then delegate to a `create<Name>` function. No business logic in the router.

## Tests

See `templates/createCreateWidget.test.ts`.
- One test file per function: `create<Name>.test.ts`.
- `sinon.restore()` in `afterEach`; Arrange/Act/Assert comments.
- Inject a stubbed client (DI makes this a one-liner). No DB in unit tests.
- Always cover a **validation-failure** case asserting `ValidationError` and that the side
  effect never fired.
- Integration tests (real DB) live under `test/integration/**` and run on their own script.

## File hygiene

- **Copyright header** on every source file: `/** Copyright (C) <year> by <org>. <license>. */`
- Conventional commits (`feat:`, `fix:`, `chore:` …) — drives Lerna versioning/changelog.
- `.js` extension on every relative import.

## Optional: the agent layer

When the project is an LLM/agent app, reuse the same validated functions as the agent's hands:
- `tools/definitions.ts` — declare each tool as an OpenAI function-calling schema (name,
  description, JSON-schema parameters).
- `tools/executor/` — map an incoming tool call to the matching `create<Name>` function, so
  the LLM and the API share identical validated logic.
- Agents are declared **declaratively** (a schema + a `agents.yaml`-style config), with a
  router selecting the agent and a session store holding conversation state.
This keeps the LLM surface honest: the model can only do what a validated function already allows.
