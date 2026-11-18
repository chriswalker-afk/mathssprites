# World 1 — three learning stages and the Equation Workshop

World 1 is entirely about **positive whole-number equations**. Each stage changes the student's *responsibility for the reasoning and representation*, not the number system.

| Experience | Number of levels | Hand control | Status |
|---|---:|---|---|
| Stage 1 — Guided Balance | 20 (5 chapters) | Hand automatically mirrors the operation in the other room | **Playable** |
| Stage 2 — Independent Balance | 16 (4 chapters) | Student deliberately makes a separate hand visit to each room | **Playable (PR19)** |
| Stage 3 — Algebra Apprentice | 12 (3 chapters) | Student writes algebra first; sprites reenact validated steps afterwards | **Playable (PR21)** |
| Equation Workshop | Custom | Input positive-whole-number equations, check representability and choose a method | Coming soon (PR22) |

The Equation Workshop is a free-play laboratory, **not a fourth stage**; it does not count towards campaign progress.

## Navigation

`Home → World Select → World 1 Stage Select → Stage-specific Level Select → Game → Solved scene → Algebra comic → Next level`.

- Guided Balance is accessible to everyone. Its 20 existing puzzles and five chapter definitions are unchanged.
- Independent Balance is accessible when all 20 Stage 1 levels are complete, or sooner through Teacher access. The 16 new puzzles are sequentially unlocked except for teachers, and level selection shows only this stage's progress.
- Algebra Apprentice unlocks after all 16 Stage 2 levels (or immediately for teachers). Its 12 notebook-first levels have independent progress, backwards-faded working and physical replay.
- The Equation Workshop is a clear, deliberately non-interactive placeholder until the solver is implemented.
- The home Continue button resumes Stage 1 until it is mastered, then the next available Stage 2 level. After both are mastered the student can revisit the stage map.
- Level navigation returns to its own stage's level map. The final level of either stage returns to Stage Select; this is not a claim of whole-World 1 completion.

## Stage 1 — Guided Balance

- The 20 original positive-whole-number puzzles from PR16 remain intact.
- The mode is always automatic; the hand performs the operation on both sides without asking students to choose the second room.
- The dropdown and individual room buttons are hidden in Stage 1. Synthetic manual-control changes are rejected.
- The first-visit coach, chapter artwork, mastery banner, saved progress and comic replay remain unchanged.

Storage **`mathssprites.progress.v1`** remains completely backwards compatible with `{completed,lastPlayed}`. No renaming, clearing or migration occurs.

## Stage 2 — Independent Balance

See [STAGE2_CAMPAIGN.md](STAGE2_CAMPAIGN.md) for the full 16-level sequence and validated teacher solution routes.

- Four chapters: **Your First Moves** (1–4), **Sharing Fairly** (5–8), **A Sequence of Moves** (9–12), **The Independent Experimenter** (13–16).
- The student uses the same action controls as Stage 1, then **chooses a room**. The engine records a provisional first-room change with real physical tipping; a second visit using exactly the same action, kind and quantity restores the balance and commits one mathematical transaction.
- Different or impossible second moves show what happens, pause, explain and rewind both rooms. The original algebra history is never corrupted.
- Stage 2 mode is **always** manual in student gameplay. Synthetic auto-control changes are rejected.
- The first-level tutorial is skippable, highlights the real buttons and points to the opposite chamber even when students begin in the east. It can be replayed without affecting the Stage 1 introduction.
- The comic only reveals the equation after genuine completion, using the actual matched move history.

Progress **`mathssprites.independent-progress.v1`** is distinct from the unchanged Stage 1 key, and the guide has its own **`mathssprites.independent-guide-finished.v1`** key. Browser storage denial never crashes the game.

## World 1 restrictions and authoring preview

The engine—not merely the DOM—enforces add, remove, multiply and divide on positive whole sprites and weights. Actual division must make complete whole-object baskets in both rooms. Signed objects, fractional pieces and squaring/square-rooting are not unlocked by reaching Stage 2.

The 13 advanced curated prototypes remain available in the **separate** `?preview=<experiment-id>` authoring route with both hand modes, signed tokens and square/root mechanics. Regression tests continue to cover them.

## Verification

PR19 introduces mathematical tests for all 16 puzzles' initial equality, positive whole-number solution, action restrictions, two possible first-side directions and complete manual solution routes. It also checks that an unmatched first move does not enter the history, mismatches cannot commit, Undo restores both rooms, and new progress never touches Stage 1 records.

Browser tests cover student/teacher gates, stage-specific chapter maps, tool hiding, real scale tipping, guided help, first room and second room actions, invalid attempts, comic handoff, saved progress and phone touch targets. The existing Stage 1 and prototype browser regressions must remain green.

## PR20 — notebook-first foundation

The **paper-first step checker and sprite replay** are implemented in PR20, with safe line parsing, physically representable one-operation transformations, multiple valid solution routes, undo, reset, and genuine hand replay. The paper is shown before the sprite scene. A teacher-only sandbox in Settings or `?notebook=two-step-09` allows validation using already-published positive-whole-number puzzles **without recording Stage 3 or earlier-stage progress**. The Stage 3 campaign is now available; see [STAGE3_CAMPAIGN.md](STAGE3_CAMPAIGN.md) for the twelve mathematically validated equations and backwards-faded lesson structure.

## Next: PR22 — Equation Workshop

Stages 1, 2 and 3 of World 1 now offer **20 + 16 + 12 playable puzzles**. Saved progress is independent and the notebook campaign only records completion after a fully successful physical replay. See the [Stage 3 campaign](STAGE3_CAMPAIGN.md).

**PR22:** Build the separate free-play Equation Workshop, with custom equation entry, strict positive-whole-number representability checks, scene generation and an open-ended interactive solver. Its progress must not be part of the campaign.

No negatives, fractional solutions, or square/root operations are added to World 1 as part of these steps.
