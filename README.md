# Maths Sprites — The Balance Lab

*A wordless algebra puzzle that becomes an equation only after you solve it.*

**Status:** complete first mathematical world (PR16). All 20 positive whole-number levels are playable across five progressive chapters, with saved progress, teacher access and chapter navigation. The advanced experiment library remains intact for future worlds and regression testing.

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
8. **Negatives have a physical language.** Black sprites are +x, white sprites −x, weights +1 and balloons −1. Opposites make visible zero pairs through a puff or flight, and Undo restores every original object.

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
- [Home, worlds and level selection (PR14)](docs/WORLD_NAVIGATION.md)
- [Two play modes, hand interactions and containers](docs/CONTROL_AND_CONTAINERS.md)
- [Automatic comic-book equation replay](docs/COMIC_REPLAY.md)
- [Negative sprites, balloons and zero pairs](docs/SIGNED_TOKENS.md)

## Play the game

The default URL now opens the **Maths Sprites home screen**. Choose a world, open the World 1 level map, and play all **20 positive whole-number puzzles** in five chapters. Levels unlock in order and completion progress stays on this device (with no account). Teachers can unlock all 20 puzzles in Settings.

The world map also shows locked placeholders for negative numbers, fractions and squares/square roots. All twenty World 1 levels are implemented; there are no empty level placeholders in this world. See [the full teacher-facing World 1 campaign guide](docs/WORLD1_CAMPAIGN.md) for puzzles, strategies and validated operations.

The original **thirteen curated experiments** have not been deleted. To inspect and regression-test their advanced mechanics before the later worlds go live, use the explicit authoring preview link `?preview=resident`, choose any prototype experiment there, or use a known ID such as `?preview=make-square`. The prototype preview is separate from the student campaign.

The mathematical engine still supports the earlier experiments, including signed objects and genuine in-room square/root constructions. These capabilities cannot be selected inside World 1: its operation permissions are also enforced by the engine.

- **Guided mirror**: choose an operation and the hand performs it in both rooms.
- **Your turn**: make a change in one room; the balance tips until you repeat it in the other.
- **Transparent baskets**: dividing means making two to five identical groups *within each room*, then retaining one group on each side.
- **Pencil-paced comic replay**: once a lone dark sprite faces the correct number of weights, the hand's actual steps unfold as comic panels. The pencil moves to each **individual algebra symbol**, draws it, pauses between lines, and only then advances to the next panel. Pause, continue, manual steps, and writing-speed choices are available.
- **Hints, Undo, Reset, reduced motion and responsive layout** are included.
- **Maths mode (separate from hand control):** positive-only lessons hide white sprites and balloons by default; Signed objects enables them for experimentation. The signed chapters require Signed mode. Positive/negative opposite pairs physically cancel, and the history records exactly which objects left the room. Fractions and negative solutions for x are still separate future features.

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


## Geometry-of-algebra: the carpenter's box (chapters 6–10)

Ordinary sprites and weights now stand along **one horizontal floor row**, not several stacked rows. If the row is crowded, the entire row shrinks proportionally to remain visible within the chamber; the pieces never wrap onto a second row.

Two new **whole-room** tools make multiplication and inverse operations tangible:

- **Square (²):** inside the actual room the hand erects a wooden/brass frame on the floor, lays out the original row as one dimension, matches it with the perpendicular side, and fills each resulting region with real sprites and weights. Round×round produces square x² sprites, round×weight fills both matching mixed regions with x sprites, weight×weight produces unit weights. Then the result returns to the normal single floor row.
- **Square root (√):** in the same chamber, the hand places the quadratic, mixed and constant pieces into the original box, removes the four regions in reverse order, and keeps exactly one side. Square sprites squish into round sprites when appropriate. For example, √(4x²+12x+9)=2x+3 under the x≥0 lesson condition.

**Mathematical safeguards:** the square applies to an **entire** nonnegative linear side, so (2x+3)² becomes **4x²+12x+9** rather than the false 4x²+9. The interior contains exactly 4 square sprites, 12 round sprites (6 in each crossing region), and 9 weights. Roots are allowed only when all three coefficients form a complete perfect square, with equal mixed regions. The chapters explicitly assume x≥0, and the 48-object limit prevents an overcrowded box; rejected attempts use the reversible PR10 feedback.

