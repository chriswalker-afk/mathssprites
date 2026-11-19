# PR31 — Algebra Apprentice: choose the operation, calculate the equation

## What students do
The notebook's old plain-text **"Write your next equation"** answer box is gone.

Instead, each Algebra Apprentice level begins with the actual equation typeset as **MathML**. A student must choose or type **one operation on both sides**, such as:
- `−3`: remove three weights from each side.
- `+3`: add three weights to both sides.
- `−x`: remove one mystery sprite from each side.
- `−2x`: remove two sprites from both sides.
- `×3` or `*3`: make three complete copies on each side.
- `÷2` or `/2`: divide both sides into two equal whole groups.

The editor offers four mathematical operator buttons **+ / − / × / ÷**, a numeric and `x` keypad, a keyboard-operable operation input, and a *typeset mathematical operation preview*. The current and calculated equations use native MathML rather than students typing an ASCII expression.

### Interaction example
Start: \(x+3=8\).

1. Press **−**, then **3** (or type `-3`).
2. The editor immediately shows **− 3 on both sides** and typesets **\(x=5\)** beneath the starting equation. Nothing has been added to the notebook history yet.
3. Press **Apply to both sides**. That engine-checked transformation is now a written notebook step.
4. Once the equation isolates one sprite, press **Replay with sprites** to make the hand perform the exact chosen operations in the real chambers. Campaign progress and star rating are awarded **only after successful replay**, unchanged from before.

No student needs to guess or manually write the entire next equation.

## Mathematical protections
- `src/notebook-maths-editor.mjs` contains an independent, bounded operation parser and pure MathML renderers. Only `+`, `−`, `×`, `÷`, positive whole-number counts and `x` are admitted. No eval, generic LaTeX parser or external font/library/CDN.
- Preview and Apply use the existing `perform(state,action,"auto")`. **It** validates each chamber's objects, the 48-object capacity, legal multiplication/division factors, stage operation restrictions and whole-group divisions.
- An invalid operation presents the engine's useful explanation and keeps **Apply disabled**. Typed `x = 5`, skipped steps, fractional divisions and impossible removals are **not valid mathematical operations**.
- Preview is pure; it does not append a step or change stars. Apply commits **exactly one** legal two-sided equation transformation. Undo/reset preserve the original balance.
- Check/replay scripts, physical basket animation, completed levels, star benchmarks and progress storage have not changed.
- Stage 3 remains positive whole-number World 1 algebra. Signed, fractional, squared and more advanced transformations are future stages, not accepted as shortcuts here.
- Existing `tryNotebookLine` pure engine API remains for backward compatibility/tests, but **the student UI no longer uses it**.

## Responsive/accessibility
- The maths editor, keypad, live calculated result and notebook remain visible on standard laptops; on exceptionally short screens, the paper's internal editor can scroll rather than clipping actions.
- 44px keypad targets on phones, keyboard Enter to Apply, text label and ARIA status for current/next expressions, `aria-pressed` for selected operator buttons, and specific errors.
- Native MathML renders in browsers without a network dependency. All MathML comes exclusively from trusted numeric engine state; typed input is never inserted into HTML.
- Respect reduced motion; this is a maths editor only and does not add new scene animations.

## Testing
- `tests/notebook-maths-editor.test.mjs` checks parsing, legal/illegal actions, both sides, whole groups, overcapacity, alternative routes, undo, exact replay scripts and MathML.
- Updated earlier Stage 3 campaign, notebook and star browser tests to use **operations** rather than type the next equation.
- `e2e/notebook-operation-editor.spec.mjs` includes operation palette/keypad, live MathML preview, incorrect/illegal action restrictions, `−x` across both sides, 1024×720 / 1092×540 / 375×725 layouts.
- GitHub Actions uploads `artifacts/pr31-*.png` screenshots.
