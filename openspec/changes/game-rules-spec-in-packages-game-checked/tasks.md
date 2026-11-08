## 1. Retire migrated doc sections

- [x] 1.1 In `docs/rules-contract.md`, replace "Setup", "Resolution Truth Table", the game-rule bullets of "Identities and Invariants" (64-card conservation, defeat threshold, face-down receipt, public/private data), the Initiation/Response/Pass preparation/Resolution rows of "Phases and Commands", the pass-eligibility, peek and prediction submission/locking bullets of "Passing and Private Predictions", and rows R01–R11, R13, R22 and R23 of "Worked Acceptance Scenarios". Each becomes the link line from design.md. Keep "Outstanding Product Review" and every bullet or row owned by other parts.
  - proof: `grep -c "openspec/specs/game-rules/spec.md" docs/rules-contract.md`
  - proof: `grep -n "## Outstanding Product Review" docs/rules-contract.md`
  - proof: `! grep -nE "^\| (R01|R03|R07|R11) " docs/rules-contract.md`
- [x] 1.2 In `docs/project-plan.md` "Confirmed Rules and Turn Experience", replace the official-corrections, random-starter, private-preparation, no-timer and peek-commitment bullets with the link line. Keep the other bullets, and the link from "Confirmed Product Decisions" to the rules contract.
  - proof: `grep -n "openspec/specs/game-rules/spec.md" docs/project-plan.md`
  - proof: `! grep -n "Peeking irrevocably commits" docs/project-plan.md`

## 2. Migration index and validation

- [x] 2.1 Set the Rules contract and Project plan rows of `openspec/migration-index.md` to Partial. Name the exact migrated sections and rows, link `specs/game-rules/spec.md` and this change as pending, and list the remaining scope.
  - proof: `grep -n "game-rules" openspec/migration-index.md`
- [x] 2.2 Validate the change.
  - proof: `npx openspec validate game-rules-spec-in-packages-game-checked --strict`
