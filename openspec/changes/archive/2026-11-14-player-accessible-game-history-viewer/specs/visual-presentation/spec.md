## ADDED Requirements

### Requirement: Discoverable match history
When the room has at least one match recap, the topbar SHALL show a visible History button with the recap count. The button SHALL open the history view and SHALL NOT be nested in the overflow menu. When the room has no recaps, the button SHALL NOT be shown.

#### Scenario: History after a finished match
- **WHEN** a match in the room has ended
- **THEN** a History button with count 1 is visible in the topbar without opening another menu

#### Scenario: No history yet
- **WHEN** no match in the room has ended
- **THEN** no History button is shown
