# Start the next match straight away on rematch

## Why
When the host presses "Uusi peli" after a match, everyone is thrown back to the lobby and every human has to ready up again. Reijo wants the table to keep playing: the same players should go straight into the next match.

## What Changes
- The host's rematch command starts a new match at once with the people still seated, in the same room, keeping earlier recaps.
- No lobby step and no ready-up between matches; readiness is no longer reset for humans.
- People who arrive between matches join as spectators; they get a seat when the host returns the room to a lobby.
- The end panel gets a second host action, `Takaisin aulaan`, that keeps the old behaviour: the room returns to a lobby, the match is cleared, humans ready up again and seated computers stay ready. In that lobby newcomers can sit, players can stand or leave the table, the host can add or remove computers and remove seats, so the group can change between matches (for example when a seated friend has gone home).
- If fewer than two people are still seated, rematch is rejected with a message (the host can still end playing).
- Adds the Rooms requirement "Return to lobby after a match".
- Modifies the Rooms "Rematch" requirement and the rematch sentence of Computer players "Computer readiness is automatic".

## Outcome
- Host presses new game
  - Now: everyone lands in the lobby with `Uusi peli, samat huonot ystävät. Ilmoittaudu valmiiksi.`
  - After: cards are dealt immediately with `Kortit jaettu. Älä luota kehenkään.`
- Button label
  - Now: `Uusi peli — sama kutsulinkki ↗`
  - After: `Uusi peli samalla porukalla`
- Host wants to change the group
  - After: a second button `Takaisin aulaan` returns everyone to the lobby with `Uusi peli, samat huonot ystävät. Ilmoittaudu valmiiksi.`

## Assumptions
- Seated players who are offline at rematch are dealt in anyway (rather than blocking the rematch until all are online); when that is unwanted, the host uses `Takaisin aulaan` and removes the seat in the lobby.
- Fewer than two seated people rejects the rematch (rather than falling back to the old lobby path).
- The button label changes because "sama kutsulinkki" no longer describes what happens (rather than keeping the old label).
- The return-to-lobby action is a new protocol command `lobby` (rather than a flag on `rematch`), and its label is `Takaisin aulaan` (rather than the old `Uusi peli — sama kutsulinkki ↗`).
- Returning to the lobby reuses the old lobby notice `Uusi peli, samat huonot ystävät. Ilmoittaudu valmiiksi.` (rather than a new text).
- Returning to the lobby asks no confirmation (rather than a confirm dialog like ending play).
