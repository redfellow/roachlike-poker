# Tasks

## 1. Spec and retirement

- [x] 1.1 Check each requirement in the three spec deltas against `apps/web/src/main.tsx`, `apps/web/src/themes.ts`, `apps/web/src/audio.ts` and `apps/server/src/runtime.ts` (`set-theme`). Fix any requirement that disagrees with the code and add the mismatch to Discrepancies.
  - proof: `npx openspec validate spec-visual-presentation-onboarding-and --strict`
- [x] 1.2 In `docs/project-plan.md` "Visual Design and Onboarding", replace the layout, hand-grouping, mute/reduced-motion, rules/help, guided-turn, theme and theme-pack bullets with link lines to the `visual-presentation`, `onboarding` and `game-audio` specs, naming this change. Keep the first two bullets (aesthetic, tonal references).
  - proof: `grep -c "spec-visual-presentation-onboarding-and" docs/project-plan.md`
  - proof: `! grep -q "Include a guided-first-turn checkbox" docs/project-plan.md`
  - proof: `grep -q "Playful, darkish" docs/project-plan.md`
- [x] 1.3 In `docs/initial-info.md`, replace the first three bullets of "6. Agreed Digital Presentation" and the first two paragraphs of "Visual and Tutorial Decisions" with link lines. Keep the remaining bullets and the verification/media paragraph.
  - proof: `grep -c "spec-visual-presentation-onboarding-and" docs/initial-info.md`
  - proof: `! grep -q "The MVP includes host-selected visual themes" docs/initial-info.md`
  - proof: `grep -q "MVP layout verification uses desktop Chrome" docs/initial-info.md`
- [x] 1.4 In `docs/rules-contract.md` "Persistence and History", replace the theme paragraph with a link to the `visual-presentation` spec.
  - proof: `! grep -q "Persist the host-selected theme as an ID and version" docs/rules-contract.md`
  - proof: `grep -q "spec-visual-presentation-onboarding-and" docs/rules-contract.md`
- [x] 1.5 In `docs/elevenlabs-sound-effects.md` "Status", add one line linking in-game sound behavior to the `game-audio` spec. Change nothing else.
  - proof: `grep -q "game-audio/spec.md" docs/elevenlabs-sound-effects.md`
  - proof: `grep -q "## Credit and Budget Control" docs/elevenlabs-sound-effects.md`
- [x] 1.6 In `openspec/migration-index.md`, mark the Project plan, Initial information, Rules contract and Sound-effects guide rows Partial for the exact sections retired here, and link this pending change. Leave the other parts' text in those rows.
  - proof: `grep -c "spec-visual-presentation-onboarding-and" openspec/migration-index.md`
  - proof: `grep -E "Sound-effects guide.*Partial" openspec/migration-index.md`

## Manual checks after merge (The user)

- Read the three specs alongside the Discrepancies list, and decide whether any doc intent (theme lock at countdown, neutral sound, the `Seuraavana` banner) should become a follow-up code change.
