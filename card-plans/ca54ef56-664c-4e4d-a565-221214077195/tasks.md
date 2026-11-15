# Tasks

- [x] 1.1 Add `<meta name="description" content="Selaimessa pelattava bluffikorttipeli 2–6 kaverille. Luo huone, kutsu kaverit ja pelaa yhdessä." />` to the head of `apps/web/index.html`, using tab indentation
  - proof: `grep -c 'name="description"' apps/web/index.html`
  - proof: `git diff --stat -- . ':!apps/web/index.html' ':!card-plans'`

## Manual checks after merge (The user)
- Share the deployed URL in a chat app and check that the preview shows the Finnish summary.
