# PR75 — Independent Squares

Publish the 20 existing Independent Squares fixtures in the public
Square Laboratory, alongside 24 Guided puzzles. The 16 Apprentice
puzzles remain visibly locked. No existing fixture IDs, equations or
Guided thresholds change.

| Chapter | Levels | Purpose |
|---|---:|---|
| The Two-Handed Press | 1–4 | Match square constructions and principal roots |
| Restore the Balance | 5–8 | Clear and share before rooting |
| Rebuilding the Square | 9–12 | Recognise mixed square regions |
| Complete the Picture | 13–16 | Choose the inspection-frame sides and complete the square |
| Independent Mastery | 17–20 | Choose and match a multi-step strategy |

## Hand control

Reuse the real two-visit controller. Either room can be chosen first;
the other chamber remains unchanged until the student explicitly
chooses a matching operation. Clear the operation, kind and amount
after each visit, so even the first chosen tool is not preselected.
Do not reveal whether an intended second move matches in its button
label; the other chamber simply says "Visit other chamber". Show
the physical mismatch or impossible whole-object root, explain and
undo BOTH provisional visits, preserving earlier committed work.
Undo of a first visit is free. Only a committed pair counts as a move.
Existing Guided, preview and previous-world controls are unchanged.

Inspection is optional on levels 13–20. It starts from zero markers,
uses only the learner's chosen side dimensions, and highlights no
special corner. It is unavailable between visits. Rooting uses the
principal nonnegative side; the first three build goals require the
correct constructed area, not just isolation.

## Verified star targets

Independent finite-state BFS on the legal whole-object graph:
1,1,1,1,1,2,2,3,2,2,3,3,3,3,3,3,3,4,4,6.
Every authored route attains the certified minimum. CI checks both
authored and computed shortest routes in both manual visit orders,
one history entry per pair, mismatch, rejected second root and Undo.
Independent has 60 available stars. World 4 totals 44 levels and
132 stars; whole campaign totals 224 levels and 672 stars. Shared v2
records keep Guided, Independent and other-world best scores separate.
Teacher curriculum/report includes the 20 new levels.

## QA and previous release

PR74's initial unit run failed four obsolete assertions about the
previous release state and star totals. Corrected them and the
mathematical suite passed before merge. The subsequent smoke rerun
passed 29/30; its only failure was another obsolete World 4 lock
assertion in the Opposites tests, fixed here. Remaining PR74 focused
browser jobs and PR75 CI/manual visual verification are outstanding.
New browser coverage includes public access, right-first construction,
fresh match selection, rollback of different/invalid second moves,
inspection on phone, scores, replay, resume and next-level navigation.

## Next PR76

Publish 16 Square Algebra Apprentice levels with paper-first exact
whole-object algebra operations, squaring whole expressions and
principal roots, explicit matched transformations, verification before
sprite replay, certified star targets and isolated saves. No inspection
scaffold while writing. Keep Equation Workshop integration for PR77.
