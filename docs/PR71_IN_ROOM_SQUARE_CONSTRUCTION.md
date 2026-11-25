# PR71 — In-room square construction

The existing mixed-area prototype is the review entry point:
`/?preview=mixed-area`. This is real gameplay on the existing engine,
not an isolated explanatory animation. World 4 remains unavailable on
the public campaign board.

## Physical sequence

1. The hand carries one brass construction tool (no fictitious
   multiplication count) and erects a wooden/brass frame in the active
   chamber. Keep the original floor inventory visible.
2. Move the original round sprites and weights into their horizontal
   positions. They become dimensional markers; no second visible
   original inventory remains on the floor.
3. Establish the perpendicular matching side. Both edges are guides,
   explicitly non-counting and visually quieter than the interior.
4. Fill the square-sprite region, the first mixed region, the second
   mixed region, and the weight corner as separate hand beats. Skip
   empty regions. Keep the square itself truly square; symbolic
   variable/unit tracks use the existing relative display lengths.
5. At the original engine contact callback, render the exact resulting
   room. Every interior cell is mapped by kind and ordinal to one real
   floor token. Capture the origin before contact, transfer the
   corresponding floor token towards its own settled slot, hide all
   construction actors immediately, and let the four walls fall away.
   No duplicate visible result, extra mathematical object, or second
   commit. Sprites bounce; weights settle into the existing 3+2 piles.
   Hand-target pause and idle animation cleanup remain intact.

The renderer is read-only with respect to the engine and supports both
the two-room mirrored operation and one pending manual visit. Resize
fitting uses the actual in-room available area; reduced motion presents
the same stages without flying objects. All temporary views, observers
and animations are cleaned up on exit. Principal-root animation is
unchanged until PR72.

## Refused over-capacity attempts

A 7x7 requested square contains 49 objects, but capacity is 48.
The hand now presents a temporary square of 48 positions and the one
excess object spilling out before the existing speech/rewind. For larger
attempts use only a bounded illustrative sample of at most 48 slots and
12 excess props. The full exact requested count is preserved in
accessible feedback; these props are not engine objects. The original
room/history is restored. Unsupported higher powers retain existing
refusal behavior; imperfect square-root trials are for PR72.

## QA

Unit tests exercise all 27 nonempty representable positive side lengths
(a+b<=6), exact area region counts, source/output mapping, guide counts,
hand stage order and single contact, integer overflow, both-sided
transactions and Undo. Browser tests exercise the actual mixed-area
prototype, both mixed steps, transfer and release, independent match,
overflow and reduced-motion mobile. CI and visual inspection are
required before calling the physical effect fully verified.

## Next PR72

Reverse the construction for principal square roots. Arrange the actual
existing square sprites, round sprites and weights into their four
regions, remove the interior only after verifying the square, retain
exactly one side, and return its round sprites/weights to the floor.
For incomplete areas, show the missing corner or uneven mixed regions
before restoring the room. Respect nonnegative sprite values and the
same square vocabulary/capacity. Keep World 4 locked until PR74.
