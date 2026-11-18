# Signed quantities: white sprites and balloons

## Visual dictionary
| Object | Meaning revealed at completion | Physical metaphor | Cancellation |
|---|---|---|---|
| Black bouncy dust sprite | `+x` | A standard sprite / pulling contribution | 1 black + 1 white sprite → zero |
| White bouncy dust sprite | `−x` | An anti-sprite / opposite contribution | Mutual hop, bump, little puff of soot |
| Solid stone / brass weight | `+1` | Pulls down | 1 weight + 1 balloon → zero |
| Small tethered balloon | `−1` | Lifts up | Balloon carries the weight upward; both leave |

**A balloon always represents one negative unit, not the unknown value of a sprite.** White must be visibly distinguishable from black without relying on colour alone (e.g. white sprite gets pointed, airy tufts and different hop timing).

## Underlying mathematics
Represent a room with four **nonnegative physical counts**: black sprites `p_x`, white sprites `n_x`, weights `p_1`, balloons `n_1`. Its **canonical algebraic value** is

`(p_x-n_x)x + (p_1-n_1)`.

For a puzzle with chosen positive-integer solution `s`, balance value is `(p_x-n_x)s+(p_1-n_1)`. Signed effects contribute conceptually positive or negative force; a zero pair has a net contribution of exactly zero. **The rendered height of a hopping sprite is never a mass input.**

Annihilation/flight is an **exactly zero-valued simplification inside one room**; it is valid without simultaneously annihilating a pair in the other room because neither room's algebraic value changes. It differs from adding/removing a nonzero quantity, which must be mirrored.

### Neutral-pair animation
1. Both counterpart tokens visibly exist together briefly.
2. They glance/float toward one another.
3. Black and white sprites hop together and disappear in a modest puff; balloon and weight rise together and vanish above the chamber.
4. Game updates the physical token counts *after* the effect; canonical algebra never changes.
5. Record the physical cancellation within the action history for exact replay. Initial zero pairs may be deliberately introduced as a one-time tutorial beat.

Avoid continuous, random collisions deleting objects without an intelligible causal event. Auto-cancel when a newly formed pair is available, with a short educational delay so the relationship remains visible.

## Example level — `2x-2=x+2`, `x=4`
- Left: 2 black sprites + 2 balloons.
- Right: 1 black sprite + 2 weights.
- Remove one black sprite from **each** room → `x-2=2`.
- Add two weights to **each** room → left weights pair with balloons and fly away; right becomes four weights → `x=4`.
- Reveal: the pencil explains both the equivalent operation `+2` and the zero-pair simplification `(+1)+(-1)=0`.

## Mathematical traps to avoid
- Taking away a balloon is **subtracting negative one**, equivalent to adding positive one. Do not log it as subtracting one.
- Adding a white sprite is **adding negative x**, equivalent to subtracting x. The replay must preserve what the player physically did *and* the equivalent algebra.
- Cancelling a black/white pair does **not** “delete two x's” in the algebra. It simplifies `x+(-x)` to zero.
- Real balance pans ordinarily cannot have negative mass. The dial is a *fantastical mathematical balance* responding to positive/negative contributions, not literal rigid-body physics. The animation should make the lifting force metaphor legible.
- Start signed chapters with **positive values of x** so black as a positive contribution / white as a negative contribution is visually intuitive. If levels later allow `x<0`, the semantics of the force metaphor must be revisited and made explicit.
- The initial whole-item chapter must reject operations demanding fractional pieces; the fraction chapter will introduce legitimate split tokens.
- Systems of equations and `x²` creatures require separate mathematical and visual models; these signed-token rules do not magically solve them.

## Signed-engine tests to add before unlocking signed chapter
1. `1 black + 1 white` cancels to zero while preserving the room value at *every* x.
2. `1 weight + 1 balloon` cancels to zero while preserving the room value.
3. `2x-2=x+2` can be solved as described, including logged neutralisation events.
4. Adding two weights to both rooms and then cancelling left zero pairs preserves equality.
5. Removing a balloon maps to subtracting `(-1)`, not subtracting `(+1)`.
6. Undo of a cancellation restores exactly the original physical tokens and IDs.
7. Replay shows all physical actions, cancellation effects and correct symbol changes, in order.
8. Manual-mode partial actions remain uncommitted until paired, even when zero-pair effects fire on the first room.


## PR12 implementation (18 November 2026)

**Maths mode and hand control are separate settings.** The Maths mode selector has two current choices: Positive objects (introductory, no negative kinds permitted by engine) and Signed objects (white sprites and balloons allowed). Users can opt into signed practice on an introductory lesson, resetting that lesson. Signed chapters 11–13 require signed objects, so their opening objects cannot be hidden by selecting Positive mode. Guided Mirror and Your Turn remain independent, unchanged hand-control choices.

**Physical cancellation is animated and atomically recorded:** the hand places the objects; while the hand is at contact, black and white sprites hop towards each other and disappear in a little animated soot puff, or a balloon grabs and carries away its matching weight. With several pairs, they cancel in a deterministic order: sprite pairs first, then constant pairs, one pair at a time. The children see the pair together before it leaves. The engine commits only one mathematical change for the two-sided operation; a local zero-pair event is recorded inside its history entry with its room, ID, before/after counts and animation type.

**Division:** when the current room already contains zero pairs, the pairs are visibly cancelled before making whole-object baskets. The remaining counts must all divide exactly; otherwise the PR10 fractional-piece refusal is shown. We never pretend a half sprite or balloon is a whole object.

**Notebook:** the pencil writes signed operations correctly (for instance, adding a white sprite is + (−x), not +x). Each signed cancellation is shown as a zero-valued subevent before the resulting equation is written. The miniature comic stages likewise show the black/white or weight/balloon pair. Undo restores the exact initial counts on both sides, and Your Turn cannot commit a one-sided step.

**Three new introductory signed puzzles:**
- 11. x−2=2: add two positive weights, letting two balloons lift two new weights away, leaving x=4.
- 12. 2x+3=x+7: add a white sprite to both sides; the opposite sprites cancel. Remove three weights to leave x=4.
- 13. 2x−2=x+2: add two weights to neutralize the balloons; then add one white sprite to both sides to neutralize black sprites, leaving x=4.

All current signed puzzles intentionally retain **positive solutions of x**, and signed-square, signed-root and fractional visual representations are intentionally not added. The existing square/root frame still requires a nonnegative length and an exact area. The rendered vertical bounce or balloon flight is never treated as literal mass in the scale's mathematical calculation.

Test contracts are implemented in tests/signed-objects.test.mjs and e2e/signed-objects.spec.mjs alongside the pre-existing balance, Undo, animation and notebook QA.
