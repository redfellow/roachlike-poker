# Implementation Backlog

Status: gameplay implementation is feature-complete pending visual stabilization, release verification, and friend-group acceptance; see [mvp-status.md](mvp-status.md) for verified evidence and remaining work. Product decisions live in [project-plan.md](project-plan.md); rules in [initial-info.md](initial-info.md). New rooms are listed openly by default, hosts may make them private, and every room retains a three-word invite code. Recap history is persistent and multiple independent rooms may run concurrently. Desktop Chrome is tested at desktop/mobile dimensions; no separate iPhone testing is required.

Each numbered task is a separately reviewable increment. Finish its acceptance checks before moving to dependent tasks. Use pure-rule tests, storage/transport integration tests, and browser tests where each best verifies behavior. No arbitrary coverage percentage is required. Builds run only when requested.

## B0 — Final Rules Contract

Dependency: none. Review gate: worked examples approved before affected implementation.

Review artifact: [rules-contract.md](rules-contract.md), containing phases, command permissions, privacy, departure semantics, and 28 worked acceptance scenarios. The rules-contract is approved; only implementation-linked test coverage remains incomplete.

- [x] B0.1 Specify every phase, command, legal actor, visible information, and transition. **Check:** walk through direct truth/lie calls, repeated passes, forced call, empty hand, and matching-card defeat in both player-count modes.
- [x] B0.2 Resolve departure/replacement defaults. **Check:** trace card ownership and next actor for removal during initiation, response, peek, and resolution; preserve all 64 cards across active, removed, and retired zones.
- [x] B0.3 Define person-versus-seat attribution and prediction/achievement examples. **Check:** a replacement inherits obligations but neither steals old achievements nor retroactively changes a prediction.

## B1 — Project Foundation

Dependency: stack selection (complete); may proceed independently of remaining house-rule details.

- [x] B1.1 Create workspaces and runtime/package configuration. **Check:** documented installation in supported development and deployment environments; no platform-specific shell assumptions.
- [x] B1.2 Configure TypeScript and lint rules matching AGENTS.md. **Check:** type/lint commands detect forbidden any, incorrect braces, and other configured conventions.
- [x] B1.3 Configure unit, integration, and browser runners. Document dev/test/check commands and data locations. **Check:** a meaningful initial rules fixture runs through the test command; separate browser contexts are available for later tests.

## B2 — Pure Game Engine

Dependency: B1 and B0.1.

- [x] B2.1 Deck, shuffle injection, deals, random first player. **Check:** exact 2–6-player hand sizes, unique 64-card inventory, ten unseen removals only for two-player setup.
- [x] B2.2 Initiation, claim, and true/false resolution. **Check:** all four claim/response combinations; correct loser, display, and next actor; reject wrong actors and unavailable cards.
- [x] B2.3 Peek commitment, passing, path, and forced response. **Check:** no return to calling after peek, no repeated recipient, latest sender liability, last eligible recipient cannot pass.
- [x] B2.4 Defeat checks and terminal state. **Check:** thresholds four/five, empty-hand defeat only when required to lead, game-over commands rejected.
- [x] B2.5 Information projections. **Check:** full payload assertions for each player and spectator; hidden cards and private grouped counts never appear outside authorized views.

Review gate: complete deterministic games and invalid-action scenarios without browser or network.

## B3 — Durable Multiplayer Core

Dependency: B2.

- [x] B3.1 Persistent room/match/seat/person schema and migrations. **Check:** save/load every gameplay phase without changing cards or ownership.
- [x] B3.2 Validated command pipeline, per-room serialization, deduplication, and revisions. **Check:** concurrent responses, double-clicks, stale commands, malformed messages, and wrong-seat actions cannot apply twice or mutate unauthorized state.
- [x] B3.3 Commit state/receipts/events atomically before broadcasts. **Check:** terminate before commit, after commit before acknowledgment, and during broadcast; recover one consistent result.
- [x] B3.4 Socket connections and authorized snapshots. **Check:** refresh, network loss, and server restart recover hands, pending peek, claims, predictions when added, and match revision.

Review gate: separate clients complete a persisted game, including a forced restart.

## B4 — Rooms and Identity

Dependency: B3.

- [x] B4.1 Private/open room links, names, deterministic avatars, and 2–6 seats. **Check:** duplicate connected names rejected, seventh player cannot occupy a seat, invite route restores correct room, and only host-published rooms appear publicly.
- [x] B4.2 Ready controls and automatic animated five-second countdown. **Check:** unready, disconnect, and new seated join cancel; spectator join does not; only one game starts.
- [x] B4.3 Late spectator view and host transfer. **Check:** spectators receive public state only; host departure selects one connected successor.
- [x] B4.4 Exact-name disconnected-seat reclaim. **Check:** notify table, preserve state, revoke old device; simultaneous claims yield only one controller and old commands are rejected.

