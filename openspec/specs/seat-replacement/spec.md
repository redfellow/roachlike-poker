# seat-replacement Specification

## Purpose
TBD - created by archiving change spec-rooms-identity-spectators-reconnect. Update Purpose after archive.

## Requirements

### Requirement: Seat request eligibility
A spectator SHALL be able to request a non-removed seat of a running match when no vote is pending and either:
- the seat's person is offline, or
- the seat is the one required to act and more than 60 000 ms have passed since that required prompt.
A request at exactly 60 s SHALL be rejected. Watching and optional predictions SHALL NOT start the clock, and nothing is played automatically.

#### Scenario: Exactly 60 seconds
- **WHEN** the required seat is online and exactly 60 s have elapsed
- **THEN** the request is rejected

### Requirement: Frozen voter majority
At request time, the voter set SHALL be frozen as the seated, online people other than the target's person and the requester. A request with no voters SHALL be rejected. The seat SHALL transfer when approvals reach floor(n/2)+1. The vote SHALL be rejected once a majority can no longer be reached.

#### Scenario: Majority approves
- **WHEN** enough frozen voters approve
- **THEN** the requester takes the seat

### Requirement: Vote cancellation
A pending vote SHALL be cancelled when any of the following happens:
- the target's person reconnects;
- a frozen voter or the requester disconnects;
- a frozen voter reconnects;
- the target seat takes a non-prediction action;
- the match ends;
- a seat is removed.

#### Scenario: Owner reconnects
- **WHEN** the original player reconnects before approval
- **THEN** the vote is cancelled

### Requirement: Inheritance on transfer
The replacement SHALL inherit the seat's hand, exposed display and pending obligation, including a committed peek. The transfer SHALL be atomic, and the old person's commands SHALL fail afterwards. Earlier action authorship and prediction points SHALL stay with the original people. After the transfer, the prompt clock SHALL restart and any waiting-seat state SHALL clear.

#### Scenario: Peeked seat replaced
- **WHEN** a seat that had peeked is taken over
- **THEN** the new person must pass and cannot answer

### Requirement: Knowledge conflict
A person who has already seen the active challenge card SHALL NOT take over a seat that card has not visited until the challenge resolves. A person who already holds a seat SHALL NOT take a second one.

#### Scenario: Knowing spectator
- **WHEN** a person who saw the card requests an unseen receiver's seat and approval completes
- **THEN** the transfer is rejected