There are two hand modes, original hand/sprite interactions, and the same animated pencil recap. The square-shaped x² sprite has independent bounce, wiggle and blinking just like its round counterpart. Formal algebra labels are retained for the comic-book replay rather than permanently placed on the objects during play.


### New linked experiments (chapters 9–10)

**Build every part:** 2x+3=5 with x=1 becomes (2x+3)²=25. The hand builds all four regions in the west room; five weights in the east room become a 5-by-5 box. The completed layout is 4x²+12x+9=25. This is an area-building goal, not an instruction to isolate x.

**Unbuild the square:** start from 4x²+12x+9=25. The hand reverse-fills and removes the box until only 2x+3=5 remains. The student then removes three weights and divides by two to isolate x.

This is a *single in-world interaction*, not a teaching diagram layered beside the action. The edge rulers are translucent **dimension markers**, not counted tokens. Only interior cells become algebra tokens, which are committed by the engine at hand contact. The box never pollutes Undo, the notebook or the normal floor-only view. On small screens it scales within the chamber; reduced motion retains the complete sequence as quick static stages.


## PR12: white sprites, balloons and signed mathematics modes (chapters 11–13)

The header now includes a **Maths mode** selector independent of Guided Mirror / Your Turn. Introductory chapters start in *Positive objects*: only black sprites, square sprites and brass weights can be selected. Choosing *Signed objects* exposes the white sprite (−x) and tethered balloon (−1) controls and resets that experiment safely. Chapters 11–13 are signed from the start and cannot be switched into a positive-only representation incompatible with their opening contents.

The same equation engine handles four primitive signed objects: a black sprite contributes +x, a white one −x, a weight +1, and a balloon −1. A black/white pair hops together, bumps and disappears in a little soot puff; a balloon grabs a brass weight and **lifts them both out of the room**. Each pair is a zero-valued simplification of ONE room, not an additional operation on both sides. The hand still performs the initiating add/remove/copy operation to **both** rooms; a completed step still has exactly one commit, and every cancellation is recorded as an ordered subevent.

The signed experiments are:

- **11 Balloon rescue:** x−2=2. Add two weights to both sides. The two balloons each lift away their opposite weight on the left; the right becomes four weights, leaving x=4.
- **12 A white sprite arrives:** 2x+3=x+7. Add a white sprite to both rooms. A black/white pair cancels in each chamber, leaving x+3=7; remove three weights to get x=4.
- **13 Two ways to make zero:** 2x−2=x+2. Use weight/balloon cancellation followed by black/white cancellation to leave x=4.

**Truthfulness and constraints:** signed objects still count as whole items. Before division, any visible zero pairs cancel FIRST, so the remaining integer objects form honest equal baskets. Adding/removing a balloon retains its negative algebraic meaning; the comic replay writes equations such as − (−1) for removing a balloon and includes the actual zero-pair subevents. A signed action that is not permitted in positive-only mode is blocked by the pure engine, not only by hiding a button. The current square/root geometry remains restricted to nonnegative areas. We intentionally do NOT introduce negative values of x, signed square roots or fractional objects in PR12; those need their own physical metaphors.


## PR13: When division needs little pieces

A whole-object division that would produce fractions is now demonstrated **on the actual chamber floor**. The hand brings a brass cutter to the leftover sprite or weight, visibly tries cutting that very object into the required number of parts, and lets the fragments separate and wriggle. Because each fragment is clipped from the original artwork, half a black sprite really looks like part of a sprite, not a new small creature. Square sprites, balloons and pale sprites work too. The other intact objects stay where they were.

After a visible pause, a first-person speech bubble explains why those tiny fractional pieces are not being used in the current experiment. The hand then joins them back together, and the entire failed attempt is undone. No fractional operation is committed, no balance equation changes and no replay panel is created. The old detached fraction-basket cards have been replaced for this failure case; legitimate whole-number division still makes physical baskets. In signed rooms, zero-pair cancellation happens before the attempted cut so the correct remainder is shown.