Review gate: real invite-to-first-turn flow in multiple Chrome sessions.

## B5 — Playable Responsive Table

Dependency: B2 projections and B4; static layout can be reviewed earlier.

- [x] B5.1 Desktop and portrait-mobile layouts. **Check:** six opponent/player panels, public displays/counts, visible path/claims, readable names, and tap targets at agreed viewport sizes.
- [x] B5.2 Private grouped hand and card → target → claim → Send interaction. **Check:** edit locally until commit; no selection or grouping leaks through payloads or opponent UI.
- [x] B5.3 Uskon / En usko / peek-pass controls and explanation text. **Check:** legal choices only, private peek, final receiver forced to answer, no auto-response timer.
- [x] B5.4 Original dark/gross creature art, restrained retro effects, resolution sounds, response prompt sound, next-player banner, and separately controlled menu music. **Check:** correct personal/neutral sound, one reveal per revision, muted/reduced-motion use, music fades during countdown and resumes on the results screen, no extra response wait.
- [x] B5.5 Finnish rules and dismissible first-turn guidance. **Check:** checkbox defaults on, persists per device, guidance never pauses others or reveals private choices.
- [x] B5.6 Host-selected, room-persistent visual themes. **Check:** a visual lobby picker is visible to everyone and editable only by the host before countdown; the chosen versioned theme follows the match, rematch, invite page, open-room listing, and recap; unknown or removed themes fall back to Örkkipokka. MVP ships Örkkipokka and Herrasmiespokeri, whose eight character cards have finished artwork.

Review gate: full 2- and 6-player games usable in desktop Chrome at desktop and portrait-phone viewport sizes with an external call. Physical phone testing is deferred.

## B6 — Departures and Replacements

Dependency: B0.2, B3, B4, and table seat controls.

- [x] B6.1 Disconnected chairs and AFK eligibility. **Check:** no global pause, required-action clock only, eligibility strictly after 60 seconds, no automatic action or defeat.
- [x] B6.2 Spectator requests and majority voting. **Check:** only eligible seats, requester excluded, owner return/valid response cancels, reconnect/vote races resolve once.
- [x] B6.3 Apply voted replacement atomically. **Check:** hand/display/peek obligation inherited, previous controller revoked, personal stats separate, prior knowledge policy enforced.
- [x] B6.4 Host-confirmed permanent removal and redistribution. **Check:** shuffle/even distribution, retired displays, cancelled card revealed/retired once, zero cancellation penalty, card conservation, risk-aware next actor.
- [x] B6.5 Replacement-needed state below minimum remaining count. **Check:** intact seat and hand, no redistribution, replacement resumes exact obligation, End game yields no loser.

Review gate: scripted departure matrix across all phases, including server restart during a vote or replacement wait.

## B7 — Predictions, Recap, and Rematches

Dependency: B3 and B5; person-attribution checks depend on B6.

- [x] B7.1 Private eligible-player predictions per claim. **Check:** receiver/seen players/spectators excluded, lock on receiver action, new opportunity after pass, no pre-resolution leak.
- [x] B7.2 Prediction scoring and aggregate emojis. **Check:** +1/0/0, cancelled challenge scores zero, accurate submitted-prediction denominator, restart cannot double-score; zero predictions is neutral.
- [x] B7.3 Implement accepted achievements from event fixtures. **Check:** qualifying/nonqualifying boundaries, ties, two-player thresholds, replaced people, no inference of belief from passing.
- [x] B7.4 Loser spotlight, factual recap, highlights, and same-link rematch. **Check:** all players return to lobby with readiness reset, newcomers can join, ended-without-loser matches are distinct, no old hand/prediction data enters new match.

- [x] B7.5 Persistent recap history and history view. **Check:** earlier match recaps survive rematches and server restarts, remain selectable, and never expose unrevealed hands or cancelled private predictions. Starting a match cannot overwrite earlier history.

Review gate: compare a scripted match's recap and every award against its actual event history; reopen earlier recaps after rematch and restart.

## B7C — Computer Players and Solo Testing (Required for MVP)

Dependency: behavior interview, B2, B3, B4, and B5. Scope and proposed review slices: [computer-players.md](computer-players.md).

- [x] B7C.1 Complete the behavior interview and define concrete acceptance cases.
- [x] B7C.2 Add computer identities and agreed lobby/seat controls; verify player limits and readiness.
- [x] B7C.3 Implement policies using only each computer's legally available information; verify legal choices and fair knowledge boundaries.
- [x] B7C.4 Integrate scheduled actions, persistence, and agreed solo-test controls; verify exactly-once behavior across restart and seat changes.
- [x] B7C.5 Complete solo browser games at 2, 3, and 6 seats, including recap/rematch and recovery.

