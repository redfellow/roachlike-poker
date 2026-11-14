## ADDED Requirements

### Requirement: Distinct, stable player icons
Each room member SHALL receive a player icon (shape and colour) when first joining the room. No two current members of a room SHALL share the same icon while unused combinations remain, and players SHALL get different shapes before shapes repeat. A member's icon SHALL NOT change for the life of the room, including across new games, rematches and reconnects. Lobby, spectator and table views SHALL render the assigned icon.

#### Scenario: Players at one table look different
- **WHEN** six players join a room
- **THEN** each has a different icon shape

#### Scenario: Icon survives a new game
- **WHEN** a match ends and a new game starts in the same room
- **THEN** every player shows the same icon as before
