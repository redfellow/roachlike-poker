# Documentation migration index

OpenSpec adoption is incremental. No existing capability has yet been migrated into `specs/`. The inventory below records documentation roles and migration scope, not an assertion that every documented statement is approved or implemented.

`specs/` is canonical for approved requirements within explicitly migrated scope. Existing documents remain provisional references elsewhere. Resolve conflicts using the relevant decisions, source, tests, and user clarification; do not silently treat implemented behavior as the intended requirement. Proposed changes and archived records do not establish Git integration, deployment, or acceptance.

## Coverage statuses

- **Unmigrated:** no replacement specification has been integrated for the listed scope.
- **Partial:** only named sections or requirements have reviewed, integrated replacements. List those replacements and the remaining scope explicitly.
- **Migrated:** all requirements within the explicitly named scope have reviewed, integrated replacement specs. Link to those specs and the integrating change or commit.
- **Maintained reference:** guidance, plans, or evidence that remains maintained outside OpenSpec. Mixed documents can also contain unmigrated requirements.

## Existing documentation inventory

| Document | Role and scope | Current coverage | Replacement specs / retirement conditions |
| --- | --- | --- | --- |
| [Rules contract](../docs/rules-contract.md) | Game invariants, setup, commands, resolution, predictions, replacement, persistence, acceptance scenarios | Unmigrated | None. Migrate explicit rule/scenario sections; retain unresolved product review until resolved. |
| [Project plan](../docs/project-plan.md) | Product decisions across rules, rooms, identity, spectators, departures, achievements, presentation, hosting | Unmigrated | None. Mixed domains: retire only sections with reviewed replacements; preserve open decisions and useful rationale. |
| [Initial information](../docs/initial-info.md) | Original mechanics and architecture blueprint, digital presentation decisions | Unmigrated | None. Compare with the rules contract and later decisions before selecting requirements; preserve historical rationale where useful. |
| [Computer players](../docs/computer-players.md) | Computer-player requirements, first-slice decisions and acceptance criteria, proposed work slices | Partial (pending integration) | [spec-the-computer-players](changes/spec-the-computer-players/specs/computer-players/spec.md) (pending review) covers the sections, which were retired ahead of integration: "Implemented Direction", "Approved First-Slice Decisions" and "Acceptance Criteria for Slice 1". Remaining planning context: "Confirmed Requirement", deferred items and "Proposed Work Slices". |
| [Achievement ideas](../docs/achievement-ideas.md) | Achievement copy, candidate conditions, attribution constraints, open implementation details | Unmigrated | None. Preserve decision status and unresolved conditions rather than promoting every idea to a requirement. |
| [Implementation backlog](../docs/implementation-backlog.md) | Work buckets, confirmed defaults, operational questions | Maintained reference; embedded requirements unmigrated | None. Capture requirement changes in OpenSpec; retain useful work tracking and open questions without duplicating migrated requirements. |
| [Technical plan](../docs/technical-plan.md) | Stack, privacy, durability, deployment, later media architecture, references | Maintained reference; embedded requirements unmigrated | None. Migrate behavioral guarantees when touched; retain architecture explanations, rationale, and references. |
| [MVP status](../docs/mvp-status.md) | Implementation claims, verification evidence, remaining release gates | Maintained reference; embedded acceptance requirements unmigrated | None. Retain dated evidence and release tracking; migrate requirement definitions separately. Status claims require current verification. |
| [Release guide](../docs/releasing.md) | Publishing, deployment, rollback, version preparation | Maintained reference | No wholesale migration planned. Keep procedures current; OpenSpec may reference the guide. |
| [Sound-effects guide](../docs/elevenlabs-sound-effects.md) | Audio generation workflow, configuration, prompts, metadata, review and verification | Maintained reference; embedded product requirements unmigrated | None. Retain tooling guidance and evidence; migrate approved audio behavior when touched. |
| [Audio review candidates](../docs/audio-review-candidates.json) | Structured audio candidate/review data | Maintained reference | No wholesale migration planned. Retain usable review data and provenance. |

## Updating this index

For each migration, record the exact source sections, approved replacement spec links, integrating change or commit, remaining requirements, and unresolved discrepancies. Split inventory rows or add capability rows when a document's broad scope would hide partial coverage. Update coverage only after reviewing and integrating the replacement; an active proposal can be linked as pending work without changing its scope to migrated.

Retirement belongs in the reviewed change. Before removing a section or file, confirm replacement coverage, preserve useful rationale and evidence, inspect other domains it covers, and update incoming links. For mixed documents, remove or replace only superseded requirement sections with links to their specs. Schedule a specific follow-up when retirement cannot yet be completed. Archiving a change alone does not authorize deletion or prove integration or acceptance.

The root [README](../README.md), [agent guidelines](../AGENTS.md), and operational assets in `ops/` remain maintained in place. Add new documents to this inventory when they introduce requirement sources or supporting guidance relevant to migration.