## B8 — Release and Gameplay Acceptance

Dependency: gameplay buckets and the computer-player work below.

- [ ] B8.1 Verify environment-neutral configuration and public hosting behavior. **Check:** TLS, API and socket proxying, direct room links, external Chrome connections, and process restart behavior.
- [ ] B8.2 Verify database-aware backups, restore, migrations, and release rollback. **Check:** restore a copied backup into an isolated instance and continue a saved game; logs omit private state.
- [ ] B8.3 Run friend-group acceptance sessions at 2, 3, and 6 players. **Check:** complete games, external calls, controls at mobile viewport sizes, recovery, replacements, recap, and rematch. Record and fix blockers.

Gate: user accepts gameplay before media implementation. Release and deployment execution occurs only when requested.

## B8S — Stabilization and Release Candidate

Dependency: implemented gameplay buckets. These checks run before release and friend-group acceptance are considered complete.

- [x] B8S.1 Make all Playwright scenarios pass repeatedly. **Check:** remove the intermittent full-game timeout without weakening assertions; verify open-room discovery, reconnect, rematch, and complete computer games together. **Evidence (2026-10-08):** all 14 Chrome scenarios pass twice (28 passes). Fixed first-turn dialog pointer events and desktop hand clearance; automation now waits for completed actions, handles guidance explicitly, opens the history menu, and measures the current claim presentation.
- [ ] B8S.2 Review the table at narrow and wide desktop sizes with 2–6 seats. **Check:** no player card, public total, route, banner, claim, response, or private hand obscures another required control or datum.
- [x] B8S.3 Validate achievement frequency and boundaries. **Check:** deterministic fixtures cover every award; several representative long games produce a selective recap rather than awarding most of the catalog.
- [x] B8S.4 Run the local release-candidate check set after stabilization changes. **Check:** type checks, lint, unit/integration tests, and simulations pass in the current workspace. **Evidence:** `npm run check` passes with complete game simulations, card-conservation checks, private-hand boundaries, and achievement boundary/frequency coverage.

## B9 — Integrated Audio/Video, After Gameplay Acceptance

Dependency: B8 acceptance and clarified media requirements.

- [ ] B9.1 Compare media topology/provider options against the hosting budget, six-player bandwidth, and phones. **Check:** a technical spike proves multi-network audio/video and relay behavior.
- [ ] B9.2 Add device setup, permission/error handling, and required-device policy. **Check:** allowed/denied/missing devices, interrupted devices, device changes, and spectator rules.
- [ ] B9.3 Replace avatars with persistent face panels, emphasizing sender/receiver. **Check:** all faces remain visible without obscuring private hand or public table, including portrait mobile.
- [ ] B9.4 Integrate reconnection, audio controls, and media-triggered pause. **Check:** muting microphone or disabling camera pauses game actions; exercise the agreed resume policy, six-way play, network switches, echo/feedback, and media failure without lost state. Voice activation is optional later work.

## Confirmed Defaults

These decisions are now approved and implemented in the rules contract and runtime behavior.

1. Names are normalized by trimming surrounding whitespace and Unicode normalization; preserve the original case in the UI while comparing normalized names. Reject display names that differ only by case.
2. Replacement votes snapshot the eligible connected seated voters at the time the request is created. The vote requires $\lfloor n/2 \rfloor + 1$ approvals, excluding the requester and affected seat. A membership change cancels the request rather than silently changing its threshold.
3. Voluntary replacement preserves the current phase and object state. Permanent removal cancels only an affected active challenge; otherwise the removal waits until resolution.
4. Redistribution recipients are chosen randomly from remaining seats with cards. Risk-based selection is used only for choosing the next initiator when the current starter is removed or cancelled.
5. Knowledge is preserved by person as well as seat. A person who has seen the active card cannot gain a fresh unseen receiver or prediction opportunity through another seat until the challenge resolves.
6. Cancelled challenges produce no prediction points, reveal no private predictions, and do not contribute to achievement progress.
7. Server restarts cancel unfinished countdowns and votes, preserve the game phase and obligations, and restart AFK timing when a required prompt is delivered anew.
8. Recaps show factual counts and award reasons, while the achievement list remains expandable.

## Operational Questions

- Public-host verification and backup retention. Real-device/mobile-OS validation is deferred beyond MVP.
- Backup destination, saved recap retention policy, maximum simultaneous rooms, and spectator limits.
- Media-phase pause/resume policy and unexpected dropout handling; user mute/camera-off explicitly pauses the game. No media pause logic in external-call MVP.
