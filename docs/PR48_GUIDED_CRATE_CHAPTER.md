# PR48 — Guided Balance: The Crate Workshop

## Why this chapter follows the first twenty

PR47 shipped the physical crate system across Independent Balance and Algebra
Apprentice. Guided Mirror still had only one grouped demonstration at Level 19.
This change provides four deliberately graduated Guided crate puzzles so pupils
can acquire the representation before being asked to manage two hands or write
an equivalent symbolic expression.

**Preserve the existing 20 Guided puzzles completely.** In particular, the
original Level 19 (Sealed Crates) and Level 20 (The master experiment) keep their
equations, titles, numbers, stable IDs and legacy best-move thresholds. The new
chapter is numbered 21–24, not inserted in the middle of old student progress.
A new chapter can start with simpler mathematics because the representation and
decision to open a group are the new learning targets.

## The four-level teaching sequence

| Guided | Student-facing name | Author-only equation | Solution | Shortest whole-object route | Target |
| --- | --- | --- | ---: | ---: | --- |
| 21 | Two little crates | 2(x+1)=8 | 3 | 3 | Keep a group intact or open it |
| 22 | Three sealed crates | 3(x+2)=21 | 5 | 3 | Coordinate three copies of one group |
| 23 | The visitor outside | 2(x+4)=x+13 | 5 | 3 | Open first; a loose sprite blocks an immediate split |
| 24 | The hall of crates | 3(x+2)+2x+1=x+23 | 4 | 4 | Manage sealed and loose objects with unknowns on both sides |

At Levels 21 and 22, both **divide-first** and **open-first** strategies are
legal and result in the same isolated sprite. At Level 23, trying to divide
immediately would split the loose right-hand sprite, so opening the left-hand
crates is the meaningful way forward. At Level 24, loose sprites can be
removed from BOTH rooms either before or after unpacking, followed by clearing
weights and equal grouping; there is no privileged first highlighted choice.

The shortest-route star benchmarks are mathematically proved through the
bounded breadth-first engine search. Each successful opening counts as one
equivalent-expression rewrite; each two-sided operation counts as one balance
move. The Guided hand automatically mirrors conventional balance operations.

## Visual and interaction contract

- Start with operation, object and amount controls **unselected**. Crate
  opening is available, not highlighted as the answer.
- Keep opaque wood, a physical picture sign, real stacked crates, a crowbar,
  simultaneous bouncing sprites, folding crate sides and falling weights.
- Opening one room never manipulates or changes the other room; opening is
  a representation change, not an unbalanced operation.
- A crate must not enter a division basket. Whole surplus crates are thrown
  away directly, with loose objects kept separate.
- Mixed rooms must retain their existing loose sprites and weights during
  opening, including the short laptop and phone layouts.
- No equations, references to brackets or procedural narration in the room.
  The equation appears in the algebraic replay, after the successful puzzle.
- Signed objects, fractional pieces, negative crates and quadratic groups are
  not added in this chapter.

## Progress and visuals

World 1: 24 Guided + 20 Independent + 16 Apprentice = 60 levels. World 2:
unchanged at 48. Total playable campaign: **108**. Three stars per level:
180 possible in World 1, 324 campaign-wide.

Existing ID-keyed and older number-keyed saves for Guided Levels 1–20 stay
valid and are never silently rewritten. Players who completed twenty Guided
levels still own those twenty completions and stars, but the new four cannot
be awarded without play, so Guided mastery now requires all 24.

The new sixth chapter has its own warm wooden colour treatment and emblem. In
the Experiment Board, six Guided chapters are laid out in two rows of three
instead of a lopsided five-and-one arrangement.

## QA

- Every Guided level, including all four new ones, is valid for the actual
  whole-object physics engine and can be solved and fully undone.
- Alternate ways to solve 21, 22 and 24 are proven separately.
- The star-rating breadth-first search proves no route shorter than
  3, 3, 3, 4 respectively exists under the legal operations.
- The teacher curriculum records the representations, independent
  variable-sides/fraction flags and a within-chapter difficulty pattern
  of 3 → 3 → 4 → 5.
- Browser tests verify new levels, neutral controls, no leaked mathematical
  prompt, physical crate division/opening, a failed premature split, star
  ratings, Undo, old saved progress and the final mixed-room visuals.
- Signed World 2 and both other World 1 modes remain unchanged.
