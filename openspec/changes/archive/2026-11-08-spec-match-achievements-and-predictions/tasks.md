## 1. Spec

- [x] 1.1 Check the `match-achievements` spec delta against `achievements()`, `scores()`, award strings and theme overrides; fix any mismatch in the spec only
  - proof: `npx openspec validate spec-match-achievements-and-predictions --strict`

## 2. Retire docs

- [x] 2.1 In `docs/achievement-ideas.md`, replace the status line's attribution/tie rules and the award table with a link to the new spec; keep the tone limit, move the docs' differing conditions under "Unresolved proposals" marked unresolved, keep "Open implementation details"
  - proof: `grep -n "openspec/changes/spec-match-achievements-and-predictions/specs/match-achievements/spec.md" docs/achievement-ideas.md`
  - proof: `grep -n "Unresolved proposals" docs/achievement-ideas.md`
- [x] 2.2 In `docs/project-plan.md` "Predictions and Match Achievements", replace the scoring, attribution and tie bullets with links to the new spec; keep the confirmed eligibility, privacy and locking bullets until the reviewed game-rules spec replaces them, and keep the reveal bullet as unmigrated; keep the tone-limit rationale and the achievement-ideas link
  - proof: `grep -n "specs/match-achievements/spec.md" docs/project-plan.md`
  - proof: `grep -c "Award +1 for a correct prediction" docs/project-plan.md | grep -x 0`

## 3. Migration index

- [x] 3.1 Set the Achievement ideas row and a new Project plan "Predictions and Match Achievements" row to Partial, linking the pending change and spec; in other domain rows, only repair the Computer players row's spec link to its archived path, repair the rooms-change links in the Rules contract and Project plan rows to its archived path ("pending change ... (not yet archived)" becomes "archived change"), and add to the Rules contract row a pointer that its prediction scoring and R22 scoring overlap with this spec (retirement as follow-up)
  - proof: `grep -n "spec-match-achievements-and-predictions" openspec/migration-index.md`
  - proof: `npx openspec validate spec-match-achievements-and-predictions --strict`
