# Replace the sound switch with a sound-volume slider

## Why
Reijo reported the `Äänet` switch does not work in Opera on Windows. His direction: replace it with a volume slider that controls in-game sounds. The on/off switch goes away; the slider at 0 mutes.

## What Changes
- Remove the topbar `Äänet` on/off switch (`torakka:muted`).
- The 0–100 slider now sets the volume of all game sounds (event, click, prompt, outcome, countdown). At 0 no sound plays.
- The slider shows on the landing page, in the lobby, during play and after a match.
- game-audio spec: modify "Sound toggle" into a sound-volume slider and update "Countdown ticks".

## Outcome
- Topbar control
  - Now: `Äänet` on/off switch
  - After: `Äänet` slider with `25%`-style value, shown everywhere

## Assumptions
- Slider label is `Äänet`, storage key `torakka:sound-volume`, default 100.
- Migration: a stored `torakka:muted` of `true` starts the slider at 0; leftover `torakka:music-volume`/`torakka:music-muted` keys from the removed music are cleared.
- Slider value scales each sound's existing per-sound volume linearly (rather than a perceptual curve).
