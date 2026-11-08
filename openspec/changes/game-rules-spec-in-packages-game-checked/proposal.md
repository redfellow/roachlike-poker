## Why

The game rules in `packages/game` are documented only in provisional sources (`docs/rules-contract.md` and the "Confirmed Rules and Turn Experience" section of `docs/project-plan.md`). This is part 1 of 5 of "Retrospective OpenSpec specifications for existing project features": it records the rules the code implements now as a `game-rules` capability and retires the migrated doc sections.

## What Changes

- Add the `game-rules` capability: deck identities and card conservation, setup per table size, defeat threshold, phases and commands (send, answer, peek, pass, predict), the resolution truth table and defeat checks, passing eligibility, private prediction submission and locking, and the public/private view boundary.
- Write the game-rule worked acceptance scenarios (R01–R11, R13, R22, R23) as spec scenarios.
- Retire in `docs/rules-contract.md`: "Identities and Invariants" (game-rule bullets), "Setup", "Phases and Commands" (game-phase rows), "Resolution Truth Table", "Passing and Private Predictions" (submission/locking bullets) and the migrated rows of "Worked Acceptance Scenarios". Each becomes a short link to `openspec/specs/game-rules/spec.md`. "Outstanding Product Review" stays.
- Retire the game-rule bullets of "Confirmed Rules and Turn Experience" (the private-preparation and no-timer bullets stay for the presentation part) in `docs/project-plan.md` with a link. Keep its presentation, recap, rematch, departure and achievement bullets for the sibling parts.
- Update the Rules contract and Project plan rows in `openspec/migration-index.md` to Partial with the exact sections.
- Direction changed the idea: the origin said to retire the whole sections. The shared constraints say to edit only this domain. So bullets and rows owned by the rooms/departures, computer players, achievements/scoring and presentation parts stay in place for those parts.

## Discrepancies

- "Phases and Commands" lists a "Pass preparation" phase and a "Resolution" phase. The code has the phases `initiation`, `response`, `passing` and `ended`. Resolution happens atomically inside the `answer` command and is not a phase. The spec uses the code's phases.
- "Identities and Invariants" says cards may be in "unseen setup removals, and visibly retired cards". The code also keeps the in-flight card in `challenge.card`. The spec counts hands, displays, the active challenge, unseen removals and retired cards (`inventory`).
- "Identities and Invariants" says "Hands, creature stack counts, draft selections, and unresolved predictions stay private". This is about a player's own hand grouping into creature stacks and unsent draft selections (see project-plan Visual Design), not exposed displays. It does not conflict with `projectMatch`, which publishes exposed displays and no other seat's hand. The spec covers hands and unresolved predictions through the view boundary. The hand-grouping and draft-selection privacy rule stays in `docs/rules-contract.md` for the presentation part.
- "Passing and Private Predictions": "A seated person who has not seen the card and is not the receiver may predict". In the code, predictions are accepted only in the `response` phase, only for the latest claim (`challengeId` + `claimIndex`), and are attached to person IDs. Match and person scoping comes from the seat and the match, not from fields in the submission. The spec follows the code.
- Defeat: the doc says "matching-card defeat" for the penalty card's creature. The code (`startNext`) ends the match if the penalty recipient has *any* creature stack at the threshold. These match in practice, because stacks grow only by one card at a time.

## Assumptions

- Prediction scoring, accuracy and cancellation scoring go to part 4 (achievements and predictions scoring). This change covers submission and locking only. The alternative was to spec scoring here.
- Lobby, countdown, rematch, replacement and duplicate-delivery idempotency (R12, R14–R21, R24–R29) are server and room behaviour and go to parts 2, 4 and 5. They stay in the docs. The alternative was to migrate every acceptance row here.
- No code or tests change. This change has no `## Outcome` because users see nothing different.
