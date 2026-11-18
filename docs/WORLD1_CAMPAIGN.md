# World 1 — The Balance Workshop (PR16)

World 1 is a complete **20-level** positive-whole-number campaign. The player sees physical rooms only: no symbolic equation is revealed until the animated comic replay. The original experiment library remains available separately via the authoring preview.

## Curriculum progression and reference solutions

Each chapter contains four levels. The right-hand equation column is for **teacher review and tests**, not a game-screen hint. `x` means a dark sprite; units are brass weights. All target solutions are positive whole numbers. Every intermediate state in these reference routes uses whole objects in rooms containing at most 48 items, and each operation is applied to **both** rooms.

| # | Chapter | Title | Hidden equation | Valid route |
|---:|---|---|---|---|
| 1 | Clearing | One little resident | x + 2 = 5 | remove 2 weights |
| 2 | Clearing | Three weights in the way | x + 3 = 7 | remove 3 weights |
| 3 | Clearing | A heavier mystery | x + 5 = 9 | remove 5 weights |
| 4 | Clearing | Clear the crowded chamber | x + 7 = 12 | remove 7 weights |
| 5 | Groups | A roomful of sprites | 3x = 9 | divide into 3 baskets |
| 6 | Groups | Two tidy baskets | 2x = 10 | divide into 2 baskets |
| 7 | Groups | Four faithful groups | 4x = 16 | divide into 4 baskets |
| 8 | Groups | Five crowded baskets | 5x = 25 | divide into 5 baskets |
| 9 | Two steps | Clear, then share | 2x + 3 = 11 | remove 3 weights, divide by 2 |
| 10 | Two steps | Share before clearing? | 3x + 6 = 18 | divide by 3, remove 2 weights |
| 11 | Two steps | The crowded shelves | 4x + 8 = 24 | divide by 4, remove 2 weights |
| 12 | Two steps | An uneven start | 3x + 7 = 22 | remove 7 weights, divide by 3 |
| 13 | Across the hall | A visitor next door | 2x + 3 = x + 7 | remove 1 sprite, remove 3 weights |
| 14 | Across the hall | The sprite on the right | x + 9 = 3x + 1 | remove 1 sprite, remove 1 weight, divide by 2 |
| 15 | Across the hall | Two visitors too many | 4x + 3 = 2x + 13 | remove 2 sprites, remove 3 weights, divide by 2 |
| 16 | Across the hall | The busy corridor | 5x + 4 = 2x + 16 | remove 2 sprites, remove 4 weights, divide by 3 |
| 17 | Mastery | A shortcut through baskets | 4x + 6 = 2x + 14 | divide by 2, remove 1 sprite, remove 3 weights |
| 18 | Mastery | The other way round | 2x + 7 = 3x + 2 | remove 2 sprites, remove 2 weights; final sprite on the east |
| 19 | Mastery | The quicker route | 4x + 14 = 2x + 24 | divide by 2, remove 1 sprite, remove 7 weights |
| 20 | Mastery | The master experiment | 5x + 17 = 2x + 29 | remove 2 sprites, **add** 1 weight, divide by 3, remove 6 weights |

### Mathematical design notes

- **1–4:** explicit removal practice with progressively heavier rooms. These original shipped puzzles stay unchanged to preserve existing player progress and regression examples.
- **5–8:** only complete equal baskets are accepted. The starting basket count is not automatically the solution after the first few puzzles; students must inspect the rooms.
- **9–12:** combine different operations. Some allow division first (levels 10–11), others must clear weights first to avoid fractional pieces (levels 9 and 12).
- **13–16:** both sides contain sprites, and some require three operations. Level 14 reverses the placement of the unknown; the answer can be on the east.
- **17–20:** emphasise student-selected strategy. Level 17 has equivalent 3-step approaches. Level 18 is reversed. Level 19 is quicker if the player divides both rooms before carrying weights. Level 20 makes a positive **addition** a legitimate strategic step to create three complete groups, instead of repeated large subtractions.

Level 20 also has a valid subtraction-only four-step route: remove 2 sprites; remove 12 weights; remove 5 weights; divide by 3. This validates that the game allows genuinely different ways to solve the same equation rather than forcing a memorised sequence.

**No new mathematical tool is required**: the existing hand supports addition, subtraction, multiplication and whole-object division. All four remain available in World 1. The player is never obliged to use addition or multiplication, but strategically chosen positive additions can make a different solution pathway possible.

### Safety of the mathematical model

- Starting amounts and solutions are all nonnegative integers; each actual level has a strictly positive solution.
- Only dark sprites (`posX`) and weights (`posOne`) are permitted; signed objects (`negX`, `negOne`) and square sprites (`posX2`) are blocked in the engine for World 1.
- Squaring and square-rooting operations are hidden and rejected by the engine.
- Division refuses to cut whole objects into fractions and shows the original in-room error animation before undoing the move.
- Maximum 12 objects per manual removal/addition and 2–5 groups per share are handled in puzzle solutions.
- Real hand moves produce a transaction history; the algebra comic is generated from those committed moves rather than from an assumed ideal answer.

### Test acceptance

`tests/world1-campaign.test.mjs` checks all 20 initial balances, correct solutions, number of objects, signed/square permissions, canonical reference routes and manual-mode equivalents, plus multi-route puzzles and rejected fractional splits. `tests/site-progression.test.mjs` checks the unlock chain, browser persistence and teacher access. `e2e/site-navigation.spec.mjs` checks the full selection map, final-level load and an actual reversed-equation solve with comic replay.

### Next

PR17 is a **visual and onboarding polish pass**, not another mathematical-world requirement: inspect level map illustrations, improve the guided introduction and level-complete transitions, and review small-screen comfort. Worlds 2–4 remain placeholders for future negative numbers, fractions and geometric square/square-root interactions.
