# PR25 — physical wicker baskets and hand-discard division

## Student-facing behaviour

A valid divide-by-k operation now stays inside the original two-room scale:
1. The original sprites and weights remain on the chamber floor while **k empty wicker baskets** drop into that chamber.
2. The **original token DOM elements** move into the baskets. Counts of each token kind are assigned round-robin, so the baskets are internally identical, without duplicating sprites or weights.
3. The hand grips each unwanted basket, lifts it with its contents and throws it off-screen **one basket at a time**. For k groups, exactly k−1 baskets are discarded.
4. The final basket remains visible, then the hand touches it and the surviving group's objects return to the room floor.

The process happens separately for the left and right rooms (Guided Mirror) or on each player's chosen room (Your Turn). Stage 3 notebook replay and the free Equation Workshop reuse the same choreography.

**Important invariant:** basket pickups are *visual subevents*. The mathematical mutation happens once at the last hand contact, through the existing `applyAtContact` callback. No changes were made to the pure engine, solutions, progress or room-capacity rules. A basket itself is never a weighted object.

## Implementation

- `src/division-baskets.mjs`: pure timing/slot/markup helpers and the DOM choreography.
- `src/app.mjs`: renders **the original floor objects** and separate empty baskets; valid division is delegated to the basket choreography, with existing hand orchestration used for all non-division actions.
- `src/styles.css`: earthy woven-wicker textures, strong rim and grounding shadow, falling/landing, token-sharing, basket pick-up and throw states, and responsive sizing.
- `tests/division-baskets.test.mjs`: assignment, timing, empty initial props and motion-mode invariants.
- `e2e/division-baskets.spec.mjs`: basket arrival/sharing/removal counts, screenshots, manual hand control, five-basket mobile sizing and reduced-motion snapshots.

The division stage has sequential `data-phase` values: `waiting`, `dropping`, `sharing`, `ready`, `discarding`, `remaining`. These are visual-only, accessible to browser QA and do not enter the mathematical history.

### Speed tiers

| k | Landing gap | Throw per unwanted basket |
|---|---:|---:|
| 2–3 | 175 ms | 370 ms |
| 4–5 | 125 ms | 260 ms |
| 6–8 (future) | 90 ms | 190 ms |
| 9+ (future) | 65 ms | 125 ms |

The existing mathematical operation control still limits k to 2–5. For reduced-motion preference, the same logical milestones appear as static scenes; no falling, bouncing, rapid flying or hand travel is used.

### Scope protections

- An invalid division remains a reversible **actual-object cut/rejoin**, not basket theatre.
- Pre-division neutral pairs still cancel before grouping.
- A mismatched manual second action still reverts to the prior committed equation after its visual trial.
- The first manual move remains a pending half-turn; it is not silently completed or credited.
- Baskets have zero mass and do not change the physics of a balanced equation.
- The ordinary add/remove/multiply/square/root choreography remains unchanged.

## Visual review

The browser suite captures these PNGs as GitHub Actions artifacts:
- `artifacts/pr25-01-wicker-baskets-dropping.png`
- `artifacts/pr25-02-three-equal-wicker-groups.png`
- `artifacts/pr25-03-hand-carrying-full-basket.png`
- `artifacts/pr25-04-one-basket-remains.png`
- `artifacts/pr25-five-baskets-phone.png`

Check that the rim, basket walls, token silhouettes and hand grip remain clear at both desktop and narrow mobile dimensions before merging.
