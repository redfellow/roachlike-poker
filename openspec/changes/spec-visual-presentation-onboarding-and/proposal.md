# Spec visual presentation, onboarding and audio behavior

## Why

The browser app's presentation, themes, onboarding and sound behavior (`apps/web`) are described only in provisional documents. This is part 5 of 5 of "Retrospective OpenSpec specifications for existing project features". It records what the code does now.

## What Changes

- Add three capabilities:
  - `visual-presentation`: Finnish UI, table layout, private hand grouping, the resolution and next-turn animation, reduced motion, and host-selected visual themes (including theme persistence and fallback).
  - `onboarding`: the rules view and the guided first-turn hints.
  - `game-audio`: the sound toggle, event sounds, who hears what, countdown ticks, background music and its volume, and the rule that the browser never calls ElevenLabs.
- Retire the migrated sections and replace each with a short link to its spec:
  - `docs/project-plan.md` "Visual Design and Onboarding": the layout, hand-grouping, mute/reduced-motion, rules/help, guided-turn, theme and theme-pack bullets. The aesthetic and tonal-reference bullets stay as rationale.
  - `docs/initial-info.md` "6. Agreed Digital Presentation": the first three bullets (Finnish UI/no timers, resolution animation and sounds). "Visual and Tutorial Decisions": the first two paragraphs. The verification/media paragraph and the other bullets stay for their own domains.
  - `docs/rules-contract.md` "Persistence and History": the theme paragraph. Part 2 left it for this part.
- `docs/elevenlabs-sound-effects.md` stays a maintained tooling guide. Its Status section gets one line linking to `game-audio` for in-game sound behavior.
- Update the Project plan, Initial information, Rules contract and Sound-effects guide rows in `openspec/migration-index.md`. Mark them Partial and link the pending change. Edit only this domain's part of each row.
- No code changes.

### Where the direction changed the idea

The origin said only to specify behavior from the docs. The direction adds that the code wins over the docs, with mismatches listed below. It also adds retiring the doc sections, updating the index and making no code changes. Following part 2's assumption, theme persistence from `rules-contract.md` is included here.

## Discrepancies (the spec follows the code)

1. **Theme lock.** project-plan: "The host chooses a visual tile in the lobby before countdown". initial-info: "The selection ... locks when countdown begins". Code: the change is blocked only during the lobby countdown. During a match the host can switch the theme from the topbar menu (`runtime.ts` `set-theme`). This rewrites the theme of the running game and of its recap.
2. **Neutral sound.** initial-info §6: "Sounds reflect personal success/failure; uninvolved players hear a neutral sound." Code: everyone hears the believe/disbelieve, reveal and penalty-transfer sounds. Only the final sender, the receiver and the penalty taker also hear a win or loss sound. There is no separate neutral sound.
3. **"Seuraavana: [player name]".** Code: the next-turn banner reads `Sun puheet!` for yourself and `<name>!` for others.
4. **Guided first turn.** project-plan: "dismissible local hints during the first actual turn". Code: a start hint and a response hint are shown as modals whenever the person must act, until each is dismissed. The dismissals are remembered per device (`torakka:tutorials:v1`), so a hint can appear in a later match if it was never dismissed.
5. **Reduced motion.** Code: it defaults to the OS `prefers-reduced-motion` setting. It shortens the animations to near zero and also silences the countdown ticks. The docs do not say this.
6. **Unlisted audio.** The docs do not mention the looping background music, its 0–100 volume slider (default 25) or its fade during the countdown. The ElevenLabs guide lists card-flip, peek and ready-confirmation sounds. The code does not play them, although some of the files exist.
7. **Avatar decoration.** Herrasmiespokeri "top hats on avatars": implemented as a hat on the generated avatar. Avatars are made from the name's hash (colour and shape).

## Assumptions

- The ElevenLabs guide is kept whole; only a link line is added. The alternative was to retire its "Recommended Approach" list. That list is a generation backlog, not app behavior.
- The prediction-reveal emoji (👏/😂/😱) is specified under `visual-presentation`, because it is part of the resolution display. Prediction scoring stays with part 4.
- Theme-change authority (host only) is restated here because it is presentation. Part 2 does not cover it.
- Coverage is Partial, not Migrated, until review and integration.
- This change has no `## Outcome` because users see nothing different.
