# PR28 — real small-laptop single-screen layout

PR27 successfully merged and deployed, but its stylesheet only enabled compact mode when the **browser viewport**, measured in CSS pixels, was at least **940 × 650**. A 1366×768 Windows laptop at 125% scaling may have less than 650 CSS pixels of usable browser height after toolbar space, which disables the entire compact layout. Previous browser tests simulated **1366×768 CSS pixels** and therefore did not test the actual failure case.

PR28 closes that gap:
- One-screen desktop layout now activates at **900+ CSS pixels wide and 500+ CSS pixels high**, including heights typical of smaller/scaled laptops.
- For usable heights of 500–649px, the layout compresses headers, stage cards, world cards, chapter columns and controls to fit.
- The **physical scale** has its chamber positions, room heights, beam and pedestal realigned together. No transform or zoom is applied to the live scene or its hand/basket geometry.
- The decorative homepage scale can safely shrink independently.
- The stylesheet URL includes `?v=28` so browsers fetch the updated layout CSS after the new HTML is loaded.
- Below 500 CSS pixels high or 900 wide, normal scrolling remains rather than clipping mathematically important content. Increasing browser zoom or maximising the window changes the usable CSS viewport.

## QA
Run `e2e/viewport-fit.spec.mjs`:
- Existing 1024×720, 1280×720 and 1366×768 ideal viewports.
- **New** realistic 1092×540, 1024×600, 900×560 and 1280×525 browser viewports.
- Tests require 20 enabled levels, every menu in the viewport, the real scale pedestal and main hand controls visible, and **actual pointer hit-testing** of the operation button (a bounding rectangle alone does not prove a button isn't clipped).
- 1092×460 retains ordinary scrolling.
- Upload screenshots named `pr28-*.png` for visual review.

The aim is not just "no document scrollbar"; actions and content must remain visibly reachable and readable. A very narrow or exceptionally short viewport will still scroll by design.
