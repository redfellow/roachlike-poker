# Technical Plan

Status: stack accepted, with existing Windows Nginx replacing the proposed Caddy server. Detailed operational defaults still require review. Target: a small private group, Windows hosting, desktop Chrome with responsive viewport testing for MVP, persistent games, gameplay before integrated video.

## Stack

| Layer | Choice | Reason |
| --- | --- | --- |
| Language/runtime | Strict TypeScript, Node.js 24 LTS, ESM | Shared contracts and rules; a supported runtime suitable for Windows |
| Browser | React with Vite, regular CSS with BEM classes | Responsive card/table components and local UI state; no server-rendering requirement |
| Server | Fastify and Socket.IO | HTTP endpoints plus bidirectional room events and reconnection support |
| Storage | SQLite via better-sqlite3, versioned SQL migrations | One local database for a single server; transactions for durable game transitions |
| Validation | Runtime schemas at command boundaries | Treat incoming data as unknown; validate before changing state |
| Tests | Vitest and Playwright | Rules/storage tests plus separate-browser multiplayer flows |
| Style | ESLint, typescript-eslint, ESLint Stylistic | Enforce tabs, explicit types, semicolons, quotes, and Stroustrup braces from AGENTS.md |
| Serving | Existing Windows Nginx; separately managed Node.js process | Reuse the user’s existing proxy and certificate setup for static assets and backend forwarding |

Use npm workspaces and a lockfile. Pin compatible stable dependencies during setup; check native SQLite installation on the actual Windows host. Do not add a formatter that rewrites Stroustrup braces. Prefer ordinary CSS transitions and small original retro sound effects initially.

Proposed layout: `apps/web/`, `apps/server/`, `packages/game/`, `packages/protocol/`, `tests/e2e/`, and `ops/`. The pure game package must not depend on UI, transport, or storage. These directories do not exist yet.

## Authoritative State and Privacy

The browser submits intentions, never outcomes. The server checks actor identity, seat-control generation, game revision, command ID, phase, and legal action. Serialize transitions per room. Use injected randomness for reproducible tests and server-generated randomness in production.

Generate public, per-player, and spectator projections explicitly. Never send other hands, grouped stack counts, unrevealed card identities, private selections, or pending predictions to unauthorized clients. Use opaque card identifiers that do not encode creature types.

MVP supports one active room; simultaneous rooms are deferred. Separate room, match, seat, person, and connection identities so the design can grow later. Reconnecting the same person preserves stats; a voted replacement inherits the seat but starts their own personal stats. Name-based recovery is an explicitly accepted trust model for private friends' rooms. Tokens still identify ordinary sessions; reclaim invalidates older seat control.

## Persistence and Recovery

Persist each accepted command's resulting match state, revision, command receipt, and recap events in one SQLite transaction before acknowledging or broadcasting. Store actual dealt cards and randomness outcomes rather than reshuffling on restart. Persist private predictions and in-flight peek/pass obligations as well as public state.

A retry of a committed command returns its prior outcome without applying it twice. After restart or unrecoverable socket interruption, send a newly authorized snapshot. Socket.IO recovery is an optimization, not the durable source of truth. Broadcast failure after commit is repaired by revision/snapshot reconciliation.

On process restart, treat network presence as disconnected. Proposed default: cancel lobby countdowns and pending replacement votes; resume the last committed gameplay phase when players reconnect. Do not replay old reveal sounds or score events twice. Keep normal diagnostic logs free of hands, invite secrets, and private predictions.

Persist completed recap history across rematches and server restarts, including results, public highlights, predictions revealed by normal resolution, and personal achievements. History access must not expose unrevealed hands or cancelled private predictions. A rematch creates a new match record rather than overwriting history.

Use local disk for SQLite. Add a database-aware backup/restore procedure and schema migrations; agree retention before deployment. This design targets one server process. Multiple-server scaling would require a different coordination/storage plan.

## Windows Hosting

Reuse the user’s existing Nginx installation on the Windows PC. The user can add a TLS certificate. The proposed public address is `https://torakkapokeri.redlan.co`; it is not yet verified as deployed. Serve the built client and reverse-proxy API/socket traffic on this single origin. Keep the backend bound locally and manage its startup/restart separately from Nginx. Store persistent data outside release directories so application updates do not overwrite it.

The current development machine is a MacBook and does not have access to that Windows Nginx setup. Develop and test locally here; prepare deployment instructions and configuration for later application and verification on the Windows host. Do not treat local checks as proof of production reachability.

At deployment, inspect the existing Nginx configuration and verify Windows version, DNS, external reachability, TLS, and socket proxy behavior. Reuse the established network route where possible. Document startup, backup, restore, logs, and rollback. Production builds remain user-requested under AGENTS.md.

## Later Media Phase

Reserve stable player panels now. After gameplay acceptance, evaluate WebRTC transport, relay/SFU needs, Windows upload capacity, and mobile performance with six participants. Do not choose a media provider or promise a free six-way deployment yet. Preserve authoritative game state through media failures. A player muting their microphone or disabling their camera pauses gameplay; implement this only in the media phase. Define resume and unexpected media-loss behavior then. Voice activation is a later possibility, not an MVP requirement.

## Official References

- [Node.js release schedule](https://github.com/nodejs/Release)
- [Vite guide and React/TypeScript templates](https://vite.dev/guide/)
- [Fastify documentation](https://fastify.dev/docs/latest/)
- [Socket.IO recovery and its limitations](https://socket.io/docs/v4/connection-state-recovery)
- [better-sqlite3 installation and transactions](https://github.com/WiseLibs/better-sqlite3)
- [Vitest guide](https://vitest.dev/guide/)
- [ESLint Stylistic brace configuration](https://eslint.style/rules/brace-style)
