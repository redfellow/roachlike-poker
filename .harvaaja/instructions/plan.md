# Planning this project

Rules for planners, on top of härvääjä's own.

## Proofs

- Unit and integration tests are Vitest `*.test.ts` files beside source (packages/game, packages/protocol, apps/server, apps/web/src). Name a proof as `npx vitest run <path/to/file.test.ts>`.
- Browser tests are Playwright `*.spec.ts` in `tests/e2e` and need Chrome; they run only at release. Name `npx playwright test tests/e2e/<file>.spec.ts` only for tasks that change browser behavior.
- Lint one file: `npx eslint <file>`. Type check: `npm run typecheck` (whole project, `tsc --noEmit`).
- Mark test speed with a first-line comment `@harvaaja-test-tier: fast`, `integration` or `host`. Server tests that start Fastify/Socket.IO/SQLite are `integration`.

## Every plan includes

- Tests for card conservation, hidden-information boundaries (protocol views must not leak other players' cards), command races and recovery where touched.
- Requirement changes go through an OpenSpec change under `openspec/changes/`; check `openspec/migration-index.md` and update it when coverage changes.
- Style: tabs, Stroustrup braces, double quotes, semicolons, no `any`, BEM CSS class names.
