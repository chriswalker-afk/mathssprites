# PR37 — Adaptive viewport composition across Maths Sprites

## Why this pass exists

After PR27–35, the single-screen CSS fitted short 1024×720 and 1092×540 laptop viewports well, but scaled poorly to taller windows. Two user screenshots revealed:

- **Home**: the flexible background frame grew to nearly all available height while the fixed-size heading, buttons and illustration remained concentrated in a relatively small central band
- **Gameplay**: `.app-shell .game-board{max-height:590px}` stopped the physical scene and controls from growing beyond ~590px; everything stayed pinned to the top of tall desktop pages and the rest of the viewport was empty

The problem was **aspect ratio / available height**, not just screen width. A tall narrow browser must not be treated the same as a wide monitor with equal height.

## Rules

1. Desktop screens should **fill an appropriate area**, with a bounded content width and consistent top/bottom rhythm rather than a needlessly enormous frame.
2. A room and its pan, the beam and the pedestal are one connected physical instrument. Their `top` and `height` changes must remain **mathematically and visually synchronized**. No `transform:scale` or `zoom` of the game scene, hand, baskets, rooms or tokens, and no changes to game/equation logic.
3. When **width limits the physical scene**, as on a 1024px-wide but 1200px-tall window, do not turn rooms into narrow towers or scale the sprites too far. Centre the intact board vertically, reserving natural breathing room.
4. Protect the existing **short laptop** ranges including 1092×540 and **mobile/portrait/zoom** fallback, where natural vertical scrolling is preferable to hiding focusable controls.
5. Preserve speech, controls, replay, notebook and progress while using any extra space; the full experiment must remain visible on normal desktop viewports.

## Implementation

A final stylesheet, `src/viewport-adaptive.css`, is loaded after the existing PR28/30/33/36 CSS:

- Desktop Home (≥900px wide, ≥790px tall): caps the hero frame at 850px, retains a three-card quick-stage row, enlarges the heading/scale only to the extent their columns can support, and improves rhythm. It does not add filler text.
- Large world and stage gallery: stretches existing cards with natural gaps, readable buttons and roomier medallions.
- Experiment Board: increases chapter spacing, tile labels, status/star legibility and hit targets, while retaining the same 5/4/3 four-level chapter grid.
- Wide gameplay (≥1100px wide, ≥790px tall): sets a fluid board-height budget of `min(100dvh - 104px, 820px)`; increases room height from 290px to `clamp(365px,37dvh,440px)`; compensates the room row, beam and base **together** so the pedestal remains supported by the workbench rather than floating. Controls expand to use more of the rail.
- Tall narrow gameplay (900–1099px wide, ≥790px tall): retains native geometric proportions and vertically centres a board capped at 610px.
- Extra-wide desktop (≥1600px wide): increases readable content width up to 1510px in the portal and 1710px in game, with a proportionate action rail.
- Notebook: increases readable paper/editor spacing where screen height permits; keeps the equation history scrollable and the Apply/Undo/Replay actions accessible.
- Short desktop below 790px, tablets, portrait phones, unusual browser zoom/reduced height: **unchanged** aside from global min-width safety. The existing PR28 compact CSS remains the authority.

## QA and review

`e2e/adaptive-viewport.spec.mjs` is included in the browser smoke suite:

- 1920×1080: wide desktop
- 1440×900: common desktop
- 1120×900: tall laptop
- 1024×900: narrow tall window
- 1366×768: regular laptop
- 1092×540: Windows-scaled short laptop
- 1024×720: short laptop with real chapter/stage navigation
- 375×812 and 390×844: phones
- 768×1024: portrait tablet

Tests check horizontal overflow, visibility of actions/level cards, restrained hero height, vertical positioning and measured alignment between pans/beam/pedestal/workbench. Screenshots are uploaded as `pr37-*.png` in the GitHub Actions **maths-sprites-viewport-preview** artifact.

### Manual visual review after CI

- [ ] On the user's large monitor: the home is no longer an oversized empty frame, and the two-column text/scale row looks balanced
- [ ] On a tall game screen: both chambers visibly meet their pans and the central brass scale is attached to its workbench
- [ ] On a 1024px tall-but-narrow viewport: the stage is centred with comfortable breathing room but sprites and text are not distorted
- [ ] On a 1092×540 laptop: every control is usable, the stage remains visible, no forced document scroll
- [ ] On a 375px phone: scrolling is available and action buttons remain reachable; no horizontal overflow
- [ ] Guided, Independent, signed World 2, notebook, handbook, star/achievement UI and pencil replay remain readable

**Next after PR37:** if human screenshots show residual overlap or unused blocks, make a focused visual polish pass rather than adding broad CSS overrides. All learning content and engine behaviour stay unchanged.
