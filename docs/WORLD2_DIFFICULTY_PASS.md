# PR49 — World 2 difficulty balancing pass

## Goal

Correct the *actual mathematical progression* of the 48 shipped Opposite
Chambers puzzles rather than simply changing difficulty labels. World 2 still
has 20 Guided, 16 Independent and 12 Algebra Apprentice levels. All IDs,
level numbers, chapter indices and save keys remain stable. The unknown's value
remains a positive integer; the signed objects model negative terms.

## Findings and corrections

Previously, Guided Levels 5–6 introduced white sprites without having any
white sprite in their initial rooms; Guided 9 repeated an early one-move
balloon problem in the combined-cancellation chapter. Guided 18, Independent
15 and Apprentice 8 were one-step puzzles within late strategic chapters.
Independent 5–6 and Apprentice 5–6 had no initial signed representations
appropriate to their named learning objectives.

Eleven puzzles have been revised, and every optional hint is now conceptual
rather than telling the student the operation or numerical amount.

| Stage | Level | Author-only new equation | Solution | Authored route length |
| --- | ---: | --- | ---: | ---: |
| Guided | 5 | x = −x + 6 | 3 | 2 |
| Guided | 6 | 2x + 1 = −x + 13 | 4 | 3 |
| Guided | 9 | x − 1 = −x + 5 | 3 | 3 |
| Guided | 10 | 2x − 2 = −x + 10 | 4 | 3 |
| Guided | 18 | 3x − 2 = x + 6 | 4 | 3 |
| Independent | 5 | 2x = −x + 9 | 3 | 2 |
| Independent | 6 | 2x + 3 = 11 | 4 | 2 |
| Independent | 15 | 4x − 3 = 2x + 9 | 6 | 3 |
| Apprentice | 5 | 2x + 3 = x + 8 | 5 | 2 |
| Apprentice | 6 | 3x − 1 = x + 9 | 5 | 3 |
| Apprentice | 8 | 3x − 4 = x + 6 | 5 | 3 |

The canonical equation in Apprentice 5 is unchanged, but the physical east
room now has a genuine balloon/weight mixture, making its signed representation
real. Independent 6 likewise uses actual balloons, although its displayed
canonical equation has no negative term: students must think about how two
rooms simplify differently. Guided 18, Independent 15 and Apprentice 8
include balloons on BOTH sides, and subtracting a negative is one useful step
in a multi-step solution, not the complete answer.

## Difficulty model

The teacher-only curriculum entries have rebalanced 1–5 difficulty bands,
explicit content revisions, and measured initial zero pairs. New flags mark
relevant fraction traps and meaningful alternative strategies. The labels
are author hypotheses; the authored routes in World 2 are still valid
reference routes, not globally certified shortest paths.

Every new route uses the actual engine. Targeted automated enumeration rejects
one-step shortcuts in all eleven revisions and two-step escapes in seven
revised strategic examples. The full signed route unit tests, manual two-hand
matching, written signed operations and physical replay remain required.

## Saved progress — historical credit without false current mastery

Changing an equation under an existing stable ID could wrongly grant a
student stars for a question they had never solved. Renaming the IDs would
lose continuity. PR49 retains the ID but adds a content-revision stamp:

- Unchanged puzzles still use revision 1; all existing completion and best
  scores remain credited exactly as before.
- The eleven rewritten puzzles use revision 2. Older saved completion entries
  with no matching stamp are kept in the stage's historical collection,
  together with their previous best move count.
- Earlier achievements are not silently credited to the revised problem.
  The level tile reads **Revised · replay**, and the archive is retained.
- A new completion writes the current content revision, earns current stars,
  and leaves the historical achievement available in the same save.
- The original campaign v2 save key and schema version remain, with backward
  compatible optional fields; World 1 and every unchanged World 2 level
  keep their completion, stars and resume history.

## Interaction guardrails

- Blank operation, object and amount selectors at the start, for all worlds.
- No mathematical equation, authored route or difficulty label before the
  student solves the room. The concise optional hints never provide amounts.
- One mathematical action still affects BOTH rooms. Independent learners
  must complete the matching second hand visit.
- No fractional sprites or weights; no negative value of the mystery x;
  no opening of signed crates in this pass.
- Old level numbers, chapter order and current world navigation stay intact.

## QA and follow-up

Tests audit all 48 stable IDs, all eleven new starting equations, real
signed objects, valid reference routes, whole-number guards, manual matching,
notebook steps, absence of hidden short routes, and save archive/replay
roundtrips. Playwright checks neutral controls, physical signed cancellations,
two-hand matching, notebook changes and an older student's archived markers.

The next distinct task would be a certified shortest-route search for all
48 signed levels and empirical student play-testing of the 4→5 and 8→9
chapter transitions; neither is silently assumed complete here.
