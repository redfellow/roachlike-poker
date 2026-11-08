## ADDED Requirements

### Requirement: Deck identity and card conservation
A match SHALL use exactly 64 uniquely identified cards: eight copies of each of the eight creatures (torakka, lepakko, karpanen, sammakko, rotta, skorpioni, hamahakki, lude). At every point in a match, every card SHALL be in exactly one zone: a seat's hand, a seat's exposed display, the active challenge, the unseen setup removals or the retired cards.

#### Scenario: Cards are conserved through play
- **WHEN** any sequence of legal commands is applied to a match
- **THEN** the match inventory contains 64 cards with 64 distinct IDs

### Requirement: Match setup
Creating a match SHALL require 2–6 distinct players. Creating a match SHALL shuffle the deck once. For two players, it SHALL remove 10 cards unseen and deal the rest. For 3–6 players, it SHALL deal every card. Dealing SHALL go round-robin in a randomly shuffled seat order, so which seats get the extra cards is random. The starting seat SHALL be chosen randomly and the match SHALL begin in the `initiation` phase. The defeat threshold SHALL be fixed at creation: 5 for two players, 4 otherwise.

#### Scenario: Hand sizes per table size
- **WHEN** a match is created for 2, 3, 4, 5 or 6 players
- **THEN** the hand sizes are 27/27 (10 unseen), 22/21/21, 16×4, 13/13/13/13/12 and 11/11/11/11/10/10 respectively

#### Scenario: R01 three-player start
- **WHEN** three players start
- **THEN** hands are 22/21/21, 64 cards exist in total and none are removed unseen

#### Scenario: Invalid player count
- **WHEN** a match is created with fewer than 2 or more than 6 players, or with repeated player IDs
- **THEN** creation is rejected with a game error

### Requirement: Phases and command validation
A match SHALL be in one of the phases `initiation`, `response`, `passing` or `ended`. The rules module SHALL reject an illegal command with a game error and leave the match unchanged. After a match has ended, no command SHALL be accepted.

#### Scenario: Command after the end
- **WHEN** any command is applied to an ended match
- **THEN** it is rejected

### Requirement: Send command
In `initiation`, only the active seat SHALL send: one card from its own hand, an active target seat other than itself, and a claim naming any creature. Sending SHALL move the card into a new challenge and record the sender as original owner and as the seat and person who have seen it. The match SHALL then enter `response`.

#### Scenario: Sending a card not in hand
- **WHEN** the active seat sends a card ID that is not in its hand, or targets itself
- **THEN** the command is rejected

### Requirement: Answer, peek and pass commands
In `response`, only the latest receiver SHALL answer (Uskon or En usko) or peek. Both lock the latest claim. Answering resolves the challenge. Peeking needs at least one eligible target, records the receiver seat and person as having seen the card, and enters `passing`. In `passing`, only that receiver SHALL pass: an eligible target and a claim. The pass appends a claim with the actor as latest sender and returns to `response`.

#### Scenario: R09 peek commits to passing
- **WHEN** a receiver has peeked and then submits an answer
- **THEN** the answer is rejected and the match stays in `passing`, with the card visible to that receiver

### Requirement: Resolution truth table
On `answer`, the receiver is correct when "believes" equals "the card's creature matches the latest claim". If the receiver is correct, the latest sender SHALL take the card into their exposed display. Otherwise the receiver SHALL take it. The penalty recipient SHALL become the active seat. The resolution SHALL be recorded and the challenge cleared in the same state transition.

#### Scenario: R03–R06 truth table
- **WHEN** A sends a lepakko to B and B answers
- **THEN** a false claim + Uskon gives the card to B, a true claim + Uskon gives it to A, a true claim + En usko gives it to B, and a false claim + En usko gives it to A

#### Scenario: R07 penalty uses the latest sender
- **WHEN** A sends to B, B peeks and passes to C claiming rotta on a lepakko, and C answers En usko
- **THEN** B takes the card, not A

### Requirement: Defeat
After the penalty card is added, the penalty recipient SHALL lose immediately (`matching`) if any creature in their display has reached the threshold. Otherwise, if their hand is empty, they SHALL lose (`empty`) because they must initiate next. Otherwise the match SHALL continue in `initiation` with them as the starter. Playing one's last hand card SHALL NOT by itself cause defeat.

#### Scenario: R02 two-player threshold
- **WHEN** in a two-player match a seat takes its fourth matching card
- **THEN** the match continues, and when the seat takes its fifth matching card the match ends with that seat as loser

#### Scenario: R10 last card sent and wrongly believed
- **WHEN** A sends their last card and B believes its false claim
- **THEN** B takes the card and A remains in the match with zero hand cards

#### Scenario: R11 empty-handed penalty recipient
- **WHEN** A sends their last card and B correctly disbelieves
- **THEN** A takes it and loses with reason `empty`, even without a matching set

### Requirement: Passing eligibility
The eligible pass targets SHALL be the active seats that are not the current receiver, have not seen this challenge card, and whose occupant has not learned the card. A peek SHALL be allowed only when at least one eligible target exists, so the final eligible receiver must answer. In a two-player match, a pass is never possible. Receiving a face-down card SHALL NOT count as having seen it.

#### Scenario: R08 last unseen receiver
- **WHEN** C receives the card and is the last seat that has not seen it
- **THEN** C has no peek or pass action, and C's view does not include the card identity

### Requirement: Prediction eligibility
Only during `response`, a seated person who is not the latest receiver and has not learned the card MAY submit a prediction (believe/disbelieve) on the latest claim. The submission SHALL name the challenge ID and the claim index. A stale or locked claim SHALL be rejected.

#### Scenario: Spectator cannot predict
- **WHEN** a person without a seat submits a prediction
- **THEN** it is rejected

#### Scenario: Stale prediction
- **WHEN** a prediction names an earlier claim index after a pass
- **THEN** it is rejected

### Requirement: Prediction revision and locking
A new submission SHALL replace that person's earlier prediction on the same claim. A claim's predictions SHALL lock when its receiver answers or peeks. A later pass opens a new claim with its own predictions.

#### Scenario: R22 predictions per claim
- **WHEN** A claims rotta on a lepakko, D predicts false, B passes claiming lepakko and D predicts true
- **THEN** both predictions stay recorded on their own claims, and neither is visible to other players before resolution

#### Scenario: R23 predictor later receives the card
- **WHEN** a person who predicted on an earlier claim becomes the receiver of the same card
- **THEN** their earlier locked prediction remains, and they cannot predict on the claim where they are the receiver

### Requirement: Public and private view boundary
A person's projected view SHALL include every seat's hand count and exposed display, the current challenge's claim path, the person's own hand, the card identity only if the person has learned it, their own eligible targets only if they are the latest receiver, and only their own prediction on the latest claim. It SHALL NOT include other seats' hand cards, the unseen card identity, or other people's unresolved predictions.

#### Scenario: R13 spectator view
- **WHEN** a person without a seat is shown the match
- **THEN** their view has no hand cards, no unrevealed challenge card and no pending predictions
