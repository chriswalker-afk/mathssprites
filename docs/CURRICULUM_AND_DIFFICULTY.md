# Maths Sprites — Curriculum definitions and difficulty metadata (PR46)

## Purpose and scope

This is a **teacher/developer planning layer** for the **104 playable campaign levels**:
20 Guided, 20 Independent and 16 Algebra Apprentice in World 1
(The Balance Workshop), plus 20 Guided, 16 Independent and 12 Algebra Apprentice
in World 2 (The Opposite Chambers).

The 13 legacy experiments in src/engine.mjs remain preview and mathematical
test fixtures, not additional campaign entries. The future fractions and
quadratics worlds are intentionally excluded until they have actual levels.

**No game menus, balancing controls, hints, or student-facing equations are
generated from this catalogue.** PR45's neutral starting controls remain
neutral. A curriculum difficulty band must never silently select the correct
operation or number of objects.

## Where the data lives

- src/curriculum.mjs: authored skill definitions and prerequisites, learning
  objectives for every four-level chapter, explicit 1–5 difficulty bands,
  per-level mathematical/physical features and lookup functions
- tests/curriculum.test.mjs: coverage and consistency tests for **all 104
  IDs**, chapters, skill IDs, difficulty bands, move benchmarks and no
  accidental imports by the student application
- scripts/curriculum-report.mjs: author-only Markdown or JSON report,
  including the **actual equation** generated from the same model as the game

Run:

    npm run check
    npm run curriculum
    npm run curriculum -- --world workshop --stage guided
    npm run curriculum -- --world opposites --stage notebook
    npm run curriculum -- --json

The JSON report can be used later to chart difficulty, find missing objectives
or compare planned challenge with student attempt data. It is not part of
persistent student progress.

## What counts as difficulty?

| Band | Interpretation |
|---|---|
| 1 · Foundation | One familiar equivalent change; direct visual matching |
| 2 · Developing | Select a whole-object action or independently repeat it |
| 3 · Connecting | Coordinate different operations, representations or signs |
| 4 · Strategic | Plan a route, manage a reversal, signed cancellation or division trap |
| 5 · Mastery | Combine demanding decisions, multi-step strategy and constraints |

**Important:** difficulty is not the value of the unknown or the number
printed on a weight. It reflects the decisions needed to preserve equality,
the representations involved and the planning required. Four puzzles in a
chapter are deliberately related, not four identically difficult copies.
A new chapter may begin at a slightly lower band while introducing a new
concept. The authored bands are **initial hypotheses for play-testing**, not
empirical claims about pupils.

Each record also carries complexitySignals:
- benchmarkMoves: **proven shortest legal move count** for World 1 (the
  already tested OPTIMAL_MOVES baseline), but **authored valid route length**
  for World 2. These are intentionally labelled differently; do not use
  World 2 values as certified minima or give stars from them without separate
  proofs.
- variableSides, changesOrientation: unknowns on both sides and/or
  the remaining variable on the right
- signedObjectTypes: number of distinct signed-object types initially present
- studentControlledHandVisits: 1 Guided Mirror, 2 Independent Balance,
  0 notebook-first until the verified replay
- scaffoldKind: model, first, last or none from the actual level
- fractionTrap, multipleSolutionRoutes, sealedGroupReasoning: explicitly
  authored mathematical/representation flags (not guessed from the quantity)
- referenceOperations: only for World 2, kept exclusively in author metadata

## Curriculum strands

The skill registry has explicit *student can do* descriptions and prerequisite
links in six strands: equivalence, linear transformations, strategy,
representation, signed numbers and mathematical communication.

| World | Guided progression | Independent progression | Notebook progression |
|---|---|---|---|
| 1 · Workshop | Equal subtraction → whole equal groups → two-step → unknowns on both sides → efficient routes/crates | Match single moves → match divisions → match sequences → solve strategic two-sided balances | Model/first/last/solo written moves → choose an efficient order → solve multi-operation and reversed equations |
| 2 · Opposites | Balloons and unit zero pairs → white sprites and variable zero pairs → combine cancellations → reversed signed equations → strategic signed transformations | Match signed hand visits → distinguish local cancellation effects → prepare signed groups → independent signed strategies | Write signed operations → distinguish signs/negative terms → combine independent signed transformations |

### Design guardrails

- Preserve the equation, valid physical contents, level ID and save-key
  semantics; this PR is descriptive metadata only, **not a reordering or
  numerical rebalance**.
- Keep World 1 strictly positive and whole-object only; negative operands
  belong to World 2; fraction pieces and square/square-root worlds are future.
- The guided, independent and notebook labels describe the method, not
  arbitrary student ability tiers. The same mathematical difficulty can feel
  different across methods.
- Visual hand actions are not extra algebraic moves: two separate Independent
  visits still form **one** balanced algebra step.
- Existing star ratings and saved progress are unchanged.
- Use authored flags and real features when reviewing progression; do not
  increase difficulty only by making numbers large or by creating more objects
  than the room can comfortably hold.
- Do not surface difficulty, mathematical reference routes or equation metadata
  before the student solves a room; PR45's neutral selections remain protected.

## How to use this in the next difficulty-balancing pass

First review the npm run curriculum output **chapter by chapter** and identify
sudden spikes, repeated objective types, unnecessary busywork and levels where
the desired method is trivial or mechanically impossible. Then play-test early
and late examples in all three modes, record actual moves/rejections and
whether pupils select a mathematically appropriate next step. Finally propose
specific changes to equation contents, sequence and supporting hints in a
*separate* PR. Do not auto-reorder the campaign from scores alone.

The next planned game feature after this metadata pass is the **grouped-crate
generalisation**: extend the existing sealed-crate visual and engine mechanism
beyond the current demonstration without leaking an algebraic expansion.
