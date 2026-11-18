# Game design and interaction specification

## Player fantasy
The player is an apprentice in a quiet, peculiar laboratory. Two tiny rooms sit on a precision balance. Their inhabitants are restless soot-like creatures; their belongings are numbered only in the end-of-level reveal. A large, friendly but realistic human hand is the player's instrument.

## Main screen
- **Centre:** two open-front laboratory rooms, each resting on a distinct balance pan, with a shared pivot and a quiet indicator needle.
- **Occupants:** lively black round sprites and neutral unit weights first; later airy white anti-sprites (negative variables) and balloons (negative unit constants). They settle, jump, look toward the hand and react to nearby changes.
- **Top:** minimal chapter / level / step progress, **no algebraic equation or variable labels**.
- **Bottom:** operation selector (add, remove, duplicate, split), item and quantity / grouping count, Undo, Reset, optional Hint, and a visible Guided Mirror / Your Turn mode selection outside the active operation.
- **Pointer:** a giant hand descends from above when a player selects an operation. In Guided Mirror it completes both sides; in Your Turn the player directs its second matching action. Occasional small speech bubbles come from the unseen hand-owner.
- **Accessibility:** all actions possible via buttons and keyboard, not dependent on drag; reduced-motion option; readable contrast; sound optional.

## Main interaction loop
1. Observe each room and the level goal.
2. Select an operation, the item type, and a count / group count.
3. Preview the operation, including whether all objects can be divided into the requested number of **transparent, equal-content containers**.
4. In **Guided Mirror**, confirm once and watch the hand perform both sides; in **Your Turn**, act on one room and then match the operation in the other while the scale temporarily tips. Only a complete mirrored pair is recorded as a mathematical step.
5. Objects may form local **zero pairs**: black/white sprites bump and vanish; weights/balloons float away together. These remove algebraic zero without changing either room's value.
6. Contents settle and the balance returns to level. Repeat until one black sprite is isolated opposite a number of unit weights in the initial positive-solution chapters.
7. **Automatic comic replay:** a panel for each player's completed step unveils in sequence, re-animating the action while a pencil writes the labelled algebra on paper beside the panels. Pause, step, rewind and watch again.

## Two hand modes and pending balance
A hand cannot manipulate both rooms at exactly the same time, so every full operation has two physical beats and **one algebraic history entry**. Guided Mirror automatically directs both beats. Your Turn requires a second matching input; the scale stays visibly tilted, unrelated controls are locked and an Undo option remains until the match. Invalid operations must not produce an unrecoverable intermediate state. [Full interaction specification](CONTROL_AND_CONTAINERS.md).

## Feedback and errors
- Unsupported removal: refuse before the hand moves; show the absent quantity with a gentle shake and optionally a contextual first-person remark from the hand-owner.
- Unequal operation: pending hand action visibly tilts the scale but cannot count as a completed move; prompt the matching action or offer Undo.
- Wrong but equivalent transformation: allowed, including moves that do not advance toward isolation; Undo available.
- Excessive complexity or loops: optional hint recommends simplifying, not an automatic move.
- Winning condition: one selected sprite on one side, zero other sprites / loose non-unit terms on that side, and only unit stones on the other; its stone count is the solved value.
- Whole-item division that creates fractions: refuse in that chapter with a **truthful** brief speech bubble; fractional chapters later allow it.
- Zero pairs: animate clearly without requiring equivalent cancellation elsewhere because their value is already zero.
- **No false physical balance:** when both sides are equal in the puzzle's hidden solution, the beam stays level; sprite animation is not a measure of mathematical weight.

## Replay: the educational moment
- **Automatically** transition to an illustrated lab-notebook composition when the solution is achieved.
- On the **left**, unfold one animated comic-book panel per actual complete two-sided move. On the **right**, an animated pencil writes the corresponding algebra on paper, line by line.
- Reveal object labels **only now**: `+x` black sprite, `−x` white sprite, `+1` unit weight and `−1` balloon, where relevant.
- Each panel reconstructs the original hand move, any local zero-pair cancellation and the resulting equation before the next panel appears.
- Offer pause, previous/next, restart, skip and reduced-motion presentation; preserve the player's own path, even if inefficient.
- End with a legible solved equation and a brief reflection prompt. [Full storyboards and technical contract](COMIC_REPLAY.md).

## Mode and scaffolding
- **Guided Mirror:** player chooses an operation once; the hand makes the corresponding changes in both rooms automatically.
- **Your Turn:** player must repeat the same operation in the opposite room; a temporary tilt marks unfinished work.
- **Hinting:** optional graduated tips in either mode, including sparing hand-owner speech bubbles. Algebra remains hidden until replay in both modes.
- **Replay / Study:** begins automatically at success and can be revisited with panel navigation.
- Future optional Sandbox: build an arrangement and investigate its equation.

## Art and audio direction
An original black dust-sprite species, not a replica of existing film characters. Restrained teen-friendly atmosphere: charcoal, brass, timber, lab glass, softly lit parchment, ambient creaks and small airy creature chirps. Avoid childish badges, candy colours, excessive particle effects and a wizard-school parody.

## Non-goals of the first playable version
No accounts, network multiplayer, currency, cosmetic monetisation, random puzzle generator, fraction-based pieces, quadratic solving, or complex multi-variable systems. The **engine should anticipate signed values**, but negative-piece visuals and zero-pair levels come in the next teaching chapter.
