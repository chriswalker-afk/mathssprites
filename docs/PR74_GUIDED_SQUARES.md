# PR74 — Publish Guided Squares

The Square Laboratory is a playable world for the first time. The
24 Guided experiments are all available from the Experiment Board.
Independent (20) and Apprentice (16) are visibly locked. The 60 authored
fixtures, chapter IDs and previous levels remain unchanged. Direct
teacher preview routes still earn no credit.

## Curriculum and progression

| Chapter | Levels | Focus |
|---|---:|---|
| The Square Press | 1–4 | Build exact square areas |
| Opening Squares | 5–8 | Recover one nonnegative side |
| Clear the Area | 9–12 | Clear and share before rooting |
| The Four Regions | 13–16 | Recognise mixed complete squares |
| Missing Corners | 17–20 | Complete the square |
| Master of Squares | 21–24 | Strategic quadratics |

The first four goals explicitly require a completed square in both
rooms; they are not won by the initial isolated sprite. Success and
comic copy distinguish building from solving. Root replay explains the
nonnegative sprite assumption and principal root. Chapter-first cues
are concise and no controls are preselected. The final level does not
claim all levels completed unless the board's actual completion record
says so. The inspection frame remains optional and read-only.

## Certified star thresholds

Independent finite breadth-first search over the legal whole-object
room-count graph gives the minimum moves for Guided 1–24:
1,1,1,1,1,1,1,2,2,2,3,3,2,2,3,3,3,3,3,4,3,4,4,6.
The search enumerates every reachable shorter state, including common
additions/removals, exact division, multiplication, complete-square
construction and roots. It independently found that all authored
reference lengths are minimum. The added CI test checks the resulting
route against the actual engine and verifies no shorter path.

Use the shared v2 records and resume system, with 72 available World 4
stars (204 published levels / 612 stars across all worlds). Earlier
world records and legacy keys are unchanged. Locked stages cannot
receive credit or resume destinations. Teacher curriculum metadata
and report now include the published 24 levels only.

## Regression and QA

PR73 passed unit, smoke, visual, navigation and notebook checks before
merge. PR72's full focused area run later failed four assertions:
three transient animation stage waits and an actual empty-frame
cleanup defect. The broad operation selector included the frame
itself (data-operation), unhiding it after cleanup. Scope it to tool
buttons and clear construction metadata; record transient stages with
the existing mutation observers instead of depending on polling
timing. Keep geometric and exact-inventory assertions.

Unit tests certify star minima, both routes on the engine, all level
IDs, 6 chapters, locked stages, exact Undo, isolated save/resume, score
upgrade and all 72 attainable stars. Browser tests cover public entry,
one-move build success, actual completion of a missing corner,
principal-root replay, stars, resume/next, and laptop/phone board.
Update old assertions expecting the world portal to be locked without
relaxing the checks on its unavailable stages. CI and manual live
visual inspection remain outstanding.

## Next PR75

Publish 20 Independent Squares levels with the existing matching
manual-hand controller. Certify their own shortest move targets,
check mismatch/failed root rollback, independently selected inspection
candidates, world-specific progress/resume and actual browser flows.
Keep Apprentice locked until PR76.
