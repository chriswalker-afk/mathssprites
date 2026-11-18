# Mathematical model and QA invariants

## Mathematical truth beneath the toys
There is **one canonical algebra engine**, shared by Guided Mirror, Your Turn, the balance needle, the hand's preview, the comic panels and the pencil's symbolic notation.

The **first five playable puzzles** use one unknown with nonnegative integer coefficients and constants and a uniquely solvable positive integer answer. **Design the engine for signed terms from the start** so the later white-sprite and balloon chapters do not require changing what an operation means. Fractions and extra variables are separate later features.

The equation is never shown during play. The engine holds it regardless.

### Five token kinds

| Physical token | Algebraic value | Signed contribution |
|---|---|---|
| Black dust sprite | `+x` | positive variable term |
| White dust sprite | `−x` | negative variable term |
| Square black dust sprite | `+x²` | quadratic area term |
| Unit weight / stone | `+1` | positive constant |
| Balloon | `−1` | negative constant |

Each room stores integer counts for each token kind. Visual positions, bouncing and temporary area arrangements are presentation only. The mathematical projection is

`Room(x) = squareCount·x² + (blackCount - whiteCount)·x + (weightCount - balloonCount)`.

For the first signed chapter, the level's solution `s` remains positive. The fantasy balance maps signed contributions to downward/upward force, **never to the sprite's animated vertical coordinate**.

## Two-phase hand operations
Every completed equation operation consists of the same operation on the left and right room. Two modes change only **how the player submits those two halves**:

- **Guided Mirror:** one user command creates and animates the two halves, then commits one logical transaction.
- **Your Turn:** the first half is shown as a **pending** operation, the beam temporarily tilts, and the player must repeat the same operation on the second room. Until completed, the pending operation is reversible and **not part of the committed mathematical history**.

A single hand naturally visits rooms sequentially. The engine must not present its temporary middle pose as a legal final equation state. In Guided Mirror, validate both rooms before the first hand visit so neither side can be left unfinished. In Your Turn, a physically possible first-side action is allowed even when it cannot be matched in the opposite room. The first action is **provisional only**, cannot become a valid equation step by itself, and may be safely undone. If the second room cannot perform the matching action, visually demonstrate why and roll both sides back. If the second room performs a *different* action, preview the resulting balance, explain unequal changes, then undo both actions.

Matching means identical **algebraic operation**, signed token type, count and group factor. Zero-pair side effects may differ between rooms; this does not make the mirrored operation different.

## Valid equation transformations

1. **Add signed term(s):** add the same `+x`, `−x`, `+1` or `−1` tokens in each room. This adds the same expression to both sides. A positive and a negative term may form zero pairs.
2. **Remove signed term(s):** physically remove matching existing objects from each room. Removing `−1` means **subtract `(-1)`**, not subtract `1`. In more advanced chapters, adding the opposite token is an equivalent operation but should remain a distinct recorded physical action.
3. **Multiply by positive integer `k`:** build `k` complete copies of **each room's entire expression**; never duplicate only one chosen type.
4. **Divide by positive integer `k`:** after zero-pair normalization, place the *entire* contents of **each room** into `k` baskets that have identical contents **within that room**. Remove `k−1` full baskets from each side, retaining one group in each room. The group's container itself contributes **zero** weight.
5. **Square pure rows:** with x≥0, `n` round x sprites become `n²` square x² sprites, or `n` weights become `n²` weights. This models `(nx)²=n²x²`. Reject mixed expressions such as `x+2`: squaring them would also require cross terms, which the pure-row geometry model does not yet represent.
6. **Principal square root:** arrange `n²` square x² sprites or `n²` weights into an n×n grid, then keep one side: `n` round x sprites or `n` weights. This assumes x≥0 so `√(x²)=x`. Reject mixed expressions, imperfect-square counts and negative areas.
7. **Cancel a zero pair:** `(+x)+(-x)=0` and `(+1)+(-1)=0`. These are **local algebraic simplifications** with no value change, so they may occur in one room without a parallel action. Log them as ordered **visual subevents** attached to the triggering transaction, not new bilateral operation steps.

### Whole-item chapter restrictions
- A divide by `k` move is permitted only if **each room** can form `k` identical groups from **whole** sprites, whole weights and whole balloons, after permitted zero-pair normalization. Operationally, the canonical variable coefficient and constant coefficient of each room must both be divisible by `k`. The animation must be able to realise that partition with real visible tokens.
- Reject `k=0`; never silently split a creature or stone.
- If division would create fractions in a whole-item level, the hand-owner can say that they prefer not to deal with fractions **in this experiment**. The mathematics of fractions is legitimate and unlocks in a later chapter.
- Reject subtraction that cannot be performed using the chosen physically present tokens; do not invent a token removal while displaying another action.
- Cap `k` and token growth to keep counting and room layout usable.

## Cancellation animations
- **Black + white:** hop together and vanish in a little puff, then remove exactly one of each from physical state.
- **Weight + balloon:** balloon lifts its matched weight and the pair floats away, then remove exactly one of each.
- Make the before-cancellation pair visible long enough to understand the zero relationship.
- Normalization must preserve the net signed coefficients. Deterministically log token IDs, order, animation type and post-normalization scene. Undo must recover tokens and their positions.
- Automatic normalization in the scene happens at a controlled beat, not at unpredictable physics collision time.

See [signed tokens and chapter example](SIGNED_TOKENS.md).

