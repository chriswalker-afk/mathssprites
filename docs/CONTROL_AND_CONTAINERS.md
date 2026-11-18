# Hand controls and container mechanics

## Two selectable play modes
The modes teach the **same puzzle** with the **same underlying algebra**. Players can choose mode at the start of a level. Neither shows an algebraic equation before the final reveal.

### Mode A — Guided mirror
1. Player chooses an operation and physical contents (e.g. remove two unit weights).
2. Both rooms show the proposed matching change.
3. The hand visits both rooms in sequence; a **single atomic equation operation** is committed.
4. An optional cue reads: “The same thing happened in both rooms.”

**Recommended default for the earliest puzzles.** It isolates inverse operations before asking players to remember to balance both sides.

### Mode B — Your turn / manual mirror
1. Player chooses an operation in one room and applies it.
2. The scale visibly tips. The game shows **“Now match that move in the other room”**, without revealing algebra.
3. Player must select the other room and perform an equivalent operation with the **same sign, item type, and quantity / grouping factor**.
4. The scale levels, then the complete two-sided action becomes one committed history entry.

Until paired, prevent unrelated actions, changing level, or claiming success. Allow **Undo first move**. For operations that cannot be mirrored, refuse the first action with an explanatory preview rather than trapping the player. Unfinished manual actions do not create comic panels.

Manual mode is not a second maths rule: it is a *two-part input choreography* for a single mathematical transaction. A temporary visual tilt is allowed; no permanent state may remain unequal.

## Containers: making × and ÷ physically meaningful
**Division by k:** in *each room*, the hand arranges the **entire** contents into k *internally identical* open baskets. Each room's baskets may contain a different combination; do not imply left and right baskets contain equal weights. The hand removes k-1 baskets from **each room**, leaving one basket's contents per side.

Example `5x+10=20`, divide by five:
- Left: 5 baskets, **one black sprite and two unit weights in each**.
- Right: 5 baskets, **four unit weights in each**.
- Removing four complete baskets per room leaves `x+2=4`.

**Multiplication by k:** show a model full-room container (or silhouette of the entire group) replicated k times in **each** room; all contents multiply, not just one selected creature. Use a soft, restrained lab-mechanism effect.

**Prerequisite in whole-item levels:** all per-room counts of each uncancelled item type (black sprites, white sprites, weights, balloons) must be divisible by k after neutral pairs are resolved. Never silently divide a creature, weight or balloon into fractional pieces.

**Important:** a grouping basket is a temporary mathematical container, not an extra unit of weight. The container itself contributes zero. Transparent fronts, individual objects still visible, selectable focus/zoom for crowded rooms. Do not introduce opaque containers with undisclosed totals in hidden-equation play.

## Shared operation semantics
- Choose `+`, `−`, `×` or `÷` using icon-led buttons; the textual operation may appear as a verb (“add”, “remove”, “make 5 groups”) but **not as an algebraic equation**.
- Add/remove applies the same signed quantity to both rooms. Removing a balloon is subtracting a negative unit, **not** subtracting a positive one.
- Multiply/divide operates on **every term**, not just the chosen object.
- Preview before committing; reject invalid operations without consuming moves.
- Interactions are mouse, touch and keyboard accessible; no mandatory dragging.
- Hand choreography records logical transaction ID, origin room, physical beats, cancellation beats, target mathematical operation and replay metadata.

## Hand-owner speech bubbles
The human never needs a full character model. A cuff, hand and occasional small speech bubble at the top are enough for personality.

Speech is **trigger-driven and sparing** (e.g. no more than two unsolicited remarks per level); distinct from optional on-demand hints. It should explain *why* a move is unsuitable and never mock a learner.

Example lines:
- Invalid division in a whole-item level: “That would leave part of a sprite. We aren't doing fractions in this experiment.”
- Invalid removal: “I can't take two stones from a room that has only one.”
- Manual mode awaiting the second half: “One room done. The other one needs the same treatment.”
- Zero pair: “Oh! Together those two make nothing at all.”
- Misleading repeated work: “We seem to be putting things back. Maybe there's a shorter way?”

Do not say a division would cause fractions unless the arithmetic genuinely requires fractions under the current representation. Fraction-focused later chapters remove this restriction and use different responses.
