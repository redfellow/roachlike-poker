# onboarding Specification

## Purpose
TBD - created by archiving change spec-visual-presentation-onboarding-and. Update Purpose after archive.

## Requirements

### Requirement: Rules view
The landing page and the room SHALL offer a modal with concise Finnish rules. Its wording SHALL follow the current theme. The room's rules modal SHALL also offer the reduced-motion setting.

#### Scenario: Open rules in a room
- **WHEN** a person opens the rules from the room menu
- **THEN** the rules modal is shown in the theme's wording

### Requirement: Guided first-turn hints
The lobby SHALL offer the checkbox `Opasta ensimmäisellä vuorollani`, default on and stored per device (`torakka:guided`). When it is on and the person must act, a local hint modal SHALL be shown: a start hint when initiating, and a response hint when responding or passing. Each hint SHALL stay until dismissed. Dismissals SHALL be remembered per device (`torakka:tutorials:v1`). Hints SHALL NOT pause other people or send anything to the server.

#### Scenario: Response hint dismissed
- **WHEN** a guided receiver dismisses the response hint
- **THEN** the response controls are usable and the hint does not return on that device

#### Scenario: Guide off
- **WHEN** the checkbox is off
- **THEN** no hint is shown
