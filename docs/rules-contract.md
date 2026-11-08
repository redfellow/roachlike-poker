# Rules Contract and Acceptance Scenarios

Status: B0 review draft. Confirmed rules below consolidate the interview. Items explicitly marked **proposed** are unresolved defaults, not approved changes. This is the detailed reference for future automated tests; examples have not yet been executed as tests.

## Identities and Invariants

- A room retains its invite link and match history. A rematch creates a new match in that room.
- A seat owns a hand, exposed display, and turn obligations. A person controls a seat; a connection/device is only a way to control it.
- Same-name recovery preserves person and seat. A voted replacement changes the person while preserving the seat and its obligations. Record the person responsible at the time of each action.
- Migrated to [game-rules spec](../openspec/changes/game-rules-spec-in-packages-game-checked/specs/game-rules/spec.md) (pending archival; not yet in openspec/specs).
- Only the server decides legality, outcomes, and randomness. Each accepted command is applied once and committed before acknowledgment/broadcast.
- Removing seats never changes the defeat threshold, which is fixed at match creation.
- Draft selections and the grouping of a player's own hand into creature stacks stay private.

## Setup

Migrated to [game-rules spec](../openspec/changes/game-rules-spec-in-packages-game-checked/specs/game-rules/spec.md) (pending archival; not yet in openspec/specs).

## Phases and Commands

| Phase | Command and actor | Result |
| --- | --- | --- |
| Lobby | Join/name selection by visitor | Seat if available; spectator otherwise. Duplicate connected names rejected. |
| Lobby | Ready/unready by seated player | All 2–6 players ready starts the countdown. |
| Countdown | Unready, seated join, or disconnect | Cancel countdown and return to lobby. Spectator changes do not cancel. |
| Countdown | Server completes five seconds | Shuffle/deal once; enter initiation with random starter. |
| Initiation, Response, Pass preparation, Resolution | Game commands and resolution | Migrated to [game-rules spec](../openspec/changes/game-rules-spec-in-packages-game-checked/specs/game-rules/spec.md) (pending archival; not yet in openspec/specs). |
| Resolution | Server | Score locked predictions (reveal, penalty transfer, defeat check and next actor are migrated above). |
| Replacement needed | Approved replacement or exact-name recovery | Restore control of preserved seat and phase. |
| Replacement needed | End game by host | End without a loser; persist an interrupted-match recap. |
| Ended | Rematch by host | Fresh lobby with existing players, reset readiness, same link and saved history. |

Card/target/claim drafting happens locally, is editable until Send, and creates no public events. There is no turn timer. The AFK threshold permits a replacement request, not an automatic move or defeat.

Resolution presentation is brief and automatic, followed by “Seuraavana: [name]” unless the match ended. The whole logical result is committed atomically before the broadcast. Clients may animate it, but they must not delay the next phase or create a second state transition.

## Resolution Truth Table

“True” means actual creature equals the latest claim. The penalty recipient starts next unless defeat occurs.

Migrated to [game-rules spec](../openspec/changes/game-rules-spec-in-packages-game-checked/specs/game-rules/spec.md) (pending archival; not yet in openspec/specs).

## Passing and Private Predictions

- Migrated to [game-rules spec](../openspec/changes/game-rules-spec-in-packages-game-checked/specs/game-rules/spec.md) (pending archival; not yet in openspec/specs).
- Persist the peek commitment before delivering the private card identity.
- At final resolution, evaluate each locked prediction against its own claim and the actual creature: +1 correct, 0 wrong. Skips score zero and do not count in accuracy's denominator. No predictions can be added retroactively.
- Cancelled challenges produce no points and do not publish their private predictions. No achievement progress comes from cancellation.

## Reconnection and Replacement

Exact-name recovery of a disconnected seat requires no approval. The recovered name is normalized by trimming surrounding whitespace and Unicode normalization; duplicate display names are rejected if they differ only by case. Preserve the original case in the UI while using the normalized value for comparison.

A spectator may request a seat if disconnected or unanswered for strictly more than 60 seconds after a required-action prompt. Valid owner action or reconnection cancels a pending request. Optional predictions and watching are not required actions.

Approval is by a majority of remaining connected players: the voter set is frozen when the request is created, excluding the affected seat and requester, and requires $\lfloor n/2 \rfloor + 1$ approvals. If the voter set changes, the vote is cancelled and a fresh request is required. With no eligible voters, takeover cannot be approved.

The new person inherits the hand, exposed display, and pending obligation, including a committed peek. Transfer control atomically; old-device commands must fail even if queued before transfer. The new person does not inherit earned prediction points or authorship of previous actions.

A person who has already seen the active card cannot switch into an unseen receiver's seat until the challenge resolves. Seat history still prevents revisiting a seat even if its occupant changes.

## Permanent Removal

Temporary disconnection never redistributes automatically. Host-confirmed removal is a separate action.

