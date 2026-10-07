# MVP Implementation Status

The MVP is in progress. This file records evidence, not a completion claim.

## Implemented

- npm workspaces, TypeScript, ESLint conventions, Vitest, and Playwright setup.
- Pure 2–6-player engine, random deals/starter, truth/lie calls, irreversible peek/pass, forced calls, and defeat rules.
- Separate public/private projections, private grouped hand, public card path and displays.
- Fastify/Socket.IO room server with SQLite transactions, revisions, command deduplication, and persisted state.
- Private lobby, name-based avatars, readiness countdown, spectators, host transfer, same-name reconnection, and old-connection revocation.
- Initial AFK/replacement votes, permanent removal, card redistribution, and replacement-needed flow.
- Finnish React UI, responsive layouts, original creature SVGs, restrained animations, synthesized retro sounds, mute/reduced motion, and local guided-turn hints.
- Private predictions, post-resolution prediction detail, separate scoring, accepted achievement set, loser recap, history selection, and same-link rematches.
- Server-controlled computer players with automatic readiness, removable named seats, deliberate pacing, mixed truthful/bluff claims, fair public-information responses, private peek/pass chains, and eligible predictions.
- Card handoff, private peek, decision, showdown, penalty, and next-turn animations with a shortened reduced-motion presentation.
- Database-aware backup command and Windows/Nginx runbook/configuration example.

## Verified So Far

- TypeScript and ESLint checks pass.
- 57 unit/integration tests cover rules, runtime, storage, audio, computer play, recap evidence, and recovery boundaries.
- The simulation tests play 60 complete games across 2, 3, and 6 players and assert card conservation and private-hand boundaries after every action.
- Chrome browser scenarios cover complete solo games at 2, 3, and 6 seats, the six-seat portrait layout, private lobby/countdown, a complete two-human game, defeat/recap, computer readiness after rematch, spectator privacy, reload with restored hand, the animated showdown, and keyboard-safe rules-dialog focus.
- Server restart integration test restores the same match, hand, and starter from SQLite.
- Replacement vote integration test transfers a disconnected seat's exact hand to a spectator and preserves separate personal scores.
- Under-capacity removal preserves the seat; host ending creates a no-loser recap that survives rematch.
- SQLite tests prove receipt failure rolls state back and online backups restore state and command receipts.
- Desktop and 390px mobile screenshots inspected, including a six-seat table without horizontal overflow.

## Still Required Before Calling the MVP Complete

- Audit implementation against every backlog acceptance criterion; fix findings rather than treating this initial pass as sufficient.
- Reconcile provisional house-rule defaults with user review. Core gameplay does not depend on those exceptions.
- Windows native SQLite install, Nginx/TLS deployment, reboot/restart and external-network verification on the actual unavailable host.
- Friend-group playtest and gameplay acceptance.

No production build, deployment, commit, or push has been run. Node 26.8.1 is installed on this MacBook; the Windows target remains Node 24 LTS or newer. Built-in video is deferred as agreed.
