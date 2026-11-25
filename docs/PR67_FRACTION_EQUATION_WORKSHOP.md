# PR67 — Fraction Equation Workshop

## Scope

The Inventor's Desk now has a number-system selector, defaulting to Whole
numbers from Home (or Fractions when opened from the World 3 board).
Whole-number free play and its existing hand controls remain unchanged.
Selecting Fractions replaces the examples, syntax and rules, and enables
Guided, Independent and Algebra Apprentice. Return to the builder retains
the selected number system, draft and method. Optional deep-link parameters:
`?workshop=2x%3D5&workshopWorld=fractions&workshopMode=notebook`.

## Exact grammar and legality

- Positive linear terms joined with +, one equals sign; ordinary fractions,
  x/3, 2x/3, (2/3)x, improper and mixed numbers (including (1 1/2)x).
  Reduce equivalent fractions exactly; no decimals, signed objects,
  powers, general bracket expansion or arbitrary expression evaluation.
- Supported reduced denominators 1, 2, 3, 4, 5, 6, 8, 10, 12. Check both
  combined rooms and the positive unique rational solution. Respect the
  settled 48-object/piece capacity and the existing tool permissions.
- Bounded best-first search certifies a legal route of at most 16 moves
  through the same exact engine used for student moves. Search tries
  cancellations in different orders and integer scaling 2–5; the priority
  uses a rigorous coefficient/shared-kind lower bound. At most 6000
  expanded states; no arbitrary additions in the search. Failure to find
  a certificate is NOT a proof that the equation is mathematically
  unsolvable. Explain the physical/search limits rather than misteach maths.
- Generated levels contain no reference route. The actual chosen student
  moves and paper history are the source of any review or playback.

## No campaign writes

Use the fraction scene/notebook controller with a free-play context.
There is no active campaign world/stage/level and no campaign solved
event. The completion panel reports checked moves and no stars. Home,
Equation Workshop and Build another equation navigate without altering
campaign progress, best moves, resume or legacy keys.

## Verification

Unit tests certify the four examples, all sixty existing fraction equations,
alternate denominator-clearing order, both orientations, exact solutions,
capacity, parser rejections, route/no-route behavior, and compatible
physical/notebook transactions. Browser tests cover explicit selection,
Guided/Independent/Apprentice custom play, draft return, save isolation,
invalid input, deep links and small screens. CI and manual visual review
remain required.

## Next PR68 — difficulty audit and final QA

Audit all 60 World 3 levels: exact legal shortest routes and star targets,
difficulty progression and chapter balance, teacher curriculum metadata
and report, all three modes and custom equations, responsive art/hand
choreography and refusal feedback, old-world regression and published
deployment. Do not change supported denominators, introduce signed
fractions, or add fractional crates without a separate design decision.
