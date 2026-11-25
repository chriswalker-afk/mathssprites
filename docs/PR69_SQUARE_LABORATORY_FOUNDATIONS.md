# PR69 — Square Laboratory engine and unpublished curriculum foundations

World 4 stays locked in the public Experiment Board. This is the
mathematical and curriculum foundation, not an art/UI or public campaign
release. Keep all earlier campaign levels, records and star targets intact.

## Explicit world capability

A World 4 level has `squareLaboratory: true`, `quantityMode: "positive"`,
`lockPositive: true`, and an explicit allowed-kind/operation list. The
existing integer engine handles round sprites (x), square sprites (x²)
and unit weights; no fractional, signed, sealed-crate or higher-power
objects. Add/remove 1–12 of one kind; whole equal groups/copies by 2–5.
At most 48 counted objects per settled chamber; a square construction
must also have at most 48 interior cells. Dimension guides do not count.

The old area engine and hand timeline are reused. Squaring a whole
nonnegative expression ax+b yields a²x²+2abx+b². Taking a principal root
requires both square corner counts and the exact combined cross-term
count 2ab. Reject unsupported or overflowing areas without a committed
change. Sealed crates may no longer be silently ignored by the legacy
area transform. Algebra review of x² removal/addition now correctly
writes the quadratic term, not a constant. The nonnegative-domain check
uses the known integer root and Vieta's relation to exclude a distinct
second nonnegative root without a floating-point discriminant.

## Goals

Nine introductory construction experiments use the existing `area`
goal, with an independently generated exact target for BOTH rooms.
These deliberately do not win when x is initially isolated. The other
51 levels start with a quadratic coefficient difference and isolate one
round sprite opposite its positive integer value. The game's assumption
x >= 0 must be explained in post-success algebra, and later paper mode.

## Authoring catalogue

`src/square-level-plan.mjs`: immutable 60 fixtures with stable IDs
square-g-01…24, square-i-01…20, square-a-01…16. Six/five/four chapters
of four levels, neutral tools, explicit goal, exact solution, and a
teacher-only authored witness. `squareLevelForPlay` removes the witness
from launch data. `SQUARE_CAMPAIGN_STAGES` is NOT imported into the
public registry yet; all its stages and slots are unavailable, with
empty optimal-move maps. Reference routes are not shortest-route proofs.

| Stage | Levels | Area goals | Longest authored witness | Peak settled inventory |
|---|---:|---:|---:|---:|
| Guided | 24 | 4 | 6 | 36 |
| Independent | 20 | 3 | 6 | 40 |
| Apprentice | 16 | 2 | 6 | 36 |

The prior planning model independently checked the 60 equations and
reference routes. PR69 adds actual-engine unit tests for all routes,
capacity, polynomial identities at other values of x, complete square
geometry, both independent visit orders, reversible refusals, exact
Undo, world permissions, unique-domain solutions and no public progress.
These tests do not establish a shortest route or browser/visual success.

## Deferred implementation

PR70: square sprite art and motion, with a dedicated interactive visual
preview. Reuse the established creature design, not a mathematical label
stuck onto an object. Do not unlock World 4. PR71/72 improve the original
in-room square and root choreography. PR73 implements the optional
non-counting inspection frame and completing-the-square scaffolding.
PR74/75/76 publish the three modes with verified star targets, editor,
navigation and save isolation; PR77 adds custom supported equations;
PR78 completes curriculum/reporting, final audit and deployment QA.

The existing legacy app's locked-positive object picker and notebook
grammar still need World 4-specific UI integration in those milestones.
No square-root tools are added to Worlds 1–3.
