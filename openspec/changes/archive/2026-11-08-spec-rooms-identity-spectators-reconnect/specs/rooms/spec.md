## ADDED Requirements

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
After a match ends, the host SHALL be able to start a rematch. A rematch SHALL return the room to a lobby with the same code and the same seated people, with readiness cleared except for computer seats. Earlier recaps SHALL be kept, and newcomers SHALL be able to join.

#### Scenario: Rematch keeps history
- **WHEN** the host starts a rematch
- **THEN** the previous recap remains in the room history

### Requirement: Spectator information boundary
Each person SHALL receive a view projected for them. A spectator's view SHALL contain no hand cards, no grouped creature counts, no pending predictions, and no unrevealed challenge card identity. A spectator's game commands SHALL be rejected.

#### Scenario: Spectator inspects state
- **WHEN** a spectator receives state during play
- **THEN** its hand is empty and no private data of any seat is present
