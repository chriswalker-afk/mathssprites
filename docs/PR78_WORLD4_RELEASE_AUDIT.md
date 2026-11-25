# PR78 — World 4 final curriculum and release audit

## Release scope

PR77's mathematical checks, smoke checks and all eleven focused
browser groups passed, including the Independent phone regression.
PR77 was squash-merged to main and GitHub Pages reported successful
build and deployment for commit fa93ebfa801ba83e6aae2ed935f8728f15a22786.

The Square Laboratory has 60 campaign levels and 180 attainable stars.
Across all four worlds there are 240 levels and 720 stars.

## Independent mathematical audit

The independent count-state breadth-first search was rerun for every
authored fixture. All authored routes attained the shortest legal
distance. There is no equation, level ID, level order, content revision
or star-threshold change. The state search is independent of the visual
engine. The new reusable audit cross-checks both its witness and the
authored witness against Guided, both Independent visit orders, the
actual maths editor, the recorded physical replay, Undo, and the
whole-object custom Equation Workshop. The bounded custom certificate
remains a representability test, not a student hint.

| Stage | Levels | Build | Solve | 1 move | 2 | 3 | 4 | 5 | 6 | Peak settled (authored) | Stars |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Guided | 24 | 4 | 20 | 7 | 5 | 8 | 3 | 0 | 1 | 36 | 72 |
| Independent | 20 | 3 | 17 | 5 | 4 | 8 | 2 | 0 | 1 | 40 | 60 |
| Apprentice | 16 | 2 | 14 | 3 | 4 | 6 | 1 | 1 | 1 | 36 | 48 |
| Total | 60 | 9 | 51 | 15 | 13 | 22 | 6 | 1 | 3 | 40 | 180 |

The peak authored settled inventory is 40/48, at Independent 8.
The maximum actual constructed side is six markers (36 cells).
The authored routes use 120 nonempty area frames, two per level.
The largest independent search was approximately 10,030 states,
well within the 50,000-state custom-workshop budget. No fixture exceeds
the 16-move notebook bound. The final level of each stage requires six
committed operations. Every four-level chapter's average minimum
move count is at least that of the previous chapter within its stage.

The progression remains intentionally pedagogical rather than strictly
sorted by number of moves: a short opening problem can introduce a new
representation, after which the next problems increase planning demand.
Manual matching and paper-first decisions create additional demand
without artificially inflating the minimum move score.

## Metadata and physical checks

The teacher report now distinguishes area construction from solving,
mixed complete squares from merely mixed quadratic expressions, and
routes that complete a missing corner. The notebook level 11 title
clarifies that nine weights is the completed corner, not the number
that must be added. The curriculum and README now describe the four
published worlds.

The audit checks exact quadratic, equal cross-region and constant
counts; one-to-one interior cells; non-counting edge markers; and
a single engine-contact beat in both normal and reduced motion.
The incomplete-square/refusal and inspection allocations conserve
every source object, including the leftovers. Exact whole-object
counts are not replaced with a visual approximation.

## Browser and visual verification

Reviewed the retained PR76 desktop/phone area screenshots: board,
mixed-square construction, root retaining one side, missing-corner
inspection, and final written replay. The phone view uses deliberate
vertical scrolling. The PR77 successful focused run did not retain
screenshots; current-release screenshots are requested with full QA.

New browser coverage launches every one of the 60 Square Laboratory
tiles and checks the starting physical inventory or initial paper
equation, correct stage, neutral controls, and zero completion credit
for simply visiting. A shared release probe checks all 12 published
world/stage boards (240 unique level IDs), a Guided custom root,
a right-first Independent phone root, and a paper-first build-square
challenge. All custom journeys must retain the draft and leave
local storage unchanged.

## Reproduce

    npm run audit:world4
    npm run audit:world4 -- --stage notebook --json
    npm run curriculum -- --world squares
    npm run check
    npx playwright test e2e/world4-release.spec.mjs --workers=1

Use the full-browser-qa and visual-review labels to request the
unabridged six-shard regression across Worlds 1–4 and retain artifacts.
PR78 CI must pass before merging. The new World 4 published release
check runs automatically on relevant main changes or manually via
Actions. It first verifies the actual published entrypoint and
key modules against the checked-out revision, polling for at most
three minutes during deployment; then runs the same release probe
against balance.mrwalkermaths.com. It retains JSON and screenshots.

    npm run check:live:world4

The direct probe requires Playwright and Chrome. It should run from
the deployed main revision. A green Pages deployment alone is not
proof that the interactive student journeys work. Do not claim PR78
deployed or fully verified before its own checks finish. No further
campaign scope is needed for the agreed World 4 release.
