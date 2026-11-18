# World 1 · Stage 2 — Independent Balance (PR19)

This is the 16-puzzle follow-on to **Stage 1 · Guided Balance**. The mathematical scope stays unchanged: **positive whole numbers**, one unknown sprite (possibly multiple copies), brass weights, whole group division and the four allowed operations. The difference is that **students must apply each operation to the rooms separately**.

## Learning progression

| Levels | Chapter | Focus |
|---|---|---|
| 01–04 | Your First Moves | Select an operation, act in one room, observe the scale tip, then match the second room |
| 05–08 | Sharing Fairly | Make an identical number of complete baskets in each chamber, without fractions |
| 09–12 | A Sequence of Moves | Order two operations and complete every pair before selecting a new one |
| 13–16 | The Independent Experimenter | Sprites in both rooms, reversed orientation, multi-route strategies and load limits |

The first Stage 2 level shows its own four-step, **dismissible** tutorial: notice the balance; choose Remove; choose two weights; visit the west hand, watch the scale tip and visit the east hand to restore it. The coach points at the *actual opposite chamber* if the student chooses east first. It never prevents actions or reveals an answer. It can be replayed through Settings or the in-game Guide button, with an independent saved seen-flag.

## Teaching and mathematical model

Every independent action follows this contract:

1. The hand makes the chosen move in the first selected chamber; its objects visibly change. The scales **really tilt**, because the physical rooms now have different values at the puzzle's solution.
2. The engine stores a *pending* action but does **not** commit the algebraic step or mark the puzzle complete.
3. The same operation, kind and amount are then required in the other room. Only that matching visit creates a single balanced transaction in equation history.
4. A different or impossible second action is allowed to **demonstrate** the result, with a pause and a speech explanation, then **both rooms rewind** to the last committed step. No wrong algebra enters the comic.
5. Undo cancels a pending first move; after a complete pair, Undo reverses that last mathematical step as before.
6. An entirely successful level shows the solved physical balance, then the actual committed history in the same comic/pencil replay as Stage 1.

Stage 2 is **manual-only** in campaign mode. The mode selector is hidden, its hidden value remains `manual`, and an unexpected call to the automatic button cannot trigger a two-room move. This does not remove the already-validated automatic/manual prototype route.

### Teacher reference routes (not displayed to students)

*Here x means the dark sprite; route operations are applied to **both rooms, one at a time**.*

| Level | Hidden equation | Solution | Valid route |
|---|---|---:|---|
| 01 — Two hands, two rooms | x + 2 = 7 | 5 | −2 |
| 02 — A matching handful | x + 4 = 10 | 6 | −4 |
| 03 — Start in the east | 9 = x + 3 | 6 | −3 |
| 04 — The careful carrier | x + 7 = 12 | 5 | −7 |
| 05 — Two baskets, twice | 2x = 8 | 4 | ÷2 |
| 06 — Three matching groups | 3x = 12 | 4 | ÷3 |
| 07 — Four-room rhythm | 4x = 20 | 5 | ÷4 |
| 08 — Five careful baskets | 5x = 20 | 4 | ÷5 |
| 09 — Clear and share | 2x + 3 = 11 | 4 | −3, ÷2 |
| 10 — Share, then tidy | 3x + 6 = 18 | 4 | ÷3, −2 |
| 11 — The fourth basket | 4x + 5 = 21 | 4 | −5, ÷4 |
| 12 — No pieces, please | 3x + 7 = 22 | 5 | −7, ÷3 |
| 13 — A sprite next door | 2x + 2 = x + 6 | 4 | −x, −2 |
| 14 — East keeps the mystery | x + 11 = 3x + 1 | 5 | −x, −1, ÷2 |
| 15 — Two travelling sprites | 4x + 3 = 2x + 13 | 5 | −2x, −3, ÷2 |
| 16 — The balancing specialist | 4x + 14 = 2x + 24 | 5 | ÷2, −x, −7 |

The test suite checks every route with both possible first-hand directions, ensures that the first hand visit produces a genuine temporary imbalance, and verifies that no step reaches equation history until the second matching action commits.

## Unlocking and compatibility

- Students unlock Stage 2 by completing all 20 Stage 1 puzzles. Teachers may open Stage 2 immediately and all sixteen Stage 2 levels for teaching; neither route unlocks Stage 3.
- Within Stage 2, levels unlock sequentially, unless Teacher access is enabled.
- Stage 1 storage **remains exactly** `mathssprites.progress.v1`; neither its completed array nor lastPlayed is migrated.
- Stage 2 stores `{completed,lastPlayed}` separately at **`mathssprites.independent-progress.v1`**.
- The Stage 2 guide uses its own `mathssprites.independent-guide-finished.v1` key. An inaccessible localStorage API is non-fatal.
- The two stages have separate level maps, progress bars, mastery banners, and advancement sequences. Completing Stage 2 returns to Stage Select. Stage 3 still says Coming soon.

## Acceptance

- All 16 puzzles must pass positive-whole-number restrictions, initial equality, meaningful solution and full manual route validation.
- First and second hands animate physically; the scale tips between them and settles after the second.
- Mismatched second actions, failed fraction cuts and overflows show physical feedback, pause, speak and rewind (without corrupting history).
- Guided Mirror works only in Stage 1; Your Turn is fixed in Stage 2. Signed, fraction and square/root tools remain inaccessible in both.
- Finishing a Stage 2 puzzle persists only Stage 2 progress, launches the real algebra comic, and unlocks the next Stage 2 puzzle.
- The Stage 2 guide is skippable, usable on a phone, and replayable without altering the Stage 1 guide.

## Next: PR20 — notebook-first algebra engine

Build the **Stage 3 · Algebra Apprentice** notebook interface and mathematically valid algebra step editor before writing its 12 campaign puzzles. Students write equation transformations **first**; the game checks each line for equivalence and World 1 representability, then converts the validated history into physical hand movements and a sprite replay. Retain alternate valid methods, no early answer reveal, and stage-specific progress. PR21 will author/validate the actual Stage 3 level content; PR22 builds the free-play Equation Workshop.
