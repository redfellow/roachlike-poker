# Rules Contract and Acceptance Scenarios

Status: B0 review draft. Confirmed rules below consolidate the interview. Items explicitly marked **proposed** are unresolved defaults, not approved changes. This is the detailed reference for future automated tests; examples have not yet been executed as tests.

## Identities and Invariants

- A room retains its invite link and match history. A rematch creates a new match in that room.
- A seat owns a hand, exposed display, and turn obligations. A person controls a seat; a connection/device is only a way to control it.
- Same-name recovery preserves person and seat. A voted replacement changes the person while preserving the seat and its obligations. Record the person responsible at the time of each action.
- Exactly 64 unique cards always exist across hands, the active challenge, exposed displays, unseen setup removals, and visibly retired cards. Cards cannot occupy two zones.
- Only the server decides legality, outcomes, and randomness. Each accepted command is applied once and committed before acknowledgment/broadcast.
- Defeat threshold is fixed at match creation: five for a two-player match, four otherwise. Removing seats never changes it.
- Receiving a face-down card does not mean seeing it. Record both seats visited and people who actually learned its identity.
- Public data includes total hand counts, exposed cards, current claim, and challenge path. Hands, creature stack counts, draft selections, and unresolved predictions stay private.

## Setup

| Players | Hand sizes | Cards removed unseen | Defeat threshold |
| --- | --- | --- | --- |
| 2 | 27, 27 | 10 | 5 |
| 3 | 22, 21, 21 | 0 | 4 |
| 4 | 16, 16, 16, 16 | 0 | 4 |
| 5 | 13, 13, 13, 13, 12 | 0 | 4 |
| 6 | 11, 11, 11, 11, 10, 10 | 0 | 4 |

Choose the starting player randomly. **Proposed:** randomize dealing order independently to distribute extra-card positions fairly over multiple games.

## Phases and Commands

| Phase | Command and actor | Result |
| --- | --- | --- |
| Lobby | Join/name selection by visitor | Seat if available; spectator otherwise. Duplicate connected names rejected. |
| Lobby | Ready/unready by seated player | All 2–6 players ready starts the countdown. |
| Countdown | Unready, seated join, or disconnect | Cancel countdown and return to lobby. Spectator changes do not cancel. |
| Countdown | Server completes five seconds | Shuffle/deal once; enter initiation with random starter. |
| Initiation | Send by starter: owned card, other seat, legal claim | Move card out of hand into challenge; record sender and target; enter response. |
| Response | Uskon / En usko by receiver | Lock predictions and resolve against latest sender. |
| Response | Peek-and-pass by receiver with an eligible target | Lock predictions; commit to passing, reveal privately, enter pass preparation. |
| Pass preparation | Send by that receiver: eligible target and claim | Same card moves to a new recipient; record latest sender and claim; enter response. |
| Resolution | Server | Reveal, transfer one penalty card, score locked predictions, check defeat, and select next actor. |
| Replacement needed | Approved replacement or exact-name recovery | Restore control of preserved seat and phase. |
| Replacement needed | End game by host | End without a loser; persist an interrupted-match recap. |
| Ended | Rematch by host | Fresh lobby with existing players, reset readiness, same link and saved history. |

Card/target/claim drafting happens locally, is editable until Send, and creates no public events. There is no turn timer. The AFK threshold permits a replacement request, not an automatic move or defeat.

Resolution presentation is brief and automatic, followed by “Seuraavana: [name]” unless the match ended. **Proposed implementation:** commit the whole logical result atomically; clients animate that result and must not make the next phase wait for every browser to acknowledge animation completion.

## Resolution Truth Table

“True” means actual creature equals the latest claim. The penalty recipient starts next unless defeat occurs.

| Claim | Receiver action | Penalty recipient |
| --- | --- | --- |
| True | Uskon | Latest sender |
| True | En usko | Receiver |
| False | Uskon | Receiver |
| False | En usko | Latest sender |

