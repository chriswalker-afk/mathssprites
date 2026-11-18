# Mathematical model and QA invariants

## Domain
First release uses **linear equations in one variable over nonnegative integer coefficients and constants**. One round sprite denotes an unknown fixed quantity `x`. One identical unit stone denotes `1`. The equation is concealed until replay; all manipulable objects nevertheless have precise algebraic values.

Each room is represented by `ax + b` with `a,b ∈ ℤ≥0`. An initial puzzle has a positive integer solution `s`, and both rooms evaluate to the same number at `x=s`.

## Balance engine
The scale is grounded in the algebra engine, not literal sprite collisions. Each sprite has a stable effective mass `s` for that puzzle; its vertical jump changes only its rendered position. The engine records a sequence of **reversible transactions**, with before/after states and replay annotations.

### Allowed transformations in v1
- **Add:** insert the same quantity of `x` sprites and/or `1` stones in both rooms.
- **Subtract:** remove the same quantity of sprites and/or stones from both rooms, only when each room contains the requested items.
- **Multiply by positive integer `k`:** duplicate the entire contents of each room into `k` equal copies; cap `k` to manage screen crowding.
- **Divide by positive integer `k`:** partition **both** rooms' contents into `k` identical groups of whole sprites and stones, and retain one group per room. In this concrete mode all individual coefficients and constant counts must be divisible by `k`; do not silently split a sprite or stone.
- Never allow multiply or divide by zero.
- All state transitions occur atomically, despite the hand's sequential movement animation.

### Invariants
1. If `L(s) = R(s)` before a valid operation, then `L'(s) = R'(s)` after it.
2. The same algebraic transformation is applied to left and right.
3. Each state is representable by nonnegative whole items for v1.
4. Undo restores the exact prior logical state and reverses or reconstructs the visual arrangement.
5. Every committed action has a canonical symbolic transformation and deterministic replay.
6. A success state has exactly one sprite and no stones in one room, zero sprites in the other room, and `s` unit stones in the other.
7. All generated puzzle inputs have a unique intended positive-integer solution, except deliberately designated demonstration cases.

### Deliberately excluded complexity
- **Negative quantities:** require signed tokens or cancellation pairs.
- **Fractions:** require split objects or fractional weights.
- **Square sprites (`x²`):** may be rendered in future, but **cannot be assumed solvable by linear addition/removal alone**. A distinct non-linear puzzle and factor/grouping mechanic is required, plus reliable solution checking and a valid replay. Do not add a square sprite merely as a decoration to a linear equation.
- **Different-coloured variables:** cannot generally solve a single equation containing two independent unknowns; needs substitution clues, a second scale, or systems of equations. Different colours should never misleadingly imply different unknown values without a constraint.
- **Variables on both sides:** valid and included once one-sided equation solving is established.

## Sample QA assertions
- `2x + 3 = x + 7`, solution `4`: subtract `x` both sides, then subtract `3` both sides, reaching `x = 4`.
- `3x = 12`: partition into three equal groups, reaching `x = 4`.
- `x + 5 = 9`: subtract five stones, reaching `x = 4`.
- `2x + 4 = 12`: subtract four stones then divide by two, reaching `x = 4`.
- Reject subtraction of a sprite from a side containing no sprite.
- Reject division of `x + 1 = 5` by two in concrete-object mode, because the item counts cannot be equally partitioned.
- Reject changing only one room as a completed move.
- Verify replay labels and equations correspond to every actual transaction.
