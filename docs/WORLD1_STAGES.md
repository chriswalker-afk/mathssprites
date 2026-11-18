# PR18 — World 1 learning stages and free-play destination

World 1 still means **positive whole-number linear algebra**. Students progress between representations of the same mathematics rather than switching number systems. The already-tested 20 puzzles are **Stage 1**, not the entirety of World 1.

## Player journey

`Home → World Select → World 1 Stage Select → Stage 1 Levels → Balance → Physical success → Algebra comic → Next Stage 1 level`.

The existing home **Play/Continue** action may jump directly into the next Stage 1 puzzle, preserving its behaviour and the student's saved place. Leaving a Stage 1 puzzle via Levels returns to its familiar twenty-level chapter map. The back button on that map now returns to the **stage** map; the stage map returns to **world** selection.

### Four cards on World 1's stage screen

| Card | Planned puzzles | Student control | PR18 status |
|---|---:|---|---|
| Stage 1 — Guided Balance | 20 existing | Choose operation/amount; hand repeats it automatically in **both rooms** | Playable |
| Stage 2 — Independent Balance | 16 new | Choose operation and visit **each room separately** | Coming soon, PR19 |
| Stage 3 — Algebra Apprentice | 12 new | Write valid algebra steps **first**; sprites replay those steps afterward | Coming soon, PR20–21 |
| Equation Workshop | Custom equations | Enter and validate a positive-integer equation; choose a supported approach | Coming soon, PR22 |

The **Equation Workshop** is a separate free-play card, not a fourth stage, and it does **not** count towards campaign completion. It is deliberately noninteractive in PR18: we must not offer a fake equation input or pretend that a parser exists.

Locked future cards state the intended experience and planned puzzle count. There is no playable link until that stage has fully authored, mathematically validated content. Teacher mode cannot override unbuilt stages.

## Stage 1, including all 20 existing levels

- All original level IDs, initial physical rooms, solutions, five chapters, hints, algebra replay and completion rules are unchanged.
- The **Hand control** dropdown is replaced by a static, accessible **Stage 1 · Guided Mirror** explanation.
- The mode is set to `auto` whenever a Stage 1 level launches. Even a synthetic change on the hidden selector cannot switch to manual; calling the independent-room handler on a campaign level is ignored.
- Students still select actions, objects and quantities. Invalid whole-number operations continue to show physical experiments and reverse with feedback.
- The separate authoring route `?preview=<known-experiment-id>` retains both auto/manual controls, signed objects and square/root experiments. The existing animation and mathematics regression suite must continue to work there.
- Finishing Level 20 earns **Guided Balance mastered** and returns to the stage overview, where Stages 2 and 3 are honestly still unavailable.

### Compatibility and progress

The original browser key `mathssprites.progress.v1`, with `{completed:number[],lastPlayed:number}`, is intentionally reused, unchanged. **Do not migrate, rename or reset** these existing Stage 1 records. Students keep every completed level and Continue lands on their prior Stage 1 level.

When Stage 2 is created (PR19), store its 16 completions under a separate **stage-specific versioned key**, never inside or in place of the Stage 1 array. Stage 3 similarly needs its own independent progress. Stage unlocking should use actual completed content, not a teacher flag alone. The Stage 1 complete banner is not a claim that all of World 1 is mastered.

### World boundaries

Signed tokens, fractional quantities, and square/root operations are still reserved for Worlds 2–4. Stage 2 and 3 of World 1 will use **positive whole-number equations** only. Unsuccessful fractional splitting in World 1 is still an animated, undoable explanation, not an available fraction mechanic.

## Acceptance criteria / PR18 tests

1. World Select leads to three Stage cards plus the separate Equation Workshop. Exactly **Stage 1** has a playable button.
2. Teacher mode never opens unavailable Stage 2, Stage 3 or Equation Workshop, even if all Stage 1 levels have been completed.
3. All twenty Stage 1 level cards still unlock in order and the original `mathssprites.progress.v1` contents remain byte-for-byte compatible.
4. In Stage 1 the static Guided Mirror label appears and the hand selector and separate-room buttons are hidden. A synthetic manual-mode change reverts to auto and a valid move still animates both rooms and produces the original algebra comic.
5. In authoring preview the hand selector remains visible and **Your Turn** still works.
6. After Level 20 the celebration says **Stage 1**, not World 1. Stage 2 is still marked Coming soon.
7. The original mathematical unit tests, animation browser tests, mobile checks and GitHub Pages diagnostics stay green.

## Next: PR19 — Independent Balance

- Author 16 new mathematically verified positive-integer puzzles in four progressive chapters: **Your First Moves**, **Sharing Fairly**, **A Sequence of Moves**, and **The Independent Experimenter**.
- Enable the existing manual hand behaviour **only** in Stage 2. No player mode switch. Keep genuine provisional first-side changes, physical scale tipping, matching actions, and demonstrative/undoable mismatched attempts.
- Create a stage-specific introduction to making moves on separate rooms, especially the need to restore balance.
- Add saved Stage 2 progress without changing the Stage 1 key. Unlock Stage 2 on completion of Stage 1 (or through teacher access once Stage 2 is actually implemented).
- Verify each new puzzle and alternative solution routes in the pure engine, and the separate-room physical choreography, comic and mobile controls in Playwright.

The notebook-first Stage 3 and custom Equation Workshop follow in PR20–22 after Stage 2 is playable.
