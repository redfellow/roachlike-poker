# player-identity Specification

## Purpose
TBD - created by archiving change spec-rooms-identity-spectators-reconnect. Update Purpose after archive.

## Requirements

### Requirement: Session token
A successful join SHALL return a session token. A later join with that token SHALL resume the same person.

#### Scenario: Refresh keeps identity
- **WHEN** a client rejoins with its token
- **THEN** it controls the same person and seat, and the host role is kept

### Requirement: Name normalization and uniqueness
Names SHALL be compared after trimming, NFKC normalization and Finnish lower-casing. The original case SHALL be kept for display. A join whose normalized name matches an online member SHALL be rejected.

#### Scenario: Case-only duplicate
- **WHEN** someone joins as "reiska" while "Reiska" is online
- **THEN** the join is rejected

### Requirement: Exact-name recovery
A join without a valid token whose normalized name matches an offline member SHALL reclaim that member and their seat without approval. It SHALL issue a new token and announce the return to the table. The join SHALL be rejected when that person's seat was permanently removed in the current match.

#### Scenario: Recovery with different whitespace and case
- **WHEN** an offline "Reiska" is reclaimed by " reiska "
- **THEN** the same seat and hand are restored

### Requirement: Single controlling connection
Only the latest connection of a person SHALL control them. On a new join the previous connection SHALL receive `replaced`, and its later commands SHALL be rejected ("Paikkasi on käytössä toisella laitteella.").

#### Scenario: Old device sends after reclaim
- **WHEN** the old connection sends a command
- **THEN** it is rejected and the new connection alone controls the seat

### Requirement: Disconnection
A disconnect SHALL NOT pause play or move cards. The seat and hand SHALL be kept, and play waits if that seat must act. The person SHALL be shown offline, and their readiness SHALL be cleared.

#### Scenario: Seated player disconnects mid-match
- **WHEN** a seated player disconnects
- **THEN** their seat and hand stay unchanged
