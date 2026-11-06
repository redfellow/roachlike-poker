# Repository Guidelines

## Project Structure & Module Organization

The TypeScript workspace contains `apps/web` (React/Vite), `apps/server` (Fastify/Socket.IO/SQLite), `packages/game` (pure rules), and `packages/protocol` (schemas and views). Unit/integration tests live beside source; browser tests are in `tests/e2e`. Original SVG creature art lives in `apps/web/src`. OpenSpec adoption is incremental; consult `openspec/migration-index.md` for specification coverage and existing documentation. Windows/Nginx operations are in `ops`.

## Specifications & Documentation

- `openspec/specs/` is canonical for approved requirements of explicitly migrated capabilities. `openspec/changes/` contains proposed or in-progress changes, not automatically approved current behavior. Archived changes preserve history.
- Read `openspec/migration-index.md` before changing requirements. For unmigrated behavior, existing documents remain provisional references. Missing OpenSpec coverage does not invalidate existing behavior. Code and tests provide evidence of implementation, not automatic proof of intended behavior; surface conflicts and unresolved decisions explicitly.
- Capture new or changed requirements through OpenSpec changes. Migrate the specific capability or requirements touched by the request; do not expand a small change into an entire domain migration without authorization. Identify source documents and sections, replacement requirements, retained context, and unresolved discrepancies in the change artifacts.
- Do not add duplicate requirement definitions to superseded documents. Developer guides, setup instructions, release procedures, operational runbooks, and explanatory architecture documentation remain maintained in their appropriate locations. Mixed documents may retain these sections after their requirements migrate.
- Update the migration index when coverage changes. Mark coverage as partial until the specified scope has been reviewed and integrated into the main specs and repository. Record exact scope and replacement spec links; do not mark a whole domain migrated because one requirement changed.
- Retire only the specific legacy sections or files whose replacement coverage has been reviewed. Preserve useful rationale and historical evidence, check cross-domain content, and update incoming links. Include retirement in the reviewed change; do not delete documents automatically when a domain is touched or an OpenSpec change is archived.
- OpenSpec archival, Git integration, deployment, and user acceptance are separate statuses. An archive operation alone establishes none of the others.
- Keep `README.md` focused on orientation, setup, and navigation. Link to OpenSpec for requirements and proposals and to maintained guides for operational detail.

Before finishing a task or creating a PR:

- Check that new or changed requirements are captured in the relevant OpenSpec change or integrated specs, and that migration coverage is accurately recorded.
- Check for duplicate or conflicting requirement edits outside OpenSpec. Relocate only task-owned edits as appropriate; never automatically revert contributor changes.
- Check whether superseded sections can safely be retired or need an explicit follow-up. Preserve unmigrated requirements and maintained guides, and repair affected links.
- Report verification and integration status separately from spec synchronization, archival, and acceptance.

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

Never mark commits Co-authored-by you.

## Releasing New Versions

When asked to tag a release:

1. Rebase `main` to include new code from `development`.
2. Increment the root `package.json` version according to SemVer and keep `package-lock.json` synchronized. Versions before the accepted MVP remain below `1.0.0`; the accepted MVP is `1.0.0`.
3. Create a matching `v<version>` Git tag on `main`, never on `development`.
4. Only then run build scripts.

## Security & Configuration

Never commit secrets. Use configuration placeholders and ignore local environment files and generated artifacts.
