# PR68 — World 3 final curriculum and release audit

## Curriculum verdict

Retain the 60 existing stable level IDs and equations. No new fraction
denominators, signed fractional objects, crates, or fractional scale factors.
The introductory chapters intentionally contain one-move puzzles: choosing
common parts or interpreting an unknown fragment is conceptual demand even
when the shortest route is short. Final chapters combine both-sided terms
and integer scaling. The teacher difficulty bands are authored judgements,
not measured attainment or a claim that all students find the order identical.

| Mode | Levels | One move | Two | Three | Four | Five | Fractional solutions |
|---|---:|---:|---:|---:|---:|---:|---:|
| Guided | 24 | 14 | 3 | 5 | 1 | 1 | 15 |
| Independent | 20 | 9 | 5 | 5 | 0 | 1 | 13 |
| Apprentice | 16 | 6 | 4 | 3 | 2 | 1 | 11 |
| Total | 60 | 29 | 12 | 13 | 3 | 3 | 39 |

The reference routes peak at 30 settled pieces, below 48. The audit reports
temporary grid counts separately. All three modes' star targets are unchanged:
3 stars at the legal minimum, 2 at one extra move, 1 at two or more extra moves.

## Reproducible teacher tools

- `npm run curriculum -- --world fractions` (or add `--stage notebook --json`).
  The catalogue now contains all 180 campaign levels and exact rational
  equations, fraction-specific objectives, skills, initial denominators and
  physical complexity flags. Student controls do not import it.
- `npm run audit:world3` (optional `--stage guided --json`). For each level,
  a coefficient-only breadth-first search independently lower-bounds the
  number of integer scaling moves. Every initially shared object kind
  additionally needs at least one removal. This is valid even if a learner
  adds arbitrary permitted positive quantities. A legal route of the same
  length is independently found using the exact Workshop route finder and
  replayed through the engine. Thus the bound is attained; no exhaustive
  search over every physical arrangement is needed. Check authored and
  independently found routes, grid conservation and rendering, manual
  visits in both orders, exact written operations and replay, Undo,
  custom-input equivalence, star thresholds and metadata.
- The dedicated unit tests run under `npm run check`.

## Physical and accessibility refinements

Crowded direct chamber inventories can wrap to several rows before scaling,
  keeping weight piles intact; baskets remain fitted individually.
Refused unsupported denominators show a temporary representative original
  sprite or brass weight divided into genuinely equal-area pieces, then
  rejoin; overflow shows up to five illustrative falling objects with the
  exact excess in accessible text. These demonstrations do not represent
  the complete attempted inventory and never become engine objects. The
  original room and history are restored. Explicit trial-only geometry is
  limited to 120 subdivisions; legal engine vocabulary is unchanged.
A local reduced-motion control is available during all fraction modes,
  without writing campaign or preference records.

## Release gates

- Unit suite including the 60-level audit and physical trial-art tests.
- Full unabridged Playwright regression: label the PR `full-browser-qa`.
  `visual-review` retains screenshots, including crowded desktop/mobile,
  refusal illustrations and solved balance. Review actual screenshots.
- After merging and Pages deployment, run **World 3 published release
  check** (manual Actions workflow), or `npm run check:live:world3` with
  pinned Playwright installed. It checks the actual published board
  (24/20/16) and exact custom division, save isolation and browser errors.
  A PR check against an already-deployed main is not evidence that this
  PR has deployed. Do not mark the final release verified until this
  workflow has passed against the released site.

This PR does not introduce World 4 or signed fractions. The older animated
notebook-writing comic is still distinct from World 3's step-through
MathML comic; neither a new animation redesign nor classroom difficulty
calibration is claimed by this audit.
