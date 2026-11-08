# departures Specification

## Purpose
TBD - created by archiving change spec-rooms-identity-spectators-reconnect. Update Purpose after archive.

## Requirements

### Requirement: Host-confirmed removal of offline seats
During a running match, only the host SHALL be able to remove a seat, and only one whose person is offline. Computer seats count as online. A disconnect alone SHALL never redistribute cards. After the match has ended, removal SHALL be rejected.

#### Scenario: Online seat
- **WHEN** the host tries to remove an online player's seat
- **THEN** the command is rejected

### Requirement: Under-capacity seat is preserved
When the match has 3 or fewer non-removed seats, including the one being removed, removal SHALL NOT change cards or phase. It SHALL mark the seat as waiting for a replacement and tell the table that a replacement or End game is needed. While a seat is waiting, game commands SHALL be rejected. The waiting state SHALL clear when the owner reconnects, a replacement takes the seat, or the host ends the match. Ending SHALL cancel any challenge and finish without a loser.

#### Scenario: Three-player removal
- **WHEN** the host removes an offline seat in a three-player match
- **THEN** the seat and cards stay intact and the table is asked for a replacement

### Requirement: Removal with redistribution
With more than 3 seats, removal SHALL cancel the challenge without penalty when the seat is the current sender or receiver. It SHALL be rejected when the seat is a bystander to an unresolved challenge. The removed hand SHALL be shuffled and dealt round-robin to the remaining seats in random order. The removed exposed cards SHALL stay visible. The seat SHALL be marked removed and its person unseated. All 64 cards SHALL be conserved.

#### Scenario: Four-player game removes current receiver
- **WHEN** the receiver's seat is removed
- **THEN** the challenge card is retired, the hand is spread among three, and 64 cards remain

### Requirement: Recovery initiator
After a removal, when the match was not in initiation by another seat, the new initiator SHALL be chosen at random among the seats that have cards. Seats tied with the worst risk SHALL be excluded unless every candidate ties. Risk is the largest matching exposed stack, then the smallest hand. When no seat has cards, the match SHALL end without a loser. An unaffected scheduled initiator SHALL be kept.

#### Scenario: Highest risk excluded
- **WHEN** X has stack 3 and hand 8, Y has stack 2 and hand 2, and Z has stack 2 and hand 5
- **THEN** Y or Z is chosen

### Requirement: Removed seat is final
A removed seat SHALL NOT be reclaimed during that match, including by exact-name join.

A removed person whose device still holds the session token SHALL rejoin as a non-seated member who may watch. The token SHALL NOT restore the removed seat.

#### Scenario: Name join after removal
- **WHEN** the removed person joins by name
- **THEN** the join is rejected
