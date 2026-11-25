# PR76 — Square Algebra Apprentice

All 16 previously authored Square Laboratory Apprentice fixtures are
published alongside the 24 Guided and 20 Independent levels. Reuse the
existing paper-first operation editor and the checked physical replay.
No fixture equations, IDs, routes or earlier-world scoring change.

| Chapter | Levels | Purpose |
|---|---:|---|
| Writing Squares and Roots | 1–4 | Square whole expressions and recover a principal side |
| Recognising Square Expressions | 5–8 | Prepare the expressions for a legal root |
| Completing the Square | 9–12 | Add the missing whole-number corner on both sides |
| Strategic Quadratics | 13–16 | Choose a sequence of exact quadratic operations |

## Maths editor and physical replay

Only explicit Square Laboratory levels accept the new commands: square,
² or ^2; sqrt or √; and positive whole x² terms in addition or subtraction
(e.g. −x² or +2x^2). The two whole-expression operations use true MathML
superscripts and radicals. Dedicated buttons and the x² key appear only
in this notebook. No automatic corner fitting, inspection frame,
arbitrary polynomial input, negative sprites, fractions, cubes or
guessed answers. The principal root uses the existing nonnegative
sprite domain and whole-object constraints.

Preview is pure. Apply commits exactly one engine-verified operation
on both sides to the written working. Illegal operations leave the
notebook unchanged. The first two experiments have an area-construction
goal, so checking a completed square is different from isolating x.
Undo works in the notebook. Only after the entire goal is checked and
the learner explicitly requests replay does the physical scene appear.
Replay uses the actual existing square/root choreography; each
transaction is checked against the recorded result and final equation.
Only successful completed replay dispatches campaign credit.

## Certification and records

Independent finite-state BFS verified these minima:
1,1,1,2,2,3,2,2,3,3,3,3,3,4,5,6.
All 16 authored routes attain their respective minima. Add tests for
both shortest and authored routes through the actual operation editor,
preview immutability, rejected operations, exact replay, undo and
world/stage-isolated progress. Browser tests cover the public board,
older notebook restrictions, square construction, exact root and
completing-square replay, keypad, phone layout, progress and resume.

World 4 now has 60 published levels / 180 stars. All four worlds
have 240 levels / 720 stars. Apprentice adds 48 stars. Extend the
curriculum report and existing release-count assertions.

PR75 mathematical tests passed after correcting outdated source and
world-lock assertions. Corrected PR75 smoke, navigation, notebook and
visual checks also passed. PR74 area QA passed 28 of 30 tests; its
remaining failures were duplicate Continue-button/level-tile locators.
Scope both Guided and Independent tests to actual level tiles. PR76
automated checks and manual visual inspection remain outstanding.

## Next PR77

Integrate Square Laboratory into the free-play Equation Workshop:
positive integer quadratic expressions or a valid square-build
challenge, unique positive solution on the nonnegative sprite domain,
48-object capacity, safe bounded parser, appropriate hand modes and
paper-first replay. No campaign credit or changes to the earlier
workshop modes. PR78 is the final difficulty and release QA audit.
