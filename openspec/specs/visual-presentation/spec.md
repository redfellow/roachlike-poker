# visual-presentation Specification

## Purpose
Define the Finnish interface, layout, hand grouping, reduced motion and visual themes.

## Requirements

### Requirement: Finnish interface without turn timers
The interface SHALL be in Finnish, with the response buttons `Uskon` and `En usko`. No turn timer or mandatory wait SHALL be shown before a person may respond.

#### Scenario: Response buttons
- **WHEN** a receiver must respond
- **THEN** the buttons read `Uskon` and `En usko` and are usable immediately

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

### Requirement: Private hand grouping
A person's own hand SHALL be shown as one stack per creature with a count. A stack of two or more cards SHALL look like layered cards, with one visible layer per card up to four layers, and SHALL keep its `×N` count. Other people SHALL see only that person's total hand count. No grouping or selection details SHALL be sent to other clients.

#### Scenario: Hidden hands
- **WHEN** two people view the same match
- **THEN** each sees only their own creature stacks and the other's hand count

#### Scenario: Duplicate cards appear stacked
- **WHEN** a person holds three cards of one creature
- **THEN** that creature is shown as one selectable card with three visible layers and the count `×3`

### Requirement: Resolution and next-turn display
On resolution, every client SHALL briefly show the receiver's decision, the final claim next to the true card stamped `TOTTA` or `VALHE`, and who takes the card (or that the round was cancelled). When predictions exist, it SHALL show the correct-prediction count with 👏 (all correct), 😱 (none correct) or 😂 (mixed). After a new initiator is set, a banner SHALL show `Sun puheet!` to that person and `<name>!` to others. At game over, the end panel shows the loser and the reason instead.

#### Scenario: Reveal after an answer
- **WHEN** a receiver answers
- **THEN** all clients show the showdown and penalty taker for about two seconds, then the next-turn banner

### Requirement: Reduced motion
Each device SHALL offer a reduced-motion setting, stored locally (`torakka:reduced`) and defaulting to the OS `prefers-reduced-motion` preference. When it is on, handoff, peek, reveal and banner animations SHALL be cut to near zero and the answer flash SHALL not be shown.

#### Scenario: Reduced motion on
- **WHEN** reduced motion is on and a card resolves
- **THEN** the reveal clears almost immediately and no answer flash is shown

### Requirement: Host-selected visual themes
A room SHALL have a theme reference (ID and version), defaulting to Örkkipokka. Only the host SHALL change it, and not while the lobby countdown runs. A change SHALL reach every client immediately. When a match is running, the change SHALL also update that match and its recap.

#### Scenario: Host changes theme
- **WHEN** the host selects Herrasmiespokeri in the lobby
- **THEN** every client shows it, and a non-host's attempt is rejected

#### Scenario: Countdown blocks the change
- **WHEN** the lobby countdown is running
- **THEN** a theme change is rejected

### Requirement: Theme persistence and fallback
The theme SHALL persist through matches, rematches and restarts, and each recap SHALL store its theme reference. An unknown theme ID SHALL render as Örkkipokka without changing game state.

#### Scenario: Unavailable theme
- **WHEN** a recap names a theme the client does not know
- **THEN** it renders as Örkkipokka

### Requirement: Themes change presentation only
A theme SHALL change only card names and art, the card back, colours, theme wording, avatar decoration and achievement title/copy. Rules, achievement conditions and sounds SHALL stay the same.

#### Scenario: Same rules in another theme
- **WHEN** a match uses Herrasmiespokeri
- **THEN** its threshold, actions and sounds are the same as in Örkkipokka

### Requirement: Shipped theme packs
The app SHALL ship Örkkipokka (default and fallback) and Herrasmiespokeri. Herrasmiespokeri SHALL map the eight creatures to Härvääjä, Kiltti, Tilasto, Murre, Lurkki, Viilaaja, Nippeli and Pamppu, and SHALL draw a top hat on avatars.

#### Scenario: Herrasmiespokeri labels
- **WHEN** a match uses Herrasmiespokeri
- **THEN** cards use its eight names and portraits, and avatars wear hats

### Requirement: Discoverable match history
When the room has at least one match recap, the topbar SHALL show a visible History button with the recap count. The button SHALL open the history view and SHALL NOT be nested in the overflow menu. When the room has no recaps, the button SHALL NOT be shown.

#### Scenario: History after a finished match
- **WHEN** a match in the room has ended
- **THEN** a History button with count 1 is visible in the topbar without opening another menu

#### Scenario: No history yet
- **WHEN** no match in the room has ended
- **THEN** no History button is shown

### Requirement: Distinct, stable player icons
Each room member SHALL receive a player icon (shape and colour) when first joining the room. No two current members of a room SHALL share the same icon while unused combinations remain, and players SHALL get different shapes before shapes repeat. A member's icon SHALL NOT change for the life of the room, including across new games, rematches and reconnects. Lobby, spectator and table views SHALL render the assigned icon.

#### Scenario: Players at one table look different
- **WHEN** six players join a room
- **THEN** each has a different icon shape

#### Scenario: Icon survives a new game
- **WHEN** a match ends and a new game starts in the same room
- **THEN** every player shows the same icon as before
