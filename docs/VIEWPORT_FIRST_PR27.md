# PR27 — truthful continuation and one-viewport laptop layout

## Behaviour change

The home page's primary button now **opens exactly the stage and level named on the button**:
- First-time player: **Start Stage 1 · Level 1**.
- Returning player: **Continue Stage 2 · Level 7**, etc., even when Stage 1 remains unfinished.
- Replaying a completed level: the button explicitly says **Replay** if that level was already completed.
- After solving an equation, the resume destination moves to the next adjacent level (if available); a student can still return and replay at will.

The chosen destination is saved separately as `mathssprites.resume.v1`. Old progress and best-star storage are neither modified nor reset. Players with older saves but no resume key fall back to a sensible level derived from their existing stage progress. Corrupt or inaccessible storage cannot prevent play. Navigation always uses the same destination as the label.

## Single-screen desktop layout

On laptop / desktop viewports **at least 940 CSS pixels wide and 650 CSS pixels tall**:
- **Home:** compact navigation, legible question and large dynamic balance animation, clear actions, three short feature summaries.
- **Worlds:** four cards in two rows, with artwork and descriptions side by side.
- **Stages:** three playable stage cards and Equation Workshop on one screen.
- **Levels:** five chapter columns, four numbered star-rated level tiles per column. All twenty stage levels are visible together without a long vertical list. Stage totals, star legend, and navigation remain visible.
- **Help / Settings:** compact document panels, with local scrolling available only when text or browser zoom requires it.
- **Equation Workshop:** its lesson and form sit beside one another in the remaining viewport; long details can scroll within their own panel.
- **Game:** native-scale balance and responsive controls sit **side by side**, instead of the tools being pushed below the 582px scene. The scene dimensions and all the hand/token coordinate calculations are unchanged; physical animations still target actual objects. Manual-mode controls, intro coach and motion notice remain available.
- **Algebra Apprentice:** two-column instructions and the paper notebook fit in the viewport; long working is scrollable within the paper, without displacing the input and replay buttons.
- **Comic replay:** the card fits the viewport rather than requiring a >620px minimum height.

At narrow viewport widths, mobile or large browser zoom, the existing vertically scrollable layout is retained; controls are not clipped to force an impossible single-screen layout. This is **not** a scaling or gameplay-rules PR.

## Quality / accessibility

- Do not scale `#scene` with `transform` or `zoom`: hand targeting, drag/floor token positions and basket throws rely on its native coordinate system.
- Keep controls and interactive buttons >=34px on compact desktops, and existing >=44px touch targets on phones.
- Preserve accessible headings, disabled states, focus order and keyboard navigation.
- Use in-panel scrolling only for genuinely overflowing content; do not hide critical actions or mathematical information.
- Maintain the default homepage animation and reduced-motion behaviour.
- No world/stage access, stars, mathematical rules or progress history are changed.

## Visual QA

`e2e/viewport-fit.spec.mjs` validates laptop dimensions of **1024×720**, **1280×720**, and **1366×768**. It captures the home, four worlds, three stages and all 20 levels at each size, plus a gameplay and notebook shot. Bounds checks verify that content and key controls are within the viewport and that the document does not require vertical or horizontal scrolling. A mobile 375×812 fallback verifies vertical scrolling with no horizontal clipping.

The same suite also tests navigating to Stage 2 Level 7 and Stage 3 Level 6 and then resuming those exact locations through the homepage, without needing earlier stages completed.

**Screenshots:** GitHub Actions browser-smoke artifacts named `pr27-*.png`.

## Acceptance

- [ ] Initial and return-home CTA text correctly reflects the action and destination.
- [ ] All 20 implemented levels for each selected stage fit within one standard laptop viewport.
- [ ] Menus and game UI fit at 1024×720 / 1280×720 / 1366×768.
- [ ] Level titles, star ratings and achievements remain legible and usable.
- [ ] Hand, basket, signed-object and square/root scenes still align properly.
- [ ] Notebook input and replay button remain accessible.
- [ ] Mobile continues to scroll normally, without sideways overflow.
- [ ] All unit tests and fast browser checks pass.

The aim is a clean laptop experience without losing content or functionality on smaller devices.
