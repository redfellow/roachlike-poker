# visual-presentation Specification

## Purpose
TBD - created by archiving change spec-visual-presentation-onboarding-and. Update Purpose after archive.

## Requirements

### Requirement: Finnish interface without turn timers
The interface SHALL be in Finnish, with the response buttons `Uskon` and `En usko`. No turn timer or mandatory wait SHALL be shown before a person may respond.

#### Scenario: Response buttons
- **WHEN** a receiver must respond
- **THEN** the buttons read `Uskon` and `En usko` and are usable immediately

### Requirement: Table layout
The table SHALL show the person's own hand below the play area, the current claim in the centre and a compact panel for each seat. Each panel shows the name, avatar, hand count and the exposed cards grouped per creature with counts. A stack at threshold−1 SHALL be marked as dangerous. The seats in the current claim path SHALL be emphasised. The layout SHALL be playable in a portrait mobile viewport.

#### Scenario: Seat panel contents
- **WHEN** a match is in progress
- **THEN** each seat shows its hand count and per-creature exposed counts, and the seat that must act is marked active

### Requirement: Private hand grouping
A person's own hand SHALL be shown as one stack per creature with a count. Other people SHALL see only that person's total hand count. No grouping or selection details SHALL be sent to other clients.

#### Scenario: Hidden hands
- **WHEN** two people view the same match
- **THEN** each sees only their own creature stacks and the other's hand count

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
