## Why

Match achievements and prediction scoring are implemented (`packages/game/src/index.ts` `scores()`/`achievements()`, copy in `apps/web/src/strings.fi.ts` and `apps/web/src/themes.ts`) but specified only by the provisional `docs/achievement-ideas.md` and the "Predictions and Match Achievements" section of `docs/project-plan.md`, which disagree with the code. This is part 4 of 5 of the retrospective OpenSpec migration.

## What Changes

- Add capability `match-achievements`: recap prediction scoring and stats, person attribution, leaderboard awards, the 31 event/threshold awards with exact conditions, and the award copy for both themes, as the code does now.
- Retire the requirement content of `docs/achievement-ideas.md` (the status line's attribution/tie rules and the award table) and the scoring, attribution and tie bullets of `docs/project-plan.md` "Predictions and Match Achievements", replacing them with links to the new spec. The confirmed eligibility, privacy and locking bullets are left for the game-rules change `game-rules-spec-in-packages-game-checked`, whose prediction eligibility, revision/locking and view-boundary requirements cover them; they stay in the project plan until that coverage is reviewed. The reveal bullet stays there unmigrated. Keep the tone/filth limit rationale and the open implementation details, and the doc's proposed conditions as an unresolved record (see Discrepancies).
- Update the migration-index rows for those two documents to Partial with the pending change linked.
- In the migration index, also repair the Computer players row's spec link to the archived path `changes/archive/2026-11-08-spec-the-computer-players/...` (link repair only; coverage unchanged), and add to the Rules contract row a pointer that its remaining prediction scoring and the scoring part of R22 overlap with this spec, with their retirement left as an explicit follow-up.
- The game-rules change is archived (`changes/archive/2026-11-08-game-rules-spec-in-packages-game-checked/`) and synced into `specs/game-rules/spec.md`; the two index rows this change edits (Rules contract, Project plan: Predictions and Match Achievements) link those paths.
- No code changes.

## Follow-ups

- Stale links to the game-rules change outside this change's scope, left as found: the migration index's Project plan row (still `changes/game-rules-spec-in-packages-game-checked/...`), the index intro sentence "No existing capability has yet been migrated into `specs/`" (now untrue), and the game-rules link in `docs/project-plan.md` "Confirmed Rules and Turn Experience" ("pending archival; not yet in openspec/specs"). Repair them in the game-rules follow-up or the next index update.

Direction changed the origin: it made this one child of a split migration (one change, retire migrated sections, update the index, code wins over docs, no code changes) and made it wait for the game-rules part, so prediction eligibility, revision and locking are left to that spec.

## Discrepancies

Code behavior is specified; doc text quoted:

- achievement-ideas.md status: "Require at least one qualifying event for a leaderboard award; share ties." — code requires minimums (3/3/5) and gives ties nobody; project-plan "Achievement ties may be shared (proposal)".
- "Paskapuheen tohtori … Väitöskirja oli paskaa." — code copy reads `Väitöskirja oli palturia.`; condition is believed final-claim bluffs, minimum 3.
- "Paskatutka | Haistaa kusetuksen oman ripulinkin läpi." — code copy differs (`Hämähäkkivaistoihin …`).
- "Saatanan kiertopalkinto … shared by its participants." — code awards only the penalty taker, minimum 3 claims, unique longest.
- "Joukkokusetus … minimum two predictions." — code needs 3+ predictions and 5+ people; UI shows no participant counts.
- "Kuiva kakkonen … two consecutive" — code needs three.
- "Hautapaikka varattu … at least three further resolved challenges" — code needs five.
- "Oma kusetus, oma kuoppa | Kaivoit kuopan. Hyppäsit itse." — code title/copy is `Kuset reisillä` / `Kasteli omat housunsa.`
- "Vainoharhainen mulkku … At least three" and "Totuus sattuu … At least three" — code needs four.
- The code has 23 further awards not in the docs (e.g. `serial-liar`, `lone-genius`, `silent-partner`).
- project-plan "Show accuracy and participation alongside points" — recap shows prediction points only via awards; the score table shows receiver-answer accuracy, bluff calls and bluffs.

- rules-contract.md "Passing and Private Predictions" scoring and cancellation bullets and the scoring part of R22 overlap with this spec's prediction scoring; they stay in the rules contract (listed as Remaining in its index row, with a pointer here) and retiring them is an explicit follow-up after review.

Unresolved (status kept open): whether the docs' proposed conditions or copy should replace the code's; the open implementation details listed in achievement-ideas.md.

## Assumptions

- Prediction eligibility/revision/locking belongs to the game-rules spec (rules contract "Passing and Private Predictions"); ruled out duplicating it here.
- The docs' differing conditions stay in achievement-ideas.md under an "unresolved proposals" heading rather than being deleted; ruled out deleting them.
- One capability `match-achievements`; ruled out a separate `match-predictions` capability.
