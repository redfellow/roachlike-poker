# Tasks

## 1. Spec and retirement

- [x] 1.1 Validate the computer-players spec delta against the code. Fix any requirement that disagrees with the code, and record the mismatch under Discrepancies.
  - proof: `npx openspec validate spec-the-computer-players --strict`
- [x] 1.2 In `docs/computer-players.md`, replace "Implemented Direction", "Approved First-Slice Decisions" and "Acceptance Criteria for Slice 1" each with a one-line link to `openspec/changes/spec-the-computer-players/specs/computer-players/spec.md`. Keep "Confirmed Requirement", the deferred items list and "Proposed Work Slices".
  - proof: `grep -c "spec-the-computer-players/specs/computer-players/spec.md" docs/computer-players.md`
  - proof: `! grep -E "^- The host can add a computer to an open seat until" docs/computer-players.md`
  - proof: `grep -q "## Proposed Work Slices" docs/computer-players.md`
- [x] 1.3 Update the "Computer players" row of `openspec/migration-index.md`: set it to Partial, name the retired sections, link the pending change, and list the remaining planning context.
  - proof: `grep -E "Computer players.*Partial.*spec-the-computer-players" openspec/migration-index.md`