## Data contracts for implementation
Store every level as: `levelId`, `hiddenInitialExpressionLeft`, `hiddenInitialExpressionRight`, `positiveIntegerSolution`, allowed operations, mode options, and constraints.

Store every completed user transaction as:
- precise operation and signed operand / factor;
- ordered two-room physical hand actions, including whether manual mode was used;
- before and after **canonical expressions**;
- before and after physical object snapshots;
- cancellation subevents;
- optional reason code for hints / dialogue (not a new equation step).

Use these transaction records as the **single source of truth** for the animated comic-book replay, pencil writing, and Undo / Redo. Never infer the equation from screen pixels or animation coordinates.

## Invariants / automated tests

1. If `L(s)=R(s)` before a completed valid transaction, then `L'(s)=R'(s)` afterwards.
2. The two halves of every committed transaction are algebraically identical.
3. The mathematical expression of any one room is unchanged by a local zero-pair cancellation.
4. Intermediate Your Turn states are pending, cannot win and cannot initiate unrelated commands. Undo restores the exact prior state.
5. A divide-by-`k` move yields `L/k` and `R/k` and one visible group per side, or rejects without partial action.
6. The intended positive-integer answer stays the unique solution to every committed equation.
7. In early chapters, success means exactly **one black sprite with no other items in its room** and only `s` unit weights in the other; no hidden uncancelled zero pairs.
8. Replay yields **one panel per complete student transaction**, plus optionally setup/finale panels, and writes the matching initial, intermediary and final symbolic equations.
9. Reduced-motion and non-visual modes preserve the same interaction outcomes and written equations.
10. A refusal for fractions fires **only if** the requested operation would be nonintegral in that level's whole-item representation.

## Curated tests

| Initial expression | Student action sequence | Result |
|---|---|---|
| `x+2=5` | subtract two weights on each side | `x=3` |
| `3x=9` | divide both expressions into 3 equal groups | `x=3` |
| `2x+4=12` | subtract 4 weights, then divide by 2 | `x=4` |
| `2x+3=x+7` | remove one black sprite on each side, then remove three weights each | `x=4` |
| `5x+10=20` | divide the entire arrangement by 5 | `x+2=4` |
| `2x-2=x+2` | remove one black each; **add** two weights each; cancel left weight/balloon pairs | `x=4` |

Rejections:
- Remove a sprite from a room with none of the selected kind.
- Divide `x+1=5` by 2 in whole-item mode.
- Divide any room by zero.
- Commit a first-side-only action as a finished equation move.
- Skip a recorded step or mislabel removal of a `−1` balloon as subtraction of `+1`.

## Future mathematical chapters
- **Fractions:** split containers and fractional tokens, with explicit semantics and correct symbolic fractions.
- **Multiple variables:** separate creature family with actual constraints / linked balances; a single equation in two unknowns is generally insufficient.
- **Further quadratic operations:** mixed squares such as `(x+a)²` will require explicit rectangular cross-terms. The current square tool correctly rejects mixed rooms rather than falsely squaring each term independently.
- **Negative solutions of x:** revisit the mass/anti-mass metaphor before allowing `s<0` rather than silently reversing what black and white creatures do.


## Implemented square and square-root chapters (6–8)

The default arrangement of every chamber is one floor-aligned row, even when it must be scaled to fit. To square a pure row, the hand animates a matching column and the remaining cells of an n-by-n grid **before** atomically changing the algebra at contact. A round x sprite becomes a distinct square x² sprite. Square-rooting builds the complete area and keeps a single side; square sprites squish back to round sprites. The row returns to the floor after the demonstration. These transformations are visual explanations of an already validated equation operation, never independent math.

Chapter 6 builds `x²=9` from `x=3` as an *area-building goal*; chapter 7 reverses the process; chapter 8 takes `√(4x²)=√36`, giving `2x=6`, then divides by two. Since the course assumes `x≥0`, principal rooting is valid within the stated domain: outside that domain, `x²=9` has both `x=3` and `x=−3` solutions. The game must not imply otherwise. Both Guided Mirror and Your Turn remain two-sided transactions. Add, remove, multiply and divide preserve distinct x and x² token types without conflating their coefficients.


## Unsuccessful action previews (PR10)

The engine keeps committed equality transformations as the only entries in history. Failed operations return structured information (without mutation): fraction (kind, total, number of baskets and exact remainder), overflow (actual attempted count and 48-object capacity), missing token, unsupported area, or mismatched manual actions. A separate one-room preview may be called in Your Turn for educational display; it cannot itself change the canonical equation.

Fractional pieces are **temporary diagrams**, not algebraic tokens silently introduced into the whole-item engine. For example, a share of 3x sprites into two baskets requires 1 + 1/2 of a sprite per basket; this is rejected for now and both rooms remain unchanged. Overflow items may bounce or tumble beyond the drawn chamber without modifying the actual object counts.

After an observation pause, the hand narrates why the move is inadvisable, announces that it will undo the attempt, then returns the physical arrangement to the last committed equality. A matched, valid two-sided action still commits exactly once at contact. A manual mismatch uses two provisional previews and is rolled back; it must not generate a notebook panel or Undo entry.

**Physical-truth exception:** two nonidentical actions can have mathematically identical effects (e.g. adding one weight versus removing one negative weight). The balance must remain level when the values are equal, even though the chapter may still ask pupils to use matching moves. Misleading tilting would teach false algebra.
