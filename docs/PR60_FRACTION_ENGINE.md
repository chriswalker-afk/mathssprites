# PR60 — exact rational foundation for the Fraction Workshop

## Scope

World 3 remains unavailable. No menu, renderer, notebook editor, star threshold,
existing campaign or save key changes in this PR. The 60 agreed equations live
as teacher-only fixtures in `src/fraction-level-plan.mjs`; they are not yet
published campaign slots. The common engine dispatches fraction-mode states to
a pure, exact transaction implementation while preserving numeric whole-room
state and all previous world permissions.

## Contract

- `quantityMode: "fractions"` is explicit on a level. Initial solution and
  positive sprite/weight quantities are reduced `{n,d}` safe integer pairs
  or whole integers at input. The canonical room carries the mode tag and
  two rational quantities, `posX` and `posOne`. Arithmetic uses BigInt
  intermediates and serializes only safe integer pairs. No float comparison,
  decimal parsing, negative objects, square objects, or crates.
- Supported reduced denominators: 1, 2, 3, 4, 5, 6, 8, 10, 12. All positive
  rational quantities with those denominators (including mixed numbers)
  are allowed up to room capacity. Add/remove permits positive amounts up
  to 12 objects, and multiply/divide permits integer factors 2–5 only.
- Capacity counts settled whole objects plus individual fractional pieces
  (48 per chamber). Transient animation layout needs its own later QA.
  Unsupported denominator and overflow are explicit reversible refusals;
  mathematical fractions outside this visual vocabulary are valid maths.
- `canonical`, `evaluate` and `balanceDifference` return exact rational
  pairs in fraction mode, legacy numbers otherwise. Future rendering must
  use rational comparison for direction and convert to a number only for
  visual positioning. `equation` is readable plain text for developer QA;
  typeset editable fractions belong to the notebook PR.
- `prepare` and `perform` validate both rooms for guided mode. Independent
  mode is provisional until a genuinely matching second visit, including
  equivalent fraction amounts (1/2 and 2/4). A rejected match retains the
  provisional state for Undo/visual rollback, never a committed move.
- Each transaction contains before/after room snapshots and
  `fractionPlans` per room/kind. Plans specify original and resulting
  whole/piece counts, common unit grid, selected amount or copies, and
  equal-share group descriptors. These are exact quantities, NOT animation
  actor IDs or a completed choreography. Whole + residual pieces is the
  canonical settled representation; visual splitting/recombination is not
  a second scored algebraic move.
- A win requires exactly one whole sprite on either side and only its
  matching positive rational weight on the other; pending moves cannot win.
- Reference moves remove common variable terms and constants, multiply to
  clear the remaining coefficient denominator, then divide the remaining
  numerator using allowed factors. Unit tests execute each reference against
  the real shared engine (manual two-visit transactions for Independent).
  These are constructive routes, not certified shortest paths.

## Verification

`npm run check` runs all existing tests plus rational, fraction transaction,
campaign reference and permission tests. Preserve the existing refusal
animation for whole-number worlds.

## Next PR — fractional weight visual system

Retain the existing brass weight art, split pieces with equal proportional
mass, show the original whole outline when helpful (not a counted object),
and keep the five-weight pile style for whole objects. Build an isolated
preview of separated/combined halves, thirds, quarters and fifths, plus
equivalent sixths, eighths, tenths and twelfths. Use `fractionParts` and
transaction plans as the source of truth; test equal-area shapes,
recombination/borrowing, viewport fit and reduced motion. Keep the world
locked until fractional sprites and hand operations are also implemented.
