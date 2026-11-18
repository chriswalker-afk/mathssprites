# PR20 — Algebra Apprentice: notebook-first engine and scene replay

Stage 3 is a **different order of thinking**, not a new number world.

> **Stage 1:** choose a move → the hand mirrors it → see algebra afterward.  
> **Stage 2:** move each hand separately → complete the matching action → see algebra afterward.  
> **Stage 3:** **read the equation → write validated algebra → watch the sprites replay your steps**.

PR20 builds the **reusable Stage 3 mathematics and user interface**. It intentionally **does not release the 12 Stage 3 campaign puzzles**; that is PR21. Stage 3 remains a Coming Soon card (no playable link) for everyone, including teachers. There is a separate **teacher sandbox** in Settings and direct regression URLs, e.g. `?notebook=two-step-09`, for verifying the workflow using an already-built positive-integer puzzle. It awards no Stage 1 or Stage 2 progress and creates no Stage 3 completion record.

## Student experience in the teacher sandbox

1. The paper workspace is shown first. The chambers and ordinary hand tools are hidden to prevent revealing physical solutions before the student's algebra.
2. The starting **equation** (for example, `2x + 3 = 11`) is given. Students type their next complete equation in a single-line, labelled text box; pressing Enter or **Check this line** validates it. Existing checked lines accumulate on ruled paper, annotated with the **actual operation on both sides**.
3. Each accepted line must be the state of **one legal physical two-sided operation**. An incorrect line stays in the input box with a specific, non-spoiler explanation and cannot affect the history.
4. The student can **Undo a line** to try an alternative route or **Start again**. Different valid orders of operations are accepted, but a leap over two required steps is not.
5. Once exactly one dark sprite faces the correct whole-number weights, the paper is marked complete and **Replay with sprites** unlocks.
6. The teacher/student clicks Replay. The paper is hidden, the two rooms appear, and the existing animated hand **performs the student's checked operations** in order, separately visiting left then right. A final physical balance is shown without rerunning the old *paper-after-sprites* comic.
7. **View my notebook** returns to the original checked written steps; **Replay my steps** watches them again.

The sandbox is clearly labelled as such and never pretends that Stage 3's curriculum or completion system exists yet.

## Mathematical validator

`src/notebook-engine.mjs` is pure, dependency-free, and uses the same `src/engine.mjs` transactions as the physical game. It does not evaluate arbitrary user code.

### Supported input grammar

- Exactly one `=` per line.
- A side contains `x`, `2x` or other **positive whole-number coefficients**, positive integer weights, and `+` between terms; `0` represents an empty chamber.
- Whitespace, mixed case `X` and rearranged additive terms are accepted: `x + 3` and `3 + x` describe the same physical chamber.
- Negative objects, fractional/decimal amounts, square/root expressions, brackets, signed tokens and over-capacity scenes are rejected. **No hidden DOM control bypasses these restrictions.**
- Entries are bounded to 80 characters, 16 checked steps, 48 physical objects per chamber, additions/removals of 1–12 objects, and 2–5 groups for multiplication/division.
- Supported operations are the four original World 1 moves, with the same physical preconditions.

### Acceptance algorithm

For each candidate next equation:

1. Parse into canonical nonnegative whole-number `x` and weight counts, without executing or injecting user text.
2. Reject unchanged lines or equations that are **not balanced at the same solution**, without exposing the solution.
3. Generate the bounded list of allowed operations, attempt each using `perform(previousState,action,"auto")`, and compare **both actual after-room contents** with the parsed equation.
4. Accept only if one operation produces **exactly** the student's line. The resulting engine state and transaction history become the next notebook state.
5. At completion, `notebookReplayScript` returns the exact checked engine transaction history. The physical scene replays it using existing `handAct`, basket grouping and cancellation events. It does not solve again, infer new actions from the answer, or invent an animation.

A line `x = 4` written directly under `2x + 3 = 11` is numerically true but **rejected as a skipped step**. The route `2x = 8` then `x = 4` is valid. For `3x + 6 = 18`, **both** `x + 2 = 6 → x = 4` (divide then remove) and `3x = 12 → x = 4` (remove then divide) are valid and generate corresponding, different sprite stories.

A mere commutative rewrite, such as `3 + x = 7` when the current room is `x + 3 = 7`, is treated as unchanged notation, not a mathematical step. Swapping the left and right chambers as a written-only rewrite is not yet supported because it would require an explicit physical swap animation; PR20 refuses it instead of faking a hand operation.

## Existing content and progression safety

- Stage 1: original 20 equations, Guided Mirror, first-visit guide, saved key `mathssprites.progress.v1` all unchanged.
- Stage 2: original 16 equations, separate-room manual control, saved key `mathssprites.independent-progress.v1` all unchanged.
- Stage 3 stage card **remains locked** regardless of stage completion or teacher flag. No Stage 3 progress key exists yet.
- The Equation Workshop is still unavailable; it is not the same as the fixed level preview.
- `?preview=...` still provides the original advanced prototype scenes and signed/square regression tests.
- The teacher sandbox is visible in Settings only when Teacher access is on, and clearly advertises no completion credit. Direct `?notebook=<existing-stage-1-id>` links are reserved for QA and demos.

## Verification criteria

The unit tests check parsing (including malicious-looking text), mathematical equivalence and physical legality, alternate strategies, undo, shortcut rejection, signed/fractional/square exclusion, and exact replay-history consistency.

The browser suite checks the paper-first/no-visible-sprites state, incorrect-line feedback, step confirmation, two-step solution, actual two-room replay, original paper restoration, keyboard and phone input, Stage 3 locked card, teacher sandbox access, and unchanged Stage 1/2 progress storage. The prior campaign and advanced prototype tests must remain green.

## Next: PR21 — make Stage 3 a complete campaign

Author **12 new Algebra Apprentice puzzles**, grouped in a progression of **backwards-faded scaffolds**:

1. **Written with You (1–4):** every equation is shown; early prompts guide the first operation without selecting it.
2. **Choose the Route (5–8):** students pick a valid next line and complete a multistep solution with less scaffolding.
3. **Apprentice Challenges (9–12):** both-sided sprites, reversed equations and multiple valid routes, with independent working.

Implement the actual Stage 3 level select, instructional handover, separate local progress, Stage 2 mastery → Stage 3 unlock (plus Teacher access), completion/replay feedback, and full test matrix for all twelve equations. Keep all questions in positive whole numbers and avoid leaking worked answers before independent attempts.

After PR21: **PR22 — Equation Workshop**, a separately validated free-play equation entry/parser/scene generator.
