# PR57 — The Sealed Opposites (World 2 Guided, Levels 21–24)

**Status:** Authored in PR57; release only after unit and browser checks. PR56's signed crate art/physics and PR55's contextual matching are prerequisites and are already merged.

## Purpose

Bridge students from individual positive/negative objects to **whole groups that represent brackets**, without changing the physical laboratory or showing the algebra as a hint. There are now **52 signed-number campaign levels**: 24 Guided, 16 Independent, 12 Algebra Apprentice. The former 48 are preserved with their stable IDs, equations, content revisions, completed records and existing star benchmarks.

The four new rooms all have positive solution **x = 5**. Each level is initially shown as sealed wooden crates plus loose real objects, not a symbolic equation.

| # | Stable ID | Behind-the-scenes equation | Actual starting arrangement | Focus | Difficulty band | Independently certified scored minimum |
|---:|---|---|---|---|---:|---:|
| 21 | `op-g-21` | `2(x+1)+1−1=12` | 2 crates of one black sprite + one weight; a loose weight and balloon; 12 eastern weights | Attach a constant pair; share whole crates before opening | 3 | 3 |
| 22 | `op-g-22` | `3(x+2)+x−x=21` | 3 crates of one black sprite + two weights; one loose black and one white sprite; 21 eastern weights | Attach an initial black/white pair; share three complete sealed crates | 3 | 3 |
| 23 | `op-g-23` | `2(x+2)+4−3=15` | 2 crates of one black sprite + two weights; four loose weights and three balloons; 15 eastern weights | Three visible balloon lifts and choosing a suitable order | 4 | 3 |
| 24 | `op-g-24` | `2(x−2)+x+3=14` | 2 crates of a black sprite and **two actual balloons each**; one loose black sprite and three weights; 14 eastern weights | Negative values *inside* brackets, visible cancellation after crate opening | 5 | 3 |

### A mathematically truthful, physical sequence

- A sealed crate is one movable group; while sealed its interior counts remain real but are **not** loose tokens.
- The student may explicitly attach existing `+1/−1` or `+x/−x` pairs within a chamber. This is a one-room, **zero-scored-move** representation change, not an action that must be mirrored on both sides.
- Opening crates is an **undoable, one-scored-step** value-preserving rewrite. A crowbar opens the genuine lids, black/white creatures emerge, panels fall and weights/balloons leave their actual crate. Paired objects that become available are visibly neutralised before the normalized model is displayed.
- Add/remove/multiply/divide remain genuine balance operations on **both** sides, with matched hand visits in Independent mode. Only opening/pairing are one-room rewrites.
- No equation, operation sequence, numeric answer, or proposed par is revealed in the starting scene.

## Reference legal routes (author-only)

- 21: divide both chambers by 2; open the single surviving crate; remove one weight from both chambers.
- 22: divide by 3; open the surviving crate; remove two weights from both chambers.
- 23: open both crates; remove five weights from both chambers (after physical cancellations); divide by 2.
- 24: open the two signed crates; add one weight to each chamber (the final balloon and added weight visibly pair); divide by 3.

A free initial pairing may be selected before the scored route when available; it is not essential because the actual engine also demonstrates cancellation during eligible operations. The shortest-route explorer independently enumerates **all** 104 signed add/remove/multiply/divide choices, and where authored, opening either physical crate stack. The search includes **zero-cost pairing closures**. Its state identity includes every kind of loose token, crate count and contents, not merely algebraic coefficients. Every shorter scored route is rejected before the 3-move witness is certified. Run `npm run audit:world2` to reproduce.

### Impact on saved progress

- Existing World 2 Guided Level 1–20 IDs and benchmark counts are unchanged; revisions from PR49 are unchanged.
- Existing Independent/Notebook records are unchanged.
- Four **new** IDs `op-g-21` through `op-g-24` begin uncompleted, even if a user had previously completed all 20 Guided levels.
- Total campaign levels change from 108 to **112**, with 336 possible stars (World 1: 60 levels/180 stars; World 2: 52 levels/156 stars). Old earned stars remain earned.

### QA coverage

`tests/world2-sealed-chapter.test.mjs`: authored routes, mathematical equality, signed crate actors, initial opposite pairs, Undo, shortest-route certificates and saved progress. `tests/world2-optimal-routes.test.mjs`: engine-exhaustive certification of all **52** signed levels. `e2e/signed-crate-chapter.spec.mjs`: Level 22 physical starting pairing through completion; Level 24 actual balloon release and resealing on phone; the six-chapter board on a short laptop.

The next work after this release is **student play-testing**: check that the difficulty of choosing a representation and interpreting negative contents genuinely increases without relying on text prompts or misleading disappearing objects.
