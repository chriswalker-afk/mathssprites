# PR62 — fractional sprite visual system

## Scope
The Fraction Workshop is still locked. Visit `fraction-sprite-preview.html`
directly after deployment. The original positive/signed sprite renderer,
campaign registry and progress are unchanged.

## Art and exact semantics
- Retain the dark sprite's slate/charcoal colour, cream eyes, little limbs
  and fur texture. The measured silhouette is a circle, with the fur detail
  inside that disk. Radial sectors of equal angle have equal area for all
  eight supported denominators. Exact values come from rational pairs, not
  SVG pixels. A partial sprite never becomes a scaled-down complete sprite.
- All pieces are clipped from the same artwork: a single pair of eyes,
  with each fragment retaining only its own portion of the creature.
  Fragments without eyes are still magical pieces of the same sprite.
  The dashed circle is a non-counted reference. The seam-free joined
  overlay redraws the original sprite only when all pieces are present.
- Separation moves the same actors radially, with a short staggered magical
  wiggle; rejoining restores their original position and complete face.
  Reduced motion retains the same actors and final visual state.
- A settled inventory shows whole sprites plus the reduced residual piece
  group, at the same scale. Temporary unreduced grids and copy groups are
  presentation only, driven by the engine's exact fraction plan.
- The art preview covers every denominator, arbitrary supported partial
  numerators, two thirds times three, three quarters times four, half plus
  third, and borrowing a whole into quarters. It links to the weight preview.

## Verification
Pure tests check sector geometry, exact conserved values, original face and
piece actor markup, mixed inventories, borrowing, copying and all 60 planned
reference routes. Browser tests cover the actual preview, actor identity,
reassembly, partial sprites, responsive fit and reduced motion.

## Next PR63 — integrate fractional hand operations and animations
Use the fraction engine's per-room `fractionPlans` and both reusable art
modules to create a staged split/share/copy/regroup/borrow choreography in
the existing chamber scene. Preserve whole pile behavior and pending
manual visits; common denominators must not add scored steps. Plan and
test an isolated vertical slice with actual engine transactions, undo,
overflow/unsupported denominator refusals and reduced motion. Integrate
preview rendering before enabling the full Guided campaign in PR64.
