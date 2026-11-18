# PR22 — Equation Workshop: custom positive-whole-number balances

The Equation Workshop is **free play** inside World 1, separate from Guided Balance (20), Independent Balance (16), and Algebra Apprentice (12). It is open to everyone **without teacher access or any campaign completion**.

## Student journey

**Home → Worlds → World 1 → Stage Select → Equation Workshop → Write equation → Choose hand method → Build my balance → Play → Algebra comic → Build another equation.**

A direct `?workshop=3x%2B5%3D20` link opens the builder with a draft, **not** an auto-created game. A student must submit a valid equation to generate rooms. The original text stays in the builder when returning. Example chips help a student get started.

The Equation Workshop deliberately uses the same established physical scene and engine, not an SVG depiction or fake mathematical model.

- **Guided Mirror:** choose the tool, kind and amount; the hand performs the *same* operation in both rooms.
- **Your Turn:** move in one chamber, watch the scale genuinely tip, then make a matching move in the other. An inadvisable attempt animates, pauses, explains and reverses as it does in Stage 2.
- **Undo / Reset / Ask the Hand:** remain available. The generic hint prompts a balancing strategy but never displays the unknown value.
- **Comic after success:** physical operations are recorded and written out in the same hand-and-pencil retrospective as the other physical stages. The final replay button is **Build another equation**, not a legacy prototype level.
- Players may switch hand mode between mathematical moves, but never in the middle of a pending first-side move. Reset preserves the custom equation and hand mode.
- The free-play scene never dispatches campaign completion (no stage or level number), and no workshop progress store is created. Leaving returns to the builder or Home.

## Supported grammar and mathematical restrictions

Accepted input examples:

- `x + 3 = 8`
- `3x + 5 = 20`
- `2x + 3 = x + 7`
- `19 = 2x + 9`
- `3x + 6 = 18`

Both sides are sums of nonnegative integer coefficients of `x` and nonnegative integer unit weights, written as `x`, `2x`, `5`, `+`, and one `=`. Uppercase `X`, spaces, term reordering and `0` are allowed. `2x` means two whole sprites; `x+x` is also accepted. No brackets or multiplication sign input; no subtraction inside a chamber, decimal, fractional, signed, power or square-root expressions.

Each initial room may contain **at most 48 objects**; the isolated final opposite room likewise supports a maximum of 48 weights. Hand actions add or remove at most 12 objects per visit and make groups of **2–5 complete objects**, matching the unchanged pure engine. World 1 permission checks disallow signed tokens, square sprites, squaring and roots even if somebody manipulates a hidden control.

### Mathematical checks before showing the game

1. **Syntax and capacity** — reuse `parseNotebookEquation`, which parses rather than executes user text and checks the initial per-room capacity and a length limit of 80 characters.
2. **Unique solution** — for `ax+b=cx+d`, require `a≠c`; otherwise distinguish an identity (infinitely many solutions) from a contradiction (no solution).
3. **Positive whole-number sprite** — require `x=(d-b)/(a-c)` to be a strictly positive integer. Explain separately when the solution would be zero, negative or fractional.
4. **Genuine physical initial state** — build a locked-positive level and confirm `validInitialLevel`; reject a scene that is already solved instead of granting fake completion.
5. **Physically solvable route** — attempt legal operations using `perform`, without shortcuts or a hidden symbolic solver: repeatedly remove shared sprites and weights in handfuls of 1–12, then divide by factors 2, 3 and/or 5 until exactly one sprite remains. If a coefficient contains a factor such as 7 or 11 that cannot be eliminated with the current baskets, clearly explain why the current hand cannot solve it, rather than generating a dead-end. The proof route is never included in student-facing return values or hints.

This last check matters: `7x=21` has the whole-number solution 3, but the World 1 hand cannot split seven sprites into groups of 2–5 using legal integer-preserving transformations. The input is deliberately **rejected**, even though its symbolic algebra is solvable, until the game's physical language expands.

## Supported / excluded examples

| Input | Result |
|---|---|
| `3x + 5 = 20` | Valid: generated sprite and weight rooms |
| `2x + 3 = x + 7` | Valid: sprites occur in both chambers |
| `19 = 2x + 9` | Valid: variable stays on the east side |
| `x = x` | Explain infinitely many solutions |
| `2x + 5 = 2x + 6` | Explain no solution |
| `2x = 5` | Explain fractional solution |
| `x + 5 = 3` | Explain negative solution |
| `x = 0` | Explain zero solution |
| `x = 5` | Already isolated: invite a new puzzle |
| `x + 99 = 100` | Too many objects for a chamber |
| `7x = 21` | Solvable symbolically but not with available baskets |
| `x² = 9`, `x/2 = 4` | Future-world operation not accepted |

The reason is always visible beside the form with a labelled, live-updating status. Invalid input never builds a game scene, resets progress, or changes the mathematical engine.

## Tests and next milestone

Pure `tests/equation-workshop.test.mjs` verifies classification, strict grammar, diverse valid routes, actual engine replay, security boundaries and no route leaks. `e2e/equation-workshop.spec.mjs` covers public navigation, example chips, invalid submissions, automatic and manual hand sequences, real temporary imbalance, Undo/Reset, comic-to-builder return, unmodified campaign storage, direct links, keyboard submission and a 375px phone.

The **next mathematical world** after PR22 is World 2 — Opposite Chambers: support negative numbers with white sprites and balloons through its own campaign, leveraging the existing signed-object prototype without prematurely mixing signed tools into World 1.
