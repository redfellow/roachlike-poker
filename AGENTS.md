# Repository Guidelines

## Project Structure & Module Organization

The TypeScript workspace contains `apps/web` (React/Vite), `apps/server` (Fastify/Socket.IO/SQLite), `packages/game` (pure rules), and `packages/protocol` (schemas and views). Unit/integration tests live beside source; browser tests are in `tests/e2e`. Original SVG creature art lives in `apps/web/src`. Product specifications and acceptance criteria are in `docs`; Windows/Nginx operations are in `ops`.

## Build, Test, and Development Commands

- `npm ci`: install locked dependencies on Node.js 24 or newer.
- `npm run dev`: start the local server and browser app.
- `npm run check`: typecheck, lint, and run Vitest tests.
- `npm run test:e2e`: run Chrome scenarios, including mobile-sized viewports.
- `npm run build`: generate production browser assets.
- `npm start`: start the server with existing production assets.

Only run build commands when the user requests them. A release-tag request authorizes the build at the end of the release sequence below. See `README.md` for configuration.

## Formatting & Style

- Strictly use Stroustrup braces: put `else`, `catch`, and `finally` on a new line after the closing brace.
- Indent with tabs; use spaces for YAML indentation.
- Use explicit semicolons, double-quoted strings, and backticks for templates.
- Avoid arrow functions unless they are one-liners.
- Use BEM CSS classes: `block`, `block__element`, `block--modifier`, and `block__element--modifier`.
- ESLint and ESLint Stylistic enforce the configured conventions.

## TypeScript Guidelines

- Never use `any`. Use `unknown` for dynamic data and narrow with runtime guards or schemas.
- Specify return types on exported and public functions.
- Use `readonly` and `as const` for fixed configurations.

## Node.js Guidelines

- Use ESM imports and prefix built-in modules with `node:`, for example `node:fs/promises`.
- Prefer `async`/`await` over Promise chains.
- Throw custom `Error` classes. Never swallow errors in empty `catch` blocks.

## Testing Guidelines

Use Vitest `*.test.ts` files for rules and server integration, and Playwright `*.spec.ts` for browser behavior. Test card conservation, hidden-information boundaries, command races, and recovery. No arbitrary coverage threshold is imposed. Add regression tests for meaningful fixes.

## Commit & Pull Request Guidelines

Use concise commit messages prefixed with an uppercase Conventional Commits type in brackets, such as `[FEAT] Add game setup` or `[FIX] Validate player count`.

When asked to commit, propose the commit message and request approval before committing. Once approved, commit and push.

PRs should explain purpose, link relevant issues, list validation, and include screenshots for interface changes.

When asked to suggest commits, always check the files, also consider unstaged.

## Releasing New Versions

When asked to tag a release:

1. Rebase `main` to include new code from `development`.
2. Increment the version in `manifest.json` by `0.1`.
3. Create the Git tag on `main`, never on `development`.
4. Only then run build scripts.

## Security & Configuration

Never commit secrets. Use configuration placeholders and ignore local environment files and generated artifacts.
