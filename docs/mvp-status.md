# MVP Implementation Status

Status: the external-video-call gameplay MVP, including host-selected themes, is feature-complete and in stabilization. This file records evidence and remaining release gates.

## Implemented

- A server-authoritative 2–6-player rules engine with private projections, card paths, peek/pass, predictions, defeat rules, recap history, and achievements.
- Persistent Fastify/Socket.IO rooms backed by transactional SQLite state, revisions, command deduplication, reconnect recovery, replacement voting, and host-controlled removal.
- Private invite rooms with optional host-published open-room discovery. Multiple independent rooms can run concurrently; active-game arrivals join as spectators.
- Ready checks, automatic countdowns, same-link rematches, exact-name seat recovery, automatic host transfer, and computer players that are ready by default.
- Computer players with varied names, legally limited knowledge, mixed bluff behavior, rotating targets, deliberate action delays, peek/pass decisions, and predictions.
- Finnish React UI with table-relative seats, grouped private hands, curved claim routes, claim/reveal animations, outcome feedback, turn banners, retro sounds, reduced motion, focus mode, and responsive layouts.
- Versioned host-selected themes that persist with rooms, matches, rematches, open-room listings, invite pages, and recap history. Örkkipokka remains the fallback; Herrasmiespokeri includes its own names, copy, achievements, card backs, table palette, seven supplied portraits, and one temporary card placeholder.
- Expanded match statistics and evidence-based achievements with stricter thresholds and plain-language award reasons.
- Database backup tooling plus Windows/Nginx deployment instructions and configuration examples.

## Verified Evidence

- `npm run check` passes: TypeScript, ESLint, and 69 unit/integration tests. Theme authorization, countdown locking, publication, match persistence, and restart recovery are included in the runtime coverage; the intentionally long six-player simulation has a 30-second case budget.
- The simulation tests play 60 complete games across 2, 3, and 6 players and assert card conservation and private-hand boundaries after every action.
- Runtime tests cover persistence, restart recovery, command receipts, room cleanup, open-room visibility, replacement flows, computer readiness, pacing, and target selection.
- Eleven Playwright scenarios cover solo computer games, human multiplayer, open rooms, countdowns, rematches, spectator privacy, reload recovery, defeat/recap, responsive seating, animation state, and keyboard-safe dialogs.
- Recent focused browser checks for open rooms and table layout pass. The full browser suite has not been rerun after the latest UI batch; one earlier full-game automation loop timed out once and remains a stabilization item.

## Stabilization Gates

- Make the complete Playwright suite pass repeatedly, including the intermittent full-game timeout.
- Recheck 2–6-seat table layouts at narrow desktop and wide desktop sizes, especially top/bottom seat overlap, exposed-card totals, route lines, prompts, and turn banners.
- Exercise achievement boundary fixtures and run longer games to confirm the revised rules produce a useful number and variety of awards.
- Replace the final Herrasmiespokeri placeholder portrait when its artwork arrives, then visually verify all eight portraits from compact counters through full hand cards.
- Run friend-group acceptance games with external video chat at 2, 3, and 6 players; record and fix blockers.
- Verify native SQLite installation, Nginx/TLS proxying, backups, reboot recovery, and external Chrome connections on the Windows host.

No production build or deployment has been run. Node 26.8.1 is installed on this MacBook; the Windows target remains Node 24 LTS or newer. Built-in video remains a post-MVP phase.
