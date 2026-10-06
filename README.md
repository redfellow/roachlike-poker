# roachlike

A Finnish, private-room bluffing card game for 2–6 friends. The MVP uses an external video call. Built-in audio/video is a later phase.

## Local development

Use Node.js 24 LTS or newer and npm. Development is supported on macOS; the intended deployment host is Windows with an existing Nginx installation.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Create a room and share its `/r/...` link. Use separate browser profiles/contexts to play multiple people locally; tabs share device/session storage. One active room is supported initially. The browser remembers the room link and name.

The API listens on `127.0.0.1:3001`. The Vite development server proxies API and Socket.IO traffic. Both listeners are local-only by default. SQLite is stored at `data/torakkapokeri.sqlite`; it is private server data and must never be served as static content.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start server and Vite with change watching |
| `npm run typecheck` | Check TypeScript without emitting files |
| `npm run lint` | Check repository style rules |
| `npm test` | Run game and server integration tests |
| `npm run check` | Typecheck, lint, and unit/integration tests |
| `npm run test:e2e` | Run isolated Chrome browser scenarios against development servers |
| `npm run build` | Produce browser production assets; run only when requested |
| `npm start` | Run the server, serving existing production assets when available |

Browser tests require installed Google Chrome. MVP checks use desktop Chrome at desktop and portrait-phone dimensions; they do not establish real iPhone compatibility. No production build has been run during initial implementation.

## Structure

- `packages/game`: pure game state, rules, private projections, predictions, achievements.
- `packages/protocol`: runtime command schemas and typed client views.
- `apps/server`: Fastify/Socket.IO server and transactional SQLite store.
- `apps/web`: React table, original creature SVGs, Finnish UI, responsive CSS.
- `tests/e2e`: multi-browser interaction tests.
- `docs`: product decisions, rules, technical plan, backlog, and verification status.
- `ops`: Windows/Nginx deployment and backup guidance.

## Persistence and identity

State is committed before acknowledgment. Command receipts prevent duplicate penalties on retries. Reconnects restore the saved hand and phase; recap history survives rematches and restarts. Hidden hands and pending predictions are projected individually, never broadcast to spectators.

This is a friends-only identity model: an exact-name join may reclaim a disconnected seat without confirmation. Keep the invite link within the group. A voted replacement inherits the seat while retaining separate personal statistics.

## Configuration and deployment

`TORAKKA_DB` overrides the database path; `PORT` overrides the backend port. Use an absolute database path for deployment. The process serves the built web assets from `apps/web/dist` when that directory exists.

See [Windows deployment](ops/windows.md), [rules contract](docs/rules-contract.md), and [implementation backlog](docs/implementation-backlog.md). Remaining validation and implementation gaps are tracked in [MVP status](docs/mvp-status.md).
