## Context

This is a documentation-only retrospective spec. Evidence comes from `packages/game/src/index.ts` (`createMatch`, `applyAction`, `eligibleTargets`, `startNext`, `projectMatch`, `inventory`) and `packages/game/src/game.test.ts`.

## Decisions

- One capability, `game-rules`. Requirements describe the pure rules module, not the server or UI.
- Where the docs and the code disagree, the spec follows the code. Each mismatch is listed under Discrepancies in the proposal.
- Retire at bullet and row granularity. Each migrated block is replaced with one line: `Migrated to [game-rules spec](../openspec/changes/game-rules-spec-in-packages-game-checked/specs/game-rules/spec.md) (pending archival; not yet in openspec/specs).` Bullets and rows owned by sibling parts stay unchanged.
- The migration index marks both rows Partial, because the replacement is not yet integrated into `openspec/specs/`.

## Risks

- The replacement link points to the pending change's spec file, which moves to `openspec/specs/game-rules/` on archival. Archival must repoint the link lines in the docs.
