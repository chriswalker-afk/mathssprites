# PR52 — Visible weight piles of five

## Brief

Replace the continuous floor row of brass weights with discrete, countable **piles of five**. Each complete pile has **three individual weights along the bottom** and **two resting on the lower three**, centred between their neighbours. The final pile contains the remainder, following the same five positions: first three on the floor, fourth and fifth (if present) above.

A small label is shown only when a room's **loose positive weight count is greater than 10**. It matches the count plaque and brass connector used for sealed crates. The old label counting *all objects in a row* is removed, including mixed signed-object rooms.

## Physical arrangement

```text
    ④ ⑤           ④ ⑤
  ① ② ③   gap   ① ② ③     = ten actual weights

    ④ ⑤           ④
  ① ② ③   gap   ① ② ③     = nine actual weights

  ① ② ③   gap   ① ②       = five actual weights

  For 1, 2, 3: only the floor row is used.
  For 4: three on the floor, one above.
```

Examples: 8 = 5+3; 10 = 5+5 (no count plaque); 11 = 5+5+1 (one *11 weights* plaque); 23 = 5+5+5+5+3; 29 = 5+5+5+5+5+4.

## Crucial engineering invariant

**Every original weight stays one individual, direct `.token.weight` child of its `.floor-track`.** No pile becomes a mathematical token or basket. This means:
- the room has the exact number of real weight DOM nodes as the engine's `posOne` count;
- existing hand pickups, Undo, overflow experiments, signed zero-pair cancellations, fractional cuts, division-basket sharing, multiplication and notebook replays still use individual whole weights;
- CSS arranges the last two weights of each five via compensating flex margins, physically raising them above the lower three; no transforms are applied to the weight tokens, preserving the existing animations;
- the existing `floorScaleToFit` scales the *whole arranged floor* to the chamber width, including the count plaque when present;
- sealed crates retain their own stacked-column rendering and count plaque. For a room containing both sealed crates and loose tokens, a separate floor zone keeps the loose piles beside (not below) the closed crate stack.

The screen-reader `.room-items` label still announces exact counts; the count plaque is decorative `aria-hidden`. The same floor arrangement is used when the hand is starting a move, when the rooms temporarily differ in Independent Balance, during signed cancellations and when a basket action is about to begin. **Inside wicker baskets, individual weights continue their existing basket-sharing animation**—these are temporary transfer containers, not a long floor row.

## Acceptance

| Loose weights in a chamber | Floor presentation | Plaque |
| ---: | --- | --- |
| 0 | None | None |
| 1–3 | One partial bottom row | None |
| 4 | Three below, one above | None |
| 5 | Three below, two above | None |
| 6–9 | One full pile plus a partial pile | None |
| 10 | Two full piles | None |
| 11 | Two full piles and one remaining weight | **11 weights** |
| 12 | Two full piles and two remaining weights | **12 weights** |
| 16 | Three full piles and one remaining weight | **16 weights** |
| 23 | Four full piles and three remaining weights | **23 weights** |
| 25 | Five full piles | **25 weights** |
| 29 | Five full piles and four remaining weights | **29 weights** |

## QA

`tests/weight-piles.test.mjs` certifies all slot assignments, upper/lower arrangement, last-pile sizes and >10 threshold. `e2e/weight-piles.spec.mjs` measures actual objects in the browser, checks that the raised two physically overlap the base, validates the precise number of tokens and one plaque, checks a real mixed crate room, and confirms division baskets still transfer all real objects.

This change is strictly visual. No equations, solved states, level IDs, move counts, star benchmarks, saves or object limits change.
