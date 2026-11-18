# PR14 — Maths Sprites site navigation and campaign boundaries

## Student journey

1. Home: a contextual introduction, Play/Continue, World Select, How to Play and Settings.
2. World Select: four thematic laboratories. Only World 1 is enabled. Future worlds are intentionally visible but inaccessible.
3. World 1 Stage Select (PR18–21): Guided Balance (20 playable), Independent Balance (16 playable after Stage 1 mastery), Algebra Apprentice (12 notebook-first levels after Stage 2 mastery), and Equation Workshop (still planned). Teacher access opens all implemented levels.
4. Stage-specific level selection: five four-level chapters in Guided Balance (20 levels), four four-level chapters in Independent Balance (16 levels). Progress and level unlocking are independent.
5. Play: the original two-room scene with Guided Mirror **fixed** for Stage 1 and Your Turn **fixed** for Stage 2. The independent hand genuinely tips the scale after the first move; only the matched second move commits the equation step.
6. Success: committed hand transactions replay as comic panels with handwritten algebra. The final level of either stage returns to Stage Select.

### World definitions

| World | Maths scope | Status |
|---|---|---|
| The Balance Workshop | positive whole-number initial values, operations and solutions | playable (20 puzzles) |
| The Opposite Chambers | negative numbers, white anti-sprites, balloons, cancellation | locked placeholder |
| The Fraction Workshop | exact fractional objects and arithmetic | locked placeholder |
| The Square Laboratory | in-room squaring, square roots and area models | locked placeholder |

World 1 contains 20 slots grouped into Clearing the Room (1–4), Equal Groups (5–8), Two-Step Experiments (9–12), Across the Hall (13–16), and Master of the Balance (17–20).

All 20 puzzles are playable following PR16, organised from simple one-step manipulations to multi-route strategy problems. The previous 13 prototype experiments remain in the engine, including early two-step, both-sides, signed and area problems, rather than being overwritten or incorrectly presented as student-facing advanced worlds. Teacher reference solutions and all level maths are documented in [WORLD1_CAMPAIGN.md](WORLD1_CAMPAIGN.md).

## Boundaries and enforcement

- A campaign level carries `lockPositive: true` and an explicit `allowedOperations` allowlist containing add, remove, multiply and divide.
- `initialState` rejects an attempt to create signed mode from a locked positive level.
- `perform` and `prepare` check operation permissions before any state transition, including manual moves. They reject square/root actions even if called outside the UI.
- The scene hides square/root operation controls, square-sprite selection and negative tools, and hides the prototype-level and quantity-mode selectors.
- Whole-object division has its original exact integer guard; fractional pieces still appear only as a temporary failed-move teaching animation.
- The engine and 13-item `LEVELS` experiment library are preserved. `?preview=resident` (or `?preview=<known-id>`) enters a **separate authoring/QA preview** used by the existing browser animation and mathematical regression tests.

## Saving, teacher access and accessibility

- `mathssprites.progress.v1` stores completed World 1 level numbers and the most recently playable level.
- Unlocks are sequential; completion cannot unlock an unimplemented level.
- `mathssprites.teacher-unlock.v1` allows all **implemented** World 1 levels to be used individually in class. It never unlocks placeholders or changes a level's mathematical restrictions.
- Reading or writing blocked browser storage is non-fatal. When persistence is unavailable, progress is retained in the current page only.
- All navigation and actions use buttons, accessible labels and focusable page headings. Stage 1 locks automatic mirroring, while the preview route preserves both hand modes and existing reduced-motion controls.
- The site uses only repository-local HTML, CSS and ES modules. No network services or accounts are required.

## Browser QA / acceptance

- Opening `/` shows the home page, not the balancing scene.
- World cards show exactly one available world and three unavailable placeholders.
- The level map shows five chapter groups and 20 slots, but only Level 1 opens initially.
- Completing Level 1 automatically launches its algebra comic, stores progress and permits Level 2. After a reload, the home Play action continues at the correct level.
- Teacher access unlocks all 20 World 1 levels but never later, unimplemented mathematical worlds.
- World 1 physically and mathematically blocks signed objects and square/root actions.
- Prior animation, neutral pair, area, fraction-cut and replay browser tests still run in preview mode.

## PR17 — Player-experience polish

The World 1 campaign now has five distinct chapter visual themes, optional first-visit Level 1 coaching, contextual chapter introductions, visible completion progress, a balanced-scene celebration before comic replay, a finished-workshop mastery screen and larger mobile touch/replay controls. Teachers can turn guidance off or restart the introductory sequence. All first-world mathematical restrictions and the 13 legacy experiments remain untouched.

See [PR17_EXPERIENCE.md](PR17_EXPERIENCE.md) for the intended walkthrough and browser QA criteria.

## PR18–19 — Three-stage World 1

PR18 introduced the stage map and fixed automatic mirroring in Stage 1. PR19 adds all **16 Independent Balance** puzzles, the separate-room hand tutorial, real provisional scale tipping, stage-specific progress and Stage 2 unlocking (Stage 1 mastered or teacher access). Stage 3 now provides a complete notebook-first campaign; only the custom Equation Workshop remains unavailable. See [WORLD1_STAGES.md](WORLD1_STAGES.md) and [STAGE2_CAMPAIGN.md](STAGE2_CAMPAIGN.md).

**PR20:** The Stage 3 notebook-first checker and actual hand replay are now available in a clearly identified teacher sandbox via Settings or a test URL such as `?notebook=two-step-09`. PR21 adds Stage 3 level cards, backwards-faded help, stage-specific progress and replay-based mastery. See [the notebook design and QA checklist](STAGE3_NOTEBOOK_FOUNDATION.md).

**Next: PR22.** Develop the separate Equation Workshop's custom equation parser and scene generator, without changing saved Stage 1–3 progress. Worlds 2–4 remain distinct later mathematical work.
