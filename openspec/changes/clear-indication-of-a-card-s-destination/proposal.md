## Why
Reijo: "its not apparent where cards are going to in mobile". When a card is handed along the claim path, the face-down card flies from a fixed off-screen point to the play-area centre, so on a narrow portrait screen nothing shows which seat receives it.

## What Changes
- The handoff card animation starts at the sending seat panel and ends inside the receiving seat panel, using their measured on-screen positions, on every viewport including portrait mobile.
- The receiving seat panel highlights as the card lands (existing `seat--receiving` timed to arrival).
- Reduced motion hides the flying card, and the receiving panel gets a static highlight for the normal handoff duration instead of the animated glow, so the destination stays marked without motion.
- **MODIFIED** `visual-presentation` requirement "Table layout" gains a handoff-destination scenario.

## Outcome
- Passing a card on a phone
  - Now: card sweeps in from the lower-left edge to the table centre and fades
  - After: card travels from the sender's panel into the receiver's panel, which lights up on arrival

## Assumptions
- Only the claim handoff changes; the penalty card after resolution is untouched (ruled out: also animating the penalty card).
- Positions are measured from the `data-seat-id` panels at handoff start; if a panel is not found the current centre animation is kept as fallback (ruled out: hiding the card).
- The same targeted flight applies on desktop too rather than only below a mobile breakpoint.
