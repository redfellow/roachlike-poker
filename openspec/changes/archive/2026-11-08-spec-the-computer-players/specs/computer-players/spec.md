## ADDED Requirements

### Requirement: Host adds computer players before a match
Only the host SHALL be able to add a computer player, and only while no match is in progress and fewer than six people are seated. The new computer SHALL be seated immediately, marked ready and flagged `computer: true` in the member view. Adding a computer SHALL cancel any running countdown.

#### Scenario: Adding a computer to an open seat
- **WHEN** the host sends `add-computer` in a lobby with fewer than six people seated
- **THEN** a new member appears who is seated, ready and labeled as a computer, and the countdown is cleared

#### Scenario: Table is full or the request does not come from the host
- **WHEN** six people are already seated, a match is in progress, or a non-host sends `add-computer`
- **THEN** the command is rejected and the room is unchanged

### Requirement: Computer identities are explicitly labeled
Each computer SHALL get a name chosen at random from the unused names in a fixed list of `🤖`-prefixed names. When all of those names are taken, its name SHALL be `🤖 Kusetusbotti <n>`. When a stored room is loaded, computers with the legacy names `Tietokone <n>` SHALL be renamed to names from the list.

#### Scenario: Random unused name
- **WHEN** a computer is added
- **THEN** its name is a `🤖` name that no other member of the room has

### Requirement: Computer readiness is automatic
Seated computers SHALL always count as ready and online. A match SHALL start when two or more people are seated and every seated person is ready, whether the seated people are humans, computers or both; the host does not need a seat. When the host opens a rematch, the seated computers SHALL be ready and the humans SHALL not be.

#### Scenario: Rematch keeps computers ready
- **WHEN** the host opens a rematch after a match ends
- **THEN** every seated computer is ready

#### Scenario: Computers alone start a match
- **WHEN** two or more computers are seated and every seated person is ready
- **THEN** the countdown starts and the match begins, even if the human host is not seated

### Requirement: Host removes computers
Before a match, the host SHALL be able to remove a computer with the ordinary `remove` command. Its member entry, seat and readiness are deleted and the countdown is cleared. A human can then take the free seat with `sit`, which places them last in the seat order.

#### Scenario: Removing a computer
- **WHEN** the host removes a computer in the lobby
- **THEN** the computer is no longer a member and the countdown is null

### Requirement: Computers never hold the host role
The host role SHALL never be given to a computer. When a human joins a room whose host is missing or is a computer, that human SHALL become the host.

#### Scenario: Host refresh with computers present
- **WHEN** the human host reconnects with their token in a room that has computers
- **THEN** the host is still the same human member

### Requirement: Decision policy uses only public information
Computer decisions SHALL be deterministic functions of public match state and the computer's own hand. They SHALL be submitted through the same validated action pipeline as human actions. A computer SHALL never inspect a face-down card it has received.

#### Scenario: Complete fair computer games
- **WHEN** computers play complete matches at 2, 3 and 6 seats
- **THEN** every action is legal, 64 cards are conserved, and passes and predictions occur

### Requirement: Computer tactical choices
When starting a challenge, a computer SHALL send the card whose creature it holds most of, pick its target by rotation, and choose a truthful or false claim by a public hash. When responding, it SHALL peek and pass by a public hash only when there is an eligible target, and otherwise answer by a hash of public claim metadata. A computer that is eligible to predict SHALL submit one prediction per claim, chosen by a public hash.

#### Scenario: Responding without an eligible pass target
- **WHEN** a computer receives a card and no eligible pass target remains
- **THEN** it answers believe or disbelieve instead of peeking

### Requirement: Computer pacing is configurable per deployment
A computer SHALL act after a delay of `TORAKKA_COMPUTER_DELAY_MS` milliseconds (default 4300). A human's action SHALL be broadcast before the computer's response to it.

#### Scenario: Human claim is visible before the computer answers
- **WHEN** a human sends a card to a computer
- **THEN** clients first see the response phase without a resolution, and the resolution follows after the delay

### Requirement: Single scheduled computer action and restart recovery
Each room SHALL have at most one pending computer timer. When the timer fires, the computer SHALL act on the latest stored room state: pending computer predictions are applied first, then the computer action that is required, if any. If nothing changed, nothing is saved. Because the timer reads the latest stored state, no computer action is applied for a turn a human has already taken. Computer members (with their `computer` flag and name) and their seats SHALL be stored with the room; when the server starts, it SHALL restore them, recompute computer readiness, and schedule pending computer obligations for stored rooms without replaying earlier actions. Closing the room or the server SHALL clear the timers.

#### Scenario: Pending response resumes after restart
- **WHEN** the server restarts while a computer owes a response
- **THEN** the response is applied exactly once and produces the next resolution

#### Scenario: Game proceeds until a human must act
- **WHEN** a match has one human and five computers
- **THEN** the computers keep acting until the match ends or a human's action is required
