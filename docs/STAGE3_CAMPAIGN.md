# World 1 · Stage 3: Algebra Apprentice (PR21)

**Twelve playable notebook-first lessons**, unlocked for students when they have finished Stage 2, or for teachers immediately. There is no new number world: every sprite and weight represents a **positive whole number**, and every checked algebra line must be the exact result of one legal two-sided action.

## Intended learning arc

| Levels | Chapter | Written scaffolding |
|---|---|---|
| 01–04 | Written with You | (1) analogous fully worked example; (2) first-move cue; (3) last-move/finish-planning cue; (4) no visible worked scaffolding |
| 05–08 | Choose the Route | No automatic scaffold; several valid routes or tricky grouping require choosing a strategy |
| 09–12 | Apprentice Challenges | Independent linear equations with sprites on both sides, reversed unknowns, carrying limits and optional tactical addition |

The starting equation and current lesson prompt appear **on the paper**. Unlike Stage 1/2, students do not see the rooms until *after* the algebra is checked. A **Need a thinking prompt?** button always remains available; it asks a useful mathematical question instead of disclosing the solution. The first chapter's scaffold is contextual text, not a prefilled answer for the current level. This implements backwards fading without allowing students to skip every algebra step.

## Exact teacher reference routes (not surfaced during play)

These are verified by `tests/apprentice-campaign.test.mjs` against `startNotebook → tryNotebookLine → notebookReplayScript`, and by applying every replay action through the same physical engine used for Stages 1/2.

| Stage 3 level | Starting equation | A valid sequence (each arrow = one legal operation) |
|---|---|---|
| 01 A written beginning | x + 3 = 8 | x = 5 |
| 02 One equal group | 2x = 12 | x = 6 |
| 03 Think about the finish | 2x + 4 = 12 | 2x = 8 → x = 4 |
| 04 Your first solo page | 3x + 6 = 21 | 3x = 15 → x = 5 |
| 05 Two ways through | 3x + 6 = 18 | x + 2 = 6 → x = 4 (or 3x = 12 → x = 4) |
| 06 The careful remainder | 4x + 5 = 25 | 4x = 20 → x = 5 |
| 07 Reading from the east | 19 = 2x + 9 | 10 = 2x → 5 = x |
| 08 Fraction-free strategy | 3x + 8 = 23 | 3x = 15 → x = 5 |
| 09 A mystery next door | 2x + 3 = x + 8 | x + 3 = 8 → x = 5 |
| 10 The east keeps the sprite | x + 13 = 3x + 3 | 13 = 2x + 3 → 10 = 2x → 5 = x |
| 11 Many moves, one balance | 4x + 7 = 2x + 17 | 2x + 7 = 17 → 2x = 10 → x = 5 |
| 12 The final apprentice test | 5x + 17 = 2x + 29 | 3x + 17 = 29 → 3x + 5 = 17 → 3x = 12 → x = 4 |

## Playing and saving

- **Home → World Select → Stage Select → Stage 3 level map → notebook → physical replay → next Stage 3 level.**
- Each next level unlocks after its predecessor is completed; Teacher access opens all twelve. The twelve levels are grouped into three four-level chapters with separate completion markers and a **12/12 Algebra Apprentice mastered** screen.
- Writing a correct final equation only unlocks **Replay with sprites**. It **does not** count as level completion; players can leave and revisit without false credit.
- The original two-room hand animation plays **the confirmed written sequence**. Once every step has run to completion and the balance is solved, `mathssprites:solved` (stage `notebook`) records one completed Stage 3 level. Only then does **Next notebook level** appear. The last puzzle's button returns to Stage Select.
- **View my notebook**, **Replay my steps**, Undo, Reset and optional hints remain usable. Failed animation restores the paper workspace without incorrectly awarding credit.
- New storage key `mathssprites.apprentice-progress.v1`: same resilient `{completed,lastPlayed}` shape, tolerant of blocked storage. No change to `mathssprites.progress.v1` or `mathssprites.independent-progress.v1`.
- **Teacher sandbox remains separate**, in Settings or `?notebook=two-step-09`: it earns no campaign credit even if a teacher uses it after Stage 3 unlocks.
- The *separate* Equation Workshop for entering arbitrary equations is still planned for PR22, and negative-number, fraction and square/root worlds remain unimplemented.

## Verification

Tests cover 12 nontrivial initially balanced and valid whole-number linear puzzles, every exact route, two alternate valid strategies on Level 5, strict one-operation-per-line checks, fractional and negative rejections, backwards fading, 12 sequential gates, teacher access, saved-progress isolation, paper hidden/visible ordering, no early completion, actual hand movements, mobile controls and final mastery.

**Next: PR22 — Equation Workshop.** Add a free-play equation entry/parsing/scene-generation tool with full positive whole-number representability checks; decide how to present unsolvable, negative/fractional, excessively large and ambiguous inputs. Keep it separate from campaign progress and retain the same physical-operation validator so a generated scene cannot teach inaccurate transformations.
