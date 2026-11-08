# Spec the computer players

## Why

Computer players are part of the MVP, so one person can test and refine complete games alone. Their behavior is described only in `docs/computer-players.md`, which the migration index lists as Unmigrated. This change writes what the code does now into a `computer-players` capability. Nothing reaches `openspec/specs/` without review.

Direction: this is part 3 of 5 of "Retrospective OpenSpec specifications for existing project features". The direction added these constraints to the original card: spec the code's behavior where it differs from the doc and list the mismatches under Discrepancies; retire the migrated doc sections in this same change; update only the computer-player rows of the migration index; make no code changes. The direction also says this part waits for "Spec the game rules from the rules contract". This change refers to game actions (send, pass, peek, answer, predict) only by name and does not restate their rules, so it stays out of that part's scope.

## What Changes

- Add a `computer-players` spec delta covering: host-only adding of computers to seats, names and labels, automatic readiness (including after a rematch), removal by the host, the host role never passing to a computer, the decision policy using only public information, pacing through `TORAKKA_COMPUTER_DELAY_MS`, scheduling of one pending action per room and recovery after a restart.
- In `docs/computer-players.md`, replace the sections "Implemented Direction", "Approved First-Slice Decisions" and "Acceptance Criteria for Slice 1" with short links to the new spec. Keep "Confirmed Requirement" (the rationale), the deferred items and "Proposed Work Slices" as planning context.
- Update the "Computer players" row in `openspec/migration-index.md` to Partial and link the pending change.
- Incoming links in `docs/project-plan.md` and `docs/implementation-backlog.md` point to the whole file, which stays in place, so they need no repair.

## Discrepancies

- Doc, "Approved First-Slice Decisions": "The host can add computers to open seats and can later replace a computer seat with a human." Doc, "Acceptance Criteria": "The host can replace a computer seat with a human before the match starts without changing the existing seat order or room state." Code: there is no replace command. Before the match the host can only `remove` the computer, which deletes its member entry. A human then takes the free seat with `sit`, which appends them to the end of the seat order (`apps/server/src/runtime.ts`, the `remove` and `sit` branches). The spec records removal followed by sitting.
- Doc, "Acceptance Criteria": "A human can take over a computer seat only through the existing seat-control flow…" Code: no takeover of a computer seat exists. A human can only take a free seat. During a match, mid-game replacement is part of the departures domain and is not specified here.
- Doc, "Acceptance Criteria": "Default computer timing is deterministic and configurable per room or deployment". Code: the delay can be set only per deployment (`TORAKKA_COMPUTER_DELAY_MS`, default 4300 ms). There is no per-room setting.
- Doc, "Approved First-Slice Decisions": "Mixed human/computer matches are the initial scope". Code: a match can start with only computers seated, as long as a human host is in the room (the host does not need a seat). The spec records the code's behavior.
- Doc, "Implemented Direction": computer names are not described. Code: names are picked at random from a fixed list of 8 `🤖` names, with a numbered fallback name.

## Assumptions

- The retired sections' acceptance wording that the code does not meet is kept only as quotes here; it is not preserved in the doc. The alternative was to keep it in the doc as open decisions.
- Coverage is marked Partial, not Migrated, because the spec is still pending review. The alternative was Migrated.
