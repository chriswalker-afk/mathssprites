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

1. Choose experiment 1–5 at the top. Each has the same hidden algebra rules but different physical starting objects.
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
