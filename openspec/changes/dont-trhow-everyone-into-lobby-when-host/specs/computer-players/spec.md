## MODIFIED Requirements

### Requirement: Computer readiness is automatic
Seated computers SHALL always count as ready and online. A match SHALL start when two or more people are seated and every seated person is ready, whether the seated people are humans, computers or both; the host does not need a seat. A rematch SHALL deal seated computers into the next match together with the seated humans.

#### Scenario: Rematch deals computers in
- **WHEN** the host starts a rematch after a match ends
- **THEN** every seated computer has a seat in the new match

#### Scenario: Computers alone start a match
- **WHEN** two or more computers are seated and every seated person is ready
- **THEN** the countdown starts and the match begins, even if the human host is not seated
