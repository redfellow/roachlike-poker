# game-audio Specification

## Purpose
Define in-game sound effects, music and mute behavior.

## Requirements

### Requirement: Sound toggle
The topbar SHALL offer a `Äänet` switch, stored per device (`torakka:muted`) and default on. When sound is off, no event sound, click sound or countdown tick SHALL play.

#### Scenario: Muted device
- **WHEN** sound is off and a card resolves
- **THEN** no sound plays on that device

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
During the lobby countdown, a tick SHALL play once per second, unless sound is off or reduced motion is on.

#### Scenario: Countdown with reduced motion
- **WHEN** reduced motion is on during the countdown
- **THEN** no tick plays

### Requirement: Background music
Looping background music SHALL play on the landing page, in the lobby and after a match ends, but not during play. It SHALL fade out during the countdown. Its 0–100 volume slider (default 25, stored as `torakka:music-volume`) is separate from the sound switch. At 0 the music SHALL pause. Playback SHALL start after the first user interaction when the browser blocks autoplay.

#### Scenario: Match starts
- **WHEN** a match begins
- **THEN** the background music stops

### Requirement: No browser calls to the generation service
The browser app SHALL play only static audio files it ships. It SHALL never call the sound-generation API or hold its key.

#### Scenario: Production bundle
- **WHEN** the app plays a sound
- **THEN** it loads a file under `/audio/` from the app's own origin
