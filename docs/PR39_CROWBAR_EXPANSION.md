# PR39 — Crowbar Expansion: See Both Multiplications

## Goal

Replace the PR38 instant crate-unpacking animation with an observable physical demonstration of the distributive law at World 1 / Guided Level 19: `2(x+3)=14`.

**The maths engine, stable ID `master-19`, three-star benchmark, and both solution strategies remain unchanged.** This is a staged visual presentation of the existing one-room identity rewrite, not an extra balance transaction.

## Before expansion

Two closed, glass-fronted crates, each containing one black sprite and three brass weights, appear in the west chamber. Neither crate has a symbol or label reading `x+3`. There is **one shared plaque** associated with the group: **Each crate: 1 sprite + 3 weights**.

The action rail says **Expand brackets** and explains that the crowbar opens each crate, releasing the contents. Divide by two remains independently available and is still a valid first move.

## One click, meaningful visual phases

1. **Open all crates:** the existing articulated hand carries a metallic crowbar. It aims at the actual lid of crate 1, levers it up, withdraws, then repeats on crate 2. While opening, all contents remain inside.
2. **Collect sprites:** one actual sprite actor flies out of each crate into a temporary in-chamber collection tray. The miniature sprite is no longer visible inside the source. All three brass weights remain visibly in each open crate. The shared on-scene caption pauses at `2 × x = 2x`.
3. **Collect weights:** three actual brass-weight actors leave crate 1 together as one packet, then three leave crate 2 together as a separate packet. The temporary collection tray preserves source groups, and the shared caption pauses at `2 × 3 = 6`.
4. **Settle:** the empty crates fade. The temporary illustration is removed; the engine commits the already-validated expansion once. The permanent floor now contains exactly two sprites and six weights. The equation changes from `2(x+3)=14` to `2x+6=14`.

The first two multiplications are visible **before** the final equation. The balance never tips due to an identity rewrite.

## Divide first

If the student divides by two using the existing wicker basket choreography, there is exactly one remaining crate. The same code reads its *current* contents and produces one crowbar opening, one sprite, and three weights, with captions `1 × x = x` and `1 × 3 = 3`. The result is `x+3=7` before removing three weights.

There is no hardcoded "two-crate expansion" in the animation runner.

## Architecture

- `src/crate-expansion.mjs`: pure, unit-testable data plan, labels and handwritten replay notes for the current positive whole-number crate contents
- `src/crate-expansion-view.mjs`: visual-only on-scene staged actor grouping; ephemeral actors live outside the engine's `#left-items` and `#right-items` token rows so physics, division, neutral pairs and saved state never count partially demonstrated objects
- `src/crate-expansion.css`: shared contents plaque; real crowbar artwork in the hand; opening wooden lids; on-scene counted sprite and weight collection; 1092×540 laptop, phone and reduced-motion adjustments
- `src/app.mjs`: sequential per-crate physical hand contact, independent release steps, a single final state commit, safe cleanup even if a visual step throws, and a three-beat comic + handwritten explanation
- `src/hand-timeline.mjs`: faster, specialised seven-beat crowbar timing, preserving standard hand timing for all other operations

The pure engine remains authoritative: it validates the rewrite **before** starting the animation. No partial sprite or weight release is committed to the equation. While busy, other maths actions, Undo, Reset, and navigation are unavailable. A newly loaded page or an interrupted sequence returns to a valid state with the originally sealed crates, not half-expanded contents. The view waits until the document becomes visible before advancing to another phase.

## Replay

Each expansion comic panel illustrates:

- Crowbar: open each complete crate
- Sprites: `2 × x = 2x`
- Weights: `2 × 3 = 6`

The pencil writes those as distinct steps before the resulting equation. After dividing first, the replay automatically uses the one-crate captions. Crate miniatures in comic scenes have a physical crate icon, not `x+3` printed on each box.

## Acceptance criteria

- [ ] Sealed crate art has no `x+3` text, attribute, or title; one shared plaque describes the contents
- [ ] The crowbar is genuinely visible in the hand and reaches the correct crate lid
- [ ] Crate 1 opens and then crate 2 before any objects move
- [ ] Both sprites move out before weights start, then **three + three** weights move out
- [ ] Captions appear and are readable: `2 × x = 2x`, then `2 × 3 = 6`
- [ ] Divide-first opens **one** crate and shows `1 × x = x`, then `1 × 3 = 3`
- [ ] Final room values, both three-step solution routes, Undo and Reset are unchanged
- [ ] Comic and pencil demonstrate both multiplication steps, no invented unilateral operation
- [ ] Reduced-motion shows static, paced phases with legible maths
- [ ] Responsive screenshots at 1092×540, 1024×720, 1440×900, 1920×1080, and 375×812; no hidden controls
- [ ] All mathematics, browser smoke and Pages checks pass

**Do not merge without human review** of the crowbar and both animations. The next project after acceptance is to consider bracket puzzles in the later Independent/Algebra Apprentice levels, and opposite crates in World 2.
