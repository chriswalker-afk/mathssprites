# PR14 — Maths Sprites site navigation and campaign boundaries

## Student journey

1. Home: a contextual introduction, Play/Continue, World Select, How to Play and Settings.
2. World Select: four thematic laboratories. Only World 1 is enabled. Future worlds are intentionally visible but inaccessible.
3. World 1 Stage Select (PR18): Guided Balance (playable), Independent Balance (planned), Algebra Apprentice (planned) and Equation Workshop (planned).
4. Stage 1 Level Select: five chapters with four fully implemented slots each (20 playable), showing ready / completed / locked according to progress.
5. Play: original two-room balancing scene with Guided Mirror **fixed** for Stage 1. The player still chooses operations, objects and amounts.
6. Success: actual transactions replay as comic panels with handwritten algebra. After Level 20 the player returns to Stage Select, not a falsely unlocked future stage.

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

## PR18 — Stage-first World 1

World 1 now presents Stage 1 · Guided Balance with the original 20 chapters and saved progress. Stage 2 · Independent Balance (16 levels), Stage 3 · Algebra Apprentice (12 levels), and the Equation Workshop are clear, inaccessible placeholders. The Stage 1 hand always acts on both rooms, even if code tries to switch the hidden selector. See [WORLD1_STAGES.md](WORLD1_STAGES.md).

**Next: PR19.** Add the 16 Independent Balance puzzles, turn the current manual hand behaviour into Stage 2's dedicated control scheme, teach matching actions on each side, and validate every level. Worlds 2–4 remain separate future mathematics.
