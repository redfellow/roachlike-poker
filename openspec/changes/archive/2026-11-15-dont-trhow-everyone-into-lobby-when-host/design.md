# Design

In `apps/server/src/runtime.ts`, the `rematch` branch currently clears the game and resets readiness. Instead it will reuse the same match creation as the countdown timer: `createMatch(randomUUID(), seated members, randomSource, now(), room.theme)`, set `promptAt`, clear `ready`, `countdownAt`, `vote` and `waitingSeatId`, set the deal notice, and call `scheduleComputerTurn(room)` after save/broadcast (the timer's order). The recap of the ended match is already in `room.history`, so history is kept. Extract a small `startMatch(room)` helper used by both the timer and rematch to avoid duplicating the notice/prompt setup.

Newcomers are already spectators while `room.game` is set (sit requires `!game`), so no extra code is needed for them.

The web end panel keeps its button and only the label changes in `strings.fi.ts`. No protocol change: the `rematch` command shape stays the same.

## Return to lobby (amendment)

Add `z.object({ kind: z.literal("lobby") })` to the command union in `packages/protocol/src/index.ts`. In `runtime.ts` add a `lobby` branch with the pre-change rematch body: require an ended game and the host, then `room.game = null`, `room.ready` = seated computers, clear `countdownAt`, `vote`, `waitingSeatId`, and set notice `Uusi peli, samat huonot ystävät. Ilmoittaudu valmiiksi.` Existing sit/stand/leave-table/computer/remove rules then work unchanged because they key on `!game`. In the web end panel (`apps/web/src/main.tsx`), add a secondary button between rematch and end playing that sends `{ kind: "lobby" }`, labelled `FI.table.backToLobby` = `Takaisin aulaan`.
