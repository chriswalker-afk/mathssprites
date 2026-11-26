# PR84 — Cosmetic reward foundation

## Contract
- 29 fixed cumulative-star milestones, from Curious eyes at 3 stars to The Grand Alchemist at 720. The existing four worlds have 240 available levels and 720 declared stars. Read the current campaign record via its global total, never add legacy and migrated totals or increment a separate currency.
- Best results only: a repeated completion does not grant additional stars; improving a result can cross a milestone. Unrated historical completions do not invent stars. Free play, previews, opening a level, and invalid moves do not grant unlocks.
- Existing students receive all currently earned entitlements on startup, with original appearance preserved and no notification backlog. Save permanent known reward IDs and equipped slots separately in `mathssprites.cosmetics.v1`; future reductions in current stars cannot revoke an already saved reward. No empty profile write for a new student. Storage failure leaves an in-memory session.
- Keep the single shared appearance for both signs. Seven slots (fur, eyes, headwear, eyewear, neckwear, movement, effect) allow glasses and a scarf or medal together. The final milestone grants one coordinated seven-piece set; exact artwork is intentionally deferred. The catalogue has no sign, colour, size, mass or physical parameters.
- Store validates known IDs, correct slots and ownership. Null means the original look/no accessory; restore original clears only selections, never entitlements or stars. Snapshots are immutable. Subscribe to reward/selection changes and return newly unlocked IDs in catalogue order. Site's only live award hook follows its validated campaign completion and publishes `mathssprites:cosmetics-change`. No art, menu, celebration, or reward spoilers in PR84.

## API for later PRs
`cosmeticRewards` in site.mjs is the live store; pure tests instantiate `createCosmeticRewards(campaign,{storage,registry})`. Read `getSnapshot()` (earnedStars, availableStars, unlockedRewards, equipped, nextReward, starsToNext); `isUnlocked(id)`, `equip(slot,id)`, `equipSet(id)`, `restoreOriginal()`, and `subscribe(listener)` support the Atelier. Keep the renderer's default appearance until an implemented visual layer is explicitly equipped. Set components are one milestone, not seven additional rewards.

## QA
Test all 29 boundaries, global totals, migrations, save safety, best-score upgrades, no auto-equip, locked/wrong-slot rejection, multi-tab preservation, corrupted/blocked storage, and final set. Browser tests cover real completion and returning students; existing Workshop/preview tests remain no-write checks. The all-stars synthetic save verifies the declared rating ceiling, not a new independent shortest-route certification.

## Next — PR85
Add shared presentation-only layers in the actual sprite renderer, beginning with Curious eyes, Extra fluffy and Sleepy eyes; test black/white contrast, native motion, cancellation, basket fit, and unchanged mathematics. No new thresholds or duplicated renderers. PR86 builds the Sprite Atelier UI; PR87 adds accessories; PR88 motion/effects and celebrations; PR89 cross-world polish.
