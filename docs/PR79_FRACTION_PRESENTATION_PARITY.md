# PR79 — Bring Fraction Workshop to the campaign presentation standard

## Reference and root cause

The supplied comparison shows World 2 with a wide native scene, a
full-height right control panel and compact brand/level rail. World 3
still mounted an isolated preview-sized lab capped at 1220px / 490px,
with controls below the scene. Its whole sprite was a small static
SVG and fraction captions floated below their artwork. The screenshot
also showed Motion: reduced despite World 2 displaying Motion: on.
World 3 previously used the device preference as its default and did
not persist its own toggle.

## Implementation

- Preserve the shadow-root isolation, exact rational engine, all level
  IDs, scores and authored mathematical routes. Replace the campaign
  wrapper, not the standalone preview or the other worlds' game shells.
- Match the shared large desktop workspace and side panel. Use a compact
  sprite-branded header and level rail, full-height scene, stable
  native scale/beam/hand coordinates, mission and controls on the right.
  Stack scene and controls only on smaller screens. Keep the existing
  distinct green Fraction Workshop palette. Apply to Guided, Independent,
  custom play and the physical phase of Apprentice.
- Whole sprites use the established hop/wiggle/blink/eye layers. Exact
  fractional sectors retain the mathematically accurate original cut
  artwork. Quantity plaques are attached beside their objects in the
  same brass/enamel visual style as grouping labels; no floating text
  beneath fractional objects. Whole weights retain piles of five.
- Use the same explicit persistent motion preference as the main game.
  Default to Motion: on, like Worlds 1/2/4; keep the player's explicit
  reduced choice. Synchronize the main controller and home hero when
  changed. Reduced-motion still suppresses animation; explicit on works
  even when the device media preference is reduced.
- Hand approach/reach/lift beats now match their transition duration.
  Show joined equal-area pieces before separating. Use temporary actual
  cargo art moving from the floor into the hand or from hand to floor,
  then settle the exact existing prepared/raw/canonical inventory.
  Keep the established real wicker sharing/copying stages. Remove the
  temporary transfer on completion or interruption. No added counted
  objects or mathematical commits. Keep feedback in the sidebar and
  explanation bubbles for refused moves.

## Verification

Add comparison tests at 1838×891, 1280×720 and 390×844, attached plaques,
real actor animations and animated transfer distance, scope, matching
mode, Apprentice paper-first, preference persistence across worlds,
exact final quantities and controls. Existing reduced-motion test
fixtures explicitly save the reduced preference. Changing the user
preference is permitted; workshop campaign records remain untouched.

PR78 was merged as requested after its unit and smoke checks passed and
the previous main revision passed all six full-browser shards. Five of
PR78's own full regression shards were still running at merge. PR79's
new visual and browser checks are required before judging the design
complete. Latest screenshots should be compared directly to the
World 2 reference, then any remaining basket choreography or visual
details refined in a follow-up PR if necessary.
