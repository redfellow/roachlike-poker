# Add a page description for link previews

## Why
`apps/web/index.html` has no `<meta name="description">`, so search results and shared links show no summary.

## What Changes
Add one `<meta name="description">` in Finnish to the `<head>` of `apps/web/index.html`, after the `theme-color` meta tag. Nothing else changes: no game, server or protocol code.

## Outcome
- Link preview / search snippet summary
  - Now: no summary
  - After: `Selaimessa pelattava bluffikorttipeli 2–6 kaverille. Luo huone, kutsu kaverit ja pelaa yhdessä.`

## Acceptance
- `apps/web/index.html` has exactly one `<meta name="description" content="…">` with the Finnish text above.
- No other file changes.

## Citations
- apps/web/index.html (`lang="fi"`, no description today)
- README.md: "A browser-based bluffing card game for 2–6 friends … Finnish interface"
- openspec/specs/visual-presentation/spec.md: covers the interface, layout and themes, not page metadata, so no spec change is needed.

## Assumptions
- The description is fixed and the same for every theme, because it is static HTML. The alternative, a description that changes with the theme at runtime, is ruled out because crawlers don't run JS.
- No Open Graph tags are added (`og:description`). The card asks only for the meta description.
- The exact Finnish wording is the planner's choice, and the reviewer can adjust it.
