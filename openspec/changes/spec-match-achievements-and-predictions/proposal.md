## Why

Match achievements and prediction scoring are implemented (`packages/game/src/index.ts` `scores()`/`achievements()`, copy in `apps/web/src/strings.fi.ts` and `apps/web/src/themes.ts`) but specified only by the provisional `docs/achievement-ideas.md` and the "Predictions and Match Achievements" section of `docs/project-plan.md`, which disagree with the code. This is part 4 of 5 of the retrospective OpenSpec migration.

## What Changes

- Add capability `match-achievements`: recap prediction scoring and stats, person attribution, leaderboard awards, the 31 event/threshold awards with exact conditions, and the award copy for both themes, as the code does now.
- Retire the requirement content of `docs/achievement-ideas.md` (the status line's attribution/tie rules and the award table) and the requirement bullets of `docs/project-plan.md` "Predictions and Match Achievements", replacing them with links to the new spec. Keep the tone/filth limit rationale and the open implementation details, and the doc's proposed conditions as an unresolved record (see Discrepancies).
- Update the migration-index rows for those two documents to Partial with the pending change linked.
- No code changes.

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
- The code has 21 further awards not in the docs (e.g. `serial-liar`, `lone-genius`, `silent-partner`).
- project-plan "Show accuracy and participation alongside points" — recap shows prediction points only via awards; the score table shows receiver-answer accuracy, bluff calls and bluffs.

Unresolved (status kept open): whether the docs' proposed conditions or copy should replace the code's; the open implementation details listed in achievement-ideas.md.

## Assumptions

- Prediction eligibility/revision/locking belongs to the game-rules spec (rules contract "Passing and Private Predictions"); ruled out duplicating it here.
- The docs' differing conditions stay in achievement-ideas.md under an "unresolved proposals" heading rather than being deleted; ruled out deleting them.
- One capability `match-achievements`; ruled out a separate `match-predictions` capability.
