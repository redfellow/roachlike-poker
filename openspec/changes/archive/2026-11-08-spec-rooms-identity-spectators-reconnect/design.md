# Design

## Approach

- One change with five capability specs, split by concern: rooms/lobby, identity/recovery, spectator seat replacement, permanent removal, and persistence. Each spec stays reviewable on its own.
- Requirements state what `runtime.ts`, `store.ts`, the protocol schemas and the game `removeSeat`/`replacePerson`/`projectMatch` functions do. Each scenario mirrors an existing test where one exists: `runtime.test.ts`, `store.test.ts` and `packages/game/src/game.test.ts`.
- Documents: each migrated section's requirement text is replaced by a one-line link to its spec. Rationale (the accepted redistribution tradeoff), open items ("Still unresolved…", "Outstanding Product Review"), worked scenarios and non-migrated bullets stay. The R-scenario table stays because it spans domains.
- Index: the two document rows get Partial coverage. They name the exact retired sections and link this pending change. Other domains' rows are not edited.

## Why

The direction requires specifying the code's behavior now and listing doc conflicts, without changing code. A single change keeps the cross-references (vote ↔ removal ↔ waiting seat) consistent.
