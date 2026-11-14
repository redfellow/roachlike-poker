## 1. Remove background music

- [x] 1.1 Delete music playback, the `Musiikki` slider, the `musicLabel` string, `.music-volume` CSS and `apps/web/public/audio/red_trax__bacon_fat.mp3`
  - proof: `npx eslint apps/web/src/main.tsx apps/web/src/strings.fi.ts`
  - proof: `! grep -rniE "music|red_trax" apps/web/src`
  - proof: `test ! -e apps/web/public/audio/red_trax__bacon_fat.mp3`
  - proof: `npm run typecheck`

## Manual checks after merge (The user)
- Open the landing page and lobby: no music plays and no music slider shows; sound effects still play with `Äänet` on.
