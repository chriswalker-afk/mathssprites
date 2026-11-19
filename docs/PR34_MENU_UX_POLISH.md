# PR34 — Student-first menu copy and UX polish

This pass refines the PR32 world-independent routes and PR33 illustrated spaces. It **does not** change mathematical operations, physical scale/hand coordinates, game state, saved IDs, ratings, or level gating.

## Decisions

1. **Keep the shortcut routes.** Home still has the animated scale, Resume, Choose a Level and three direct stage entrances. No new compulsory screens or clicks.
2. **Show one useful line at a time.** World doors show title, mathematical topic, availability and progress. The optional Stage gallery shows each teaching approach and progress, without repeating long descriptions. The Experiment Board keeps all 20/16/12 selectable levels and stars; progress is shown once alongside an explicit stage progress bar.
3. **Move secondary explanations into native disclosures.** How to Play starts with Choose / Balance / Reveal, with expandable stage differences and failed-experiment guidance. The star legend and Inventor's Desk equation limits expand only when wanted.
4. **Simplify Settings.** First-visit guides, teacher previews, replay introductions and reduced-motion control have concise labels; browser-local progress is still explained.
5. **Provide a real feedback hierarchy.** Working, warning and success states have distinct borders and text contrast. Detailed explanations of invalid fractions, overflowing rooms and mismatched manual moves are **unchanged** and still appear after the physical animation.
6. **Improve focus and touch.** The current main menu location is marked via `aria-current="page"`. Navigating to other screens focuses their heading; entering the Inventor's Desk focuses the actual equation input instead. Native details/summary remain keyboard-operable. Phone navigation provides 44px targets and no sideways scrolling.
7. **Future worlds remain data-driven.** Short world progress uses campaign-record totals and availability, not World 1 hardcoded numbers. Stage intro fallback uses stage method or a per-stage menu intro. Future negative, fraction and square worlds stay locked until real levels ship.

## Source and test inventory

- `src/menu-copy.mjs`: reusable, pure progress and stage-intro labels.
- `src/site.mjs`: condensed world/stage/board content; focus, active navigation and motion state.
- `index.html`: short visible copy, native help/rules/stars disclosures, concise settings.
- `src/menu-polish.css`: accessibility, menu and responsive styling after the PR33 art sheet.
- `src/app.mjs`: feedback state styling hooks that do not modify mathematical feedback.
- `tests/menu-polish.test.mjs`, `e2e/menu-polish.spec.mjs`: copy, progress, direct entry, focus, disclosures, 1024×720 / 1092×540 laptop, 375px phone, and 48-level safeguards.

## Manual visual review after CI

- [ ] At 1024×720 and 1092×540, the home scale, shortcuts, all four doors, all three stage cards and the 20-level board still fit.
- [ ] On a 375px phone, all menu and settings controls remain easy to tap; help expands without horizontal clipping.
- [ ] In Guided and Independent, inadvisable operations still animate before giving their explanatory speech and undo.
- [ ] In Algebra Apprentice, the maths editor still calculates operations before sprite playback.
- [ ] In Inventor's Desk, equation input is focused on entry; free play does not update campaign progress.

## Next: student journey review / PR35

Perform a short hands-on student navigation audit across new-player, returning-player and keyboard/phone workflows; refine any real points of friction before enabling the Negative Numbers world. Preserve one-click stage resume and two-click access to any level.
