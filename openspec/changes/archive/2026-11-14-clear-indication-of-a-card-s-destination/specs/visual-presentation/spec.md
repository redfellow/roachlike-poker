## MODIFIED Requirements

### Requirement: Table layout
The table SHALL show the person's own hand below the play area, the current claim in the centre and a compact panel for each seat. Each panel shows the name, avatar, hand count and the exposed cards grouped per creature with counts. A stack at threshold−1 SHALL be marked as dangerous. The seats in the current claim path SHALL be emphasised. When a card is handed to another seat, the handed card SHALL visibly travel from the sending seat's panel into the receiving seat's panel, and the receiving panel SHALL be highlighted on arrival. With reduced motion on, the card SHALL not travel and the receiving panel SHALL instead show a static highlight long enough to be seen. The layout SHALL be playable in a portrait mobile viewport.

#### Scenario: Seat panel contents
- **WHEN** a match is in progress
- **THEN** each seat shows its hand count and per-creature exposed counts, and the seat that must act is marked active

#### Scenario: Handoff destination on mobile
- **WHEN** a card is passed to another seat in a portrait mobile viewport
- **THEN** the card animates into the receiving seat's panel and that panel is highlighted

#### Scenario: Handoff destination with reduced motion
- **WHEN** reduced motion is on and a card is passed to another seat
- **THEN** no card animates and the receiving seat's panel shows a static highlight for about a second
