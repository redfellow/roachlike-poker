# roachlike

A browser-based bluffing card game for 2–6 friends, with open-by-default rooms, optional private lobbies, and a Finnish interface. The MVP uses an external video call. Built-in audio/video is a later phase.

## Versioning

The application follows [Semantic Versioning](https://semver.org/). The canonical version is the root `package.json` `version` field, with `package-lock.json` kept in sync. Pre-MVP development uses `0.x.y`; the accepted MVP release will be `1.0.0`. Stable Git tags and GitHub Releases use the matching `v<version>` form.

## Credits

"Cockroach Poker" was designed by Jacques Zeimet and published by Drei Magier Spiele in 2004. See the [Wikipedia article](https://en.wikipedia.org/wiki/Cockroach_Poker).

## Local development

Use Node.js 24 LTS or newer and npm. Development is supported on macOS; the intended deployment host is Windows with an existing Nginx installation.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Create a room and share its `/r/...` link, or let the host publish it in the landing page's open-room list. Use separate browser profiles/contexts to play multiple people locally; tabs share device/session storage. The server supports multiple independent rooms. The browser remembers the latest room link and name.

The API listens on `127.0.0.1:3001`. The Vite development server proxies API and Socket.IO traffic. Both listeners are local-only by default. SQLite is stored at `data/torakkapokeri.sqlite`; it is private server data and must never be served as static content.

The browser uses History API navigation between the landing page and room routes. Direct room URLs, refreshes, and browser back/forward navigation remain supported without forcing internal links to reload the application.

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

Browser tests require installed Google Chrome. MVP checks use desktop Chrome at desktop and portrait-phone dimensions; they do not establish real iPhone compatibility. Production assets have been built for the authorized WSL2 development deployment; public production deployment remains pending.

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

`HOST` overrides the default loopback bind address (Docker uses `0.0.0.0` internally); `TORAKKA_DB` overrides the database path; `PORT` overrides the backend port. `TORAKKA_COMPUTER_DELAY_MS` changes the default 4300 ms computer thinking delay, and `TORAKKA_COUNTDOWN_MS` changes the default 5000 ms lobby countdown. `TORAKKA_WEB_PORT` is available for isolated Vite development instances. Use an absolute database path for deployment. The process serves the built web assets from `apps/web/dist` when that directory exists.

See [WSL Docker deployment](ops/wsl-deployment.md), [Windows deployment](ops/windows.md), [rules contract](docs/rules-contract.md), and [implementation backlog](docs/implementation-backlog.md). Remaining validation and implementation gaps are tracked in [MVP status](docs/mvp-status.md).
