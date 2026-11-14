# Duckduckgo mobile leave doesnt work

## Why
"Poistu pöydästä" (and every other confirmed action) asks via `window.confirm()`. DuckDuckGo mobile suppresses native dialogs, so `confirm()` returns false and the command is never sent. Reijo chose to fix all confirms, not just leave.

## What Changes
- Add one in-app confirmation dialog in `apps/web/src/main.tsx`, built on the existing `Modal` (focus trap, Escape/backdrop closes = cancel), showing the existing Finnish question text with a confirm button and a cancel button.
- Replace all seven `confirm(...)` calls (end game ×2, close lobby, remove player in lobby, leave table, remove offline seat, end playing) with it; the command is sent only after the confirm button is pressed.
- Update `tests/e2e/computers.spec.ts` `closeSoloTable`, which accepts native dialogs, to press the in-app confirm button instead; add an e2e check that leaving the table works via the in-app dialog.

## Outcome
- Leaving the table
  - Now: browser popup `Poistutaanko pöydästä? Sinun asemasi poistetaan aulasta.` (never appears on DuckDuckGo mobile; nothing happens)
  - After: in-page dialog with the same question and buttons `Kyllä` / `Peruuta`

## Acceptance
- No `confirm(` call remains in `apps/web/src`.
- Each confirmed action sends its command only after the in-app confirm button; cancel/Escape/backdrop sends nothing.

## Citations
- apps/web/src/main.tsx:393,399,400,406,596,599 confirm() calls
- apps/web/src/main.tsx:291 Modal
- tests/e2e/computers.spec.ts:45 native dialog handler

## Assumptions
- Button labels `Kyllä` / `Peruuta` added to strings.fi.ts (alternative: action-specific labels).
- Confirm button uses danger styling for destructive actions (alternative: primary for all).
