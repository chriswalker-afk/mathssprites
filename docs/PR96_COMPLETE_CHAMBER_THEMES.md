# PR96 — Chamber designs, part two

This completes the 57 cosmetic milestone collection, with the last five chamber rewards at the original agreed thresholds:
- Frostbound Vault (375): icy Gothic arch, frosted steel door and crystal ribs.
- Ember Forge (465): basalt brickwork, copper vents and inset glowing embers.
- Royal Treasury (525): burgundy damask, gilt pilasters, crown relief and decorative vault door.
- Arcane Laboratory (585): violet stone, glass alchemy vessels and a geometric seal.
- Astral Sanctuary (675): celestial dome, static suspended orrery and deep indigo constellations.

All ten backgrounds are original, local 480 × 320 vector assets using the same shared room, palette and Atelier thumbnail rendering system. The art is decorative, static, muted and fades towards the floor. Theme equipment and try-on remain independent of sprite, weight and star accounting. Both sides of the balance match. No changes to physical geometry, rules, motion, exact fractional partitioning or level progress. No new service or external assets. Existing free original and permanently earned entitlements are preserved. Presentation cache revision 96; all ten asset URLs versioned, fraction styles loaded through the existing gate.

Regression coverage: all 57 rewards readiness and equip from a complete profile, high-tier saved entitlement migration, locked preview isolation, independent restoration, all ten gallery art images and thumbnails, phone gallery, actual image decoding, native/World 3 shared backgrounds and unchanged chamber geometry, signed cancellation and square/weight counts with Astral Sanctuary, and published release probe including all ten local SVG files. Missing-art safeguards still tested with deliberately unavailable art lists. PR95 unit, diagnostic, smoke and visual suites passed; other browser shards were outstanding at last inspection. Actual PR96 CI and manual visual review remain pending.

## PR97 release QA checklist

1. Confirm all 57 rewards have usable art; exercise genuine progress from 719 to 720 and verify replay-gated Grand Alchemist celebration, no duplicate rewards, no free-play credit, legacy saves and independent restore.
2. Capture all ten chamber themes in actual native and shadow-root scenes at desktop, school-laptop, short-height and phone sizes. Compare full and sparse rooms with original, including 48 weights/sprites, 3+2 stacks, fractions, negative pairs, baskets, crates and square construction. Review black/white contrast, labels, clipping, balance movement and hand targets.
3. Audit all 336 weight shape/material/effect combinations via representative and exhaustive computed-style checks; inspect unusual shape silhouettes, cut-area invariants, effects on moving/packed objects, original fallbacks and reduced motion. Verify sprites and weights remain distinguishable.
4. Check browser console/network, asset loads, cache revision, responsive overflow, startup, animation/performance and saved appearance after reload and cross-tab updates. Run unit, browser and strict published-release checks with isolated fixtures. Attach screenshots and list real test failures/known issues; do not declare a verified release until checks pass.
