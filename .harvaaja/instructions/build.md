# Building this project

Rules for implementers and fixers, on top of härvääjä's own.

## Proofs

- One test file: `npx vitest run path/to/file.test.ts`. One lint: `npx eslint path/to/file.ts`. Type check: `npm run typecheck`.
- Do not run `npm run build` or `npm run test:e2e`; they are not part of your proofs.
- A new test gets a first-line comment `@harvaaja-test-tier: fast`, `integration` or `host`: fast for pure rules in packages/game, integration for server tests using real sockets or SQLite, host for Playwright/Chrome.

## Conventions

- ESM only; import Node built-ins with `node:` prefix. Tabs for indentation, Stroustrup braces (`else`/`catch`/`finally` on a new line), double quotes, explicit semicolons, backticks for templates.
- Never use `any`; use `unknown` and narrow with zod schemas or guards. Explicit return types on exported functions. Use `readonly`/`as const` for fixed config.
- Avoid arrow functions except one-liners. Throw custom Error classes; never leave empty `catch` blocks.
- BEM CSS classes (`block__element--modifier`).
- `packages/game` stays pure (no I/O); shared schemas and views live in `packages/protocol`.
- Commit messages use `[FEAT]`, `[FIX]` style prefixes; never add Co-authored-by.
