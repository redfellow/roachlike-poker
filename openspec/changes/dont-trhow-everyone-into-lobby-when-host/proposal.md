# Start the next match straight away on rematch

## Why
When the host presses "Uusi peli" after a match, everyone is thrown back to the lobby and every human has to ready up again. Reijo wants the table to keep playing: the same players should go straight into the next match.

## What Changes
- The host's rematch command starts a new match at once with the people still seated, in the same room, keeping earlier recaps.
- No lobby step and no ready-up between matches; readiness is no longer reset for humans.
- People who arrive between matches join as spectators (they get a seat only in a later lobby, as today during play).
- If fewer than two people are still seated, rematch is rejected with a message (the host can still end playing).
- Modifies the Rooms "Rematch" requirement and the rematch sentence of Computer players "Computer readiness is automatic".

## Outcome
- Host presses new game
  - Now: everyone lands in the lobby with `Uusi peli, samat huonot ystävät. Ilmoittaudu valmiiksi.`
  - After: cards are dealt immediately with `Kortit jaettu. Älä luota kehenkään.`
- Button label
  - Now: `Uusi peli — sama kutsulinkki ↗`
  - After: `Uusi peli samalla porukalla`

## Assumptions
- Seated players who are offline at rematch are dealt in anyway; the existing absence and seat-replacement rules handle them (rather than blocking the rematch until all are online).
- Fewer than two seated people rejects the rematch (rather than falling back to the old lobby path).
- The button label changes because "sama kutsulinkki" no longer describes what happens (rather than keeping the old label).
