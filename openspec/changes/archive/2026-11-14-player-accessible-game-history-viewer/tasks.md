## 1. Topbar history button

- [x] 1.1 Move the History button from the "Lisää" menu into the topbar tools, rendered only when `state.history.length > 0`
  - proof: `npx eslint apps/web/src/main.tsx`
- [x] 1.2 Update the e2e history step to click the topbar button without opening "Lisää", and assert no History button before the first match ends (scenarios: History after a finished match, No history yet)
  Tests to update: tests/e2e/game.spec.ts
  - proof: `npx eslint tests/e2e/game.spec.ts`
  - proof: `npx tsc --noEmit -p tsconfig.json`

## Manual checks after merge (The user)

- On a phone-width screen, finish a match and check that the History button fits the topbar without wrapping awkwardly.
