# PR32 — World-independent campaign architecture and one-screen Experiment Board

## Why
World 1 had three implemented stages (20 guided, 16 independent, 12 Algebra Apprentice) and three legacy browser progress stores. Its Home CTA already remembered the last level, but selecting another level required **Home → Worlds → Stages → Levels → Play**. The stage/level renderer and star system assumed only World 1 existed. Adding the Negative Number, Fractions, and Squares worlds would otherwise require another rewrite.

PR32 delivers **Home → Experiment Board → Level** (two clicks), or **Home → Stage shortcut** (one click), while retaining World discovery as an optional path.

## Student-facing route
- Home still shows the animated scale and a truthful **Continue** CTA.
- The second CTA is now **Choose a level →**, opening the Experiment Board directly.
- Three compact quick-play cards replace generic feature copy. Each opens the *last level for that stage*, or Level 1 if it has never been visited. Cards include the stage's name, last level and completion count.
- The Experiment Board has two selectors on **one screen**: world (Balance / Opposites / Fractions / Squares) and stage (Guided / Independent / Apprentice). Switching a stage does not navigate away; any currently unavailable world is visible but disabled.
- Every implemented level stays open by default. Chapter groupings, stars and recommended next level are preserved. A level ends back on **the same selected world and stage**; pressing Back returns Home on the fast path.
- The existing Worlds → Stages discovery screens remain as compatibility/optional exploration. The former four-step path still works. Art direction and text-reduction belong to PR33/34, not this navigation/architecture pass.

## Architectural contract
`src/campaign-registry.mjs` is the central, immutable data registry:

```js
{
  id: "opposites",
  title: "The Opposite Chambers",
  available: true,
  theme: "moonlit",
  stages: [{
    id: "guided",
    title: "Guided Opposites",
    method: "auto",
    chapters: [{id: "zero-pairs", title: "Zero pairs"}],
    levels: [{id: "opposite-01", number: 1, chapterIndex: 0, level: {...}}],
    optimalMoves: [2],
    capabilities: {quantityMode: "signed", allowedOperations: ["add","remove"], handMode: "auto"}
  }]
}
```

These IDs are stable. A level is identified by **world ID + stage ID + level ID**, never by the display number alone. A world can have a different number of stages, chapters, and levels. Valid entries are checked for unique IDs and matching chapters. Available means **implemented playable content**, not a progression lock. The signed/fraction/square mechanics are NOT magically enabled by a menu; until the correct levels and mathematical engine capabilities are supplied those world entries have no stages and stay disabled. The second world in unit tests is **test-only**, never shown as public playable content.

`src/site.mjs` looks up levels, game modes and navigation from the registry. Adding another world is configuration plus real puzzles/engine capabilities, not another hardcoded menu branch.

## Saving and migrating progress
`src/campaign-records.mjs` introduces:
- `mathssprites.campaign.v2`: `{version:2,worlds:{[worldId]:{stages:{[stageId]:{completed:[stableLevelId],lastPlayed:stableLevelId,bestMoves:{[stableLevelId]:moves}}}}}}`.
- `mathssprites.resume.v2`: `{worldId,stageId,levelId}`.

Migration reads the existing World 1 keys **without deleting them**:
- `mathssprites.progress.v1`
- `mathssprites.independent-progress.v1`
- `mathssprites.apprentice-progress.v1`
- `mathssprites.stars.v1`
- `mathssprites.resume.v1`

Completion numbers become stable level IDs; old best moves preserve their fastest recorded value. Historical completed puzzles with no saved moves remain complete but have **zero new stars** until replayed. Existing World 1 completion, stars and resume are **dual-written** on real actions for old clients. The new worlds write only their own v2 records. Reading is defensive against corrupt/blocked localStorage. A v2 record merging with older valid World 1 saves only ADDS valid completion and keeps the better star score.

There is no user login or remote data transfer. Progress remains in the student's browser.

## Testing / acceptance
- **Pure registry fixture:** a synthetic world called `opposites` with 2 stages, 2/1 chapters and 3/1 levels. It shares the stage ID `guided` and number `1` with World 1, proving no collisions or fixed counts.
- **Migration test:** existing World 1 completed IDs, high-score moves, last level, and v1 keys are preserved after v2 save/reload. No false stars.
- **Browser navigation:** Home → Board → chosen level; stage switching without another screen; one-click last-played stage shortcuts; disabled unbuilt worlds; correct return route, progress, and star ratings after reload.
- **Laptop snapshots:** 1024×720 and 1092×540; no document scrolling or clipped level tiles. Mobile remains scrollable/tappable.
- **Regression:** full existing mathematics, basket, Algebra Apprentice, and star-rating suites unchanged. The physical scene coordinates are not altered.

## Future PRs
- **PR33 — Distinct menu artwork:** Laboratory Foyer / Experiment Board / Hall of Doors / Inventor's Desk and stage/world themes.
- **PR34 — Text reduction & UX polish:** final help/settings simplification, unnecessary descriptions, world introductions, accessibility, reduced-motion and small-screen QA.
