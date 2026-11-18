# Playing the first Maths Sprites prototype

## Current status

This is the first **interactive browser prototype** of the agreed concept. It is a dependency-free static web app, designed to run from a local web server or from GitHub Pages. It is not a final release or a hosted live game yet.

## Running it locally

With Python 3 installed:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in a browser.

With Node.js 20 or later:

```sh
npm test
npm run check
```

There is no `npm install` requirement for gameplay or tests.

## How to play

1. Choose experiment 1–10 at the top. Each has the same hidden algebra rules but different physical starting objects.
2. Choose **Guided mirror** for one action that the hand automatically repeats in both chambers, or **Your turn** to direct the hand in one room and then match it in the other. Your second room remains mandatory: the beam tips after just one.
3. Use **Remove / Add** with dark sprites or weights, and select how many.
4. Use **Divide** to temporarily display the room contents in two to five equal transparent baskets. The hand keeps one basket per room; all terms are divided. **Multiply** duplicates entire rooms.
5. Leave exactly one dark sprite alone in one chamber, with only weights opposite it.
6. A comic notebook appears automatically. Each completed two-room operation has its own animated panel. **An illustrated pencil physically follows the symbols and reveals each one separately**, with a rest between lines and a reading pause before the next panel. Use **Writing pace** (Careful / Natural / Quick), pause/resume mid-equation, previous/next, watch again, or show final working. The manual panel buttons show the complete selected panel for studying.

**No equations or x-labels appear during solving.** The recap is the first formal algebra.

## Levels currently available

| Level | Hidden source equation | Intended discovery |
|---|---|---|
| One little resident | `x+2=5` | take 2 weights from both rooms |
| A roomful of sprites | `3x=9` | divide into 3 equal groups |
| Clear, then group | `2x+4=12` | take 4 weights, divide by 2 |
| Across the hall | `2x+3=x+7` | take one sprite, then 3 weights |
| Five little baskets | `5x+10=20` | divide the complete rooms into 5 equal baskets, then remove 2 weights |

The equations above are **teacher notes only**; the browser UI keeps them hidden until replay.

## Deliberate first-prototype limitations

- In the introductory levels, Maths mode defaults to Positive objects: dark sprites and brass weights are available. Signed mode can be chosen for exploratory practice, and chapters 11–13 require it. White sprites, tethered balloons, collision puffs and balloon lifts are now playable and animated. Their opening levels all have positive x values; negative x solutions remain out of scope.
- Visual elements are original **CSS / inline-SVG placeholders**, not the final painted art library. The hand uses a simplified SVG pose; comic miniatures currently use DOM-rendered token symbols.
- Containers are temporarily displayed during division; there is no freeform drag-and-drop of baskets yet.
- The manual mode requires a second matching room selection, with the chosen action and count carried over. We can make the student reselect the action as a later difficulty setting.
- Speech bubbles appear on requests for hints and invalid operations; there is no complete hand-owner character.
- The pencil effect is animated handwriting-style text, not true path-by-path vector glyph tracing.
- No save state, achievements, audio, random levels or external services.

## Technical / testing

The algebra engine lives in src/engine.mjs, with immutable state and complete before/after snapshots for history and replay. The browser code is in src/app.mjs and CSS in src/styles.css. Unit and Chrome tests now cover thirteen curated levels, manual pending actions, Undo, equal grouping, signed zero pairs, and the pencil's replay of every cancellation.

The browser should preserve keyboard and pointer accessibility; the motion toggle and OS reduced-motion preference disable the decorative animations.

For initial visual QA, inspect 16:9 desktop, narrow desktop and phone widths; test both modes and the entire replay. This manual visual pass is still necessary before declaring release quality.

## GitHub Pages

The site uses **relative paths** and includes `.nojekyll`, so the repository is ready to publish as a static site. Once the prototype PR is merged, enable Pages from `main` at repository **Settings → Pages → Deploy from a branch → main / (root)**. Do not confuse the code PR URL with a deployed site URL; Pages may require separate activation.


## Hand illustration and animation (art pass)

The original single-outline hand has been replaced with an **illustrated SVG hand built from independently posed parts**:

