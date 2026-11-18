# Maths Sprites — The Balance Lab

*A wordless algebra puzzle that becomes an equation only after you solve it.*

**Status:** concept and design phase; no game code yet.

## The idea

Two open-front miniature rooms sit on either side of a laboratory balance. Tiny, black, bouncy dust-sprite creatures represent unknowns; ordinary objects represent known quantities. A large human hand reaches down into the rooms to add, remove, duplicate, or divide their contents. The player never sees the equation while solving.

The aim is to **leave a single variable sprite alone in one room and its equivalent quantity of objects in the other**, while keeping the scale balanced by performing the same mathematical operation on both rooms.

At success, the action is replayed **with labels switched on**, translating every physical move into algebra. This is the key learning payoff, not an optional explanation.

## Core promises

1. **Two rooms, not piles on pans.** Each chamber is its own little world; objects and bouncing sprites inhabit it.
2. **Invisible equation during play.** No `x`, `x²`, values, or algebraic statements until the end-of-level replay. Each unit object is nonetheless countable.
3. **One hand, two matching changes.** Addition, subtraction, multiplication, and division must preserve equality.
4. **Every animation is mathematically truthful.** Sprite bouncing does not affect weight; multiplication copies full groups, while division partitions them into equal groups.
5. **Discover before explaining.** The reveal is a slow, controllable, labelled replay of the actual steps taken by the player.
6. **Atmospheric rather than childish.** Warm, mysterious laboratory, charcoal sprites, brass, glass, aged timber, restraint in UI and colour.
7. **Gentle mistakes, no guessing penalty.** A temporary tilt and a clear recovery path let players experiment.

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

## Proposed first build

A polished **four-level vertical slice**, playable entirely in-browser, with two inhabited rooms, a working scale, one animated hand, a small set of stones and round sprites, undo, supported basic operations, and the labelled replay. **No login, server, leaderboards, timers or quadratic solving.**

Implementation proposal (not committed yet): Vite + TypeScript, a 2D rendering/animation library, a separately testable algebra engine, and simple HTML controls. Static hosting is enough for the first version.

The design is deliberately documented before coding; all details remain open to review.
