# rooms Specification

## Purpose
TBD - created by archiving change spec-rooms-identity-spectators-reconnect. Update Purpose after archive.

## Requirements

### Requirement: Room creation and codes
The server SHALL create a room on `POST /api/rooms` with a unique three-word code `first-second-third`, drawn from fixed word lists. A colliding code SHALL be resolved by stepping deterministically to the next unused combination. Several rooms SHALL exist at once. Room IDs are opaque strings, and any stored room ID SHALL still join its room.

#### Scenario: Collision resolution
- **WHEN** the random code is already in use
- **THEN** the next unused combination is returned

### Requirement: Open room listing
New rooms SHALL be open. `GET /api/rooms/open` SHALL list open, unclosed rooms that have members, most recently active first. Each entry SHALL show the host name, the seated count, the spectator count, whether a match is playing, and the theme. Only the host SHALL change visibility, and only before a match.

#### Scenario: Host makes the lobby private
- **WHEN** the host sets the room private in the lobby
- **THEN** the room disappears from the open list but its link still joins

### Requirement: Joining and seating
A join SHALL need a room ID and a name of 1–24 characters after trimming. A join SHALL fail for an unknown or closed room. A new person SHALL be seated automatically when no match is running and fewer than 6 are seated. Otherwise they SHALL join as a spectator. The first joiner SHALL become host, and so SHALL a human joining a room whose host is a computer.

#### Scenario: Late arrival during play
- **WHEN** a new person joins while a match is running
- **THEN** they join as an unseated spectator

### Requirement: Ready countdown
Only seated people SHALL ready up. When at least 2 seats are filled and every seated person is ready and online, a countdown SHALL start (5 s by default). When it expires and the conditions still hold, the match SHALL start. Sitting, standing, unreadying, a seated person disconnecting, a new seated joiner, or removal of a lobby member SHALL cancel the countdown. A spectator's connection SHALL NOT affect it. Computer seats SHALL always be ready.

#### Scenario: Spectator disconnect keeps countdown
- **WHEN** a spectator disconnects during the countdown
- **THEN** the countdown continues

### Requirement: Lobby management
In the lobby, a person SHALL be able to leave the table. When the host leaves, the host role SHALL pass to the next remaining member. The host SHALL be able to remove another lobby member, but not themselves, and that member's connection SHALL be closed. The host SHALL be able to close the lobby when no match is running. Closing the lobby, or the last member leaving, SHALL delete the room and disconnect its members. A host who disconnects SHALL keep the host role.

#### Scenario: Last member leaves
- **WHEN** the only member leaves the lobby
- **THEN** the room is deleted

### Requirement: Rematch
After a match ends, the host SHALL be able to start a rematch. A rematch SHALL immediately start a new match in the same room with the people still seated, without returning to a lobby and without asking anyone to ready up. A rematch SHALL be rejected when fewer than two people are seated. Earlier recaps SHALL be kept. People who join between matches SHALL join as spectators.

#### Scenario: Rematch keeps history
- **WHEN** the host starts a rematch
- **THEN** the previous recap remains in the room history

#### Scenario: Rematch starts the next match at once
- **WHEN** the host starts a rematch with two or more people seated
- **THEN** a new match is dealt to the same seated people without a lobby or readiness step

### Requirement: Spectator information boundary
Each person SHALL receive a view projected for them. A spectator's view SHALL contain no hand cards, no grouped creature counts, no pending predictions, and no unrevealed challenge card identity. A spectator's game commands SHALL be rejected.

#### Scenario: Spectator inspects state
- **WHEN** a spectator receives state during play
- **THEN** its hand is empty and no private data of any seat is present

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
