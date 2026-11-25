# PR61 — fractional weight artwork and isolated preview

World 3 remains locked. Open `fraction-weight-preview.html` directly after
deployment to compare the art. The normal home screen, menus and old weight
renderer are untouched. No new campaign or student progress keys.

## Visual decisions
- Retain the existing brass weight body polygon and bronze/gold gradient
  palette. A whole object is never shrunk to impersonate a fraction.
- The tapered body is divided by vertical cuts chosen to give **equal
  polygon area**, rather than equal widths (which would be unequal areas
  on a taper). Numerical SVG geometry is only presentation: the exact
  engine supplies each piece's rational value. The original dashed body
  silhouette is decorative and never counted.
- Rejoin and separate the same SVG piece actors with horizontal motion.
  Distinct cut edges, group fraction labels and accessible descriptions
  disambiguate tiny pieces. No extra equation step is introduced.
- Reuse `weightPilePosition` for whole-weight piles (three lower, two upper);
  the mixed-number residue sits beside the piles. Plaques count **whole**
  weights only when there are more than ten; the partial assembly has its
  own label. Existing Worlds 1 and 2 retain their actual CSS pile renderer.
- The preview contains all eight denominators, selectable animated cuts,
  step-through exact equivalent-fraction/borrowing examples driven by
  `fractionTransform`, and mixed inventories. The preview is intentionally
  developer-facing, so minimal explanatory labels are appropriate here.

## Tests
Equal-area partition coverage for every allowed denominator, no gaps or
overlaps in cut boundaries, exact rational inventory conservation, stable
piles, regrouping / borrowing, unique SVG IDs and accessible markup.
Playwright tests cover splitting/rejoining, common-grid examples, viewport
overflow and reduced motion. The preview does not modify the engine or
the saved game. Full hand choreography is deferred to PR63.

## Next — PR62
Fractional sprite artwork: use magical equal-area fragments of the existing
sprite (not miniature sprites); visually separate and rejoin them; preserve
original whole size and personality. Build an isolated review preview and
test all supported denominators, equivalent parts, reduced motion and
layout. Then PR63 integrates both object systems with the actual hand.
