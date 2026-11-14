# Replace music and sound switch with one sound-volume slider

## Why
Reijo reported the `Äänet` switch does not work in Opera on Windows. His direction: remove background music, and let the volume slider control in-game sounds only. The on/off switch goes away; the slider at 0 mutes.

## What Changes
- Remove background music: the looping track, its player, fade-out and the music file reference (`/audio/red_trax__bacon_fat.mp3`).
- Remove the topbar `Äänet` on/off switch (`torakka:muted`).
- The 0–100 slider now sets the volume of all game sounds (event, click, prompt, outcome, countdown). At 0 no sound plays.
- The slider shows on the landing page, in the lobby, during play and after a match.
- game-audio spec: modify "Sound toggle" into "Sound volume", remove "Background music", update "Countdown ticks".

## Outcome
- Topbar control
  - Now: `Musiikki` slider (hidden during play) and `Äänet` switch
  - After: `Äänet` slider with `25%`-style value, shown everywhere
- Music
  - Now: looping background music on landing, lobby and after a match
  - After: no music

## Assumptions
- Slider label becomes `Äänet`, storage key `torakka:sound-volume`, default 100 (rather than reusing the music key/default 25, which would make effects quiet by default).
- Migration: a stored `torakka:muted` of `true` starts the slider at 0; old music keys are removed and ignored.
- Slider value scales each sound's existing per-sound volume linearly (rather than a perceptual curve).
- The music mp3 file is deleted from `apps/web/public/audio` (rather than kept unused).
