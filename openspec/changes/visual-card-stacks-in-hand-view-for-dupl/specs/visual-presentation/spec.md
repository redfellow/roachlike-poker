## MODIFIED Requirements

### Requirement: Private hand grouping
A person's own hand SHALL be shown as one stack per creature with a count. A stack of two or more cards SHALL look like layered cards, with one visible layer per card up to four layers, and SHALL keep its `×N` count. Other people SHALL see only that person's total hand count. No grouping or selection details SHALL be sent to other clients.

#### Scenario: Hidden hands
- **WHEN** two people view the same match
- **THEN** each sees only their own creature stacks and the other's hand count

#### Scenario: Duplicate cards appear stacked
- **WHEN** a person holds three cards of one creature
- **THEN** that creature is shown as one selectable card with three visible layers and the count `×3`
