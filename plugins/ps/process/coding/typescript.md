# Coding profile: `typescript`

Pedro's opinionated TypeScript baseline: the validated-function pattern, its helpers, and the
test shape. `/ps:implement` writes code with it in any repo whose AGENTS.md declares
`Profile: typescript` (see `../agents-md-contract.md`). The copyable code lives in
`templates/` next to this file; for a new project, pick dependencies from
`typescript-stack.md`.

These are defaults with reasons, not laws: override per project, but override deliberately,
and record the override in the repo's AGENTS.md `## Conventions` section. Never apply this
profile to a repo that hasn't declared it; older code keeps its own style.

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

Use it for input-validating operations (DB writes, service calls, business logic). Skip it for
trivial pure helpers and framework glue: the pattern earns its keep only when there is
external input to validate. A synchronous function that does validate input (parsing a file, loading
config) keeps the same rules without the async wrapper: `schema.safeParse` at the door, a
`ValidationError` on failure, one function per file, and the validation-failure test.

### Adding one validated function to an existing repo

**Adopting the profile part-way through a repo's life:** the first issue that adds a validated
function also adds the spine it uses: `zod` as a dependency of the shared package and
`ValidationError` from `templates/`. `withErrorHandlingAndValidation` comes with the first
async validated function, so no helper lands without a caller. The Reporter
puts that in the first such slice's Scope; later slices reuse it.

1. **Find the spine.** Locate the shared package and its scope (e.g. `@acme/common`).
   Confirm `withErrorHandlingAndValidation` and `ValidationError` exist there; if not, copy
   them from `templates/` first. A copy is new code in that repo: bring it to the repo's
   header, format and lint rules (JSDoc, semicolons, quotes) before the first commit.
2. **Schema** in the shared package's `schemas/`, re-exported from its barrel (§ Schemas).
3. **Client interface**: reuse one from the shared package's `types/`; add a minimal new one
   only if needed. The factory depends on the interface, not a concrete client.
4. **Function**: `create<Name>.ts` in the domain directory, shaped like
   `templates/createCreateWidget.ts`; re-export it from the domain barrel.
5. **Transport**, if the repo has one: a thin tRPC procedure (§ Transport).
6. **Test**: `create<Name>.test.ts`, shaped like `templates/createCreateWidget.test.ts`,
   including the validation-failure case.
7. Run the repo's typecheck and tests; the new test must pass.

## Schemas (in the shared package)

See `templates/widget.schema.ts`.
- `zod/v4`. Every field has a message. In a CommonJS repo, `zod/v4` with zod 3.x resolves
  to ESM types under `node16`/`nodenext` (TS1479); check the import against every package
  that consumes the shared one's `.d.ts` before pinning it.
- `.transform()` **normalizes at the edge** (trim, E.164 phone, canonical formats).
- Derive the type with `z.infer` — never hand-write the input type.
- A `create*Schema` and a separate `update*Schema` exposing only mutable fields.

## Transport (tRPC) is thin

Procedures only: pick the auth level (`public`/`protected`/`admin`), `.input(theSameSchema)`,
then delegate to a `create<Name>` function. No business logic in the router.

## Building a feature end to end

The order a feature gets built in. Design comes last, so it never blocks the layers that
don't need it:

1. **Spec first.** The behavior change lands in the issue's Spec before any code or design,
   and in the change's delta spec too when the repo uses OpenSpec
   (`openspec validate <name>`). Specs describe observable, testable behavior, not styling.
2. **Build from the bottom up:** shared schemas and types, validated functions, transport,
   then the clients that don't need a design: SDK, CLI, API. Each can ship on its own.
3. **Design last**, and only for the UI slice: when the repo has a `.pen` file, the screens
   (desktop and mobile) are reviewed and approved before that slice's components and pages
   are coded (Storybook first when the repo has it). No other slice waits on the design.
4. **Test both tiers:** unit tests per function (§ Tests), plus one end-to-end spec for the
   golden path of the flow just built.
5. **Promote specs only after green.** Syncing and archiving an OpenSpec change are
   hard-to-reverse steps: a human confirms each.

## Tests

See `templates/createCreateWidget.test.ts`.
- One test file per function: `create<Name>.test.ts`.
- `sinon.restore()` in `afterEach`; Arrange/Act/Assert comments.
- Inject a stubbed client (DI makes this a one-liner). No DB in unit tests.
- Always cover a **validation-failure** case asserting `ValidationError` and that the side
  effect never fired.
- Integration tests (real DB) live under `test/integration/**` and run on their own script.
- **E2E is a separate tier, not a replacement for unit tests.** When there's a UI surface, drive
  it end-to-end: **Playwright** for web/desktop (specs under `e2e/`, `playwright.config.ts`,
  script `test:e2e`), **Maestro** for mobile (YAML flows under `.maestro/`, script `test:e2e` →
  `maestro test .maestro`; Maestro is a machine-level CLI, not an npm dep). Keep E2E thin and
  flow-level — unit tests still own business logic.

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
