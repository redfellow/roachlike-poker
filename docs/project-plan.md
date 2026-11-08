# Torakkapokeri Project Plan

Status: core discovery recorded; stack accepted; remaining operational defaults proposed for review. Implementation is in progress; see [mvp-status.md](mvp-status.md). Detailed tasks and acceptance gates: [implementation-backlog.md](implementation-backlog.md).

## Confirmed Product Decisions

- Computer players are required for MVP solo testing and refinement. Behavior interview: [computer-players.md](computer-players.md).
- Start with a faithful adaptation of base Cockroach Poker; consider online-specific rule changes later.
- Initial audience: friends, using individual computers, phones, or tablets with browsers, cameras, and microphones.
- Support 2–6 players.
- Preserve bluffing, reading faces, targeting friends, tactical choices, and banter.
- First milestone: a complete playable game using external video chat. Built-in video follows gameplay acceptance.
- Support desktop and mobile. All initial interface text and cards are Finnish; English comes later. Use Uskon / En usko for responses.
- Claims, target selection, and believe/bluff responses are explicit game actions. Use swift, polished animations and potentially effects.
- Leave room for players to observe reactions and talk before committing their response.
- No accounts required. Players enter a name and receive a generated avatar associated with it. The same name generates the same avatar.
- Later, live video will probably replace avatars.

Detailed rules and acceptance scenarios: [rules-contract.md](rules-contract.md). Its proposed defaults are distinct from confirmed decisions below.

## Confirmed Rules and Turn Experience

- Migrated to [game-rules spec](../openspec/changes/game-rules-spec-in-packages-game-checked/specs/game-rules/spec.md) (pending archival; not yet in openspec/specs).
- Prepare privately: card → target → claim → Send. Selections remain editable until Send.
- No turn timers or mandatory response delays.
- Publicly show hand counts, exposed creatures, and the current challenge’s path and claims.
- Brief automatic resolution animation and outcome sound, followed by a Finnish next-player announcement. Use a positive sound for personal success, a negative sound for taking the card, and a neutral sound for uninvolved players.
- Show locked predictions after resolution with automatic emoji reactions based on aggregate prediction performance. These replace the proposed manual reaction buttons; exact emoji mapping remains open.

> Overlap: the bullets below on saving recap history, rematch lobby and disconnected chairs are superseded in part by the pending change [spec-rooms-identity-spectators-reconnect](../openspec/changes/spec-rooms-identity-spectators-reconnect/proposal.md); retirement is a follow-up in the migration index. Room deletion contradicts "retains history" (proposal item 6).

- Spotlight the loser and show a game recap and highlights. Save recap history across rematches and server restarts. Define measurable highlights without inferring belief from passing.
- Rematch creates a fresh lobby populated by existing players; new players can join.
- Grey out disconnected chairs. Host-confirmed removal and redistribution is an approved first-version house rule, subject to the constraints below.
- Optional private predictions are approved, with separate prediction scores and match achievements. They do not alter game victory/defeat. See prediction rules below.

## Rooms, Identity, and Spectators

Requirements moved to OpenSpec (pending change `spec-rooms-identity-spectators-reconnect`): [rooms](../openspec/changes/spec-rooms-identity-spectators-reconnect/specs/rooms/spec.md), [player identity](../openspec/changes/spec-rooms-identity-spectators-reconnect/specs/player-identity/spec.md) and [seat replacement](../openspec/changes/spec-rooms-identity-spectators-reconnect/specs/seat-replacement/spec.md).

## Approved Departure House Rule

Requirements moved to OpenSpec (pending change `spec-rooms-identity-spectators-reconnect`): [departures](../openspec/changes/spec-rooms-identity-spectators-reconnect/specs/departures/spec.md).

- Redistribution changes hand depletion risks, and the removed player knows their former hand. This tradeoff is accepted for the first playable version.
- Still unresolved: remainder-card assignment, removal/replacement transaction timing, and unavailable earlier participants in an otherwise playable challenge.

## Predictions and Match Achievements

- Only seated players who have not seen the challenge card may predict, excluding the current receiver. Spectators cannot predict under the agreed rule.
- Each prediction concerns the current claim. Keep it private until the card is resolved.
- Lock predictions when the receiver acts. A pass opens a new prediction opportunity for eligible players on the new claim.
- Reveal the locked predictions together after final resolution. Cancelled challenges earn no prediction points.
- Track a separate best-reader score and recap highlights. Award +1 for a correct prediction, 0 for an incorrect or skipped prediction. Show accuracy and participation alongside points.
- Keep the achievements in [achievement-ideas.md](achievement-ideas.md). Their current crude/dark humor is the upper limit: do not make the copy dirtier. Precise event semantics still need implementation fixtures.
- Achievement ties may be shared (proposal). Never infer belief from passing or abstention. Attribute successful bluffs to the actual claimant, not earlier senders.

