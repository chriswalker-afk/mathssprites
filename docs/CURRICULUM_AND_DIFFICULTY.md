# Maths Sprites — Curriculum definitions and difficulty metadata (PR46–PR57)

## Purpose and scope

This is a **teacher/developer planning layer** for the **112 playable campaign levels**:
24 Guided, 20 Independent and 16 Algebra Apprentice in World 1
(The Balance Workshop), plus 24 Guided, 16 Independent and 12 Algebra Apprentice
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
- tests/curriculum.test.mjs: coverage and consistency tests for **all 112
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
    npm run audit:world2
    npm run audit:world2 -- --json

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
- benchmarkMoves: **independently proven shortest legal move count** in
  BOTH worlds. World 1 uses its positive whole-object search and World 2's
  PR50 test exhaustively searches all four signed object types and permitted
  factors through the real engine. Star par is never inferred from a hint or
  example route.
- authoredRouteMoves: the separately kept example route length for World 2
  (null in World 1). A valid teaching route can be longer or use different
  signed cancellations than a shortest route; do not silently change stars
  when an authored example is revised.
- variableSides, changesOrientation: unknowns on both sides and/or
  the remaining variable on the right
- signedObjectTypes: number of distinct signed-object types initially present
- studentControlledHandVisits: 1 Guided Mirror, 2 Independent Balance,
  0 notebook-first until the verified replay
- scaffoldKind: model, first, last or none from the actual level
- fractionTrap, multipleSolutionRoutes, sealedGroupReasoning: explicitly
  authored mathematical/representation flags (not guessed from the quantity)
- referenceOperations: only for World 2, kept exclusively in author metadata
- benchmarkType: "proven-minimum" for BOTH worlds (not "authored-valid-route")

## Curriculum strands

The skill registry has explicit *student can do* descriptions and prerequisite
links in six strands: equivalence, linear transformations, strategy,
representation, signed numbers and mathematical communication.

| World | Guided progression | Independent progression | Notebook progression |
|---|---|---|---|
| 1 · Workshop | Equal subtraction → whole equal groups → two-step → unknowns on both sides → efficient routes → four sealed-crate challenges | Match single moves → match divisions → match sequences → solve strategic two-sided balances | Model/first/last/solo written moves → choose an efficient order → solve multi-operation and reversed equations |
| 2 · Opposites | Balloons and unit zero pairs → white sprites and variable zero pairs → combine cancellations → reversed signed equations → strategic signed transformations → sealed crates containing signed objects | Match signed hand visits → distinguish local cancellation effects → prepare signed groups → independent signed strategies | Write signed operations → distinguish signs/negative terms → combine independent signed transformations |

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

## How to use the metadata for future play-testing

First review the npm run curriculum output **chapter by chapter** and identify
sudden spikes, repeated objective types, unnecessary busywork and levels where
the desired method is trivial or mechanically impossible. Then play-test early
and late examples in all three modes, record actual moves/rejections and
whether pupils select a mathematically appropriate next step. Finally propose
specific changes to equation contents, sequence and supporting hints in a
*separate* PR. Do not auto-reorder the campaign from scores alone.

PR47 generalised the sealed-crate visuals and engine across Independent
Balance and Algebra Apprentice. PR48 adds four Guided crate experiments
(numbered 21–24) while preserving the original 20 Guided equations, IDs,
positions and legacy progress. New curriculum records have explicit complexity
and difficulty bands; a crate rewrite is one equivalent-expression step,
not a pair of opposite hand visits.

PR49 rebalanced signed representations without changing IDs. **PR50 independently
certified the shortest legal solution length for all 48 World 2 levels**:
all 48 authored reference routes happened to be optimal, so existing stars,
content revision markers, and saved completions are unaffected. Future route
edits cannot silently change star targets. See
[the full audit](WORLD2_OPTIMAL_ROUTE_AUDIT.md) and the reproducible
`npm run audit:world2` report; both are teacher/developer resources.
