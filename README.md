# Maths Sprites — The Balance Lab

*A wordless algebra puzzle that becomes an equation only after you solve it.*

**Status:** first playable browser prototype on this feature branch. The artwork is deliberately provisional; the mathematical mechanics are testable.

## The idea

Two open-front miniature rooms sit on either side of a laboratory balance. Tiny, black, bouncy dust-sprite creatures represent unknowns; ordinary objects represent known quantities. A large human hand reaches down into the rooms to add, remove, duplicate, or divide their contents. The player never sees the equation while solving.

The aim is to **leave a single variable sprite alone in one room and its equivalent quantity of objects in the other**, while keeping the scale balanced by performing the same mathematical operation on both rooms.

At success, **comic-book panels appear automatically, one for each actual mathematical step**, while an animated pencil writes the corresponding equations on paper alongside them. This is the key learning payoff, not an optional explanation.

## Core promises

1. **Two rooms, not piles on pans.** Each chamber is its own little world; objects and bouncing sprites inhabit it.
2. **Invisible equation during play.** No `x`, `x²`, values, or algebraic statements until the end-of-level replay. Each unit object is nonetheless countable.
3. **Two hand-control modes.** In Guided Mirror the hand repeats the action on both sides; in Your Turn the player must personally make the matching second move. Either way, completed transformations preserve equality.
4. **Every animation is mathematically truthful.** Sprite bouncing does not affect weight. Multiplication copies complete arrangements; division divides the entire arrangement into equal, see-through containers, leaving one group in each room.
5. **Discover before explaining.** Each completed move becomes a newly revealed animated comic panel with handwritten algebra alongside. The replay begins automatically and remains pausable, rewindable and skippable.
6. **Atmospheric rather than childish.** Warm, mysterious laboratory, charcoal sprites, brass, glass, aged timber, restraint in UI and colour.
7. **Gentle mistakes, no guessing penalty.** A temporary tilt and a clear recovery path let players experiment. The hand's unseen owner occasionally offers contextual, first-person speech bubbles.
8. **Negatives have a physical language.** Black sprites are +x, white sprites −x, weights +1 and balloons −1. Opposites make visible zero pairs through a puff or flight. Negative-token art comes after the initial four levels, but the engine is designed for it from the outset.

## Example: the first two-sided-variable puzzle

- Start (hidden): `2x + 3 = x + 7`.
- In the rooms: left has **2 round sprites + 3 unit stones**; right has **1 round sprite + 7 unit stones**.
- Remove one round sprite from **each** room: `x + 3 = 7`.
- Remove three unit stones from **each** room: `x = 4`.
- Success triggers a replay with all sprites, stones, and operations labelled.

## Documents

- [Game design and interaction specification](docs/GAME_DESIGN.md)
- [Mathematical model and QA invariants](docs/MATH_RULES.md)
- [Visual and animation direction](docs/ART_DIRECTION.md)
- [Level progression and first playable milestone](docs/LEVEL_ROADMAP.md)
- [Two play modes, hand interactions and containers](docs/CONTROL_AND_CONTAINERS.md)
- [Automatic comic-book equation replay](docs/COMIC_REPLAY.md)
- [Negative sprites, balloons and zero pairs](docs/SIGNED_TOKENS.md)

## Play the first prototype

The repository now includes a **dependency-free browser game** with four curated whole-number levels.

- **Guided mirror**: choose an operation and the hand performs it in both rooms.
- **Your turn**: make a change in one room; the balance tips until you repeat it in the other.
- **Transparent baskets**: dividing means making two to five identical groups *within each room*, then retaining one group on each side.
- **Automatic comic replay**: once a lone dark sprite faces the correct number of weights, a notebook unfolds. Animated panels replay each actual mathematical step, and the pencil writes the equations alongside.
- **Hints, Undo, Reset, reduced motion and responsive layout** are included.
- **Signed algebra is supported in the isolated engine**, but white sprites, balloons and animated zero pairs remain planned for the next chapter rather than falsely advertised as part of this prototype.

### Run locally

```sh
python3 -m http.server 8000
```

Open [http://localhost:8000/](http://localhost:8000/).

To run the mathematical tests (Node.js 20+):

```sh
npm run check
```

No package installation is needed. After merge, publish as GitHub Pages from `main` root if desired. See [prototype instructions, scope and QA checklist](docs/PROTOTYPE.md).

### Code

- `index.html` — static game interface
- `src/engine.mjs` — testable equations, physical tokens, history, grouping and manual operations
- `src/app.mjs` — room rendering, interactions, hand choreography and comic replay
- `src/styles.css` — original CSS-drawn laboratory and actors
- `tests/engine.test.mjs` — engine regression tests
- `.github/workflows/check.yml` — automated checks on PRs and main

The first prototype prioritises **correct physical mathematics and a delightful reveal** over final art assets or a large level library.
