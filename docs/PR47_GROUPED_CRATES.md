# PR47: Generalising sealed crates

This PR extends the first Guided crate experiment (Level 19) into two new
four-level chapters, without changing Guided Level 19 or any saved level IDs.

| Stage | New levels | Starting equations |
| --- | --- | --- |
| Independent 17–20 | Inside the Crates | 2(x+1)=8; 3(x+2)=21; 2(x+3)+2=16; 2(x+3)+x=2x+10 |
| Apprentice 13–16 | Writing with Groups | 2(x+1)=8; 3(x+2)=21; 2(x+3)+2=16; 2(x+4)+3x=x+24 |

World 1 now has 20 Guided, 20 Independent and 16 Apprentice levels.
World 2 keeps 20/16/12. There are 104 playable campaign levels.

## Two distinct mathematical actions

A crate containing x and k weights represents (x+k). N identical closed
crates represent N(x+k); the contents are not loose objects.

A normal balance operation acts on both rooms. In Independent Balance,
students visit both rooms separately and must match the operation. In
contrast, opening a sealed group is an **identity rewrite in only that room**.
It changes the representation, not the mass or equality. The engine stores
it as one undoable rewrite and does not permit it midway through an unmatched
pair.

Division must partition both intact crate counts and loose quantities into
whole groups. A crate cannot be fractionally split or have its sealed
contents independently removed. When a room holds both crates and loose
items, the hand discards unneeded original crates directly, and the loose
items enter wicker baskets. Never wrap a whole crate in a basket.

## Physical release

The crowbar opens the original lids in the actual chamber. Sprites bounce
together, the side panels fall down, then weights tumble out of their crates.
Only after the full sequence finishes is the single identity rewrite
committed. Undo and Reset restore original sealed crates. During opening,
existing loose objects retain their own floor space.

Do not add symbolic equations, bracket text or instructional narration to
the physical scene. Signs on the crates are picture-only; the Algebra
Apprentice notebook is the place for symbolic notation.

## Maths notebook

The operation-first editor preserves actual brackets, including adjacent
loose terms, until the student chooses Expand west/east. The learner can
click the corresponding button or type expand left/right. This rewrites
just that expression and records it as its own step; subsequent add,
remove, multiply and divide operations still affect BOTH sides. The
verified notebook route is replayed using the original physical hands.

At the beginning of every level, the selection remains blank.
The system never chooses the correct first move for students.

## Curriculum rationale and QA

The new levels move from identical groups to loose objects outside the
crates and ultimately variables on both sides. Existing stars/progress
remain intact; appended levels introduce additional stars and extend
the complete-stage thresholds. Tests verify all new equations, whole
groups, manual balanced matching, safe one-room expansion, Undo, MathML,
shortest legal routes, real physical opening and mixed-group browser
interactions. Signed, fractional and quadratic crates are future scope.