After adding the penalty, matching-card defeat is immediate. Otherwise, an empty-handed penalty recipient loses because they must initiate next. Merely playing the last hand card does not cause defeat.

## Passing and Private Predictions

- The original card owner cannot receive it again. Each pass targets another seat that has not received/seen this challenge card; the final eligible receiver must answer. Two-player matches cannot pass.
- Peeking permanently removes the believe/disbelieve choice for that receiver. Persist this commitment before delivering the private card identity.
- A seated person who has not seen the card and is not the receiver may predict the current claim. Spectators cannot predict.
- Lock that claim's predictions when the receiver answers or commits to peeking. A later pass opens a new claim prediction opportunity for eligible people.
- **Proposed:** a person may revise their prediction before locking. A prediction includes match, challenge, claim, and person IDs so stale submissions cannot attach to a new claim.
- At final resolution, evaluate each locked prediction against its own claim and the actual creature: +1 correct, 0 wrong. Skips score zero and do not count in accuracy's denominator. No predictions can be added retroactively.
- Cancelled challenges produce no points. **Proposed:** do not publish their private predictions. No achievement progress comes from cancellation.

## Reconnection and Replacement

Exact-name recovery of a disconnected seat requires no approval. Notify the table and revoke the previous connection's control. **Proposed:** trim whitespace and normalize Unicode; reject case-only duplicate names but require matching case for name-based recovery.

A spectator may request a seat if disconnected or unanswered for strictly more than 60 seconds after a required-action prompt. Valid owner action or reconnection cancels a pending request. Optional predictions and watching are not required actions.

Approval is by a majority of remaining connected players. **Proposed:** freeze the eligible seated voter set excluding affected seat and requester; require floor(n / 2) + 1 approvals. Cancel and allow a fresh request if this voter set changes. With no voters, takeover cannot be approved.

The new person inherits the hand, exposed display, and pending obligation, including a committed peek. Transfer control atomically; old-device commands must fail even if queued before transfer. The new person does not inherit earned prediction points or authorship of previous actions.

**Proposed knowledge protection:** a person who has already seen the active card cannot switch into an unseen receiver's seat until the challenge resolves. Seat history still prevents revisiting a seat even if its occupant changes.

## Permanent Removal

Temporary disconnection never redistributes automatically. Host-confirmed removal is a separate action.

1. If removal leaves fewer than three seats, preserve the seat, cards, and phase for a replacement; offer End game. This also applies to a two-player match losing a participant.
2. Otherwise, if the removed seat is the current sender, receiver, or committed passer, cancel the unresolved challenge, reveal and retire its card without penalty, then redistribute the removed hand.
3. If a challenge can finish without that seat acting, **proposed:** queue removal until resolution. A committed terminal result takes precedence; removal cannot undo defeat.
4. Shuffle and distribute the removed hand evenly among remaining seats; keep their exposed cards visible but out of play. **Proposed:** choose remainder recipients randomly.
5. A removed seat cannot be reclaimed during that match. **Proposed:** the removed person may spectate but cannot take another seat until the active challenge ends and knowledge checks pass.

When recovery requires a new initiator, choose randomly while protecting those closest to defeat. Use only public information: largest matching exposed stack first, then smallest hand.

**Proposed exact algorithm:** consider only seats with cards; exclude those tied for highest risk unless every candidate ties, then choose from all candidates. If no seat has cards, end without a loser. Preserve an unaffected already-scheduled starter; choose anew after cancellation or removal of that starter. This exception never changes ordinary turn/defeat rules.

## Persistence and History

Save actual card ownership, committed private knowledge, phase, claims, predictions, command receipts, and action authorship. Never reconstruct a dealt game by reshuffling on restart.

Persist recap history separately from the current match view. Do not reveal remaining hands just because a match ended. A saved recap contains only approved public/revealed information and factual achievements; private storage is not a public history payload.

