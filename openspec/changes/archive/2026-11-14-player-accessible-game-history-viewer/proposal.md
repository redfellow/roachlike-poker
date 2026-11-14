## Why

Players can view past match recaps, but the History entry is hidden in the topbar "Lisää" menu. Reijo reports that none of 16 players found it.

## What Changes

- Add a visible "Historia (n)" button to the topbar. It is shown only when the room has at least one recap.
- Remove the History entry from the "Lisää" menu so it appears in only one place.
- The modal and its content stay the same.

## Outcome

- Topbar after a finished match
  - Now: `Lisää` menu → `Historia 1`
  - After: `Historia 1` button directly in the topbar
- Room with no finished matches
  - Now: `Lisää` menu → `Historia 0`
  - After: no History button

## Assumptions

- The button sits in the topbar tools next to the "Lisää" menu, styled as a compact quiet button. This rules out a primary-styled button.
- It shows during a running match too once history exists, so it does not appear only in the lobby.
