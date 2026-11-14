## 1. Stacked hand cards

- [ ] 1.1 Render decorative stack layers (one per copy, up to 4) on `.hand-card` in `apps/web/src/main.tsx`, and style the offset layers in `apps/web/src/style.css`, keeping the `×N` badge and the portrait mobile fit
  - proof: `npx eslint apps/web/src/main.tsx`
  - proof: `npm run typecheck`
- [ ] 1.2 Add a check to `tests/e2e/game.spec.ts` that a hand card with a count above 1 has matching `.hand-card__layer` elements (capped at 4)
  - proof: `npx eslint tests/e2e/game.spec.ts`

## Manual checks after merge (The user)
- On a portrait phone, the hand with several stacks fits, and the selected stack still stands out.
