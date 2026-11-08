# Retrospective OpenSpec specifications for existing project features
## Why it splits
Reijo chose to split the work by domain. Each domain has its own source documents and code: the game rules live in `packages/game`; rooms, identity and spectators live in `apps/server`/`packages/protocol`; computer players, achievements, and presentation/audio each have their own code too. Each spec can be written and checked against its own code and tests, so the domains can be built in parallel. They all share `openspec/migration-index.md`, so a later child adds its rows next to the earlier ones, and none rewrites another child's rows.
## Shared constraints
- Each child is one new OpenSpec change under `openspec/changes/`, with a proposal, design, tasks and spec deltas for its capabilities. Nothing reaches `openspec/specs/` without review.
- Spec what the code does now. Use the implementation and its tests as evidence of the requirement. Wherever the docs disagree with the code, write the code's behavior into the spec and list the mismatch under "Discrepancies" in the proposal, quoting the doc section.
- Retire the migrated sections in the same change. Replace each migrated requirement section in `docs/` with a short link to its new spec. Keep rationale, open decisions, maintained guides and dated evidence. Repair incoming links.
- Update `openspec/migration-index.md`. Mark coverage Partial or Migrated for the exact sections, and link the replacement specs. Edit only your own domain's rows.
- No code changes. Proof is `npx openspec validate --strict` on the change plus `grep` checks that the retired sections were replaced.
## Children
### 1. Spec the game rules from the rules contract
Specify the game rules in `packages/game`: the identities and invariants, card conservation, setup, phases and commands, the resolution truth table, passing and private predictions, and the worked acceptance scenarios. Use docs/rules-contract.md and the "Confirmed Rules and Turn Experience" section of docs/project-plan.md as sources, and check them against packages/game and its tests. Retire those sections and keep "Outstanding Product Review".
Blocked by: none
### 2. Spec rooms, identity, spectators, reconnection and departures
Specify room creation and joining, player identity, spectators, reconnection and replacement, permanent removal, the approved departure house rule, and persistence/history. Use docs/rules-contract.md (the sections on reconnection, removal and persistence) and docs/project-plan.md (Rooms, Identity, and Spectators; Approved Departure House Rule; Hosting and Reliability guarantees) as sources. Check them against apps/server, packages/protocol and their tests, including the hidden-information boundaries.
Blocked by: 1
### 3. Spec the computer players
Specify the computer-player behavior as implemented. Use docs/computer-players.md as the source, check it against the server/game code and tests, and keep the proposed future slices as planning context.
Blocked by: 1
### 4. Spec match achievements and predictions scoring
Specify the achievements as implemented: their conditions, attribution and copy. Use docs/achievement-ideas.md and the "Predictions and Match Achievements" section of docs/project-plan.md as sources. Keep unimplemented ideas, and leave their status unresolved.
Blocked by: 1
### 5. Spec visual presentation, onboarding and audio behavior
Specify the user-visible presentation, onboarding and sound behavior in apps/web. Use "Visual Design and Onboarding" in docs/project-plan.md, the digital presentation decisions in docs/initial-info.md and the product requirements in docs/elevenlabs-sound-effects.md as sources. Keep the tooling guides as maintained references.
Blocked by: 1
