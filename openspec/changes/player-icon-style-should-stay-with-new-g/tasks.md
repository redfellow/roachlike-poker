## 1. Server and protocol

- [x] 1.1 Add `icon` to `MemberView` and assign distinct icons on join in the room runtime, kept for the room's life (persisted with members); add a table-driven test: six joins get six shapes, icons unchanged after a new game/rematch and after reconnect
  - proof: `npx vitest run apps/server/src/runtime.test.ts apps/server/src/store.test.ts`
  - proof: `npx eslint apps/server/src/runtime.ts apps/server/src/store.ts packages/protocol/src/index.ts`

## 2. Web

- [x] 2.1 Render `Avatar` from the member's assigned icon in lobby, spectator list and table seats; remove name-hash variants
  - proof: `npx eslint apps/web/src/main.tsx`
  - proof: `npm run typecheck`

## Manual checks after merge (The user)
- Start a room with several players: icons are clearly different; start a new game: everyone keeps their icon.
