## Why
A hand card with several copies looks like one card with a number. Reijo wants several copies to look like a stack of cards (origin: "Show hand cards x1-n as stacks and not just single card with number").

## What Changes
- Each hand card with two or more copies of a creature is drawn as stacked cards, with one offset layer per copy behind the front card, up to 4 visible layers.
- The `×N` count badge stays.
- The hand stays playable in a portrait mobile viewport. Selecting, disabling and hidden hands stay as they are.

## Outcome
- Three Hiiri cards in hand
  - Now: one `×3` card
  - After: a `×3` card with two offset card edges visible behind it
- Seven cards of one creature
  - After: `×7` card with three edges behind it (4 layers is the cap)

## Assumptions
- At most 4 layers are drawn, so large stacks don't overflow on phones. The alternative was no cap.
- Layers behind the front card are decorative (CSS/`aria-hidden`), so the button stays one control. The alternative was a separate element for each card.
- Reduced motion has no effect, because the layers don't move.
