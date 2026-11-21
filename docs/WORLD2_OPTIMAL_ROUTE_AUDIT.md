# World 2 certified shortest legal route audit — PR50 baseline and PR57 extension

**PR57 extension (21 November 2026).** The original PR50 results below remain the historical baseline for all **48** previously published levels. PR57 appends four Guided signed-crate levels, with **52** World 2 levels total (24 Guided + 16 Independent + 12 Notebook). All four additions have a **proven three-scored-move minimum**; the new Guided distribution is 4 one-move, 1 two-move, and 19 three-move puzzles. World 2 totals are now **10 one-move, 8 two-move, 34 three-move**, or 156 available stars. Combined with World 1 this gives 112 levels and 336 possible stars.

The expanded teacher-only BFS now enumerates opening intact crates on either side and allows **free zero-pair attachment**; it keys states on exact loose counts and intact crate contents. No pre-existing benchmark or recorded completion is revised. See [PR57's four challenges and tests](PR57_SEALED_OPPOSITES.md). Reproduce the current **52-level** audit using `npm run audit:world2`.

---

## Historical PR50 audit (48 levels)

**Date:** 20 November 2026  
**Scope:** Every one of the 48 currently playable signed-number levels (20 Guided, 16 Independent, 12 Algebra Apprentice).  
**Status:** All 48 teacher-authored routes were independently checked as shortest under the full legal engine action set. **No star threshold needed correction.** The new published thresholds are now stored independently of the authored examples, and CI rechecks their optimality.

## Findings

| Outcome | Guided | Independent | Apprentice | World 2 total |
|---|---:|---:|---:|---:|
| 1-move minimum | 4 | 4 | 2 | **10** |
| 2-move minimum | 1 | 4 | 3 | **8** |
| 3-move minimum | 15 | 8 | 7 | **30** |
| All levels | **20** | **16** | **12** | **48** |

All 48 existing authored examples reach the solution in precisely the published minimum number of mathematical steps. There are alternative shortest paths for many levels: the authored route is **one** efficient strategy, not necessarily the one a student should choose. In particular, adding a signed object, removing its opposite, and resolving a local zero pair can yield different but equally valid sequences.

The par counts remain the same as before PR50, so there are **no new difficulty revisions**, no new replay requirements and **no changes to any existing student star awards**. Available stars remain 144 for World 2, 180 for World 1 and 324 campaign-wide. This audit does not attempt to claim that three-step puzzles are always conceptually harder than two-step puzzles.

## How the shortest route is certified

The author-only code in `scripts/world2-shortest-routes.mjs` performs a **breadth-first search**, independently of authored hints, example routes, difficulty metadata or published star values.

- Enumerates both addition and removal of **1–12** objects for each of the four signed object kinds: dark `+x`, pale `−x`, weight `+1`, and balloon `−1`
- Enumerates multiplication and division by **2, 3, 4, 5**
- Calls the **actual `perform(..., "auto")` engine method** for every candidate, so no forbidden fractions, object overflows, locked kinds or invalid moves are accidentally counted
- Treats an entire two-sided transformation as **one mathematical move**: Independent Balance needs two matching physical visits, while Algebra Apprentice writes and replays one checked line
- Searches every shorter depth before finding a witness of the claimed length. States are deduplicated by the **eight actual signed object counts** across both rooms (plus reserved square/crate slots), **not** just their simplified algebraic value
- Checks the completed state using the game's real `isSolved` function: one positive sprite opposite positive whole weights, with a positive integer mystery weight
- Reports a found shortest witness independently from the teacher-authored example. CI tests verify all 48 witness routes, full Undo, both manual hand visits and signed notebook syntax

**To reproduce** from the repository root:

```sh
npm run audit:world2
npm run audit:world2 -- --stage independent
npm run audit:world2 -- --json
npm run check
```

The CI regression test is `tests/world2-optimal-routes.test.mjs`. It fails if a newly edited level has a shorter legal route than its benchmark, no legal route at that benchmark, an illegal authored route, or an inconsistency between registry, teacher metadata, hand control and notebook.

## Full 48-level audit

These expressions and example routes are for **teachers/developers only**. They are never added to the initial physical scene or used to preselect an answer.

## Guided (20 levels)

| # | Stable ID | Underlying equation | Certified minimum | One optimal authored route |
|---:|---|---|---:|---|
| 1 | `op-g-01` | x − 1 = 3 | **1** | +1 |
| 2 | `op-g-02` | x − 2 = 3 | **1** | +2 |
| 3 | `op-g-03` | 2 = x − 3 | **1** | +3 |
| 4 | `op-g-04` | x − 4 = 2 | **1** | +4 |
| 5 | `op-g-05` | x = −x + 6 | **2** | +x → ÷2 |
| 6 | `op-g-06` | 2x + 1 = −x + 13 | **3** | +x → −1 → ÷3 |
| 7 | `op-g-07` | x + 6 = −x + 14 | **3** | +x → −6 → ÷2 |
| 8 | `op-g-08` | 2x + 5 = −x + 14 | **3** | +x → −5 → ÷3 |
| 9 | `op-g-09` | x − 1 = −x + 5 | **3** | +1 → +x → ÷2 |
| 10 | `op-g-10` | 2x − 2 = −x + 10 | **3** | +2 → +x → ÷3 |
| 11 | `op-g-11` | 3x − 2 = x + 8 | **3** | +2 → +(−x) → ÷2 |
| 12 | `op-g-12` | 3x − 4 = x + 8 | **3** | +4 → +(−x) → ÷2 |
| 13 | `op-g-13` | x + 4 = −x + 12 | **3** | +x → −4 → ÷2 |
| 14 | `op-g-14` | −x + 13 = x + 3 | **3** | +x → −3 → ÷2 |
| 15 | `op-g-15` | 2x − 3 = −x + 12 | **3** | +x → +3 → ÷3 |
| 16 | `op-g-16` | -2x + 20 = 2x + 4 | **3** | +2x → −4 → ÷4 |
| 17 | `op-g-17` | 4x − 4 = 2x + 6 | **3** | +4 → +(−2x) → ÷2 |
| 18 | `op-g-18` | 3x − 2 = x + 6 | **3** | −(−2) → +(−x) → ÷2 |
| 19 | `op-g-19` | 4x − 1 = x + 14 | **3** | +1 → +(−x) → ÷3 |
| 20 | `op-g-20` | 6x − 7 = 3x + 8 | **3** | +7 → +(−3x) → ÷3 |

## Independent (16 levels)

| # | Stable ID | Underlying equation | Certified minimum | One optimal authored route |
|---:|---|---|---:|---|
| 1 | `op-i-01` | x − 2 = 4 | **1** | +2 |
| 2 | `op-i-02` | x − 3 = 2 | **1** | +3 |
| 3 | `op-i-03` | 6 = x − 2 | **1** | +2 |
| 4 | `op-i-04` | x − 4 = 3 | **1** | +4 |
| 5 | `op-i-05` | 2x = −x + 9 | **2** | +x → ÷3 |
| 6 | `op-i-06` | 2x + 3 = 11 | **2** | +(−3) → ÷2 |
| 7 | `op-i-07` | x + 5 = −x + 15 | **3** | +x → −5 → ÷2 |
| 8 | `op-i-08` | −x + 12 = x + 4 | **3** | +x → −4 → ÷2 |
| 9 | `op-i-09` | 2x − 2 = 6 | **2** | +2 → ÷2 |
| 10 | `op-i-10` | 3x − 3 = 9 | **2** | +3 → ÷3 |
| 11 | `op-i-11` | 3x − 1 = x + 9 | **3** | +1 → +(−x) → ÷2 |
| 12 | `op-i-12` | 2x − 5 = −x + 10 | **3** | +x → +5 → ÷3 |
| 13 | `op-i-13` | 4x − 2 = 2x + 8 | **3** | +2 → +(−2x) → ÷2 |
| 14 | `op-i-14` | 3x − 4 = x + 8 | **3** | +4 → +(−x) → ÷2 |
| 15 | `op-i-15` | 4x − 3 = 2x + 9 | **3** | −(−3) → +(−2x) → ÷2 |
| 16 | `op-i-16` | -2x + 25 = 3x + 5 | **3** | +2x → −5 → ÷5 |

## Notebook (12 levels)

| # | Stable ID | Underlying equation | Certified minimum | One optimal authored route |
|---:|---|---|---:|---|
| 1 | `op-a-01` | x − 2 = 3 | **1** | +2 |
| 2 | `op-a-02` | x − 4 = 2 | **1** | +4 |
| 3 | `op-a-03` | 2x − 2 = 8 | **2** | +2 → ÷2 |
| 4 | `op-a-04` | 3x − 3 = 12 | **2** | +3 → ÷3 |
| 5 | `op-a-05` | 2x + 3 = x + 8 | **2** | +(−x) → +(−3) |
| 6 | `op-a-06` | 3x − 1 = x + 9 | **3** | +(−x) → +1 → ÷2 |
| 7 | `op-a-07` | x + 3 = −x + 13 | **3** | +x → +(−3) → ÷2 |
| 8 | `op-a-08` | 3x − 4 = x + 6 | **3** | −(−4) → +(−x) → ÷2 |
| 9 | `op-a-09` | 3x − 3 = x + 7 | **3** | +3 → +(−x) → ÷2 |
| 10 | `op-a-10` | −x + 18 = 2x + 3 | **3** | +x → +(−3) → ÷3 |
| 11 | `op-a-11` | 4x − 4 = x + 11 | **3** | +4 → +(−x) → ÷3 |
| 12 | `op-a-12` | -2x + 26 = 3x + 6 | **3** | +2x → +(−6) → ÷5 |

## Game behaviour and compatibility

The audited counts now live in `src/opposite-star-benchmarks.mjs`, keyed by stage and position, and are mapped to stable level IDs in the campaign registry. The reference example length remains separately available in teacher curriculum metadata as `authoredRouteMoves`. Both worlds' `benchmarkType` now reports `proven-minimum`.

No levels, equations, chapter numbering, starting controls, signed physics, saved records or revision markers are changed by PR50. The PR49 historical achievement policy remains intact. There are no new level-content revisions; existing World 2 progress and stars remain credited.

This is a **move-optimality audit**, not a complete measure of mathematical learning. Suggested future work is student play-testing of signed-object misconceptions, especially whether students notice the difference between `+(−x)`, `−(−x)` and physical cancellation, and measuring how often they find valid alternative routes without prompting.
