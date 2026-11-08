# Tasks

- [ ] 1.1 Validate the change artifacts (proposal, design, five spec deltas). Fix any strict-validation errors without changing meaning.
  - proof: `npx openspec validate spec-rooms-identity-spectators-reconnect --strict`
- [ ] 1.2 In `docs/rules-contract.md`, replace "Reconnection and Replacement", "Permanent Removal" and the saved-state, recap and restart paragraphs of "Persistence and History" with short links to the matching specs under `openspec/changes/spec-rooms-identity-spectators-reconnect/specs/`. Keep the theme paragraph, the worked scenarios and "Outstanding Product Review".
  - proof: `grep -c "spec-rooms-identity-spectators-reconnect" docs/rules-contract.md`
  - proof: `! grep -E "Approval is by a majority of remaining connected players|Shuffle and distribute the removed hand evenly" docs/rules-contract.md`
- [ ] 1.3 In `docs/project-plan.md`, replace "Rooms, Identity, and Spectators" and the requirement bullets of "Approved Departure House Rule" with spec links. Keep the redistribution-tradeoff rationale and the "Still unresolved" line. Replace only the restart and saved-games bullets in "Hosting and Reliability".
  - proof: `grep -c "spec-rooms-identity-spectators-reconnect" docs/project-plan.md`
  - proof: `! grep -E "Players ready up. Once all are ready|The host clicks a greyed-out chair|Ongoing games must survive server restarts" docs/project-plan.md`
- [ ] 1.4 Update the rules-contract and project-plan rows of `openspec/migration-index.md` to Partial. Name the exact retired sections and link the pending change. Repair any incoming links to the retired anchors.
  - proof: `grep -E "Rules contract|Project plan" openspec/migration-index.md`
  - proof: `! grep -rnE "#(reconnection-and-replacement|permanent-removal|rooms-identity-and-spectators|approved-departure-house-rule)" docs README.md openspec/migration-index.md`
