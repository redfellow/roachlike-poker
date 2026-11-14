## 1. Targeted handoff animation

- [x] 1.1 Measure sender/receiver seat panels on handoff in `apps/web/src/main.tsx`, set offset custom properties on `.handoff-card`, rewrite `table-handoff` keyframes and time `seat--receiving` to arrival in `apps/web/src/style.css`, with centre fallback; add a static `.app--reduced .seat--receiving` highlight and keep the handoff state for the normal duration under reduced motion
  - proof: `npx eslint apps/web/src/main.tsx tests/e2e/game.spec.ts`
  - proof: `npm run typecheck`

## Manual checks after merge (The user)
- On a phone in portrait, pass a card: it flies into the receiving player's panel, which lights up.
- With reduced motion on, no card flies and the receiver panel shows a steady (not animated) highlight for about a second.
