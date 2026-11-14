# Reliable leave-board action that works every time

Route: No spec change. Reason: `openspec/specs/rooms/spec.md` (line 37) already requires that a person can leave the table in the lobby. This change fixes code that does not meet that requirement.

## Why
Reijo reports that he has to press "Poistu pöydästä" several times before it works. In `apps/server/src/runtime.ts`, the `command` handler rejects any command whose `revision` is out of date. Only `close-lobby` is exempt. Lobby revisions change often: people join, get ready, go offline, or a countdown starts. So a leave pressed against a slightly old view fails with "Tilanne muuttui…", and the user has to press it again. Even when the leave succeeds, the leaver gets no further `state`. Their socket stays open and the screen stays on the lobby, so it looks as if nothing happened. That invites more presses.

## What Changes
- Server: exempt `leave-table` from the revision check, as `close-lobby` already is. A leave does not depend on what the view showed.
- Server: after a successful leave, emit `lobby-closed` to the leaver's socket, disconnect it and remove it from `connections`. This is the same path the host's removal of a member uses (`runtime.ts` line 104).
- Web: the client already handles `lobby-closed` by going to the front page (`main.tsx` line 354), so no new client code is needed.

## Outcome
- After leaving the lobby
  - Now: The lobby screen stays visible and the user may press again.
  - After: The user lands on the front page.
- Leaving while the lobby changes
  - Now: `Tilanne muuttui. Tarkista valinta ja yritä uudelleen.`
  - After: The leave succeeds on the first press.

## Acceptance
- A leave sent with an old revision succeeds.
- The leaver receives `lobby-closed` and is disconnected, and the remaining members see the updated lobby.

## Citations
- openspec/specs/rooms/spec.md:37
- apps/server/src/runtime.ts:104, 206-216, 378-388
- apps/web/src/main.tsx:354, 406

## Assumptions
- Leaving a running game stays out of scope. The button exists only in the lobby, and the user's report ("had to hit it multiple times") points at the lobby. Ruled out: adding a mid-game leave.
- The existing `lobby-closed` event is reused instead of adding a new `left` event, because both lead to the same result for the client.
