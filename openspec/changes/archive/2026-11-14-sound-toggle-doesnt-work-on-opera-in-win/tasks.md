# Tasks

## 1. Sound volume
- [x] 1.1 Add `soundVolume(base, level)` to `apps/web/src/audio.ts` (clamps level 0–100, returns base × level/100) with a table-driven test in `apps/web/src/audio.test.ts`
  - proof: `npx vitest run apps/web/src/audio.test.ts`
- [x] 1.2 In `apps/web/src/main.tsx` remove the `Äänet` switch and `torakka:muted` preference, add the `torakka:sound-volume` level (default 100, legacy muted → 0, clear leftover music keys), render a `SoundVolume` slider labelled `Äänet` in both topbars always, and apply the level to every `playNormalizedAudio` call (skip at 0); update `strings.fi.ts` and `style.css` (drop `.sound-toggle`, add `.sound-volume`)
  - proof: `npx eslint apps/web/src/main.tsx apps/web/src/strings.fi.ts apps/web/src/audio.ts`
  - proof: `npm run typecheck`
- [x] 1.3 Update `openspec/migration-index.md` rows referencing game-audio to note this change modifies Sound toggle and Countdown ticks
  - proof: `grep -n "sound-toggle-doesnt-work-on-opera-in-win" openspec/migration-index.md`

## Manual checks after merge (The user)
- In Opera on Windows, move the `Äänet` slider during a match and confirm sounds get quieter/louder and stop at 0.
