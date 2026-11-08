# Design

Documentation-only retrospective spec. The evidence is `apps/web/src/main.tsx` (preferences, `Table`, `Actions`, audio effects, `ThemeSelector`), `apps/web/src/themes.ts` (`themeFor` fallback, theme packs), `apps/web/src/audio.ts` and `audio.test.ts`, `apps/server/src/runtime.ts` (`set-theme`) and its test, and `tests/e2e/game.spec.ts` (guided response hint, hidden hands, mobile layout).

Three capabilities keep the review small: what you see, how you learn, what you hear. Each requirement states the code's behavior. Mismatches with the docs are listed in the proposal.

Retirement replaces each migrated bullet or paragraph with one line: `Migrated to [<cap> spec](../openspec/changes/spec-visual-presentation-onboarding-and/specs/<cap>/spec.md) (pending review in change spec-visual-presentation-onboarding-and).` The links use the pending change path and are repointed at `../openspec/specs/<cap>/spec.md` at integration/archive. Rationale (aesthetic, tonal references), media/verification notes and the tooling guide stay.
