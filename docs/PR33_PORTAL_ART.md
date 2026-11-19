# PR33 — The four illustrated places of Maths Sprites

PR32 made navigation and progress world-independent. PR33 gives those existing routes an original visual identity. It is an **art-only pass**: no change to mathematical operations, physics, hand/basket coordinates, level gating, save records or star ratings.

## 1. Laboratory Foyer
The opening question stays **How much does the sprite weigh?**, with the existing mathematically truthful animated falling-sprite scale. A translucent atmospheric SVG adds shelves, lanterns, aged timber and light behind the animation. Three individually illustrated stage medallions mark the direct Guided, Independent and Apprentice stage-entry shortcuts. Each still opens the last visited level of its stage.

## 2. Experiment Board
An engraved walnut, slate and brass console. The same world/stage switches remain visible above the same chapter grid. Guided uses warm brass, Independent a cooler metal palette and Apprentice ink/parchment colours. Chapter panels have rivets and subtle measuring marks; playable, completed and recommended tickets remain identifiable by labels and stars, not colour alone. No extra headers or scroll-dependent pages were added.

## 3. Hall of Doors
Four self-contained, original arched-door illustrations replace generic symbols in World Select. Balance Workshop has a brass scale, charcoal sprite and weights; Opposite Chambers has dark/pale sprites and a balloon; Fraction Workshop has an explicitly segmented disc; Square Laboratory has nested squares and a square sprite. Only the Balance Workshop door is playable. Future worlds remain visibly labelled as locked.

## 4. Inventor's Desk
The existing Equation Workshop builder becomes a parchment drawing desk with real sketch-sheet, balance, ink, pencil and tiny sprite artwork. The input, validation, worked examples, hand-mode selection and free-play isolation are unchanged. The illustration is deliberately faint behind lesson material and never becomes a new clickable element.

## Asset inventory
| Original local SVG | Purpose |
|---|---|
| `assets/portal/foyer-ambient.svg` | carved foyer and lanterns |
| `assets/portal/door-balance.svg` | World 1 |
| `assets/portal/door-opposites.svg` | future signed world |
| `assets/portal/door-fractions.svg` | future fraction world |
| `assets/portal/door-squares.svg` | future square world |
| `assets/portal/stage-guided.svg` | Guided medallion |
| `assets/portal/stage-independent.svg` | Independent medallion |
| `assets/portal/stage-notebook.svg` | Apprentice medallion |
| `assets/portal/board-etching.svg` | map engraving |
| `assets/portal/inventors-desk.svg` | free-play desk artwork |
| `src/portal-art.css` | integrated themes and responsive treatment |

All illustrations are original repository-local SVG paths and gradients with viewBox attributes. They embed no scripts, remote assets or fonts. Every decorative image has an empty alt and an aria-hidden wrapper. Navigation remains native keyboard-operable HTML buttons with focus outlines.

## QA checklist
- Confirm all four Hall of Doors assets load and three remain locked.
- Confirm the three stage badges on Home and Stage gallery are distinct.
- Confirm 20/16/12 levels remain visible and selectable on the Experiment Board.
- Confirm the actual game hand, baskets and scale run unchanged, including reduced-motion mode.
- Confirm the Inventor's Desk builder still validates equations, and free play does not save campaign progress.
- Confirm zero page overflow on 1024x720 and 1092x540 laptop screens, and no sideways clipping on 375px mobile.
- Inspect the PR33 browser screenshots in GitHub Actions artifact `maths-sprites-viewport-preview`.

## Next: PR34
Text reduction and user-experience polish. Shorten optional menu explanations, clarify labels, simplify help/settings, improve feedback hierarchy and keyboard/mobile focus while preserving the mathematical guidance that students need.