# Tasks

- [x] 1.1 Exempt `leave-table` from the revision check. After a successful leave, emit `lobby-closed` to the leaver, disconnect the socket and delete it from `connections` (apps/server/src/runtime.ts). Add regression tests to apps/server/src/runtime.test.ts: a leave with an old revision succeeds, and the leaver receives `lobby-closed`.
  Tests to update: apps/server/src/runtime.test.ts ("allows a player to leave the lobby")
  - proof: `npx vitest run apps/server/src/runtime.test.ts`
  - proof: `npx eslint apps/server/src/runtime.ts apps/server/src/runtime.test.ts`
  - proof: `npm run typecheck`

## Manual checks after merge (The user)
- In a lobby with two people, press "Poistu pöydästä" once while the other person toggles ready. You should land on the front page.
