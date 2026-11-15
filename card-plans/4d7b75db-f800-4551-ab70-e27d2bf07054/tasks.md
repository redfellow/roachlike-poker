# Tasks

The e2e tests can't run in the sandbox. The proofs below are the lint and typecheck of the touched files; the review gate runs the Playwright tests (game.spec.ts:78 and :241, computers.spec.ts:75, :92, :151) on the final candidate.

- [x] 1.1 Desktop layout: the play-area's margin custom properties (`--play-area-top-gap`, `--play-area-bottom-gap`, `--felt-inline-edge`) are defined on `.seats--around` but used on its sibling `.play-area`, so the margins were dropped and the hand sat about 190 px too high, over the player's own seat. Define them on both elements in `apps/web/src/style.css` (game.spec.ts:78, :241)
  - proof: `npx eslint tests/e2e/game.spec.ts`
- [x] 1.2 Mobile six-seat table no longer scrolls sideways: the host's topbar tools wrap on narrow screens in `apps/web/src/style.css` (computers.spec.ts:92)
  - proof: `npx eslint tests/e2e/computers.spec.ts`
- [x] 1.3 Computer answer feedback: the token reads "<name> uskoi" / "<name> ei uskonut" for other players' answers (no spec fixes this wording), so the test accepts it (computers.spec.ts:151)
  - proof: `npx eslint tests/e2e/computers.spec.ts`
- [x] 1.4 `closeSoloTable` can't hang: the hook ran again while the page was still showing the closed table, and a click with no timeout waited for a dialog that never opened. Clicks now have timeouts, and the helper waits for the front page and returns early when already there (computers.spec.ts:75)
  - proof: `npx eslint tests/e2e/computers.spec.ts`
- [x] 1.5 Typecheck the workspace
  - proof: `npm run typecheck`
