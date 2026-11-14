## MODIFIED Requirements

### Requirement: Rematch
After a match ends, the host SHALL be able to start a rematch. A rematch SHALL immediately start a new match in the same room with the people still seated, without returning to a lobby and without asking anyone to ready up. A rematch SHALL be rejected when fewer than two people are seated. Earlier recaps SHALL be kept. People who join between matches SHALL join as spectators.

#### Scenario: Rematch keeps history
- **WHEN** the host starts a rematch
- **THEN** the previous recap remains in the room history

#### Scenario: Rematch starts the next match at once
- **WHEN** the host starts a rematch with two or more people seated
- **THEN** a new match is dealt to the same seated people without a lobby or readiness step
