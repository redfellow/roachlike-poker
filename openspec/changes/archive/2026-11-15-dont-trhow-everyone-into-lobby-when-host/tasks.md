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

## 3. Return to lobby
- [x] 3.1 Add the `lobby` command to `packages/protocol/src/index.ts` and a host-only, ended-only `lobby` branch in `apps/server/src/runtime.ts` restoring the old lobby reset; add runtime tests named after the scenarios "Host returns the room to a lobby" and "Rematch keeps computers ready" (computers ready, humans not), "Group changes in the returned lobby" (newcomer sits, host removes a seat) and "Only the host returns to a lobby after the end" (table-driven rejections)
  - proof: `npx vitest run apps/server/src/runtime.test.ts`
  - proof: `npx eslint packages/protocol/src/index.ts apps/server/src/runtime.ts apps/server/src/runtime.test.ts`
- [x] 3.2 Add `FI.table.backToLobby` = `Takaisin aulaan` in `apps/web/src/strings.fi.ts` and a host button sending `{ kind: "lobby" }` in the end panel of `apps/web/src/main.tsx`
  - proof: `npx eslint apps/web/src/strings.fi.ts apps/web/src/main.tsx`
  - proof: `npm run typecheck`

## Manual checks after merge (The user)
- With two browsers, finish a match, press `Uusi peli samalla porukalla` as host and confirm both go straight into a new deal.
- Finish a match, press `Takaisin aulaan` as host, and confirm everyone lands in the lobby, a newcomer can sit and an absent seat can be removed before starting.
