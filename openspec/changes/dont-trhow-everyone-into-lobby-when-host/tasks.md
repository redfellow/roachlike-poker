# Tasks

## 1. Server
- [x] 1.1 Make `rematch` in `apps/server/src/runtime.ts` start a new match immediately via a shared `startMatch` helper (also used by the countdown timer); reject when fewer than two are seated; schedule computer turns
  Tests to update: apps/server/src/runtime.test.ts ("marks seated computer players ready after a rematch" becomes "rematch deals the same seats into a new match", asserting a new game id, same seat people, computers seated, history kept; "retains history after rematch" asserts a new active game instead of `game` null)
  - proof: `npx vitest run apps/server/src/runtime.test.ts`
  - proof: `npx eslint apps/server/src/runtime.ts apps/server/src/runtime.test.ts`

## 2. Web and e2e
- [x] 2.1 Change `FI.table.rematch` in `apps/web/src/strings.fi.ts` to `Uusi peli samalla porukalla` and update e2e scenarios that click the old label and expect the lobby (game.spec.ts expects a dealt table; computers.spec.ts expects cards dealt instead of 2 ready lobby players)
  Tests to update: tests/e2e/game.spec.ts, tests/e2e/computers.spec.ts
  - proof: `npx eslint apps/web/src/strings.fi.ts tests/e2e/game.spec.ts tests/e2e/computers.spec.ts`
  - proof: `npm run typecheck`

## Manual checks after merge (The user)
- With two browsers, finish a match, press `Uusi peli samalla porukalla` as host and confirm both go straight into a new deal.
