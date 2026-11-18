# Visual and animation direction

## World
A two-room balance apparatus built from aged timber, black iron and brushed brass inside a softly illuminated alchemical laboratory. Each room is an open-front dollhouse-scale interior with an independent floor, shelves and background. The rooms move as rigid parts of the scale but their contents bounce independently.

**Mood:** whimsical, tactile, mysterious, calm and clever — for secondary-school students, not preschool. The laboratory does not need a visible owner: a **hand from above, a cuff and occasional speech bubble** give sufficient personality.

## Sprite family
- **Black / positive sprite:** original charcoal dust creature; irregular fuzzy perimeter; two off-white eyes; tiny feet and arms; subtle squash on landing. Later revealed as `+x`.
- **White / negative sprite:** pale fuzzy creature with a distinct silhouette and airy hop style, not just the black sprite recoloured. Later revealed as `−x`.
- **Black + white together:** briefly notice one another, spring into contact and disappear in a **small, warm-grey puff of smoke**. They represent an exact zero pair.
- **Square sprite:** a live rounded-square dust creature, visually distinct from round even when monochrome. It fills the variable×variable corner of the physical in-room square; the `x²` label appears only in the retrospective notebook.
- **Different variable (future):** unmistakable unique silhouette / accessory; colour only supplements distinction, never supplies it alone.
- Sprite identities stay stable within a level. Create original character designs rather than replicating characters from existing films.

## Constant object family
- **Positive:** a uniform stone or brass weight, one object = `+1`.
- **Negative:** one small, tethered balloon, one object = `−1`, with gentle upward drift and enough visual tethering to read its attachment to the room.
- **Weight + balloon:** balloon takes hold of weight and they **float away together**; both vanish exactly once. This is the arithmetic simplification `(+1)+(-1)=0`.
- Do not vary sizes to imply unknown invisible values. If using larger storage containers in later puzzles, they must have transparent walls or a countable representation.

## Division containers
- Open-front see-through baskets or lab chambers with a distinct brass rim, neutral weight in the model.
- The hand arranges the **entire room's contents** into `k` equal groups **within that room**, mirrored on the other side. For divide by five, show five baskets on **each** pan.
- Contents remain visible; group layout must not bury small sprites or balloons. A tap-to-zoom view can help crowded counts.
- The hand removes `k-1` complete containers from each room, leaving one group apiece.
- Multiplication builds `k` copies of the **entire group**, with a restrained laboratory mechanism to explain duplication.
- Avoid confusing these temporary grouping containers with persistent storage objects.

## Hand and dialogue animations
- Hand enters from the top with natural sleeve and subtle shadows, pinches, places, picks up, gathers groups, points and withdraws.
- **Guided Mirror:** two matching hand actions play automatically.
- **Your Turn:** hand pauses after first room, scale tilts, prompt calls for repeating the move in the other room. Undo is always available during the pending step.
- Hand-owner bubble: small, understated, first-person language, triggered on relevant errors or occasionally for discovery; no more than two unsolicited remarks in a short level. A whole-number level can say, “That would leave part of a sprite. I'm saving fractions for another experiment.”
- Do not mock the student, or treat fractions as intrinsically wrong.

## Comic-book replay animation
- At success, the set fades to a clean composition: **comic panels unfolding sequentially on the left**, cream notebook paper on the **right**.
- The first panel reveals labels on sprites, stones, balloons and containers, then the pencil writes the hidden initial equation.
- Every subsequent **completed operation** receives a panel that recreates the actual hand action. The pencil writes `−x`, `+2`, `÷5`, etc. on **both** sides and then writes the simplified next line.
- Zero-pair puffs and balloon flights replay as part of their triggering panel, not as unsourced mathematical transformations.
- Panels appear one at a time; previous ones stay readable and the user can pause, rewind, change speed and rewatch.
- Style: ink borders, warm paper, graphite pencil, lovely subtle frame-to-frame creature behaviour; **not** comic-book speech typography or clutter.
- Reduced-motion mode replaces writing animation with a staged reveal of perfectly legible text and static object arrangements.

Full [comic replay storyboard](COMIC_REPLAY.md).

## Animation inventory
- Sprite idle: staggered irregular hops; rare synchronized bounce; looks toward hand.
- Land: compress then spring; subtle soot wisps.
- White sprite: light rising bounce, distinct from black.
- Neutralise variable zero pair: black and white bump, puff, vanish.
- Neutralise constant zero pair: balloon lifts a weight, leaves frame, vanish.
- Hand: enter, choose, pinch, lift, place, gather, copy, partition.
- Balance: physical feedback for a pending manual half-move, then smooth re-levelling after matched transaction.
- Success: sprites briefly settle; dial rests at centre; brass backlight glows.
- Comic: paper unfurls, frames animate, pencil writes, items receive labels.

## Layout and production
- Desktop 16:9 main composition; tablet responsive alternative.
- Preserve readable silhouettes, exact counts and separation.
- Layered scene: lab background, scale and indicator, room shells, room items, grouping baskets, hand, dialogue bubbles, HUD, comic panels, replay labels and notebook.
- Export individual art assets with transparent backgrounds, not full-screen precompositions.
- Prototype movement with deterministic tweens rather than unbounded physics collisions so the maths remains verifiable.
- Accessibility: contrast, static-count fallback, keyboard control, captions, no dependence on sound, reduced motion.

