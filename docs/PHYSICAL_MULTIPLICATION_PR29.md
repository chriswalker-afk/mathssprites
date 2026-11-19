# PR29 — Physical wicker multiplication

## Student-facing animation

**Division and multiplication are now inverse basket stories using the identical solid wicker artwork and articulated hand.**

For a valid `× n` (n = 2–5), in each real scale chamber:

1. **One wicker basket drops and bounces onto the floor**, in the same design as division. The room's original sprites/weights are still visible on the original floor.
2. The *original token elements* move into that first basket. They are not duplicated.
3. The hand **brings in n−1 additional full wicker baskets, one at a time**, each with an exact copy of *all kinds* of objects in the first basket. Unlike the previous generic prop, each new basket is a solid, textured, lip-and-shadow scene actor that remains where the hand places it. More baskets means faster actions.
4. Hold the **n identical groups** together for the student to inspect.
5. The hand picks up each basket in turn, **pours the actors onto the scale chamber floor**, then throws the **empty basket** away. The whole group merges into one set of objects in the same original room.
6. The existing engine applies the mathematical move **once at the last hand contact/pour**, then renders the final result. In Guided Mirror, the other chamber undergoes exactly the same sequence; in Your Turn, each room is done independently.

For example: starting with 1 sprite and 2 weights, `× 3` shows three baskets of `(1 sprite, 2 weights)`, then combines all three into `3 sprites + 6 weights`. For `× 3` on the opposite side containing five weights, the final result is 15 weights. The mathematical engine is unchanged.

**Division:** original set → equal basket groups → throw away all except one.  
**Multiplication:** original basket group → deliver identical copies → pour all groups onto floor → throw away the empty baskets.

## Technical architecture and invariants

- `src/multiplication-baskets.mjs`: timing, copy-plan helpers, hand-delivery, physical placement, per-basket pouring and empty-basket discard choreography. Uses the exact `divisionBasketMarkup`, `announceBasketContents`, `aimHandAtBasket`, `attachBasketToHand` and `resetHand` logic shared with division.
- `src/app.mjs`: uses the existing `groups` scene flag (positive = division, negative = multiplication) for **purely visual** stages. The actual mathematical state is unaffected by showing baskets; valid operations are routed to the new scene from Guided Mirror, Your Turn, mismatched-manual trials, and checked notebook replay.
- `src/styles.css`: reuses all PR25 solid wicker, lip, shadow, carry and throw rules. Adds only hand-placement and token-pouring animation.
- `src/engine.mjs`: no changes. Multiplication overflow still rejected *before* theatre. Invalid-action fallback now holds the same solid wicker prop instead of the translucent double basket.
- All original token kinds can be copied, including dark/pale/square sprites, weights and balloons. Neutral pairs still cancel via the engine's existing cancellation animation at the last basket; there is no silent simplification.
- Every incoming group contains one copy of **each** source object. n identical baskets, not just n individual objects, are visually produced.
- Animation-only subevents cannot affect the operation count, star scoring, equality or manual turn history; **one two-room operation is still one move**.
- Reduced motion uses readable static group snapshots with no flying or bouncing. Animations accelerate for factors 4–5 without skipping groups.

## Visual review and QA

`tests/multiplication-baskets.test.mjs` checks:
- Exact identical group copying for mixed signed token kinds, factors 2–5.
- Basket markup identical to division.
- Faster timing for larger factors and reduced-motion milestones.
- Pure engine mathematical totals, one transaction, signed cancellation, and overflow rejection.

`e2e/multiplication-baskets.spec.mjs` includes:
- Physical basket drops, grouping originals, the hand carrying a full basket, all identical basket contents, pouring, disposal and final correct left/right counts.
- Factor 5 with mobile geometry at 390×844.
- Reduced-motion static snapshots.
- Manual two-room paired multiplication.
- Overflow attempt shows wicker rather than the ghost-style prop and leaves engine state unchanged.

GitHub Actions attaches `pr29-*.png` screenshots on the PR smoke suite for visual inspection.

## Acceptance criteria

- [ ] No translucent multiplication group markers or old `held-basket-double` icons appear.
- [ ] Wicker basket visuals are indistinguishable from division's established props.
- [ ] Original actors stay physical, copied groups contain identical varieties and counts.
- [ ] The hand visibly carries in filled baskets, then pours and discards empties individually.
- [ ] Final chamber and balance mathematics match pure engine results, including signed/neutral cases.
- [ ] Reduced-motion and small-laptop/mobile layouts work.
- [ ] All new/old unit and browser smoke tests green; no regressions to division baskets.
- [ ] Human visual review of five screenshot milestones before merge.
