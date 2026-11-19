# PR36 — World 2: The Opposite Chambers

## Scope and parity

World 2 mirrors the complete three-stage shape of World 1, not just its first introductory chapter:

| Stage | Chapters | Levels | How the student works |
|---|---:|---:|---|
| Guided Opposites | 5 | 20 | The hand repeats the student's chosen signed operation in both rooms |
| Independent Opposites | 4 | 16 | The student moves the hand separately in each chamber; only a matched pair commits |
| Signed Algebra Apprentice | 3 | 12 | Students choose/write signed operations in the maths editor; the hand replays the checked working |
| **Total** | **12** | **48** | Every implemented level open for classroom selection |

The 48 World 1 levels and their original IDs, settings and progress remain unchanged. The new level IDs are `op-g-01`–`op-g-20`, `op-i-01`–`op-i-16`, and `op-a-01`–`op-a-12`. Each has a durable chapter ID and its own star benchmark derived from a checked reference route. World 2 uses the same core mechanics and progress/replay architecture; its storage is isolated under `mathssprites.campaign.v2.worlds.opposites`. The legacy v1 World 1 keys remain untouched.

## Mathematics: what every object means

- Black dust sprite: `+x`.
- Pale, different-silhouette sprite: `−x`.
- Brass weight: `+1`.
- Tethered balloon: `−1`.

Black + white makes `x + (−x) = 0`, shown by a mutual hop/puff. Weight + balloon makes `1 + (−1) = 0`, shown by the balloon lifting the weight. The cancelling **two objects are visible first**; zero-pair simplification can happen in a single room because it has zero value, while nonzero transformations must happen in both rooms. The engine records both the transaction and each ordered cancellation event. The physical bouncing height is not mathematical mass.

**Critical boundary:** all 48 levels have a **positive whole-number value of x**. White means `−x` as a term, not a negative numerical solution for the unknown. Negative-valued solutions for x, fractions and signed squaring remain future learning work, deliberately NOT smuggled into this world. World 2 has whole objects and the exact original 2–5 grouping rule. `allowedKinds` explicitly blocks square-sprite objects inside signed linear rooms, and `allowedOperations` blocks area operations.

## Curriculum progression

### Stage 1 — Guided Opposites (20 levels)

1. **Balloons Make Zero (1–4):** positive weights neutralise negative units; introduce 1–4 balloon pairs and a reversed chamber.
2. **The White Visitors (5–8):** white sprites oppose black sprites; add a negative variable term to both rooms or a positive sprite to meet a white one.
3. **Two Kinds of Zero (9–12):** combine both types of neutralisation before whole-basket division.
4. **Across the Mirror (13–16):** reversed equations, white sprites in either chamber, and larger signed linear coefficients.
5. **Master of Opposites (17–20):** plan signed strategies with efficient actions, negative-unit subtraction and division.

### Stage 2 — Independent Opposites (16 levels)

1. **Two Hands, Two Signs (1–4):** one signed action in each room, observing the temporary tilt.
2. **The Matching Experiment (5–8):** black/white collisions and balloon/weight flights may occur on different sides even though the *two hand actions* are mathematically identical.
3. **Signed Groups (9–12):** neutralise first, then divide the remaining physical objects into equal transparent baskets in both rooms.
4. **The Moonlit Challenge (13–16):** reversed rooms, multiple valid strategies, subtracting negative quantities and five-way grouping.

### Stage 3 — Signed Algebra Apprentice (12 levels)

1. **Writing the Opposites (1–4):** backwards-faded support (model of a different example → first-step cue → final-step cue → no cue).
2. **Choose the Sign (5–8):** introduce and contrast `+(−x)`, `+(−3)`, and `−(−4)`; the signed MathML editor calculates every next equation.
3. **Apprentice of Opposites (9–12):** multi-step algebra with negative variable terms, reverse orientation and whole-group division, solved independently before sprite replay.

The notebook parser and preview are **operation-first**, not free text that bypasses the engine. E.g. `+(−x)` means physically adding a *white sprite* to both chambers, while `−(−4)` removes four balloons from both, which is mathematically subtracting a negative term. The result is calculated and typeset as real MathML with separate sign operators and parentheses. Students cannot request one operation that is illegal in either physical room. World 1 continues to reject these signed editor commands.

## World-specific learning experience

- Hall of Doors: World 2 now has an enabled **Explore Opposites** doorway, with its own illustrated door.
- Stage Gallery: world-aware rather than hardcoding World 1; independent cards for all three signed stages. The **Inventor's Desk remains a World 1 positive-whole-number free-play tool**, not a hidden fourth World 2 stage.
- Experiment Board: same world/stage selectors, chapter grids, resume/continue/replay button, separate stars and progress.
- In-game: existing actual token animations, basket choreography, genuine pending manual tilt, Undo, mistakes/rewinds, victory comic and pencil writing; World 2 has **moonlit silver/blue architecture** while the white sprite silhouette and rose balloon stay distinguishable.
- Guided and Independent Level 1: separate signed-introduction cues, each skippable and replayable, stored in `mathssprites.opposites-guide-<stage>.v1` without changing World 1's guide state.
- Restarting a signed experiment preserves `worldId: opposites`, stage metadata and the correct signed controls rather than accidentally reverting to World 1.

## Teacher examples

- **Balloon neutralisation:** `x − 1 = 3`; adding `+1` to both rooms produces `x=4`; the balloon and added weight float away locally.
- **White sprite neutralisation:** `2x + 1 = x + 5`; adding `−x` to both sides produces `x+1=5`; subtracting `1` isolates `x=4`.
- **Subtract a negative:** `x−3=8−3`; remove three balloons from *both* sides, explicitly `−(−3)`, producing `x=8`.
- **Reversed signed equation:** `−x+13=x+3`; adding `x` to both sides, removing three positive weights, dividing by two results in `5=x`.

## Acceptance / regression work

- `tests/opposite-world.test.mjs`: 48 unique, valid, balanced equations; unchanged positive integer solution; reference routes reach a one-sprite endpoint; every step preserves equality; Undo restores exact objects; all 16 Independent routes commit only after BOTH hand visits; all 12 signed notebooks validate and replay exactly; signed MathML and World 1 isolation; stars and storage world scoping.
- `e2e/opposites-world.spec.mjs`: 20/16/12 menus, both zero-pair modes, notebook signed operations and sprite replay, separate stage progress, no World 1 signed controls, correct reset/resume and laptop/phone sizes.
- All original World 1 mathematics, animation, scoring and menu tests must remain passing.

### Visual review before merging

- [ ] Both zero-pair types read clearly before disappearance, including with reduced motion.
- [ ] Pale sprite silhouette is distinct from black without colour alone; balloon flight never looks like an ordinary weight.
- [ ] Hand never visually commits one-sided math in Independent mode; signed quantities only affect the true hidden algebra, not bounce height.
- [ ] The stage cards and signed editor are readable on 1024×720 and 1092×540 laptops and a 375px phone.
- [ ] The world selector retains locked Fraction and Square laboratories, and changing worlds never mixes stars, tutorials, best moves or last played.

**After PR36:** test the entire 96-level two-world journey with students, especially the meaning of subtracting a negative and the difference between `−x` and a negative value of x. Only after that should we begin fractions.
