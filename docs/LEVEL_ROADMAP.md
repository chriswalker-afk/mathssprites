# Level progression and first playable milestone

## Intended learning sequence
Each chapter introduces one physical algebra transformation, then mixes it with earlier ones. Algebra is concealed during interaction and revealed through an accurate replay. Introduce conceptual complexity before decorative complexity.

| Chapter | Physical idea | Algebraic target | Example | New interaction |
|---|---|---|---|---|
| 1. Clearing the room | Remove identical stones from each side | `x+a=b` | `x+5=9` | subtract units |
| 2. Making equal groups | Split matched piles into equal groups | `kx=b` | `3x=12` | divide whole expressions |
| 3. Two moves | Clear stones, then split | `kx+a=b` | `2x+4=12` | chain steps |
| 4. Sprites on both sides | Remove matched variable sprites | `ax+b=cx+d` | `2x+3=x+7` | subtract sprites |
| 5. Rebuilding rooms | Add equivalent things / multiply full arrangements | equivalent rearrangements | curated | add, multiply |
| 6. Shadow quantities | Negative counters and additive inverses | signed linear equations | curated | cancellation pairs |
| 7. Broken stones | Fractions and rational answers | fractional linear equations | curated | divide unit items |
| 8. Families of sprites | Different variables and coupled clues | systems of equations | curated | linked balances |
| 9. Square sprites | Quadratic structures | restricted solvable quadratics | curated | area / factor structures |

The later chapters are **research and design intentions**, not promised first-release mechanics. The first prototype must keep its core representation honest.

## First playable vertical slice: four puzzles
1. **One little resident:** `x+2=5` → take away two stones from both rooms → `x=3`.
2. **A busy room:** `3x=9` → split both rooms into three equal groups → `x=3`.
3. **Clear then group:** `2x+4=12` → subtract four stones; split in two → `x=4`.
4. **Across the hall:** `2x+3=x+7` → subtract one sprite; subtract three stones → `x=4`.

## Acceptance criteria for prototype
- Both chambers are visibly part of one moving balance, with no algebra text before success.
- Sprites jump independently without shifting the inferred mass; item counts remain legible.
- The hand visually applies the same mathematical operation to both rooms.
- All four curated puzzles are solvable and reject impossible physical removals / groupings.
- Undo and reset work even after a failed attempt.
- Success requires isolating a single sprite opposite unit stones, not merely maintaining equality.
- Replay reconstructs each actual user action and displays correct symbolic transformations.
- Replay supports pause, step, backward and skip.
- Keyboard actions and reduced motion permit a complete playthrough.
- Pure algebra rules have tests for invariants, division constraints and undo.
- Works as a static browser experience at desktop and tablet widths.

## Proposed implementation milestones
**PR1: design baseline** — README and four design documents, no runnable game.

**PR2: algebra engine** — pure TypeScript puzzle state, operation validation, history, replay and tests, no art dependency.

**PR3: playable wireframe** — responsive two-room balance, clickable actions, four puzzles, undo, win and text-only replay.

**PR4: movement pass** — sprite hop loops, hand choreography, beam feedback, group partitioning and reduced motion.

**PR5: final discovery replay** — labels, animated equation transformations, step scrubber and reflection.

**PR6: art integration and QA** — approved original asset sprites, polished laboratory setting, browser and accessibility tests.

## Design decisions for review
- Should the hand always execute an entire mirrored transaction, or should the player place a matching second move manually?
- Should students see the exact number of hidden unit objects once chambers become crowded, or should grouped weights be introduced?
- Should a completed level first celebrate the visual solution, then automatically replay, or require clicking a dedicated “Reveal the algebra” button?
