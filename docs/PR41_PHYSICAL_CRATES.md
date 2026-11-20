# PR41 — Physical Crate Opening (Guided Level 19)

## Student experience

The level is now titled **Sealed Crates**. The picture sign on one crate still indicates a sprite and three weights. A separate sign gives the number of identical crates. The crate control panel contains just **SEALED CRATES** and **Open crates**; there is no contents sentence, mathematical equation, or expanding-brackets instruction.

Clicking once starts one continuous, entirely in-chamber scene:

1. The articulated hand prises open each crate lid with a crowbar.
2. All sprites leap out **at the same time**, bouncing once and landing on the actual chamber floor.
3. Only after they have landed do the wooden fronts hinge down and the side boards swing away.
4. The weights become visibly exposed in the original boxes, in their original groups of three.
5. The three weights from each box tumble in their own batch onto the chamber floor.
6. The empty cases fade out, leaving the familiar fully interactive loose sprites and weights.

The one-crate alternative after division follows exactly the same sequence with one sprite and three weights, and no phantom extra crate.

## Boundaries and guarantees

- Engine identity: original level ID `master-19`, initial value `2(x+3)=14`, solution `x=4`, and three-interaction star benchmark are unchanged.
- Both valid solutions are unchanged; the divide-first operation is still the game's regular **whole-crate wicker basket animation**.
- The group value is authoritative throughout. No partial visual scene is ever committed to engine state. The single `unpack` history entry is recorded only after all physical objects have settled.
- The physical actors are temporary duplicates of familiar `.token.sprite` and `.token.weight` game art *inside the existing room*, not separate item counters. They are outside the authoritative token row until the end. This prevents wrong counting in division, neutral pairs, and star logic.
- The original stacked crate representation, count badge and one picture sign are preserved.
- A failure or interruption cleans up the open-lid and panel classes and leaves the original unopened equation. Undo and Reset work normally once the move finishes.
- The optional pause control appears only while the sequence is running; it pauses the hand, lid/panel animations, airborne actors and phase timers, and resumes at the same point.
- Reduced-motion shortens movements but preserves opened lids, landed sprites, lowered panels, visible weights, tumbling weights and final loose objects.
- The existing replay engine is retained, but this one level uses pictorial comic stages and short symbol cues rather than reading off equations and explaining actions. Other levels' replay is unchanged.

## Architecture

- `src/crate-expansion.mjs`: adds a frozen `physicalPhases` sequence derived from the current whole-crate count and contents.
- `src/crate-physical-layout.mjs`: pure geometry-bound floor positions and distinct bouncing/tumbling keyframes.
- `src/crate-expansion-view.mjs`: on-scene only physical actors, real lid and panels, group reveal, pause/visibility control, safe cleanup.
- `src/crate-physical.css`: actual hinged opaque faces and sides, concealed weight compartments, no painted-over teaching stage, real-actor styling and visual-only comic.
- `src/group-crates.mjs`: physical crate compartments; one picture sign attached to the hinged face of one crate.
- `src/app.mjs`, `src/worlds.mjs`, `index.html`: reduced copy, silent action, one value-preserving state commit, replay integration.

## Review checklist

- [ ] Hand/crowbar tip reaches actual lids on both crate-stack positions.
- [ ] Two sprites physically bounce simultaneously, and are visible settled before panels move.
- [ ] Front boards fall forward; side boards open out; pictures fall with the wood rather than floating.
- [ ] Three distinct weights appear inside EACH crate only after panels open.
- [ ] Weight packets are physically connected to their source crates and settle on the same floor as the sprites.
- [ ] No floating teaching box, multiplication text, brackets or explanatory speech.
- [ ] One-crate divide-first animation shows just one source.
- [ ] Pause freezes the physical scene, Resume continues; reduced motion shows all educational states.
- [ ] Responsive screenshots at 1092×540, 1024×720, 1440×900, 1920×1080 and 375×812.
- [ ] Unit tests, browser smoke and public-pages check green.

**Human visual sign-off is required before merging.**
