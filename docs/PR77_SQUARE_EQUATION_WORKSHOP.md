# PR77 — Square Laboratory Equation Workshop

Add Squares (World 4) to the free-play builder, with a goal selector:
solve a quadratic balance or build both square areas from linear sides.
Guided, Independent and paper-first Apprentice reuse the actual campaign
controllers, without campaign numbers, routes, scores or saved credit.

## Valid input and constraints

- Whole nonnegative terms joined by +, with exactly one equals sign.
  x² and x^2 are interchangeable. Counts from repeated terms combine.
- Solving requires a genuine quadratic difference, exactly one possible
  weight on x ≥ 0, a positive integer weight from 1 to 48, and a physical
  solution route. Two nonnegative roots (including zero or noninteger
  roots) are rejected. A repeated root is not two distinct values.
- Building squares begins with linear whole-object expressions and at
  most six side markers per chamber. Both resulting areas must fit.
- Each chamber holds at most 48 objects; no signed/fractional objects,
  arbitrary bracket expressions, higher powers, or decimals in this mode.
  Copy/share by 2–5; add/remove 1–12 whole objects per move.
- The existing exact shortest-route graph is shared with the browser.
  Search is bounded at 16 moves and 50,000 visited states; recheck any
  candidate using the actual engine. An unverified challenge is refused,
  not claimed mathematically impossible. Never expose a route or solution
  as a student hint.

## Interaction

The same physical square/root construction, refusal feedback, optional
inspection and independent matched visits remain available. Custom
inspection fits only the learner's current objects in Guided, starts
neutral in Independent, and is unavailable in Apprentice or area goals.
Apprentice requires checked written working before actual replay.
Returning to the builder preserves text, goal, number system and mode.
Direct draft URL parameters also support workshopWorld=squares,
workshopMode=auto|manual|notebook, workshopGoal=area|isolate.
No campaign score/resume writes; earlier builder modes stay unchanged.

## Regression and verification

PR76's corrected mathematical, smoke, notebook, visual and navigation
checks passed. The previous area run exposed an Independent phone failure.
The downloaded Playwright trace showed the next selection occurring
before the busy state was rendered. Render disabled controls immediately
on starting either hand operation, before any animation await; preserve
the existing exact commit and rollback. The same phone regression now
checks the synchronous lock at every visit. Recheck actual final inventory
and the three-star replay, not a relaxed assertion.

Test all 60 World 4 starts as custom challenges in all three controllers,
exact certificates, unsupported input, scope, undo, public workshop
entry, custom solving/building, paper-first credit isolation, reset and
draft return. PR77 CI and manual visual review are outstanding at creation.

## Next PR78

Final World 4 curriculum/difficulty audit: independently verify all 60
benchmarks, all three methods and the custom route constraints, review
physical motion and root/inspection clarity at laptop/phone sizes,
fix any remaining browser regressions, run Worlds 1–3 regression and
verify the deployed site after merge.
