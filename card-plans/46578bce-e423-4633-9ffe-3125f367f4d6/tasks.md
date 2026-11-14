# Tasks

- [ ] 1.1 Add an in-app confirm dialog (on `Modal`) with `Kyllä`/`Peruuta` strings and replace every `confirm(...)` call in `apps/web/src/main.tsx`
  - proof: `test -z "$(grep -nE '[^.a-zA-Z]confirm\(' apps/web/src/main.tsx)"`
  - proof: `npx eslint apps/web/src/main.tsx apps/web/src/strings.fi.ts`
- [ ] 1.2 Update `closeSoloTable` in `tests/e2e/computers.spec.ts` to click the in-app confirm button, and add an e2e test in `tests/e2e/game.spec.ts` that a seated player leaves the lobby through the in-app dialog
  Tests to update: tests/e2e/computers.spec.ts
  - proof: `npx eslint tests/e2e/computers.spec.ts tests/e2e/game.spec.ts`
  - proof: `npx tsc --noEmit -p tsconfig.json`

## Manual checks after merge (The user)
- On DuckDuckGo mobile, press "Poistu pöydästä", confirm in the dialog, and see that you leave the table.