**Proposed restart defaults:** mark connections offline; cancel unfinished countdowns and votes; preserve gameplay obligations. Redeliver required prompts after reconnect and restart their AFK clocks. Replay snapshots without duplicate scores or historical sound effects.

## Worked Acceptance Scenarios

| ID | Given / action | Expected result |
| --- | --- | --- |
| R01 | Three players start | 22/21/21 hands, 64 total cards, no reserve. |
| R02 | Two players; one takes a fourth matching card | Match continues unless empty-hand initiation causes defeat; fifth matching card ends it. |
| R03 | A sends a bat claiming spider; B says Uskon | B takes bat; B starts next if able. |
| R04 | A sends a bat claiming bat; B says Uskon | A takes bat; A starts next if able. |
| R05 | A sends a bat claiming bat; B says En usko | B takes bat. |
| R06 | A sends a bat claiming spider; B says En usko | A takes bat. |
| R07 | A → B; B peeks then sends bat to C claiming rat; C says En usko | B takes bat, not A. |
| R08 | In R07, C is the last unseen player | No peek/pass action available. Receiving alone has not revealed bat to C. |
| R09 | B peeks, refreshes, then tries En usko | Rejected; B restores pass preparation with private card knowledge. |
| R10 | A sends their last card; B incorrectly believes its false claim | B takes it; A remains in the match with zero hand cards. |
| R11 | A sends their last card; B correctly challenges | A takes it and loses when required to initiate, even without a matching set. |
| R12 | Receiver response arrives twice | One penalty, one score update, one committed result. |
| R13 | Spectator inspects every network payload | No hands, grouped creature counts, pending predictions, or unrevealed challenge identity. |
| R14 | Original connection sends after device reclaim | Rejected; new connection alone controls the preserved seat. |
| R15 | Receiver remains connected at exactly 60 seconds | Not yet AFK-eligible; eligibility begins strictly after 60 seconds. No automatic move. |
| R16 | AFK player responds before approval completes | Cancel pending replacement; process the legal response once. |
| R17 | Four-player game removes current receiver | Cancel/retire challenge card, redistribute remaining hand among three, conserve 64 cards. |
| R18 | Three-player game attempts to remove one player | Keep that seat and cards intact, request replacement, offer End game; do not convert to two-player rules. |
| R19 | Departed seat had peeked; replacement approved | New person must pass; cannot answer Uskon/En usko. |
| R20 | Candidate X has stack 3/hand 8; Y stack 2/hand 2; Z stack 2/hand 5 | Recovery excludes X; choose between Y and Z. This is not normal next-turn selection. |
| R21 | Candidate X has no hand; Y is sole candidate with cards | Proposed recovery selects Y; it cannot randomly force X's defeat. |
| R22 | A claims rat on a bat; D predicts false; B passes claiming bat; D predicts true | At final resolution D earns two points, one per correct locked claim; nothing revealed early. |
| R23 | Predictor later becomes receiver of the same card | Earlier locked prediction remains; no prediction on the claim where they are receiver. |
| R24 | Person X sends a bluff, then person Y replaces their sender seat before call | Seat bears penalty if challenged correctly; X retains authorship of the bluff. Y does not earn X's award. |
| R25 | Server dies after commit but before broadcast | Retry/snapshot restores committed result once, with original cards and scores. |
| R26 | Start rematch then restart server | Earlier recap remains accessible; new match has independent hands, readiness, and scores. |
| R27 | Two-player survivor reaches four matching cards, survives three challenges, then wins | Eligible for Hautapaikka varattu; three matching cards alone was not its threshold. |
| R28 | No bystander predictions submitted | No accuracy percentage from division by zero; neutral reaction; no Joukkokusetus. |

## Outstanding Product Review

The three most consequential proposed policies are: ending without a loser if recovery has no nonempty hands; cancelling/restarting votes when eligible voters change; and deferring knowledge-conflicting seat takeovers. Other proposed details can be reviewed with their implementation bucket. Normal gameplay is fully specified independently of these departure exceptions.
