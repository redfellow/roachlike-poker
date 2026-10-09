# MVP Implementation Status

Status: the external-video-call gameplay MVP, including host-selected themes, is feature-complete and in stabilization. This file records evidence and remaining release gates.

## Implemented

- A server-authoritative 2–6-player rules engine with private projections, card paths, peek/pass, predictions, defeat rules, recap history, and achievements.
- Persistent Fastify/Socket.IO rooms backed by transactional SQLite state, revisions, command deduplication, reconnect recovery, replacement voting, and host-controlled removal.
- Open-by-default rooms with memorable three-word invite codes and a host-controlled private option. Multiple independent rooms can run concurrently; active-game arrivals join as spectators. Existing UUID room links remain valid.
- Ready checks, automatic countdowns, same-link rematches, exact-name seat recovery, automatic host transfer, and computer players that are ready by default.
- Computer players with varied names, legally limited knowledge, mixed bluff behavior, rotating targets, deliberate action delays, peek/pass decisions, and predictions.
- Finnish React UI with table-relative seats, grouped private hands, curved claim routes, claim/reveal animations, outcome feedback, turn banners, retro sounds, reduced motion, focus mode, and responsive layouts. Internal landing, room, rematch, and error navigation uses the History API, preserving the active browser session and menu-music playback position.
- Looping landing/lobby/results music has its own persisted volume control, fades during the lobby countdown, and remains separate from gameplay-effect muting. A response prompt sound alerts the required player when Uskon / En usko becomes available.
- Versioned host-selected themes that persist with rooms, matches, rematches, open-room listings, invite pages, and recap history. Örkkipokka remains the fallback; Herrasmiespokeri includes its own names, copy, achievements, card backs, table palette, and eight finished portraits.
- Expanded match statistics and evidence-based achievements with stricter thresholds and plain-language award reasons.
- Database backup tooling plus Windows/Nginx deployment instructions and configuration examples. WSL2 Docker deployment files define persistent data/backup volumes, port 18889, health checks, restart policy, and rotated logs. A GHCR development image has been deployed by digest; public Nginx/TLS and reboot recovery remain unverified.

## Verified Evidence

- `npm run check` passes: TypeScript, ESLint, and 82 unit/integration tests. Theme authorization, countdown locking, open-room defaults, readable room-code collisions, match persistence, and restart recovery are included in the runtime coverage; the intentionally long six-player simulation has a 30-second case budget.
- The simulation tests play 60 complete games across 2, 3, and 6 players and assert card conservation and private-hand boundaries after every action.
- Runtime tests cover persistence, restart recovery, command receipts, room cleanup, open-room visibility, replacement flows, computer readiness, pacing, and target selection.
- Fourteen Playwright scenarios cover solo computer games, human multiplayer, open rooms, countdowns, rematches, spectator privacy, reload recovery, defeat/recap, responsive seating, animation state, keyboard-safe dialogs, first-turn guidance dismissal/persistence, and missing-room navigation.
- On 2026-10-08, all 14 Chrome scenarios passed twice in one repeated full-suite run (28 passes). Stabilization fixed an unclickable response guidance dialog and desktop hand clearance, removed stale selectors, opened the history menu before selecting history, and synchronized automation with completed actions and playable turns. Desktop and six-seat portrait screenshots were visually inspected. `npm run check` also passes with all 82 unit/integration tests. On this Mac, the repeated browser run used `caffeinate -i npx playwright test --repeat-each=2` to prevent idle sleep from interrupting test deadlines.
- The local B8S.4 release-candidate check was rerun on 2026-10-08 in the current working tree: TypeScript, ESLint, and all 82 unit/integration tests passed, including game simulations and achievement boundary/frequency checks. This run did not include a production build or browser tests.
- On 2026-10-09, after adopting History API navigation and persistent menu music, `npm run check` again passed all 82 unit/integration tests and all 14 Chrome scenarios passed. The missing-room browser scenario now also proves that internal navigation does not reload the document.

- The current working tree was transferred to `~/projects/torakkapokeri` on the Windows WSL2 host on 2026-10-08. Linux dependency installation, TypeScript, ESLint, and all 82 unit/integration tests passed, including native SQLite persistence. This is a working-tree check, not clean-checkout or deployed-browser validation. The subsequent user-authorized dev image build/start succeeded; GHCR dev publication and subsequent digest-pinned deployment succeeded.
- Deployment preparation updated the lockfile from `concurrently` 10.0.5 to 10.0.6 and its `shell-quote` dependency to 1.12.0; npm audit reports zero vulnerabilities for the updated lockfile.

## Stabilization Gates

- Implement the agreed GHCR dev/stable image distribution, GitHub Actions publishing automation, and version-selectable Windows/WSL2 deployment for human playtests and hosting (B8.4–B8.6). Publishing and host deployment remain separate. The workflow and registry Compose override are prepared locally; the first dev publication, authenticated image pull, and deployment by image digest succeeded. Unattended credential unlocking and reboot recovery remain unverified. Triggers are development pushes/manual dispatch and non-prerelease GitHub Releases; verify initially private registry access after first publication.

- Recheck 2–6-seat table layouts at narrow desktop and wide desktop sizes, especially top/bottom seat overlap, exposed-card totals, route lines, prompts, and turn banners.
- Achievement boundary fixtures cover every award, and deterministic long-game simulations enforce a selective recap ceiling. Continue reviewing award frequency during friend-group acceptance games.
- Visually verify all eight Herrasmiespokeri portraits from compact counters through full hand cards after the final Kiltti and Pamppu artwork update.
- Run friend-group acceptance games with external video chat at 2, 3, and 6 players; record and fix blockers.
- Verify native SQLite installation, Nginx/TLS proxying, backups, reboot recovery, and external Chrome connections on the Windows host.
- Per user direction, run the full Chrome suite and clean-checkout validation on the deployment machine after the development version is deployed there.

On 2026-10-08, the user-authorized browser build and local Docker dev deployment on Windows WSL2 succeeded. Image `torakkapokeri:dev-working-20261008` is healthy on loopback port 18889; browser HTML/assets, native SQLite, online backup creation, and data/backup persistence after container restart were verified. This does not verify saved-game restore, Windows Nginx/public HTTPS, reboot recovery, or browser acceptance. Node 26.8.1 is installed on this MacBook; the Windows target remains Node 24 LTS or newer. Built-in video remains a post-MVP phase.
