# Design

The approach is documentation only. Each requirement is written from evidence in `apps/server/src/runtime.ts` (`add-computer`, `remove`, `rematch`, `scheduleComputerTurn`, `createComputerName`, `ensureComputerReadiness`), `packages/game/src/index.ts` (`chooseComputerAction`, `chooseComputerPrediction`, `publicCoinFlip`), `apps/server/src/index.ts` (the delay variable), and the tests in `apps/server/src/runtime.test.ts`, `packages/game/src/game.test.ts` and `tests/e2e/computers.spec.ts`.

Game-rule semantics are left to the rules-contract change. This spec covers only how computers choose among legal actions and when they act.

The doc keeps its rationale and future slices. Only the requirement sections become links, so the existing incoming links stay valid.