1. If removal leaves fewer than three seats, preserve the seat, cards, and phase for a replacement; offer End game. This also applies to a two-player match losing a participant.
2. Otherwise, if the removed seat is the current sender, receiver, or committed passer, cancel the unresolved challenge, reveal and retire its card without penalty, then redistribute the removed hand.
3. If the removed seat is neither sender nor receiver, the removal waits until the current challenge resolves. A committed terminal result takes precedence; removal cannot undo defeat.
4. Shuffle and distribute the removed hand evenly among remaining seats; keep their exposed cards visible but out of play. Remainder recipients are chosen randomly.
5. A removed seat cannot be reclaimed during that match. The removed person may spectate but cannot take another seat until the active challenge ends and knowledge checks pass.

When recovery requires a new initiator, choose randomly while protecting those closest to defeat. Use only public information: largest matching exposed stack first, then smallest hand.

The exact recovery algorithm is: consider only seats with cards; exclude those tied for highest risk unless every candidate ties, then choose among all candidates. If no seat has cards, end without a loser. Preserve an unaffected already-scheduled starter; choose anew after cancellation or removal of that starter. This exception never changes ordinary turn/defeat rules.

## Persistence and History

Save actual card ownership, committed private knowledge, phase, claims, predictions, command receipts, and action authorship. Never reconstruct a dealt game by reshuffling on restart.

Persist recap history separately from the current match view. Do not reveal remaining hands just because a match ended. A saved recap contains only approved public/revealed information and factual achievements; private storage is not a public history payload.

Theme persistence and presentation-only themes: see the [visual-presentation](../openspec/specs/visual-presentation/spec.md) spec (change `spec-visual-presentation-onboarding-and` archived and synced into specs; review, Git integration and acceptance pending).

On restart, mark connections offline, cancel unfinished countdowns and votes, preserve gameplay obligations, redeliver required prompts, and restart their AFK clocks. Replay snapshots without duplicate scores or historical sound effects.

## Worked Acceptance Scenarios

| ID | Given / action | Expected result |
| --- | --- | --- |
| R01–R08, R10–R11 | Game-rule scenarios | Migrated to [game-rules spec](../openspec/changes/game-rules-spec-in-packages-game-checked/specs/game-rules/spec.md) (pending archival; not yet in openspec/specs). |
| R09 | B peeks, refreshes, then tries En usko | Rejection migrated above; refresh restores pass preparation with private card knowledge. |
| R12 | Receiver response arrives twice | One penalty, one score update, one committed result. |
| R13 | Spectator inspects every network payload | Projection migrated above; additionally no payload of any kind carries hands, grouped creature counts, pending predictions, or unrevealed challenge identity. |
| R14 | Original connection sends after device reclaim | Rejected; new connection alone controls the preserved seat. |
| R15 | Receiver remains connected at exactly 60 seconds | Not yet AFK-eligible; eligibility begins strictly after 60 seconds. No automatic move. |
| R16 | AFK player responds before approval completes | Cancel pending replacement; process the legal response once. |
| R17 | Four-player game removes current receiver | Cancel/retire challenge card, redistribute remaining hand among three, conserve 64 cards. |
| R18 | Three-player game attempts to remove one player | Keep that seat and cards intact, request replacement, offer End game; do not convert to two-player rules. |
| R19 | Departed seat had peeked; replacement approved | New person must pass; cannot answer Uskon/En usko. |
| R20 | Candidate X has stack 3/hand 8; Y stack 2/hand 2; Z stack 2/hand 5 | Recovery excludes X; choose between Y and Z. This is not normal next-turn selection. |
| R21 | Candidate X has no hand; Y is sole candidate with cards | Proposed recovery selects Y; it cannot randomly force X's defeat. |
| R22 | Scoring of the migrated R22 scenario | At final resolution D earns two points, one per correct locked claim; nothing revealed early. |
| R23 | Prediction submission scenario | Migrated to [game-rules spec](../openspec/changes/game-rules-spec-in-packages-game-checked/specs/game-rules/spec.md) (pending archival; not yet in openspec/specs). |
| R24 | Person X sends a bluff, then person Y replaces their sender seat before call | Seat bears penalty if challenged correctly; X retains authorship of the bluff. Y does not earn X's award. |
| R25 | Server dies after commit but before broadcast | Retry/snapshot restores committed result once, with original cards and scores. |
| R26 | Start rematch then restart server | Earlier recap remains accessible; new match has independent hands, readiness, and scores. |
| R27 | Two-player survivor reaches four matching cards, survives three challenges, then wins | Eligible for Hautapaikka varattu; three matching cards alone was not its threshold. |
| R28 | No bystander predictions submitted | No accuracy percentage from division by zero; neutral reaction; no Joukkokusetus. |
| R29 | Host selects Herrasmiespokeri before countdown, plays, rematches, and later opens the recap after restart | All clients see the selected presentation; the match and recap retain its versioned theme; the rematch keeps it. |

## Outstanding Product Review

The three most consequential proposed policies are: ending without a loser if recovery has no nonempty hands; cancelling/restarting votes when eligible voters change; and deferring knowledge-conflicting seat takeovers. Other proposed details can be reviewed with their implementation bucket. Normal gameplay is fully specified independently of these departure exceptions.
