# PR40 — Stacked Sealed Crates

## Purpose
Replace the side-by-side, glass-fronted crate boxes with the approved in-game concept: **a vertical stack of closed wooden crates**, **one hanging picture sign** that shows one dark sprite and three brass weights, and **one separate number label** ("2 crates" or "1 crate") pointing at the entire stack.

This changes the visual representation of World 1 Guided Level 19, *The Sealed Brackets*, without changing its mathematical value, the two routes or the operation counts.

## Approved look and feel
- Heavy warm wooden cases, vertical planks, diagonal braces, bevelled borders and brass rivets, matching the Balance Workshop palette.
- One physically attached, dark-teal, brass-framed **pictogram** on a central crate, with exactly 1 sprite face and 3 weights. The same pictogram indicates the common contents of *every* crate, not just the marked crate.
- A dark-teal, gold-bordered badge to the **left of the whole stack**, joined to the crates by a thin brass line. It reads exactly **2 crates** initially, and **1 crate** after dividing by 2. No algebra or contents sentence is printed on a crate.
- Every crate is visually sealed, rather than appearing to be a mini glass enclosure with its contents already loose. The existing crowbar opens individual lids.
- The pictogram must not become a separate physical actor, duplicate the contents or affect the algebra.

## Architecture & gameplay invariants
- `src/group-crates.mjs` still returns one direct `.token.sealed-crate` per physical crate, each with its original `data-crate-index` and sealed/opened states.
- The sign is attached to **one** crate; it is not duplicated when dividing into wicker baskets.
- The count badge is **not** a `.token`, so the basket distribution treats only real crates as divisible objects.
- Hidden inventory elements remain once per crate so PR39's staged sprite/weight release keeps the correct whole-object count.
- When the release animation runs, source positions are based on the actual crate's lid, not on the one pictogram, ensuring each crate contributes its own sprite and three weights.
- The `floor-track` uses a column arrangement only when it contains crates. Loose-object scenes, World 2, Algebra Apprentice and ordinary baskets retain their existing arrangement.
- Responsive layout: 1092×540, 1024×720, 1440×900, 1920×1080, 375×812. No horizontal overflow, no intersecting heading, and an accessible Expand brackets action.
- Different counts produce the correct count badge; future counts beyond 3 use progressively more compact sealed boxes without changing engine arithmetic.

## Acceptance
- [ ] Two boxes appear *one above the other*, on the floor, rather than side-by-side
- [ ] Exactly one picture sign shows a sprite and three weights
- [ ] Count badge reads "2 crates", is visibly linked to the stack and is not an additional basket object
- [ ] After dividing, one sealed crate remains; the sign remains and the count reads "1 crate"
- [ ] Crowbar contacts each box lid; all sprites are released before groups of weights
- [ ] Both three-move solution routes and Undo/Reset work
- [ ] Responsive views are readable, with no horizontal overflow or clipped count badge
- [ ] Unit tests, Playwright smoke tests and Pages check pass

**Do not merge until the new crate artwork has been visually reviewed.**
