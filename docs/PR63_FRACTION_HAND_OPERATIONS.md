# PR63 — Fractional hand operations and balance integration

## Scope and launch

Open `fraction-balance-preview.html` directly after deployment. It is an
isolated playable vertical slice using the same laboratory chamber, scale,
hand SVG and wicker basket markup as the existing game, not a mock-up of an
equation. Eight representative Guided fixtures can be selected, with either
Guided or Independent hand control. The controller uses the shared exact
engine and can be mounted on compatible scene/toolbar markup in PR64.

The preview is not yet routed from the World 3 menu. No student progress,
star thresholds, notebook campaign or existing-world renderer is changed.

## Physical staging contract

- Consume a successful `prepare` / `previewRoomAction` result and derive
  exact per-kind grids from its `fractionPlans`. Verify that the prepared
  inventory equals the source, and that the raw result equals the engine's
  after state. No independent arithmetic model in the UI.
- Add/remove: convert to common pieces, borrow if needed, carry the selected
  amount in the existing hand, show raw pieces, close the joins and regroup.
- Divide: partition the original quantity into equal whole/fragment groups,
  visibly transfer those same group actors into wicker baskets, remove the
  unwanted baskets with the articulated hand, then retain/recombine one.
- Multiply: begin with a complete group, carry in the other complete
  identical baskets, pour the groups out and reassemble the total.
- Guided pre-validates both rooms; independent visits are pending until the
  matching other-side visit. Equivalent fractions match. The scale responds
  to exact rational comparisons, including provisional first visits.
- A failed second visit rolls back both rooms without a history step. An
  unsupported denominator shows an illustrative equal-parts strip; overflow
  shows the excess count, and other failures use a brief room shake. Speech
  explicitly distinguishes unsupported visuals from invalid mathematics.
  These refusal treatments are bounded illustrative feedback, not the old
  full physical cut/overflow choreography; refine them in classroom QA.
- Undo/reset restore exact committed room contents. During animations the
  controls are disabled; the only committed state change is the successful
  shared-engine transaction. Recombination never costs a scored move.
- No equation during play; after success a basic written transaction review
  is shown. The production campaign's full comic replay, navigation, title
  metadata, completion and stars are follow-up integration work.
- Keep whole weight piles, fraction art, neutral controls, keyboard buttons,
  reduced motion, and scale-to-fit chamber rows.

## Tests

Pure tests exercise every one of the 60 agreed reference routes through
the actual engine and assert source/prepared/group/raw/after conservation.
Playwright covers division baskets, borrowing, multiplication, equivalent
independent moves, mismatches, refusals, Undo, reduced motion, narrow and
short viewports, and no storage writes. Add the new spec to focused physics
QA and retain full old-world regression coverage.

## Next PR64 — Guided Balance

Register the 24 Guided fraction levels with stable IDs, chapter names,
teacher-only reference data and neutral starting controls. Route World 3
Guided launches to the fraction controller, wire completion/resume and the
existing comic replay to exact fractions, test all levels and UI navigation.
Expose only the ready Guided mode; Independent/Apprentice follow PR65/66.
Audit scored pars before assigning stars.
