# Level progression and first playable milestone

## Learning progression

Each level begins with **no algebraic symbols visible**. The player manipulates two inhabited scale-rooms, then sees the equation revealed automatically in an illustrated replay.

| Chapter | Physical idea | Algebraic target | Example | New interaction |
|---|---|---|---|---|
| 1. Clearing the room | Remove identical weights from each side | `x+a=b` | `x+5=9` | subtract units |
| 2. Equal baskets | Split each whole room into equal groups | `kx=b` | `3x=12` | divide into containers |
| 3. Two moves | Clear weights, then split | `kx+a=b` | `2x+4=12` | chain steps |
| 4. Across the hall | Remove matching sprites from both sides | `ax+b=cx+d` | `2x+3=x+7` | subtract sprites |
| 5. Rebuilding rooms | Add objects and copy entire arrangements | equivalent linear equations | curated | add / multiply |
| 6. Shadows and balloons | Opposites make zero pairs | signed linear equations, positive x | `2x-2=x+2` | white sprites and balloons |
| 7. Broken pieces | Fractions are legitimate numbers | rational linear equations | curated | fractional objects / groups |
| 8. Sprite families | Multiple variables with linked information | simultaneous equations | curated | linked balances |
| 9. Square cousins | Square sprites encode area / quadratics | restricted solvable quadratics | curated | new math mechanic |

Later chapters are designs, not claims that they already work. Signed terms should be supported by the *engine structure* from the start; white sprites and balloons may be introduced in a dedicated later chapter.

## First playable vertical slice: four curated levels
1. **One little resident:** `x+2=5` → take away two weights from both rooms → `x=3`.
2. **A busy room:** `3x=9` → make three whole equal baskets from each room; keep one → `x=3`.
3. **Clear then group:** `2x+4=12` → remove four weights from each, then divide both rooms by two → `x=4`.
4. **Across the hall:** `2x+3=x+7` → remove one black sprite each, then three weights each → `x=4`.

All four must be playable in **Guided Mirror** and **Your Turn** modes. Algebra must be fully hidden until the automatically triggered comic replay.

## Signed-chapter teaching example
**The balloon problem** `2x-2=x+2`, with positive solution `x=4`:
1. Left room: two black sprites and two balloons. Right room: one black sprite and two weights.
2. Remove one black sprite from both rooms → `x-2=2`.
3. Add two weights to both rooms. On the left, two balloon/weight pairs rise away; on the right, four weights remain → `x=4`.
4. Comic replay **shows the added weights** and writes `+2` to both sides, then displays `(+1)+(-1)=0` where the pairs vanished.

Other signed examples can start with a black/white pair already present for a controlled initial zero-pair demonstration.

## Acceptance criteria for first playable
- Each side of the physical scale is an open-front miniature room; bouncing does not change mass.
- No displayed symbolic equation or variable labels before success.
- Both modes exist. Your Turn requires a matching second action and has clear pending tilt plus Undo.
- Division uses **k equal, transparent grouping containers in each room** and has a proper whole-token guard.
- Multiplication acts on the **entire contents** of both rooms.
- Two-sided operations are one canonical history step even when performed manually in two hand beats.
- The four puzzles are solvable, with correct item counts, balance and win conditions.
- Automatically begin a **comic-book replay** on success with one animated panel per completed step and an animated pencil writing the mathematical equivalent on paper alongside.
- Replay is pausable, step-forward/backward, replayable and usable with reduced motion.
- Contextual hand-owner speech bubbles respond accurately to unsuitable moves; no false “fraction” warnings.
- Inputs work via keyboard and mouse/touch, not solely drag.
- Mathematical model and replay are tested independently from animations.

## Implementation milestones (proposed PR sequence)

**Design baseline (already on main):** concept, mathematics, art direction and level roadmap.

**Next PR — algebra/transaction engine:** signed-capable room values, immutable operations, full transaction history, pending hand-half state, whole-item grouping validation, zero-pair event model and tests.

**Next PR — playable wireframe:** responsive two-room scale, four levels, **both modes**, clickable selectors, containers and Undo.

**Next PR — movement and personality:** black sprite hops, hand choreography, scale tilt, contextual speech bubbles; reduced-motion support.

**Next PR — comic-book algebra reveal:** automatically generated per-move panels, pencil-written equations, replay navigation and full step correspondence checks.

**Next PR — polish / visual QA:** lab assets, sound design, readability, mobile/tablet fit, usability and accessibility testing.

**Subsequent PR — signed chapter:** white sprite, negative balloon, controlled zero-pair animations and signed levels; add focused math/visual regression tests.

## Design choices fixed by latest feedback
- **Two modes**: automatic mirrored hand and player-repeated operation.
- **Transparent containers**: divide-by-five needs five equal-content groups on **each** pan; the containers themselves add no weight.
- **Automatic reveal**: one comic panel at a time, replaying actual operations with a pencil writing equations beside the panels.
- **Hand personality**: occasional accurate, light first-person remark, especially on forbidden fractional partitions in whole-number levels.
- **Signed visuals**: black +x, white −x, weights +1, balloons −1, with zero-pair neutralisation animations.
- **Initial scope**: whole-number levels first; signed engine future-proofing now, signed visuals later.
