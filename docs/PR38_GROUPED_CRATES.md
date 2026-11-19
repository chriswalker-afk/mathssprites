# PR38 — The Sealed Brackets (World 1, Guided Level 19)

## Why this experiment exists

Students know that all algebraic operations applied to an equation must keep both sides balanced. Brackets add a *different* operation: an **identity rewrite**, in which a group can be unpacked on ONE side without changing its value. This prototype teaches the distinction physically rather than treating expansion as a new weight-changing operation.

The game contains **two real transparent, glass-fronted crates**, each displaying **one black sprite and three small brass weights**. The pupils can see the group but cannot grab the contents separately while the lid is closed. The mathematical engine represents each entire crate as `x + 3`, not as loose tokens.

### Level identity and placement

- **World:** 1 — The Balance Workshop
- **Stage:** 1 — Guided Balance (the hand mirrors ordinary operations)
- **Level:** 19 of 20, in final chapter *Master of the Balance*
- **Stable ID:** `master-19` (intentionally unchanged)
- **New title:** *The sealed brackets*
- **Equation:** `2(x + 3) = 14`
- **Solution:** `x = 4`
- **Star benchmark:** 3 steps, as for the previous Level 19
- **Availability:** exactly the same as before: all available campaign levels remain unlocked.

Some returning players may already have Level 19 marked complete. This is deliberate to prevent a breaking progress migration; they can choose Level 19 and replay the prototype.

## Two strategies with genuinely different physical choreography

### Route A — Unpack first

1. **Unpack** the two crates on the WEST side. The hand unlatches the lids. Two dark sprites and six brass weights fly out and settle in that chamber. Nothing happens to the east side, because the unboxing is a **value-preserving identity**:
   `2(x + 3) = 14 → 2x + 6 = 14`.
2. **Remove six weights from BOTH rooms**: `2x = 8`.
3. **Divide both rooms by two** using the real wicker baskets: `x = 4`.

### Route B — Divide first

1. **Divide both rooms by two**. The west has two complete crates, so the hand places them one-per-basket and keeps one. The east's fourteen weights become seven: `(x + 3) = 7`.
2. **Unpack** the remaining west crate: `x + 3 = 7`.
3. **Remove three weights from BOTH rooms**: `x = 4`.

Both paths involve three committed, undoable steps and can earn three stars. No artificial 'optimal' strategy is imposed.

## Physical rules

- A crate is *one complete object*. Ordinary Add/Remove actions cannot access individual miniature weights or sprites.
- **Unpack** is a special action available only when a sealed group exists and only in this authored prototype. It is an identity rewrite, not a legitimate unilateral algebraic change.
- **Divide** is permitted when every physical loose-object count AND the crate count divide into complete baskets. A sealed crate must never be chopped into a fraction; a failure is explained and reversed.
- Regular multiplication reproduces complete crates (subject to the object cap); it never distributes automatically.
- Exact room evaluation includes sealed contents (`count * (posX-negX)x + count*(posOne-negOne)`), preserving the mathematical invariant for all operations.
- Undo, Reset, level changes and comic replay preserve the initial grouped representation.
- The miniature icons inside the crate **must not** be treated as loose tokens by the engine, basket assignment, sprite physics or neutral-pair selectors.
- In a classroom, distinguish **equation transformation** (both sides) from **equivalent rewriting** (one side, identical value). These are not conflated by the UI or replay.
- Unpack is counted as one interaction for star ratings in *this prototype*; future curriculum design may separate representation rewrites from balance operations if useful.

## UX and controls

A single optional control is added for this level beneath the usual operation selectors:

> THE SEALED BRACKETS — Each glass-fronted crate holds x + 3. Unpack, or divide complete crates first.
> **Unpack the crates**

The normal **Divide** button starts with factor **2**. If the student tries to remove something locked inside, the hand visibly rattles the crate, pauses, explains that the contents are sealed, and restores the prior scene. No incorrect move enters history. The crate tool disappears after the last crate opens. Hint offers both valid route choices.

## Quality gates

- [x] Two curated three-move engine routes and exact Undo tested.
- [x] Hidden contents cannot be removed or divided fractionally before unpacking.
- [x] World 1-only permission on `unpack`; the other 95 campaign levels are not modified.
- [x] Correct (2(x+3)) equation before opening, (x+3) after division and expanded algebra after unboxing.
- [x] Updated 48-level shortest-route proof to include crate state and Unpack; 3-star benchmark stays valid.
- [ ] Browser smoke: two true on-screen solution routes; basket pickup, lid opening and replay.
- [ ] Manual screenshot review at 1092×540, 1024×720, 1440×900, 1920×1080, 375×812.
- [ ] Verify the human-facing locked-crate warning gives time to SEE the rattle before the hand explains.

## Follow-up, not in this PR

After approval, decide whether brackets should expand into World 1's **late Independent and Algebra Apprentice** exercises and World 2's opposite crates. For World 2, a signed multiplier must change *every* inner term, but `-x` remains an opposite sprite, not a negative value of the unknown.
