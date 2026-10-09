# MVP Implementation Status

Status: the external-video-call gameplay MVP, including host-selected themes, is feature-complete and in stabilization. This file records public verification evidence and the remaining release gates.

## Implemented

- A server-authoritative 2–6-player rules engine with private projections, card paths, peek/pass, predictions, defeat rules, recap history, and achievements.
- Persistent Fastify/Socket.IO rooms backed by transactional SQLite state, revisions, command deduplication, reconnect recovery, replacement voting, and host-controlled removal.
- Open-by-default rooms with memorable three-word invite codes and a host-controlled private option. Multiple rooms can run concurrently; active-game arrivals join as spectators.
- Ready checks, automatic countdowns, same-link rematches, exact-name seat recovery, automatic host transfer, and computer players that are ready by default.
- Finnish React UI with responsive table layouts, claim and reveal animations, sounds, reduced motion, focus mode, persistent menu music, and History API navigation.
- Versioned themes that persist with rooms, matches, rematches, listings, invite pages, and recap history. Örkkipokka remains the fallback; Herrasmiespokeri supplies its own copy, artwork, achievements, and table styling.
- Expanded match statistics and evidence-based achievements with boundary coverage.
- Database backup tooling, health checks, persistent container volumes, and a generic reverse-proxy configuration example.

## Verified Evidence

- `npm run check` covers TypeScript, ESLint, unit tests, integration tests, complete-game simulations, card conservation, privacy boundaries, room recovery, and achievement boundaries.
- Fourteen Playwright scenarios cover computer games, human multiplayer, open rooms, countdowns, rematches, spectator privacy, reload recovery, defeat and recap, responsive seating, animations, keyboard-safe dialogs, tutorial persistence, and missing-room navigation.
- Browser navigation tests verify that internal links preserve the active document and music playback.
- Container checks verify built web assets, native SQLite, health reporting, backup creation, and data persistence across restart.

## Remaining Release Gates

- Recheck 2–6-seat table layouts at narrow and wide desktop sizes, especially seat overlap, exposed-card totals, route lines, prompts, and turn banners.
- Visually verify all Herrasmiespokeri portraits from compact counters through full hand cards.
- Run friend-group acceptance games with external video chat at 2, 3, and 6 players; record and fix blockers.
- Verify the chosen public environment, TLS and WebSocket proxying, backup restoration, restart recovery, and rollback.
- Run the complete release-candidate checks and Chrome suite against the final release state.

Built-in video remains a post-MVP phase.
