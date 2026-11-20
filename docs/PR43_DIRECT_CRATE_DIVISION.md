# PR43 — Divide Sealed Crates by Throwing Away Unwanted Crates

## Goal
When dividing a chamber containing **only identical sealed crates**, avoid the
wicker-basket distribution altogether. The crates are already whole physical
packages: the articulated hand should simply pick up each unwanted crate and
throw it away. This is a visual-only change; the pure mathematics is unchanged.

## World 1 → Guided → Level 19
The player sees two sealed wooden crates, one common contents picture and the
count label `2 crates`. When the player divides both rooms by two:

1. No wicker basket appears in the left crate chamber.
2. The hand approaches the **unmarked** upper crate (the original crate).
3. Its fingers grasp it; the same original DOM crate is carried and visibly
   thrown away beyond the room, without opening or splitting.
4. The remaining crate stays sealed in place **with its original picture sign**.
5. The count label becomes `1 crate`.
6. The right chamber still distributes its fourteen loose brass weights
   into two ordinary wicker baskets, leaving seven.
7. The resulting balance is the same as before, and the normal **Open crates**
   action still works on the surviving crate.

All crate removal remains one mathematical operation on both sides.
Do not duplicate the contents, create miniature crate props, introduce
additional equations or change the three-move star target.

## Reusable behaviour

The pure `crateDiscardPlan(count,factor)` decides which original crate indices
to retain and discard. The retained crates form a contiguous group and always
include the crate that wears the **single picture sign**. The logic supports
2/2, 3/3, 4/2, 6/2, 6/3 and larger valid whole-crate counts.

Only a **crate-only** room follows this path. A room with loose weights or
sprites uses the previous basket system; this prevents incorrect mixed-room
visualisations. No changes to the pure equation engine, saved progress, Undo,
Reset, other 95 campaign levels, or World 2.

## Implementation
- `src/crate-division.mjs`: pure division plan and a hand-driven pickup,
  lift, throw, remaining-crates sequence, with exactly one final commit.
- `src/crate-division.css`: full-size wooden crate in the existing hand;
  offscreen throw and simplified reduced-motion state.
- `src/app.mjs`: special render and hand action only for crate-only divide;
  ordinary loose-object rooms still show baskets.
- `index.html`: load the extra scene CSS.
- Tests verify whole-crate grouping, label/sign preservation, throwing of
  original objects, undo and both maths strategies.

## Acceptance
- [ ] No crate-side wicker basket in the 2-crate division animation.
- [ ] Original upper crate is visibly grabbed and thrown by the hand.
- [ ] One sealed lower crate remains, with the picture sign and `1 crate`.
- [ ] Opposite room's loose weights still use normal wicker baskets.
- [ ] No extra captions, algebra text, crate copies or opened contents.
- [ ] Correct final equation, Undo, Reset, three-step strategy.
- [ ] Reduced motion, 1092×540, 375×812 and desktop remain usable.
- [ ] Unit, focused browser and Pages checks pass.
- [ ] Human visual inspection of hand alignment and throw before merge.

Keep PR open for visual sign-off.
