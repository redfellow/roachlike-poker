# Computer Players — MVP Discovery

## Confirmed Requirement

Computer-controlled players are integral to the MVP so the user can solo-test and refine complete games. This expands the gameplay acceptance scope; computer players are not a post-MVP enhancement.

Status: the MVP computer-player slice is implemented and verified. Strength profiles and dedicated debugging controls remain optional follow-up work.

## Implemented Direction

Use server-controlled opponents that submit the same validated game actions as human players. Give their decision policy only the information legally available to that player. Keep optional test controls separate from ordinary play. Do not require an external AI service.

- Host-managed computer seats in the lobby, within the existing six-seat limit.
- Deterministic opponents that choose legal targets, mix truthful and false claims, sometimes peek and pass, and submit eligible predictions without inspecting hidden cards.
- Configurable response pacing through `TORAKKA_COMPUTER_DELAY_MS`.
- Explicit computer labels and distinct personal identities for scores and achievements.
- Persist computer identity and pending obligations across server restarts without replaying actions.

Computer-only room creation, difficulty profiles, pause/step controls, scripted scenarios, and private-state inspection are deferred beyond MVP.

## Approved First-Slice Decisions

- Mixed human/computer matches are the initial scope; computer-only matches remain deferred.
- The host can add computers to open seats and can later replace a computer seat with a human.
- New computer seats are automatically ready once added.
- Computers use explicitly labeled identities throughout the lobby, game table, scores, predictions, and recap.
- Computer responses use only public claim metadata and produce a stable, roughly even mix of belief and disbelief. They never inspect a face-down card before answering.
- Computer actions use a deterministic tactical policy; the first profile is not yet a strength-balanced opponent.
- The first implementation does not add computer-only seats, scenario playback, pause/step controls, or bot-only match setup.

## Acceptance Criteria for Slice 1

- The host can add a computer to an open seat until reaching the six-seat limit.
- A newly added computer immediately joins the ready set and is visible as a computer in the lobby.
- The host can replace a computer seat with a human before the match starts without changing the existing seat order or room state.
- A human can take over a computer seat only through the existing seat-control flow and retains the seat as a normal player afterward.
- A computer is not treated as a spectator and cannot use spectator-only commands.
- The server preserves computer identity, readiness, seat assignment, and pending obligations across server restarts.
- Computer players clearly appear as humans would in recap attribution, predictions, and results, without exposing private data.
- Default computer timing is deterministic and configurable per room or deployment; ordinary gameplay is not blocked by test controls.
- No action is scheduled twice or after a human has already acted; stale bot actions are rejected by the authoritative revision pipeline.
- Add/remove/replace operations do not allow seat-count or host-ownership violations.

## Proposed Work Slices

1. **Identity and lobby:** complete.
2. **Decision policy and privacy boundaries:** complete.
3. **Turn scheduling and restart recovery:** complete.
4. **MVP pacing control:** complete; advanced solo controls deferred.
5. **Full-game acceptance:** complete in automated Chrome scenarios at 2, 3, and 6 seats; friend-group acceptance remains a separate deployment gate.

Do not mark gameplay acceptance complete until the agreed computer-player behavior is implemented and verified.