- A forest-green laboratory sleeve with stitched seams and a brass-trimmed cuff.
- Shaded palm, thumb, four separately drawn fingers, small knuckle creases, fingernails and warm highlights.
- The thumb and fingers flex into a visible **grip**; after a removal the hand carries away the exact kind of item shown on-screen, while an addition brings it in and opens at the placement.
- Seven distinct stages: **approach, descend, aim, grip, contact, lift, withdraw**. A pure stage schedule lives in \`src/hand-timeline.mjs\`.
- The mathematics changes **once, at the contact stage**. The hand reaches and grips before the change, stays down during it, and rises while carrying/removing or releasing/adding the object. The next room is still untouched until its own hand action.
- Reduced-motion uses the **same mathematical stages** at much shorter durations without flourish. Mobile uses actual chamber geometry, not hardcoded desktop coordinates.
- \`e2e/hand-art.spec.mjs\` saves screenshots of the grasp, release, baskets, and mobile hand for review.

This is an original vector illustration, editable without adding an external image dependency. It remains a stylised hand, not photorealistic animation, and can be refined further after seeing the on-screen screenshots.


## Sprite idle animation - PR6

The inhabitants should look restless even when the learner does nothing:

- Each round dust sprite **jumps and gently bobs**, with a soft landing squash and a little floor-dust reaction.
- The **body wiggles independently** from the jump, giving an organic sense of movement rather than one repeating transform.
- The eyes **glance around and occasionally blink** at long, varied intervals.
- Different creatures have **distinct, deterministic** jump heights, frequencies, wiggle speeds and phase offsets, including between the two rooms. This does not re-randomize on every render.
- The visual body and its floor shadow use separate layers, so the shadow stays on the ground while the creature is airborne.
- The animated layers **pause only in the chamber the hand is manipulating**; the other chamber's residents keep moving.
- Sprites within division baskets have a smaller, quieter bob. Phone sizing scales the actor without cancelling its hop.
- The **Motion: reduced** setting displays fully stationary actors without fast blinking, and the existing **Motion: on** toggle restores independent motion.

The pure timing model lives in src/sprite-motion.mjs. The unit and Chrome browser suites check the independent motion and interaction states. All movement is **presentational only**: balance values still come exclusively from src/engine.mjs.


## Occasional hand-and-sprite interactions - PR7

Not every pickup is routine! When the hand removes a **dark or pale sprite**, a little creature can react to its approach:

- Approximately **28%** of eligible pickups make the selected sprite **duck down**, with a startled punctuation mark, before the fingers close and collect it.
- Approximately **27%** make it **dodge sideways** towards the middle of the room. The hand makes a small corrective reach and still captures it.
- The remaining **45%** are ordinary pickups. Each physical hand visit rolls once, so the reactions are a surprise rather than an unavoidable cutscene.
- The particular sprite that reacts is the **last sprite of the removed kind** in that room. That's the one whose visual token disappears when the equation engine applies the removal at contact.
- The creature briefly wriggles as it is lifted away. Other idle sprites remain paused in the active chamber, and the other chamber continues its usual bounce and wiggle.
- No reaction is played when adding a sprite, changing weights, grouping/dividing, or multiplying rooms. In reduced-motion mode all these comedy reactions are skipped.
- Reactions change only the visual presentation, **never the physical token counts, balance calculation, hand transaction history or replay algebra**.

For developers: the pure chance selector and safe wall-avoiding dodge direction are in src/sprite-reactions.mjs. The SVG hand's existing approach / reach / grip / contact / lift contract remains authoritative. Visual reactions end as the hand closes, **before the one and only mathematical change** at contact. Unit and Chrome tests cover ducking, dodging, normal pickup, manual matching and reduced motion.


## When the public site looks completely static

A real public-site Chrome probe confirmed (18 November 2026) that the GitHub Pages URL serves the same index.html, CSS, JavaScript and sprite-reaction modules as main. Browser checks at that URL found the sprite hop and body wiggle **running normally** when no reduced-motion preference is set. In contrast, when the browser/device requests reduced motion, the app intentionally removes these animations, including hand/replay flourishes.

Previously this was difficult to notice: the small header toggle merely displayed "Motion: reduced". Following classroom feedback, **Motion: on is now the default for every first-time visitor**, including when their device requests reduced motion. This makes the game visibly lively on opening. Anyone can explicitly choose **Motion: reduced** via the header; when it is selected, a clear explanatory notice and **Enable animations** button appear. An explicit in-game choice persists across reloads in localStorage when storage is available. The initial on-by-default behaviour is an intentional classroom design choice; students who prefer reduced motion can readily opt out.

Deployment verification sources live in scripts/check-public-site.mjs and scripts/check-live-browser.mjs. The optional GitHub Actions workflow Diagnose published Maths Sprites checks the real public URL and retains its screenshots and audit JSON. The normal Chrome test suite checks the default-on behaviour even under an OS-level reduced-motion preference, deliberate opt-out, the enable button, persistence and storage-disabled browsers.


## Floor rows and geometric operations — PR9

The ordinary (non-basket, non-area-demonstration) view of every chamber has a **single floor-aligned row**. A floor-shell centers it and scales it to fit the room, including on mobile. There is no wrap to a second row. This works for sprites, square sprites, weights and balloons; the latter still float slightly above their ground position.

New whole-room operations:

- **Square:** an existing single floor row of a round x sprites and b weights becomes a physical **in-room carpenter's box**. A matching perpendicular edge is laid out, then the hand fills the x² corner with a² square sprites, two cross-regions with 2ab round sprites, and the unit corner with b² weights. All pieces are laid before the engine commits at contact.
- **Square root:** the reverse physical procedure fills an in-room box with a² square sprites, 2ab round sprites and b² weights. The hand removes the interior in stages, takes away the duplicate edge and keeps exactly a round sprites and b weights. The engine uses principal roots (x≥0) and returns to the one-row floor layout.
- **Eligibility:** the full linear side ax+b (a,b≥0) CAN be squared, including mixed expressions such as x+2. Squaring x² again would require x⁴, so is not allowed. Rooting requires exact perfect-square corner counts a² and b² and the cross coefficient 2ab, with no signed objects. In these chapters x≥0. No room may exceed 48 whole objects.
- **Outcome:** chapter 6's goal is intentionally to *build* x²=9 from x=3; chapter 7 reverses this by taking the root; chapter 8 goes from 4x²=36 through 2x=6 to x=3.
- **Modes:** guided applies the same operation in both chambers, while manual requires the matching second operation. The hand diagram and its seven/eight-phase choreography never update the engine before contact.

The engine's posX2 token is a distinct quadratic area term. In-room geometry and Chrome tests verify the 4+6+6+9 interior pieces of (2x+3)², physical edge markers not counted as objects, reverse roots, floor layout, principal-root safeguards, manual matching, Undo, replay, and mobile screens.

**Accessibility:** reduced-motion users still receive equivalent static area arrangements while the engine operations and written equations remain available. The original Motion control is unchanged.


## Failed experiments become visible and reversible (PR10)

Instead of rejecting an inadvisable move immediately, the game now teaches through a **temporary failed physical experiment** without changing its algebraic truth.

- **Fractional division (PR13):** when sharing requires fractional objects, the hand targets and physically chops the actual leftover floor sprite, square sprite, weight, balloon, or white sprite inside the same room. The original body, eyes and tufts become little clipped fragments. The hand pauses, explains why those pieces are not allowed in the current whole-object mode, reassembles them and undoes the trial. All other objects stay on the floor; no floating basket diagram or extra whole objects are created.
- **Overflow:** an add or duplication which would exceed the 48-object cap visibly spills bouncing sprites or tumbling weights beyond the chamber. The exact attempted count and the capacity are given.
- **Missing or unsuitable pieces:** the hand shows a ghost object, or explains why a root doesn't form a complete square (or an x² sprite would require a higher power), instead of displaying incorrect algebra.
- **Order:** hand attempts the action; the learner watches the problem; a short pause; the hand explains the problem and explicitly says it will undo the change; a reversal animates; the previous whole-object rooms are restored. The attempt never enters Undo or comic history.
- **Your Turn:** after the first-side provisional move, students may change the operation, object or count before clicking the second room. If the different move has an unequal algebraic effect, the scale tips dramatically, a speech bubble explains the unequal changes and the hand restores **both** sides. The second change is only a preview. Mathematically equivalent but visually different operations are acknowledged as equivalent; a balanced scale must not falsely tip. The exercise still asks to match actions and resets both provisional attempts.
- **Reduced motion:** still shows partial-object arrangements, error explanations and reversibility, without gratuitous fast movement.

The pure engine exposes previewRoomAction and structured failure codes (fraction, overflow, missing, unsupported-area, mismatch). The separate attempt-feedback module generates exact fractional basket shares and concise hand dialogue. A temporary DOM stage is cleared after the rollback; no invalid step is committed, solved or written into the notebook. Node and Chrome tests check the calculations, visual states and recovery.


## In-room carpenter's square — PR11

The reference example is a six-stage build of (2x+3)². Its stages are implemented in the original chamber rather than through a detached area preview: the left and right area boxes use the room-square-box class within room-interior. The physical sequence is **frame → existing edge → matching perpendicular edge → square-sprite corner → both cross regions → unit-weight corner**. Each interior cell has a truthful physical type, region, row and column; it enters from the floor under the illustrated hand. Variable segments have a visibly different length to unit segments (consistent across both dimensions). The box itself is geometrically square, not two unequal axes.

There are exactly **4 square sprites**, **6+6 round sprites**, and **9 weights** inside the finished 2x+3 box. The translucent top/side edge markers are **guides**, not extra model tokens; the original floor row is dimmed during the construction and restored when the box clears. The engine's single contact event remains the only state mutation.

The square-root operation uses the SAME cells and frame **in reverse**. It begins with a fully populated physical area, removes weights, then both mixed regions, then the square-sprite region; removes the duplicate side and highlights the side to keep. Only at contact does the room change to its a sprites and b weights. It is mathematically valid only for exact nonnegative perfect squares under x≥0, never an arbitrary quadratic.

Chapters 9 and 10 use 2x+3=5 ↔ 4x²+12x+9=25, followed by ordinary two-sided operations. Existing simple area chapters (6–8), PR10 failed-experiment feedback, deliberate manual balance mismatches, reduced motion and the pencil notebook still share this implementation.

### QA requirements

The pure box plan in src/area-layout.mjs enforces a² + 2ab + b² = (a+b)² for every supported size; the two side edges are not added to those counts. Playwright must inspect the actual DOM box inside each room, the four region counts and stage order, the 6×6 simple root, 5×5 mixed build, its reversed root, phone-scale bounds and reduced motion. No UI animation may claim a transformation that the engine rejects or change the other room before hand contact.


## PR12: Signed objects and proper zero-pair theatre

The **Maths mode** selector is independent of hand control. Positive-only mode hides the two negative-object tools and the pure engine rejects them. Signed mode enables two additional physical objects: pale white −x sprites with pointed tufts and balloons representing −1. Positive introductory chapters can opt into signed practice by resetting the level; signed chapters 11–13 start signed and cannot hide their negative objects.

At contact with the large hand, all newly introduced pieces become visible BEFORE the appropriate zero-pair animation. For variables, black and white sprites hop into one another and disappear in a soot puff. For constants, the balloon reaches the weight, lifts it, and they leave together. Several zero pairs vanish one by one. The visual code consumes deterministic per-pair events from the engine: each event has a room-specific ID, before and after counts, pair kind and specific animation. It never randomly deletes nearby objects. One committed two-room operation can have arbitrarily many local zero-valued cancellation subevents; they do not create extra equation steps.

Before division, existing pairs neutralise first, then the hand forms valid whole-object baskets from the reduced counts. The notebook replay preserves each signed operation and writes separate neutralisation notes before the resulting equation. The miniature scene includes the corresponding cancelling sprites or weight/balloon. Undo restores all pre-operation objects in both rooms, including white sprites and balloons. Reduced motion displays an equivalent static pair before it disappears.

Suggested visual inspection: black/white collision in chapter 12; two distinct balloon lifts in chapter 11; both effects across two transactions in chapter 13; signed mode disabled by default in the original introductory level; separate Guided Mirror / Your Turn controls; signed algebra and neutralisation in the final pencil notebook.


## PR13 — In-room rejected-division experiments

This scene correction replaces the detached five-basket display in the failure state. The failed division targets the actual remaining whole objects standing on the chamber floor. The hand carries a brass cutter to that location. Each leftover source object is duplicated only as an invisible-state-preserving presentation, geometrically clipped into the requested number of separate fragments, and animated apart. A half-sprite has only half the original body and eye positions; it is not a miniature whole sprite. Square sprites, signed creatures, weights and balloons use the same conservation rule. Existing signed zero pairs are cancelled first in the temporary preview.

After students see the little pieces, the hand pauses, gives its explanatory speech, rejoins the fragments and restores the original floor layout. It never commits the invalid division, changes the equation, tilts a genuinely balanced result or adds a replay panel. Reduced-motion mode displays the separated and restored positions without shaking. Mobile uses the original chamber geometry. The pure material-conservation plan and new Chrome screenshots are covered by tests/fraction-theatre.test.mjs and e2e/failed-attempts.spec.mjs.
