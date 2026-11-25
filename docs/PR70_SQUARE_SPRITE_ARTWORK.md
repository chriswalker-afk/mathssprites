# PR70 — Square sprite artwork

World 4 remains locked. This milestone replaces the prototype's decorative
gold-rimmed, star-marked quadratic sprite with a distinctly square member
of the same dark sprite family. Cream eyes, dark fur, feet and a ground
shadow match the existing round creature. The silhouette, not a label,
distinguishes x² from x. The mathematical unit is still an engine token,
not a rendered pixel area or a pair of adjacent round sprites.

## Shared art

`src/square-sprites.mjs` is the shared markup for all whole-object sprite
actors and for carried sprites, area cells and miniatures. Round and pale
markup stays unchanged. Square styling is shared by the original chamber,
baskets, hand, cell actors, spill and comic miniature. Square-specific
idle hop, wiggle and ground shadow give a slightly heavier landing while
preserving deterministic per-creature periods, blinking, glances, pause
during hand contact and existing basket bob. Square pickups also support
the established duck/dodge/caught reactions.

The two fur polygons have the same 64-point topology and can interpolate
during the reversible body morph. Both the old area-contact animation
and the new visual studio use the same shape keyframes. The actual
square/root operation is still owned by the balance engine. Changing a
creature's appearance in the art studio is **not** a mathematical move.

## Preview

After deployment open `square-sprite-preview.html` directly. It compares
the round and square species at an enlarged scale, lets the reviewer
reverse a single-creature shape study, compare one/4/8/12 square creatures
alongside three round creatures, pause a chamber as the hand approaches,
trigger duck/dodge/caught reactions, and view carried, cell and comic art.
The preview honours the operating system's reduced-motion preference and
provides a local override. It has no campaign state or storage writes.

Tests cover shared markup, stable identity, shape topology, reactions,
reversibility, mixed inventory, pause, reduced motion, responsive layout,
and the actual legacy mixed-root room. Browser screenshots are captured
for review. PR70 does not implement the new construction choreography,
inspection frame, notebook or public campaign. Manual visual approval
and CI remain release checks.

## Next PR71

Build the in-room square construction sequence: frame, original row,
matching dimensional column, quadratic region, both mixed regions, unit
corner, then release the exact output. Keep guides non-counting and use
the new square creature artwork. Review the hand's physical movements
and overflow at the 48-cell limit, and preserve reduced motion and
Worlds 1–3. PR72 will reverse this process for square roots.
