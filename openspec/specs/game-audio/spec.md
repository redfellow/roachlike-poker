# game-audio Specification

## Purpose
Define in-game sound effects, music and mute behavior.

## Requirements

### Requirement: Sound toggle
The topbar SHALL offer an `Äänet` volume slider from 0 to 100 on the landing page, in the lobby, during play and after a match, stored per device (`torakka:sound-volume`) and default 100. It SHALL scale every event sound, click sound and countdown tick. At 0, no event sound, click sound or countdown tick SHALL play. There SHALL be no separate on/off switch.

#### Scenario: Muted device
- **WHEN** the slider is at 0 and a card resolves
- **THEN** no sound plays on that device

#### Scenario: Volume during play
- **WHEN** a match is in progress
- **THEN** the slider is shown and changing it changes the volume of the next sound

### Requirement: Event sounds
With sound on, the client SHALL play: a send sound for a new challenge and a pass sound for a passed claim; a prompt sound once per claim for the person who must respond; on a non-cancelled resolution, a believe or disbelieve sound, then a reveal and a penalty-transfer sound for everyone; and a short click for enabled buttons. Sounds SHALL be normalised by peak level. Where variants exist, one is picked at random.

#### Scenario: Uninvolved person
- **WHEN** a card resolves between two other people
- **THEN** this person hears the decision, reveal and penalty sounds but no win or loss sound

### Requirement: Personal outcome sound
The final sender, the receiver and the penalty taker SHALL also hear an outcome sound about one second after resolution: a loss sound for the penalty taker, and otherwise a win sound that rotates through its variants.

#### Scenario: Penalty taker
- **WHEN** this person takes the card
- **THEN** the loss sound plays

### Requirement: Countdown ticks
During the lobby countdown, a tick SHALL play once per second, unless the sound volume is 0 or reduced motion is on.

#### Scenario: Countdown with reduced motion
- **WHEN** reduced motion is on during the countdown
- **THEN** no tick plays

### Requirement: No browser calls to the generation service
The browser app SHALL play only static audio files it ships. It SHALL never call the sound-generation API or hold its key.

#### Scenario: Production bundle
- **WHEN** the app plays a sound
- **THEN** it loads a file under `/audio/` from the app's own origin
