# Spec rooms, identity, spectators, reconnection and departures

## Why

Room, identity, spectator, recovery, departure and persistence behavior exists only in provisional documents (`docs/rules-contract.md`, `docs/project-plan.md`). This is part 2 of 5 of the retrospective OpenSpec migration. It records what the server does now, using `apps/server/src/runtime.ts`, `apps/server/src/store.ts`, `packages/protocol/src/index.ts`, `packages/game/src/index.ts` (`removeSeat`, `replacePerson`, `endMatch`, `projectMatch`, `recap`) and their tests as evidence.

## What Changes

- New capability specs: `rooms`, `player-identity`, `seat-replacement`, `departures`, `persistence`.
- Retire the migrated sections and replace each with a short link to its spec:
  - `docs/rules-contract.md`: "Reconnection and Replacement", "Permanent Removal", the "Persistence and History" paragraphs on saved state, recaps and restart. The theme paragraph stays for part 5.
  - `docs/project-plan.md`: "Rooms, Identity, and Spectators" (theme and onboarding bullets are not in it), "Approved Departure House Rule" (the accepted-tradeoff rationale and the open items stay), and the two "Hosting and Reliability" bullets on surviving restarts and keeping saved games and recaps. Deployment, stack and media bullets stay.
- Update the migration index rows for these two documents. Coverage is Partial and links the pending change.
- No code changes.

### Where the direction changed the idea

The origin asked to check the docs against the code. The Steward's direction says the code's behavior wins: the spec records the code, and each mismatch is listed below. It also adds retiring the doc sections and updating the index to this change.

## Discrepancies (the spec follows the code)

1. **Host transfer.** project-plan "Rooms, Identity, and Spectators": "Host controls transfer automatically to another connected player when the host leaves." Code: the host moves only when the host uses leave-table in the lobby (to the next member, who may be offline), or on join when there is no host or the host is a computer. A host who disconnects keeps the host role.
2. **Removal of a bystander seat.** rules-contract "Permanent Removal" §3: "the removal waits until the current challenge resolves." Code: `removeSeat` rejects the removal ("Odota nykyisen kortin ratkaisua ennen poistamista."). Nothing is queued.
3. **Who may be removed.** Docs: a host-confirmed removal of a greyed-out chair. Code: only seats whose person is offline. Computer seats count as online, so they cannot be removed.
4. **Fewer than three seats.** Code: when 3 or fewer seats remain, removal sets `waitingSeatId` and the notice. While it is set, all game commands are blocked until a replacement arrives, the owner reconnects, or the host ends the match. The docs do not mention the block.
5. **Restart and the AFK clock.** rules-contract "Persistence and History": "redeliver required prompts, and restart their AFK clocks." Code: on restart `promptAt` becomes null, and readiness, countdown and votes are cleared. The AFK clock restarts only when the prompt changes or the required seat's person rejoins, so an AFK request is impossible until then.
6. **Rooms are deleted.** rules-contract "Identities and Invariants": "A room retains its invite link and match history." project-plan "Hosting and Reliability": "Preserve saved games and recap history." Code deletes a room:
   - after 30 minutes of inactivity, even with a game or history;
   - when the last online person disconnects from a lobby that has no game and no history;
   - when the last member leaves, or the host closes the lobby;
   - on startup, when it has no members, or no game, no history and no computers.
7. **Old UUID links.** project-plan: "existing UUID links remain valid." Code: room IDs are opaque strings. New rooms get three-word codes, and any stored ID still resolves. No separate UUID path exists.
8. **Name uniqueness.** project-plan: unique "among connected players". Code: a name matching any member, online or offline, is never created twice. Matching an offline member reclaims that member. Matching an online member is rejected.
9. **Removed person.** rules-contract §5: the removed person "may spectate". Code: an exact-name join of a removed seat's person is rejected ("Tämä paikka on poistettu pelistä."). A device that still holds the session token rejoins as a non-seated member and can watch.
10. **Vote cancellation triggers.** Code also cancels a pending vote when any frozen voter or the requester disconnects, when a frozen voter reconnects, and when the match ends.

## Assumptions

- Theme persistence (rules-contract "Persistence and History", theme paragraph) stays for part 5 (visual presentation). The alternative was to specify it here.
- Recovery-initiator selection is specified under `departures`, not in part 1's game rules. Part 1 has no such section.
- Lobby ready/countdown and the 2–6 player limit are included under `rooms` because they live in the same project-plan section. The alternative was to leave them to part 1.
- Computer seats appear only where they change room rules (always online, auto-ready). Their play stays for part 3.
