# Computer Players — MVP Discovery

## Confirmed Requirement

Computer-controlled players are integral to the MVP so the user can solo-test and refine complete games. This expands the gameplay acceptance scope; computer players are not a post-MVP enhancement.

Status: interview in progress. No bot policy or UI behavior is approved yet.

## Proposed Direction

Use server-controlled opponents that submit the same validated game actions as human players. Give their decision policy only the information legally available to that player. Keep optional test controls separate from ordinary play. Do not require an external AI service.

These are proposals, pending the interview:

- Host-managed computer seats in the lobby, within the existing six-seat limit.
- Fair tactical opponents for normal play; potentially predictable behavior profiles or scripted scenarios for testing.
- Configurable response pacing and optional pause/step controls for solo testing.
- Explicit computer labels and distinct personal identities for scores and achievements.
- Persist computer identity and pending obligations across server restarts without replaying actions.

## Decisions Needed

Opponent intelligence and profiles; mixed human/computer and computer-only matches; add/remove/ready/rematch behavior; normal pacing and test controls; human/bot seat swaps; prediction participation; recap attribution; behavior when humans disconnect; repeatable scenarios and private-state inspection.

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

1. **Identity and lobby:** model computer seats, expose host controls, and distinguish computers visibly. Test seat limits, readiness, host ownership, and rematches. **Status: decisions approved; implementation begins with the lobby/seat model.**
2. **Decision policy:** choose legal cards, claims, targets, responses, and passes from an authorized view. Test information boundaries and named behavior profiles.
3. **Turn scheduling:** schedule actions once through the authoritative command pipeline. Test stale jobs, human actions, replacement, disconnect, and restart races.
4. **Solo test controls:** implement only the agreed speed, pause, step, scenario, or inspection controls. Test access rules and separation from ordinary matches.
5. **Full-game acceptance:** complete solo games at 2, 3, and 6 seats; exercise passing, predictions, defeat, recap, rematch, and saved recovery in Chrome.

Do not mark gameplay acceptance complete until the agreed computer-player behavior is implemented and verified.
