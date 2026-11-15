## MODIFIED Requirements

### Requirement: Rematch
After a match ends, the host SHALL be able to start a rematch. A rematch SHALL immediately start a new match in the same room with the people still seated, without returning to a lobby and without asking anyone to ready up. A rematch SHALL be rejected when fewer than two people are seated. Earlier recaps SHALL be kept. People who join between matches SHALL join as spectators.

#### Scenario: Rematch keeps history
- **WHEN** the host starts a rematch
- **THEN** the previous recap remains in the room history

#### Scenario: Rematch starts the next match at once
- **WHEN** the host starts a rematch with two or more people seated
- **THEN** a new match is dealt to the same seated people without a lobby or readiness step

## ADDED Requirements

### Requirement: Return to lobby after a match
After a match ends, the host SHALL also be able to return the room to a lobby instead of starting a rematch. Returning to the lobby SHALL clear the ended match, keep earlier recaps, keep seated computers ready and require seated humans to ready up again. The usual lobby rules SHALL then apply again, so the group can change before the next match. Only the host SHALL be able to do this, and only after a match has ended.

#### Scenario: Host returns the room to a lobby
- **WHEN** the host chooses to return to the lobby after a match ends
- **THEN** the room has no active match, the previous recap remains in the history, seated computers are ready and seated humans are not

#### Scenario: Group changes in the returned lobby
- **WHEN** the room has returned to a lobby after a match
- **THEN** a newcomer can sit and the host can remove a seated person before the next match

#### Scenario: Only the host returns to a lobby after the end
- **WHEN** a non-host asks to return to the lobby, or anyone asks while a match is still in play
- **THEN** the request is rejected
