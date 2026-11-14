## Why
Reijo finds the background music bad and wants it gone entirely.

## What Changes
- Remove the looping background music from the landing page, lobby and match-end screen.
- Remove the `Musiikki` volume slider from the topbar, its string, CSS and the `torakka:music-volume` / `torakka:music-muted` handling.
- Delete the shipped track `apps/web/public/audio/red_trax__bacon_fat.mp3`.
- **REMOVED** `game-audio` requirement "Background music". Sound effects and the `Äänet` switch are unchanged.

## Outcome
- Topbar on the landing page and lobby
  - Now: `Musiikki` slider with `25%`
  - After: no music slider; `Äänet` switch stays
- Landing page and lobby
  - Now: looping music plays
  - After: silent apart from sound effects

## Assumptions
- Stale `torakka:music-volume` / `torakka:music-muted` keys in browsers are left alone rather than actively cleared.
- The `docs/project-plan.md` and `docs/initial-info.md` lines are not edited; the migration index needs no coverage change since game-audio stays covered.
