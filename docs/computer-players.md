# Computer Players — MVP Discovery

## Confirmed Requirement

Computer-controlled players are integral to the MVP so the user can solo-test and refine complete games. This expands the gameplay acceptance scope; computer players are not a post-MVP enhancement.

Status: the MVP computer-player slice is implemented and verified. Strength profiles and dedicated debugging controls remain optional follow-up work.

## Retained Rationale

- Do not require an external AI service.
- Keep optional test controls separate from ordinary play; ordinary gameplay must not be blocked by test controls.
- Open decisions (see the change's Discrepancies): a stable, roughly even mix of belief and disbelief in computer answers, and "the first profile is not yet a strength-balanced opponent".

## Implemented Direction

Requirements: see [computer-players spec](../openspec/changes/spec-the-computer-players/specs/computer-players/spec.md) (pending review).

Computer-only room creation, difficulty profiles, pause/step controls, scripted scenarios, and private-state inspection are deferred beyond MVP.

## Approved First-Slice Decisions

Requirements: see [computer-players spec](../openspec/changes/spec-the-computer-players/specs/computer-players/spec.md) (pending review).

## Acceptance Criteria for Slice 1

Requirements: see [computer-players spec](../openspec/changes/spec-the-computer-players/specs/computer-players/spec.md) (pending review).

## Proposed Work Slices

1. **Identity and lobby:** complete.
2. **Decision policy and privacy boundaries:** complete.
3. **Turn scheduling and restart recovery:** complete.
4. **MVP pacing control:** complete; advanced solo controls deferred.
5. **Full-game acceptance:** complete in automated Chrome scenarios at 2, 3, and 6 seats; friend-group acceptance remains a separate deployment gate.

Do not mark gameplay acceptance complete until the agreed computer-player behavior is implemented and verified.
