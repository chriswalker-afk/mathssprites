# PR26 — all levels open, move-based stars

## Scope
Unlock every **implemented** World 1 campaign level to students immediately:
- Stage 1 Guided Balance: 20 levels
- Stage 2 Independent Balance: 16 levels
- Stage 3 Algebra Apprentice: 12 levels

The three future worlds remain unavailable; teacher tools still control the special authoring previews, not student access.

## A star is a measure of solution efficiency
- **3 stars:** exact minimum legal moves (optimal route)
- **2 stars:** one completed equation move over optimal
- **1 star:** two or more completed equation moves over optimal
- **0 stars:** unplayed or completed before ratings were introduced and not yet replayed

One move is **one committed mathematical operation on both sides**:
- Guided Mirror: the automatic hand visits to both chambers together count as one
- Independent Balance: the student's paired west/east hand visits count as one
- Algebra Apprentice: one written, engine-checked step counts as one only after the **full successful sprite replay**
- Undo, unfinished manual half-moves, invalid experiments, rejected fractional divisions, incorrect second-hand experiments, and animation-only hand motion do not add steps to the final solution route
- The free Equation Workshop and teacher previews earn **no campaign stars**

The game stores the **best move count per level**, rather than the last run. Students can replay any level to improve. No stars are spent or unlocked in PR26.

## Exact optimal move benchmarks
These are shortest valid solution lengths, computed from the game's actual positive-integer operation set (remove/add 1–12 sprites or weights, multiply/divide 2–5, maximum 48 objects per chamber), with room constraints and valid balance maintained at each move.

| Stage | Level 1 onward: optimal moves |
|---|---|
| Guided Balance | 1,1,1,1,1,1,1,1,2,2,2,2,2,3,3,3,3,2,3,4 |
| Independent Balance | 1,1,1,1,1,1,1,1,2,2,2,2,2,3,3,3 |
| Algebra Apprentice | 1,1,2,2,2,2,2,2,2,3,3,4 |

**Regression gate:** a bounded breadth-first search in `tests/star-ratings.test.mjs` invokes the real engine against all 48 levels and checks that the shortest discovered routes match every published benchmark. This prevents an incorrectly labelled "optimal" path.

## Persistence and migration

Stars use their own local-storage key `mathssprites.stars.v1`. This is intentionally separate from:
- `mathssprites.progress.v1`
- `mathssprites.independent-progress.v1`
- `mathssprites.apprentice-progress.v1`

Existing completion records and level IDs are preserved byte-for-byte. Previous completions have no stored attempt lengths and **must not be awarded made-up stars**: level selection shows "Completed · replay for stars" until a new rated successful run. Ratings persist across reloads (unless site storage is cleared).

Per-level `bestMoves` and `ratingForLevel` are derived from the best valid completion. `totalEarnedStars` sums the best ratings across the three stages and provides a safe foundation for later cosmetic/achievement rewards. Maximum currently available: **144 stars** (48 × 3).

## Player-facing UI
- Every implemented stage and level is selectable immediately without teacher access.
- Each level tile displays `☆☆☆`, `★☆☆`, `★★☆`, or `★★★`, plus explicit accessible names.
- Star rubric appears above level selection.
- Stage card and home screen show star tallies; the level selection header shows its stage total.
- On completion, stars and moves appear in the physical success card and in the comic replay heading. Notebook completion has the rating in its replay-complete message.
- If a level is replayed less efficiently, the displayed result for that run is honest, while the **best saved rating** remains unchanged.

## QA expectations
- Fresh account: Stage 1 (20), Stage 2 (16) and Stage 3 (12) all available; future worlds locked.
- Optimal / +1 / +2 or more map to exactly 3 / 2 / 1 stars.
- All 48 benchmarks are validated against the engine.
- Manual half-move does not credit two moves; notebook earns only after full verified replay.
- Ratings persist, only improve, cannot spill between stages, and don't overwrite legacy completion records.
- Free play and teacher previews do not award stars.
- Mobile card, stars and announcement remain legible.
- Run all existing campaign, onboarding, and game-physics browser tests.
