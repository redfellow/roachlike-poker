# Design

In `apps/server/src/runtime.ts`, the `rematch` branch currently clears the game and resets readiness. Instead it will reuse the same match creation as the countdown timer: `createMatch(randomUUID(), seated members, randomSource, now(), room.theme)`, set `promptAt`, clear `ready`, `countdownAt`, `vote` and `waitingSeatId`, set the deal notice, and call `scheduleComputerTurn(room)` after save/broadcast (the timer's order). The recap of the ended match is already in `room.history`, so history is kept. Extract a small `startMatch(room)` helper used by both the timer and rematch to avoid duplicating the notice/prompt setup.

Newcomers are already spectators while `room.game` is set (sit requires `!game`), so no extra code is needed for them.

The web end panel keeps its button and only the label changes in `strings.fi.ts`. No protocol change: the `rematch` command shape stays the same.
