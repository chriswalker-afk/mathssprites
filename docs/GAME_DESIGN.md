# Game design and interaction specification

## Player fantasy
The player is an apprentice in a quiet, peculiar laboratory. Two tiny rooms sit on a precision balance. Their inhabitants are restless soot-like creatures; their belongings are numbered only in the end-of-level reveal. A large, friendly but realistic human hand is the player's instrument.

## Main screen
- **Centre:** two open-front laboratory rooms, each resting on a distinct balance pan, with a shared pivot and a quiet indicator needle.
- **Occupants:** lively black round sprites and neutral unit stones. They settle, jump, look toward the hand and react to nearby changes.
- **Top:** minimal chapter / level / step progress, **no algebraic equation or variable labels**.
- **Bottom:** operation selector (add, remove, duplicate, split), selected item and quantity, Undo, Reset, optional Hint.
- **Pointer:** a giant hand descends from above when the player confirms or drags an operation; the hand must perform visibly corresponding actions on **both sides**.
- **Accessibility:** all actions possible via buttons and keyboard, not dependent on drag; reduced-motion option; readable contrast; sound optional.

## Main interaction loop
1. Observe each room and the level goal.
2. Select an operation, the item type, and a count / group count.
3. Preview matching actions in both rooms (ghosted placements / removals).
4. Confirm; a single hand animates the left and right actions sequentially, while the underlying mathematical transaction is atomic.
5. Contents settle and the balance returns to level. Repeat until one round sprite is isolated opposite a number of stones.
6. **Discovery replay:** the exact player history plays back with labels and symbolic equations, highlighting equivalent operations on both sides. Pause, step, rewind and return to the original visual solution.

## Important UI decision
A hand cannot literally grab the same item on both sides simultaneously. It performs one side and then the other in a short connected animation. The scene shows a temporary intermediate state, but commits the action atomically so the scale never implies that unequal changes are a valid finished move. A short temporary tilt is acceptable *during* a transaction, followed by a balanced settle.

## Feedback and errors
- Unsupported removal: refuse before the hand moves; show the absent quantity with a gentle shake.
- Unequal operation: the preview shows an amber imbalance and cannot be confirmed.
- Wrong but equivalent transformation: allowed, including moves that do not advance toward isolation; Undo available.
- Excessive complexity or loops: optional hint recommends simplifying, not an automatic move.
- Winning condition: one selected sprite on one side, zero other sprites / loose non-unit terms on that side, and only unit stones on the other; its stone count is the solved value.
- **No false physical balance:** when both sides are equal in the puzzle's hidden solution, the beam stays level; the quantity of visibly bouncing sprites is not a measure of their weight.

## Replay: the educational moment
- Freeze the final arrangement and dim the laboratory.
- The original objects receive small floating labels (`x` for each round sprite; `1` for unit stones).
- The initial equation is revealed, e.g. `2x + 3 = x + 7`.
- Each step replays with the corresponding operation written on **both** sides: subtract `x`, then subtract `3`.
- Write the simplified equation after each transaction, ending with `x = 4`.
- Offer a single reflection prompt: “What did the hand do to both rooms to keep them balanced?”
- Preserve the player's own path, including redundant but valid steps, rather than substituting an idealised solution.
- Replay remains intelligible with sound off and reduced motion.

## Mode and scaffolding
- **Discovery** (default): invisible equation, full autonomy.
- **Guided:** highlight equivalent movements and give increasingly explicit hints; equation remains hidden until replay.
- **Replay / Study:** unlocked after completion; full labels and scrubber.
- Future optional Sandbox: build an arrangement and investigate its equation.

## Art and audio direction
An original black dust-sprite species, not a replica of existing film characters. Restrained teen-friendly atmosphere: charcoal, brass, timber, lab glass, softly lit parchment, ambient creaks and small airy creature chirps. Avoid childish badges, candy colours, excessive particle effects and a wizard-school parody.

## Non-goals of the first version
No accounts, network multiplayer, currency, cosmetic monetisation, random puzzle generator, signed numbers, fractions, quadratic solving, or complex multi-variable systems.
