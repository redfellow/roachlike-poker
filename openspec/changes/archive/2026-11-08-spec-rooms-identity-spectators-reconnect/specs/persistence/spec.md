## ADDED Requirements

### Requirement: Durable commits
Each room state SHALL be stored in SQLite (WAL, synchronous FULL) together with the command receipt in one transaction, before acknowledgment and broadcast. If the receipt cannot be committed, the state SHALL roll back. A repeated command ID from the same person SHALL be acknowledged without being applied again. A command with a stale revision SHALL be rejected, except close-lobby.

#### Scenario: Duplicate retry
- **WHEN** a receiver response arrives twice
- **THEN** there is one penalty and one committed result

### Requirement: Restart restores games
On startup, stored rooms SHALL be restored with their dealt cards, private knowledge, phase, claims, predictions and authorship, without reshuffling. Countdowns, readiness (except computer seats), votes and the prompt clock SHALL be cleared, and all connections start offline. The prompt clock SHALL restart when the prompt changes or the required seat's person rejoins.

#### Scenario: Restart mid-match
- **WHEN** the server restarts during a match
- **THEN** the same hands and private hand view are restored

### Requirement: Recap history
When a match ends, its recap SHALL be appended once to the room history and kept across rematches and restarts. Remaining hands SHALL NOT be revealed because the match ended.

#### Scenario: Rematch then restart
- **WHEN** a rematch is started and the server restarts
- **THEN** the earlier recap is still available

### Requirement: Room expiry
A room SHALL be deleted after 30 minutes without activity. A lobby SHALL also be deleted when its last online person disconnects, unless it has a game or history. On startup, rooms with no members, or with no game, no history and no computer members, SHALL be discarded.

#### Scenario: Inactive room
- **WHEN** 30 minutes pass without activity
- **THEN** the room is deleted
