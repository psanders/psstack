# Dependency groups — the menu

The recurring dependency bundles, distilled from how these projects are actually built.
Bootstrap presents these to the user as **opt-in groups** and only installs what they pick.
Package names are the real ones in use; versions are intentionally omitted (install latest).

---

## Always-on baseline (not asked — this is the spine)

Stated, not offered. Every project gets these.

- **Language**: `typescript`, `tsx` — strict TS, ESM, `.js` import specifiers.
- **Validation**: `zod` (`zod/v4`) — the validated-function pattern depends on it.
- **Lint / format / hooks**: `eslint`, `@eslint/js`, `typescript-eslint`, `prettier`,
  `husky`, `lint-staged` — flat config; pre-commit runs lint-staged.
- **Testing**: `mocha`, `chai`, `sinon`, `sinon-chai`, `@types/{mocha,chai,sinon,sinon-chai}`,
  `nodemon` — one test file per function; mock injected deps.
- **Conventional commits** — commit format `feat:/fix:/chore:`; drives changelog + versioning.
- **Logging**: `@fonoster/logger`.
- **Monorepo** (only if multi-surface): `lerna` + npm workspaces, `conventionalCommits: true`.

---

## Opt-in groups

### A. Database — Prisma  *(choice: SQLite or Postgres)*
The ORM is always Prisma; the engine is the decision.
- Common: `prisma` (dev), `@prisma/client`
- **SQLite** (simple / single-writer): `@prisma/adapter-better-sqlite3`
- **Postgres** (rich / relational / concurrent): the `pg` driver (Prisma's `postgresql` provider)
- Client generated into `src/generated/` (gitignored); enums `@@map` to snake_case tables.

### B. Backend API — tRPC service
- `express`, `@trpc/server`, `jose` (JWT/auth), `bcryptjs`, `@types/{express,bcryptjs}`
- Thin procedures (`public`/`protected`/`admin`) wiring `.input(schema)` → validated functions.

### C. Client data layer  *(for any frontend talking to the tRPC API)*
- `@trpc/client`, `@trpc/react-query`, `@tanstack/react-query`

### D. Web frontend — Vite + React + Tailwind
- `vite`, `@vitejs/plugin-react`, `react`, `react-dom`, `react-router-dom`
- `tailwindcss`, `@tailwindcss/vite` (Tailwind v4), `lucide-react`, `clsx`, `tailwind-merge`
- Optional motion: `framer-motion`

### E. Desktop — Tauri  *(pairs with group D)*
- `@tauri-apps/api`, `@tauri-apps/cli` (dev), `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`
- Scripts: `tauri`, `tauri:dev`, `tauri:build`. Frontend served by Vite.

### F. Mobile — Expo / React Native
- `expo`, `expo-router`, `expo-constants`, `expo-dev-client`, `react`, `react-native`
- `react-native-reanimated`, `react-native-gesture-handler`, `react-native-safe-area-context`,
  `react-native-screens`, `react-native-svg`
- Storage/secure: `expo-secure-store`, `expo-sqlite`, `@react-native-async-storage/async-storage`
- Extras as needed: `expo-haptics`, `expo-linear-gradient`, `expo-local-authentication`,
  `expo-file-system`, `expo-sharing`, `react-native-ble-plx`, `react-native-view-shot`
- Pairs with group C for data. Reanimated needs its babel plugin.
- **E2E**: Maestro (group L) — implied whenever Mobile is selected.

### G. CLI
- `@oclif/core`, `@inquirer/prompts`, `cliui`, `figlet`, `moment`, `@types/figlet`
- Talks to the API via `@trpc/client`.

### H. LLM / Agents
- `@langchain/core`, **`@langchain/anthropic`** (default provider — Claude)
- Optional alternates: `@langchain/openai`, `@langchain/google-genai`
- `zod` for tool schemas. **Default to current Claude models** when wiring the client:
  `claude-opus-4-8` (most capable), `claude-sonnet-4-6` (balanced), `claude-haiku-4-5` (fast).
- Agent tools are declared as function-calling schemas and routed into the **same validated
  functions** the API uses (see `conventions.md` → optional agent layer).

### I. Storybook  *(component-driven UI dev)*
- `storybook`, `@storybook/react-vite` (web) or `@storybook/react-native` (mobile)

### J. Documents & media  *(receipts, exports, images)*
- PDF/render: `pdfkit`, `satori`, `@resvg/resvg-js`, `sharp`
- Data/exports: `exceljs`, `qrcode`, `yaml`
- Misc: `jsonwebtoken` (signed artifacts), `phone` (E.164 normalization)

### K. E2E — Playwright  *(web / desktop end-to-end)*
- `@playwright/test` (dev); `npx playwright install` pulls the browsers.
- Implied whenever a Web (group D) or Desktop (group E) surface is selected; offered, not forced.
- Specs live under `e2e/`; `playwright.config.ts` at the package root. Script: `test:e2e`.
- Complements mocha unit tests — it does **not** replace them. Unit tests stay the default for
  business logic; Playwright covers the rendered UI / full-stack flows.

### L. E2E — Maestro  *(mobile end-to-end)*
- Maestro is a CLI, **not** an npm dependency — installed once per machine
  (`curl -fsSL https://get.maestro.mobile.dev | bash`), not added to `package.json`.
- Implied whenever Mobile (group F) is selected.
- Flows are YAML under `.maestro/` (e.g. `.maestro/launch.yaml`). Script: `test:e2e`
  → `maestro test .maestro`. Note the prerequisite in the README rather than installing it.

### M. Workflow tooling  *(commands & skills wired into the new repo)*
These are not runtime deps — they configure the project's AI/dev workflow. Offered as opt-in.
- **psstack commands** — make this toolbelt's skills (`/ps:kaizen`, `/ps:issues-daily`,
  `/ps:issues-report`, `/ps:bootstrap`) available in the new repo by adding the marketplace +
  plugin to the project's `.claude/settings.json` (`extraKnownMarketplaces` + `enabledPlugins`),
  so a fresh clone gets them without per-machine setup.
- **OpenSpec** — spec-driven development. `npx openspec@latest init --tools claude` scaffolds the
  `openspec/` spec layer and registers the `/openspec:*` (a.k.a. `/opsx:*` — `propose`, `apply`,
  `archive`) slash commands for Claude Code. Adds an `openspec` dev dependency.

---

## Presentation rules for the skill

1. State the **always-on baseline** briefly — don't ask about it.
2. Ask **project surfaces** first (multi-select): Backend API, Web, Desktop (Tauri), Mobile,
   CLI, LLM/Agents. These imply their groups (Desktop implies Web; any frontend implies C).
3. Ask the **database** decision (SQLite vs Postgres vs none).
4. Ask **add-ons** (multi-select): Storybook, Documents & media, **E2E tests (Playwright)** —
   only offer Playwright when a Web or Desktop surface is in play. Maestro is **not** asked: it
   is implied by the Mobile surface (noted as a machine prerequisite, not an install).
5. Ask **workflow tooling** (multi-select): **psstack commands**, **OpenSpec** — always offer,
   regardless of surfaces.
6. `AskUserQuestion` caps at 4 options per question — split a long list across multiple
   questions rather than dropping choices.
7. Echo back the final resolved dependency set for confirmation **before** installing anything.
