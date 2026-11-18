# Playing the first Maths Sprites prototype

## Current status

This is the first **interactive browser prototype** of the agreed concept. It is a dependency-free static web app, designed to run from a local web server or from GitHub Pages. It is not a final release or a hosted live game yet.

## Running it locally

With Python 3 installed:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in a browser.

With Node.js 20 or later:

```sh
npm test
npm run check
```

There is no `npm install` requirement for gameplay or tests.

## How to play

1. Choose experiment 1–4 at the top. Each has the same hidden algebra rules but different physical starting objects.
2. Choose **Guided mirror** for one action that the hand automatically repeats in both chambers, or **Your turn** to direct the hand in one room and then match it in the other. Your second room remains mandatory: the beam tips after just one.
3. Use **Remove / Add** with dark sprites or weights, and select how many.
4. Use **Divide** to temporarily display the room contents in two to five equal transparent baskets. The hand keeps one basket per room; all terms are divided. **Multiply** duplicates entire rooms.
5. Leave exactly one dark sprite alone in one chamber, with only weights opposite it.
6. A comic notebook appears automatically. Each completed two-room operation has an animated panel, while a pencil writes what the objects meant as equations. Use pause, back, next, restart and final working controls.

**No equations or x-labels appear during solving.** The recap is the first formal algebra.

## Levels currently available

| Level | Hidden source equation | Intended discovery |
|---|---|---|
| One little resident | `x+2=5` | take 2 weights from both rooms |
| A roomful of sprites | `3x=9` | divide into 3 equal groups |
| Clear, then group | `2x+4=12` | take 4 weights, divide by 2 |
| Across the hall | `2x+3=x+7` | take one sprite, then 3 weights |

The equations above are **teacher notes only**; the browser UI keeps them hidden until replay.

## Deliberate first-prototype limitations

- Only dark sprites (positive variable) and brass weights (positive units) are selectable in the four current levels. **White negative sprites, balloons, cancellation puffs and signed-number levels** are documented and partially supported by the pure mathematical engine but **not yet playable or illustrated**. Do not present them as shipped features.
- Visual elements are original **CSS / inline-SVG placeholders**, not the final painted art library. The hand uses a simplified SVG pose; comic miniatures currently use DOM-rendered token symbols.
- Containers are temporarily displayed during division; there is no freeform drag-and-drop of baskets yet.
- The manual mode requires a second matching room selection, with the chosen action and count carried over. We can make the student reselect the action as a later difficulty setting.
- Speech bubbles appear on requests for hints and invalid operations; there is no complete hand-owner character.
- The pencil effect is animated handwriting-style text, not true path-by-path vector glyph tracing.
- No save state, achievements, audio, random levels or external services.

## Technical / testing

The algebra engine lives in `src/engine.mjs`, with immutable state and complete before/after snapshots for history and replay. The browser code is in `src/app.mjs` and CSS in `src/styles.css`. The test suite (`tests/engine.test.mjs`) covers validity of the four levels, solving paths, manual pending state, undo, equal grouping, whole-number restriction, signed zero pairs, and algebraic replay correspondence.

The browser should preserve keyboard and pointer accessibility; the motion toggle and OS reduced-motion preference disable the decorative animations.

For initial visual QA, inspect 16:9 desktop, narrow desktop and phone widths; test both modes and the entire replay. This manual visual pass is still necessary before declaring release quality.

## GitHub Pages

The site uses **relative paths** and includes `.nojekyll`, so the repository is ready to publish as a static site. Once the prototype PR is merged, enable Pages from `main` at repository **Settings → Pages → Deploy from a branch → main / (root)**. Do not confuse the code PR URL with a deployed site URL; Pages may require separate activation.
