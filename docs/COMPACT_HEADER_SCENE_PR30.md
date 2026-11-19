# PR30 — Compact gameplay header and polished scale scene

This pass addresses the supplied **934×365 scene screenshot** and the existing Google Slides header reference. It makes the visual design more intentional without changing any maths logic or physical-object coordinate system.

## Header

- Replace the old abstract two-eye logo in the game header with the **actual dark-sprite layers** used in levels: furry body, white eyes, feet, blinking, small hopping and wiggling. The website's top-left brand uses the same mascot.
- The game mascot is a **real accessible Home button** (`#game-brand-home`) with a title, focus ring, keyboard support and the same safe `leaveGame("home")` handler/disabled-while-busy behaviour as the existing Home button. The dedicated Home button remains for clarity.
- Compact the Maths Sprites name, hand-control badge, navigation buttons and movement toggle into a thin toolbar; condense the level title/chapter/progress dots into an immediately adjacent slim rail rather than two tall title areas.
- Small laptop viewports (900×500 CSS pixels and up) use a little more compact spacing. Narrow mobile windows retain appropriate tap targets, wrapped controls and ordinary scrolling. Prototype/teacher-preview controls are not removed or hidden.
- Respect the Motion: reduced option on the mascot, just as for other sprites.

## Artwork / scene cleanup

- Remove the floating “THE BALANCE CHAMBERS — LAB № 04” label completely.
- Remove the two **duplicate decorative roofs** above the rooms. The existing curved room arch remains; it is the real chamber outline.
- Maintain the previous net vertical roof spacing invisibly using responsive `.chamber` padding (30px desktop / 20px tablet / 15px phone / 19px short laptop). This is crucial: the scale pans, beam, hand targets and basket pick-ups remain in the **same physical scene coordinates** as before.
- Remove the unnecessary brass stripe across the scene top; fade background shelves and the off-centre ghostly moon behind the rooms, keeping atmospheric detail subordinate to the actual sprites.
- Remove the visible idle caption “Two rooms. One perfectly balanced mystery.” and retain only an unobtrusive **visually hidden live status** describing an unbalanced or waiting scale for assistive technology.
- Keep both room names, physical objects, balance indicator and speech/feedback when an experiment occurs.
- Do not touch the mathematics engine, animation sequence, stars, save data, level progression or wicker basket renderer.

## QA

`tests/scene-polish.test.mjs` checks absence of redundant decor, authentic sprite markup, safe navigation wiring and chamber position equivalence.

`e2e/scene-polish.spec.mjs` checks:
- Actual student campaign header at **1024×720** and **1092×540**: mascot matches playable sprites, slim topbar and level rail, scene lettering/roof absent, no clipping or scrolling, pans/beam intact, and clicking mascot opens home.
- Keyboard navigation and Motion: reduced on the mascot.
- A **390×844** phone: readable scene, at least 40px mascot target, no sideways overflow and working Home.
- Full-screen screenshots saved as `pr30-*.png`.

Existing short-laptop, star, manual-operation and division/multiplication tests remain intact. Final visual approval should inspect the screenshot artifacts before merging.
