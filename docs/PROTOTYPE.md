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

1. Choose experiment 1–8 at the top. Each has the same hidden algebra rules but different physical starting objects.
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

- Only dark sprites (positive variable) and brass weights (positive units) are selectable in the five current levels. **White negative sprites, balloons, cancellation puffs and signed-number levels** are documented and partially supported by the pure mathematical engine but **not yet playable or illustrated**. Do not present them as shipped features.
- Visual elements are original **CSS / inline-SVG placeholders**, not the final painted art library. The hand uses a simplified SVG pose; comic miniatures currently use DOM-rendered token symbols.
- Containers are temporarily displayed during division; there is no freeform drag-and-drop of baskets yet.
- The manual mode requires a second matching room selection, with the chosen action and count carried over. We can make the student reselect the action as a later difficulty setting.
- Speech bubbles appear on requests for hints and invalid operations; there is no complete hand-owner character.
- The pencil effect is animated handwriting-style text, not true path-by-path vector glyph tracing.
- No save state, achievements, audio, random levels or external services.

## Technical / testing

The algebra engine lives in `src/engine.mjs`, with immutable state and complete before/after snapshots for history and replay. The browser code is in `src/app.mjs` and CSS in `src/styles.css`. The test suite (`tests/engine.test.mjs`) covers validity of the five levels, solving paths, manual pending state, undo, equal grouping, whole-number restriction, signed zero pairs, and algebraic replay correspondence.

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

- **Square:** a row of n round x sprites or n weights is visualized as an n-by-n area. The hand lays a row, matches it with a column, fills the remaining cells, then pounds the variable creature into a new square-shaped x² creature when needed. The physical result is n² x² sprites or n² weights; the mathematical change occurs only at hand contact.
- **Square root:** the opposite visual process arranges n² square x² sprites or n² weights into an n-by-n area and keeps one side. Square-shaped sprites squish back into ordinary round sprites. Objects return to the usual floor row afterward.
- **Eligibility:** do not allow square on mixed expressions (e.g. x+2), nor roots of imperfect-square token counts or mixed terms. In these lessons x≥0, and all roots are principal. Pure squares (2x)²=4x² and √(4x²)=2x are represented exactly.
- **Outcome:** chapter 6's goal is intentionally to *build* x²=9 from x=3; chapter 7 reverses this by taking the root; chapter 8 goes from 4x²=36 through 2x=6 to x=3.
- **Modes:** guided applies the same operation in both chambers, while manual requires the matching second operation. The hand diagram and its seven/eight-phase choreography never update the engine before contact.

The engine's posX2 token is a new quadratic area term. New unit and Chrome tests cover physical floor geometry, matching row/column/fill order, literal counts, negative/mixed-case refusal, principal roots, manual matching, Undo, replay and phone layouts.

**Accessibility:** reduced-motion users still receive equivalent static area arrangements while the engine operations and written equations remain available. The original Motion control is unchanged.


## Failed experiments become visible and reversible (PR10)

Instead of rejecting an inadvisable move immediately, the game now teaches through a **temporary failed physical experiment** without changing its algebraic truth.

- **Fractional division:** the hand attempts to share a row into baskets. When this requires fractional creatures or weights, the little objects are shown sliced (for example, 3 sprites into two groups of 1 + 1/2). Fractions are *visual teaching previews only*; the whole-object engine rejects them.
- **Overflow:** an add or duplication which would exceed the 48-object cap visibly spills bouncing sprites or tumbling weights beyond the chamber. The exact attempted count and the capacity are given.
- **Missing or unsuitable pieces:** the hand shows a ghost object, or explains why a mixed room cannot form a square, rather than displaying incorrect algebra.
- **Order:** hand attempts the action; the learner watches the problem; a short pause; the hand explains the problem and explicitly says it will undo the change; a reversal animates; the previous whole-object rooms are restored. The attempt never enters Undo or comic history.
- **Your Turn:** after the first-side provisional move, students may change the operation, object or count before clicking the second room. If the different move has an unequal algebraic effect, the scale tips dramatically, a speech bubble explains the unequal changes and the hand restores **both** sides. The second change is only a preview. Mathematically equivalent but visually different operations are acknowledged as equivalent; a balanced scale must not falsely tip. The exercise still asks to match actions and resets both provisional attempts.
- **Reduced motion:** still shows partial-object arrangements, error explanations and reversibility, without gratuitous fast movement.

The pure engine exposes previewRoomAction and structured failure codes (fraction, overflow, missing, unsupported-area, mismatch). The separate attempt-feedback module generates exact fractional basket shares and concise hand dialogue. A temporary DOM stage is cleared after the rollback; no invalid step is committed, solved or written into the notebook. Node and Chrome tests check the calculations, visual states and recovery.