## Revised asset backlog
1. Laboratory backdrop with readable negative space.
2. Left/right open-front rooms resting on a precise beam scale.
3. Scale beam, pivot and indicator; level and temporarily tilted states.
4. Black sprite: idle, hop, look, lifted, collision poses.
5. Unit weight (+1).
6. Hand: empty, pinch, holding weight, holding sprite, carrying group.
7. Transparent grouping basket; one-of-five layout, remove-group animation.
8. Operation HUD: signed items, operation and factor, Undo, two-mode selector.
9. **Comic panel frame**, paper notebook, **pencil writing animation**, math-label overlays.
10. **White sprite**, negative balloon, matching zero-pair puff and balloon-lift effect.
11. Owner bubble frame and lettering animation.

Prioritise basic mechanics, control modes and comic replay over polishing negative-character artwork; the latter belongs to the first signed chapter.


## Approved next visual pass: articulated hand

Move beyond a single static silhouette. The browser prototype now contains a layered, original vector laboratory hand with a dark woven sleeve, thin cuff piping, shaded palm, separate finger drawings, joints and subtle nail/crease details. The hand moves through hover → descend → grip → contact → lift → exit. Independent transforms in each finger group make the grip visibly different from an open reach.

The animation must not become decorative sleight of hand: the room's object counts only change when the hand physically touches the relevant chamber. The held object is visible when picked up or brought into the room. Grouping baskets represent entire room expressions, not individual coefficients.

Visual QA should look for convincing thumb/index opposition, clear held-item silhouettes, overlap with the room instead of the roof, smooth movement on mobile, and a readable pause at the contact beat.


### PR11: in-room carpenter's square, not a teaching inset

The large illustrated hand brings a wooden/brass square frame into the existing chamber itself. The current floor objects become its top side; translucent corner guides make the perpendicular matching side. The hand then places real creatures and weights in the four quadrants in the order used in the rough Google Slides teaching sequence: first the square creatures, then both cross regions, and finally the weights. Squaring a sprite includes a visible downward press; square-rooting a square creature includes a pinch/squish back to round.

**Never render duplicate persistent tokens on the edge rulers.** The edges are dimensional ghosts. The 4+6+6+9 interior objects of (2x+3)² are the resulting inventory. Variable-length edges are longer than unit-length edges (same proportional sizing on both axes), while the overall frame is square.

The same room-scale frame is reconstructed in reverse for a principal root: remove weights, then both cross regions, then the square-creature corner, then the duplicate perpendicular edge, leaving only one dimension. Objects return to the original floor row after hand contact. All existing moonlit colours, laboratory brass, sprite eyes/idle movement, accessible reduced motion, and animated hand articulation remain in place.


### PR12: the opposite-creature animations are now real

**White negative sprite:** retain the living round body but use a pale ink-and-fog palette, dark eyes and a more **pointed, airy tuft silhouette** so it is recognisable without colour alone. It has independent hop/wiggle/blink timing just like the black creature. The user selects this in Signed Maths mode as an object with value −x, not as a negative value of x.

**Variable cancellation:** let the black and white creatures be seen together on the floor. They glance, hop at one another, bump, then disappear into a little warm-grey puff with separate floating soot particles. Only the selected pair leaves, not every creature in the chamber. With several pairs, replay the individual collision in order.

**Balloon cancellation:** a rosy tethered balloon is −1, a brass weight is +1. Show the balloon drawing near the weight, gathering it and pulling it upwards. Both depart together, leaving an empty space. Never use the black-white soot puff for a weight/balloon pair. The held hand now also has a little balloon silhouette for add/remove controls.

**Feedback and notebook:** a scene-level caption and first-person bubble briefly name the pair's zero value. In the victory replay the miniature comic shows the specific opposing objects, and the pencil writes the zero relation in the same room; no independent unequal hand operation is implied.

**Movement safety:** reduced-motion mode displays the two objects and static pair label without their bounce, collision, fall or floating effects, then removes them. The underlying quantity-mode permissions remain mathematically enforced, and signed objects are locked away in positive-only mode.


### PR13: Chop the actual sprite, not a basket illustration

Failed whole-number division becomes a funny, reversible experiment in the ORIGINAL room. The hand has a small brass precision cutter, aims at the surviving whole sprite or weight on its existing floor, then makes real vertical cuts. Each separated fragment is a clipped piece of that EXACT original character: a half-sprite retains half the fluffy outline, part of its eyes, feet and shaded body. Never show multiple tiny fully intact sprites when the arithmetic only grants pieces of one. The same treatment works for squares, pale sprites, balloons and brass weights; two to five slices may be needed per source object.

Fragments spring apart slightly, give a little wriggle, and remain observable while the hand considers the result. Then the hand explains the problem in its existing speech bubble. The pieces slide back together and the old floor returns intact. No gore, injury or permanent harm; the entire point is that the attempted fractional division is a temporary mathematical experiment. The other objects and the scenery remain visible throughout. On small screens the real chamber geometry governs placement; in reduced-motion mode the same split/rejoin stages appear without movement. Legitimate whole-number baskets, in-room squares, signed zero pairs and over-capacity spills remain separate effects.
