# PR73 — Completing the square: optional inspection frame

The Square Laboratory is still locked in the campaign. Direct review
links after deployment (no save or progress credit):

- `/?squarePreview=square-g-18` — Guided, x²+4x=21.
- `/?squarePreview=square-i-14` — Independent, x²+4x+1=13.
- `/?squarePreview=square-g-24` — strategic level, guided fallback.

The direct route accepts only Guided/Independent World 4 fixture IDs;
it projects out teacher reference routes and locks the appropriate
hand mode. Apprentice is deliberately not exposed until PR76.

## Inspection, not a move

Choose **Inspect square** in the later completing-the-square and mastery
chapters (Guided 17–24, Independent 13–20). A single chamber's current
inventory is represented in the same real wooden/brass frame as PR71–72.
The floor tokens remain unchanged; the frame temporarily replaces their
visible and accessible representation. Two guides are non-counting.
Every original object maps once to a filled cell or leftover tray slot.
Empty positions have no actor. Neither a failed candidate nor a
completed candidate changes the equation, the balance, tools, history,
stars, progress or local storage. Switch chamber, Close, Escape or select
any ordinary tool to dismiss. Inspection is disabled during an animation,
a pending first hand visit, paper-first play and success/replay.

## Different levels of scaffolding

Guided fits a candidate from a² square sprites and exactly 2ab round
sprites, where a,b are nonnegative whole side markers, a>0 and a+b<=6.
It deliberately does not inspect the solution, opposite chamber,
reference route or constant corner to choose a side. It highlights
empty weight-corner positions; no numeric move is selected for the learner.
When the quadratic/mixed regions do not fit, the learner chooses their
own side. A complete square can also be inspected.

Independent always opens with zero selected markers: learners choose
the number of round-sprite and weight markers along one side. The other
side matches their choice. They see their own candidate's filled cells,
neutral dashed holes and leftover tray, with no fitted hint or special
corner highlight. The accessible description states visible counts, not
an action or hidden answer.

Apprentice retains the paper-first approach; no frame while writing or
replaying. The policy is explicit curriculum metadata, not a global
extension to older worlds. Fix the shared positive-object picker so
explicit Square Laboratory permission includes square sprites; keep
the old lock in ordinary positive-number worlds.

## QA

Shared exact candidate allocation is also used by the existing refused
root diagnostic. Tests exercise all 27 bounded nonempty candidate sides
on both rooms of all 60 fixtures, guided inference, manual bounds,
visibility policy, exact counts, no mutation, actual bilateral completion,
principal root and Undo. Browser tests exercise guided and independent
preview routes, real move completion, candidate reset and chamber switch,
pending move disablement, Escape, mobile geometry, no credit, older
worlds and locked board. CI and manual visual review remain outstanding.

## Next PR74

Publish all 24 Guided Squares levels, proper World 4 navigation,
world-aware saved progress/resume, certified or explicitly verified
star targets, build-vs-isolate goal presentation, introductory square
tools and the inspection frame in the later chapters. Keep Independent
and Apprentice unpublished until their own PRs.