## Visual Design and Onboarding

- Playful, darkish, somewhat gross adult aesthetic; not childish or anime.
- Restrained animation and retro game sound/feel, with Mario, Sonic, and Commodore 64 as tonal references, not asset sources.
- Support fully playable portrait mobile: own hand below, central claim, compact opponent panels with public exposed-card counts, emphasis on sender and receiver.
- Group the local hand into creature stacks. Group identities, counts, order, and selection are private; opponents see only the total hand count. Do not send private grouping details to other clients.
- Provide mute and reduced-motion options.
- Include concise Finnish rules and contextual action explanations.
- Include a guided-first-turn checkbox in the lobby, default on, remembered per device. Guidance must be local and must not reveal hidden choices to other players. Show dismissible local hints during the first actual turn, without a separate practice game or pausing other players.
- Treat visual themes as an MVP game setting. The host chooses a visual tile in the lobby before countdown; everyone sees changes immediately and the selection persists through the game and rematches. A theme can replace card art and names, card backs, table colors, theme-specific wording, and achievement titles/flavor while keeping mechanics, sounds, and factual achievement conditions shared. Store theme ID and version in recap history and fall back to Örkkipokka when an old theme is unavailable.
- Ship Örkkipokka as the default and Herrasmiespokeri as the second MVP theme. Herrasmiespokeri uses maroon/brick red, black, fiery orange, brass/gold, worn parchment, top hats on avatars, and the fixed eight-card mapping Härvääjä, Kiltti, Tilasto, Murre, Lurkki, Viilaaja, Nippeli, and Pamppu.

## Provisional Work Buckets

Each bucket requires explicit scope, dependencies, acceptance criteria, and verification before implementation.

| Bucket | Deliverable | Review and verification gate |
| --- | --- | --- |
| 1. Rules contract | Final setup, turn states, visibility, and defeat rules | Worked scenarios, including two-player play and pass chains |
| 2. Project foundation | Agreed stack, scripts, and development setup | Reproducible setup and configured checks; builds only when requested |
| 3. Game engine | Rules implemented independently of UI | Deterministic tests for legal/illegal actions, resolution, and end conditions |
| 4. Browser table | Hands, targets, claims, responses, reveal, and penalties | Scripted games in desktop Chrome at desktop/mobile viewport sizes; inspect animations and hidden information |
| 5. Multiplayer rooms | Private links, optional open-room discovery, deterministic avatars, unique names, ready countdown, public spectators, and synchronized gameplay | Complete games across browsers; verify visibility, countdown cancellation, and late joins |
| 6. Recovery and departures | Seat reclaim, voted replacements, host transfer, confirmed removal, and redistribution | Test device swaps, stale connections, card conservation, blocked challenges, and minimum player counts |
| 7. Predictions, results, and rematches | Private predictions, post-resolution reveal, loser spotlight, factual highlights, and fresh lobby | Verify prediction privacy and locking, recap evidence, retained players, and new joins |
| 8. Gameplay acceptance | Complete playable game using external calls | Friend-group playtest; resolve gameplay and usability blockers |
| 9. Integrated audio/video | Media alongside the accepted game | Multi-device calls, permissions, reconnects, and reaction visibility |

## Hosting and Reliability

- Support a portable single-host deployment behind a TLS reverse proxy. Keep host addresses, access details, and credentials outside the public repository.
- Publishing a release and switching a running host are separate operations. Keep a compatible rollback path across updates. Saved games and recaps: see [persistence](../openspec/changes/spec-rooms-identity-spectators-reconnect/specs/persistence/spec.md).
- MVP verification uses desktop Chrome at desktop and mobile viewport dimensions. Separate iPhone or physical-phone testing is not required for MVP. Responsive phone/tablet layouts remain in scope; viewport checks do not establish real-device compatibility.
- Restart survival: see [persistence](../openspec/changes/spec-rooms-identity-spectators-reconnect/specs/persistence/spec.md) (pending change `spec-rooms-identity-spectators-reconnect`).
- Accepted stack: React/Vite, TypeScript, Node.js/Fastify/Socket.IO, SQLite, Vitest/Playwright, and ESLint Stylistic. Details: [technical-plan.md](technical-plan.md).
- Future integrated media: keep all faces visible and emphasize sender/receiver. Players may temporarily mute their microphone or disable their camera, but doing so pauses the game. Resume policy and unexpected media-loss behavior will be settled in the media phase. Voice activation may be explored later. External-call MVP has no media-based pause enforcement.

## Remaining Decisions

- Public-environment verification, backup destination, and operational retention policy. Saved recap history is required; do not discard it on rematch.
- Deferred to media phase: pause/resume details, unexpected device/network failures, and voice activation.
- Remaining edge-case defaults are explicitly proposed in the implementation backlog; do not silently treat them as confirmed product rules.
