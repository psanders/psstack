# AGENTS.md

<!-- Template for /ps:bootstrap. Sections follow psstack process/agents-md-contract.md.
     Fill the placeholders, prune conditional lines, delete these comments. -->

## Overview

{{PROJECT}}: <one line on what it is and who it's for>.

<!-- monorepo: one line per workspace; single package: describe src/ instead -->
- `{{COMMON_DIR}}`: shared Zod schemas, types, errors and utils; the single source of truth
  for contracts. Depends on no other workspace package.
- `<package>`: <role>.

## Commands

- Install: `npm install`
- Build: `npm run build`
- Test: `npm test` (one package: `npm test -w <package>`)
- Lint and typecheck: `npm run lint`, `npm run typecheck`

## Conventions

Profile: typescript
Overrides: none
<!-- keep if a web/mobile surface exists -->
- All user-facing text goes through the i18n layer, never hardcoded literals.

## Areas

| Area label | Paths | Experts |
| :--- | :--- | :--- |
| `area: <name>` | `<path>` | software-architect |

## Compatibility

<!-- what counts as a breaking change here: exported APIs, tRPC procedures, CLI flags,
     env vars, the Prisma schema -->

## Release

Conventional Commits (`type(scope): subject`); a Husky `commit-msg` hook runs commitlint.
<!-- keep if Lerna was scaffolded --> Lerna versions and publishes from the commit history.

<!-- keep the next section only if OpenSpec was scaffolded -->
## Product specs

Product behavior lives in OpenSpec specs under `openspec/specs/`, changed through proposals in
`openspec/changes/`. Specs describe observable, testable behavior, not coding style.

## Decisions

- {{DATE}}: Bootstrapped from the psstack `typescript` profile.
