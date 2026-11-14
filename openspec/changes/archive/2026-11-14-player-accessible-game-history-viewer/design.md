## Approach

In `apps/web/src/main.tsx` (topbar, line ~393), move the existing `setHistory(true)` button out of `.topbar__more`. Render it in `topbar__tools` before the details element as `button button--quiet button--compact`, only when `state.history.length > 0`. Reuse the existing `FI.session.history` string and `badge`. The modal is unchanged. The e2e test that opened "Lisää" first now clicks the topbar button directly.
