## Why
Reijo: most players' icons look the same, and on every new game they all look different but again mostly the same. Icons come from a hash of the name (6 shapes × hue), so collisions are common and nothing keeps them stable.

## What Changes
- The server assigns each room member an icon (shape + colour slot) when they join the room, choosing a combination not already used by another member of that room.
- The assignment is stored with the member and kept for the life of the room, so rematches and new games in the same room keep each player's icon.
- `MemberView` carries the icon; the web `Avatar` renders from it instead of hashing the name (lobby, spectators, table seats).
- New requirement "Distinct, stable player icons" in `visual-presentation`.

## Outcome
- Lobby with several players
  - Now: several players share the same shape and similar colour
  - After: every player has a different shape/colour combination
- Starting a new game in the same room
  - Now: icons change
  - After: each player keeps their icon

## Assumptions
- Icons are stable within a room (also across reconnects); a new room may assign different icons. Ruled out: a per-person icon kept across rooms.
- Colours come from a fixed palette of clearly different hues instead of the continuous hash hue. Ruled out: keeping hash hues.
- Shapes are filled first (each new member gets an unused shape, then an unused colour) so the first six players differ by shape. Ruled out: random picks.
- The Herrasmiespokeri hat stays theme-driven.

## Discrepancies
- `docs/project-plan.md` (Goals, "No accounts required" bullet) says the same name generates the same avatar. This change replaces that with room-assigned icons; the bullet is not retired here and needs a follow-up once this requirement is reviewed.
