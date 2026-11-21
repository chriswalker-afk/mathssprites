# PR58 — Signed crates across all World 2 modes

## Scope

Append four puzzle levels to **World 2 Independent Balance** and four to **World 2 Algebra Apprentice**, retaining every existing World 2 identifier, equation, revision, best move, completion and previous star threshold. This follows the PR55 free matching, PR56 true signed-crate release and PR57 Guided chapter. No World 1 content is modified.

World 2 now has **60 levels**: 24 Guided, 20 Independent, 16 Algebra Apprentice. World 1 still has 60 levels, giving 120 playable levels and 360 potential stars.

## Pedagogical distinction

- **Guided (already released):** the hand mirrors a balanced algebraic action automatically; opening and pairing reveal one-room identities.
- **Independent:** the student deliberately chooses where to move the hand FIRST, sees a temporary tilt, then must repeat the *same algebraic operation* in the other chamber. Opening a crate is different: it only exposes the equivalent contents in that chamber, requires **no mirrored visit**, but is undoable and counts as one scored step. An unfinished hand visit blocks crate opening.
- **Algebra Apprentice:** the student starts with a correctly typeset **bracketed signed expression**, selects an operation in a maths editor, previews the equivalent equation and explicitly confirms it. The buttons **Expand west** or **Expand east** check and record a single-chamber identity rewrite. The sprites only replay the real physical steps after the written solution is complete. Inside a bracket, `2x−x−1` remains visibly `2x−x−1`, not prematurely collapsed to `x−1`.

All equations here are for teachers/developers, **not shown during the physical Independent puzzle**. Suggested solutions never preselect an action.

## Chapter 5 — Independent: The Two-Handed Crates

| Level | Hidden equation | New reasoning demand | Suggested legally checked route | Difficulty band | Proposed scored par |
|---|---|---|---|---:|---:|
| 17 · The careful unsealing | `2(x−1)+2=8` | Share whole groups before opening; distinguish local rewrite from matching hand visits | ÷2, expand west | 3 | 2 |
| 18 · Visitors outside the crate | `3(x−1)+x−x=12` | Explicitly match black and white sprites that began *outside* sealed groups | ÷3, expand west, +1 | 4 | 3 |
| 19 · East-side surprises | `x+3=2(x−1)` | Choose the **east** crate and isolate a sprite on the opposite side | Expand east, −x, +2 | 4 | 3 |
| 20 · Two hands, sealed negatives | `2(x−2)+x+3=x+11` | Negative units inside crates; unknown on both sides; multi-step matching operations | Expand west, −x, +1, ÷2 | 5 | 4 |

## Chapter 4 — Algebra Apprentice: Brackets of Opposites

| Level | Written starting expression | New reasoning demand | Suggested checked editor route | Difficulty band | Proposed scored par |
|---|---|---|---|---:|---:|
| 13 · A sealed signed line | `2(x+1)−2=10` | Preserve the negative outside brackets; use `÷2` then expand a group | ÷2, expand west | 3 | 2 |
| 14 · A white visitor inside | `3(2x−x+1)=18` | White sprite and black sprites in **same bracket**; no premature simplification | ÷3, expand west, −1 | 4 | 3 |
| 15 · Expand the eastern room | `x+4=2(x−1)` | Expand a **right-side** signed bracket and keep directional reasoning | Expand east, −x, +2 | 4 | 3 |
| 16 · The full signed expression | `2(2x−x−1)+x+2=x+12` | Both types of opposites within and outside a bracket; deliberate step choice | Expand west, −x, ÷2 | 5 | 3 |

The first 52 World 2 levels, all earlier stars and students' latest progress remain valid. The eight new IDs are `op-i-17` through `op-i-20` and `op-a-13` through `op-a-16`, all revision 1. Star thresholds are stored independently of teacher routes and **must** be verified by the real engine's breadth-first teacher audit before merging.

## QA and release acceptance

1. Each starting physical arrangement evaluates to the same integer weight for its solution and respects the 48-physical-object cap.
2. For each Independent action: genuine +, −, × and ÷ require **two matching chamber visits**; an expansion only affects its own room and is refused during an unfinished move.
3. For each Apprentice action: the editor rejects invalid operations, correctly typesets negative terms inside sealed brackets, previews the true next state, supports Undo and replays only the recorded physical actions.
4. Right-hand sealed crates are supported and their expansion never silently changes the untouched chamber.
5. Every published scored par is minimal under all legal actions, accounting for any free in-room zero-pair attachments in the modes that expose them.
6. Existing saves preserve old earned stars and completions; unfinished new levels do not inherit previous completion.
7. Phone and short-laptop QA check the five Independent and four Apprentice chapter cards, no sideways overflow, sealed-balloon release, no duplicate sprites/weights, and both side controls.

## Follow-up

Run classroom play-testing on the transition from Guided to Independent to Apprentice, watching for misconceptions about whether *expansion* requires changes to both sides. The student's visual scene should give the answer, with the maths editor making the distinction explicit in paper-first mode.
