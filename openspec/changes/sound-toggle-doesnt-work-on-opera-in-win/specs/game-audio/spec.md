## MODIFIED Requirements

### Requirement: Sound toggle
The topbar SHALL offer an `Äänet` volume slider from 0 to 100 on the landing page, in the lobby, during play and after a match, stored per device (`torakka:sound-volume`) and default 100. It SHALL scale every event sound, click sound and countdown tick. At 0, no event sound, click sound or countdown tick SHALL play. There SHALL be no separate on/off switch.

#### Scenario: Muted device
- **WHEN** the slider is at 0 and a card resolves
- **THEN** no sound plays on that device

#### Scenario: Volume during play
- **WHEN** a match is in progress
- **THEN** the slider is shown and changing it changes the volume of the next sound

### Requirement: Countdown ticks
During the lobby countdown, a tick SHALL play once per second, unless the sound volume is 0 or reduced motion is on.

#### Scenario: Countdown with reduced motion
- **WHEN** reduced motion is on during the countdown
- **THEN** no tick plays

## REMOVED Requirements

### Requirement: Background music
**Reason**: Music is removed by Reijo's direction; the slider now controls game sounds.
**Migration**: Stored `torakka:music-volume` and `torakka:music-muted` are ignored and cleared.
