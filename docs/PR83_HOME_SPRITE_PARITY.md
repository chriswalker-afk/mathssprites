# PR83 — Bring the foyer sprite up to gameplay standard

The home scale previously drew its own round, outlined, flat-eyed figure. Replace it with the real `spriteCreatureMarkup` actor used by the room renderer: layered fur, pupils, blinking, feet, shadow and deterministic independent movement. Keep its landing wrapper separate so falls and idle animation do not fight each other. Register idle movement only after the landing changes mass; retain the four mathematically consistent scale scenes, spring behaviour, controls and no-JS fallback. Enlarge the desktop sprite slots while reducing the native actor proportionally for narrow screens.

Pause freezes both landing and sprite motion. Reduced mode uses a genuinely resting creature. Explicit Play permits local foyer animation even if the rest of the game has Motion reduced; no other part of the game is opted in. The initial HTML uses matching native layers, avoiding a flash of the old artwork.

Version home presentation assets and add browser assertions for identical character layers, visible motion, reduced-motion opt-in and scale fit at desktop/tablet/phone widths. No changes to gameplay mathematics, balance sequence timing or progress.
