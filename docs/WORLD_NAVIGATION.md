# PR14 — Maths Sprites site navigation and campaign boundaries

## Student journey

1. Home: a contextual introduction, Play/Continue, World Select, How to Play and Settings.
2. World Select: four thematic laboratories. Only World 1 is enabled. Future worlds are intentionally visible but inaccessible.
3. World 1 Level Select: five chapters with four slots each (20 planned), a title and an honest state (ready / completed / locked / coming soon).
4. Play: original two-room balancing scene, Guided Mirror / Your Turn and hand feedback.
5. Success: the actual transaction history is replayed as comic panels with handwritten algebra. The next-level control advances only to an implemented, accessible level; otherwise it returns to level selection.

### World definitions

| World | Maths scope | Status |
|---|---|---|
| The Balance Workshop | positive whole-number initial values, operations and solutions | playable (5 puzzles) |
| The Opposite Chambers | negative numbers, white anti-sprites, balloons, cancellation | locked placeholder |
| The Fraction Workshop | exact fractional objects and arithmetic | locked placeholder |
| The Square Laboratory | in-room squaring, square roots and area models | locked placeholder |

World 1 contains 20 slots grouped into Clearing the Room (1–4), Equal Groups (5–8), Two-Step Experiments (9–12), Across the Hall (13–16), and Master of the Balance (17–20).

Five puzzles are ready in PR14: four one-step clearing problems, and the existing three-equal-baskets problem. The remaining 15 slots are **not** described as playable; PR15 will author and progressively test them. The previous 13 prototype experiments remain in the engine, including early two-step, both-sides, signed and area problems, rather than being silently overwritten or incorrectly presented as finished campaign chapters.

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
- All navigation and actions use ordinary buttons, accessible labels and focusable page headings. Existing motion preferences and hand-control modes remain intact.
- The site uses only repository-local HTML, CSS and ES modules. No network services or accounts are required.

## Browser QA / acceptance

- Opening `/` shows the home page, not the balancing scene.
- World cards show exactly one available world and three unavailable placeholders.
- The level map shows five chapter groups and 20 slots, but only Level 1 opens initially.
- Completing Level 1 automatically launches its algebra comic, stores progress and permits Level 2. After a reload, the home Play action continues at the correct level.
- Teacher access unlocks all five implemented levels, never Level 6.
- World 1 physically and mathematically blocks signed objects and square/root actions.
- Prior animation, neutral pair, area, fraction-cut and replay browser tests still run in preview mode.

## Next: PR15

Complete the full **20-level World 1** campaign. Make each chapter match its specified mathematical focus; progressively remove hints and require genuinely different strategies; check every level's arithmetic, reachability, whole-object constraints, solution and replay; keep the current five starter puzzles as regression anchors. PR16 follows with menu artwork, more guided onboarding, success transitions and responsive polish.
