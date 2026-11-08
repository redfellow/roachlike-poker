# Rules Contract and Acceptance Scenarios

Status: B0 review draft. Confirmed rules below consolidate the interview. Items explicitly marked **proposed** are unresolved defaults, not approved changes. This is the detailed reference for future automated tests; examples have not yet been executed as tests.

## Identities and Invariants

> Overlap: superseded in part by the pending change [spec-rooms-identity-spectators-reconnect](../openspec/changes/spec-rooms-identity-spectators-reconnect/proposal.md); retirement is a follow-up listed in the migration index.

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

> Overlap: superseded in part by the pending change [spec-rooms-identity-spectators-reconnect](../openspec/changes/spec-rooms-identity-spectators-reconnect/proposal.md); retirement is a follow-up listed in the migration index.

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

Requirements moved to OpenSpec (pending change `spec-rooms-identity-spectators-reconnect`): [player identity and recovery](../openspec/changes/spec-rooms-identity-spectators-reconnect/specs/player-identity/spec.md) and [spectator seat replacement](../openspec/changes/spec-rooms-identity-spectators-reconnect/specs/seat-replacement/spec.md).

## Permanent Removal

Requirements, including recovery-initiator selection, moved to OpenSpec (pending change `spec-rooms-identity-spectators-reconnect`): [departures](../openspec/changes/spec-rooms-identity-spectators-reconnect/specs/departures/spec.md).

## Persistence and History

Saved state, recap history and restart behavior moved to OpenSpec (pending change `spec-rooms-identity-spectators-reconnect`): [persistence](../openspec/changes/spec-rooms-identity-spectators-reconnect/specs/persistence/spec.md).

Persist the host-selected theme as an ID and version on the room, active match, and recap. Theme packs change presentation only: all card IDs, quantities, defeat thresholds, legal actions, scoring, and achievement conditions remain identical. If a stored theme is unavailable, clients render the default Örkkipokka theme without changing game state.

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
