# Automatic comic-book algebra replay

## Promise
**No displayed algebra while solving.** As soon as a puzzle is genuinely solved, transition **automatically** into a short comic-book retrospective. The reveal is a reward for discovering the physical relationship.

## Stage design
- On completion, the hand pauses, sprites settle, and the balance emits a quiet brass chime.
- Camera/scene slides to show a **growing vertical row of comic panels on the left** and an open piece of cream paper or notebook **on the right**.
- A real pencil enters and **writes the algebra line by line** alongside the unfolding panels. Labels appear *only now*: black sprite `+x`; white sprite `−x`; weight `+1`; balloon `−1` (only relevant tokens are shown).
- Each comic panel displays and animates **one actual completed two-sided transaction**, with the hand's precise chosen operation. A setup panel is allowed before step 1; zero-pair neutralizations appear inside their triggering panel or as a clearly marked simplification beat.
- The next panel is **revealed only after** the current beat finishes. Earlier panels remain as a readable visual history; long solutions become scrollable rather than cramped.

## Storyboard example — `2x+3 = x+7`
| Beat | Comic animation | Pencil on paper |
|---|---|---|
| Opening | Original two populated rooms; labels materialise | `2x+3=x+7` |
| Panel 1 | Hand removes one black sprite from each room | `-x\quad\text{on both sides}` then `x+3=7` |
| Panel 2 | Hand removes three unit weights from each room | `-3\quad\text{on both sides}` then `x=4` |
| Finale | Remaining black sprite looks at four weights; rooms glow gently | Underline / circle `x=4` |

For the signed example `2x-2=x+2`, the replay must show the player adding two weights to *each* room, pairing the newly placed left weights with two left balloons, and recording `+2` followed by the zero-pair simplification. Never mislabel this as subtracting two weights.

## Rules for truthfulness
- Reflect **the student's actual history**, including inefficient but mathematically valid choices. Do not replace it with an ideal solution.
- A two-part manual-mode hand move is **one** panel/one symbolic operation after the pair is completed.
- A zero-pair animation is **simplification of a single side by adding/removing zero**, not a new unmatched algebraic operation.
- Never write a simplified equation before the relevant hand movement and cancellation have visually completed.
- A divide-by-five panel visually makes five equal groups in *each* room and writes **`÷5` to both sides** before the resulting equation.
- Maintain correspondence among on-screen object counts, labels, equation lines, and the hidden evaluation model. The pencil should not invent arithmetic or skip a move.
- Cancellation of `x+(-x)` or `1+(-1)` is shown before the line combining those terms into zero.

## Controls and accessibility
- The replay **starts automatically**; no “Reveal” button.
- Visible pause/play, previous/next panel, restart, skip to final solution, and speed settings.
- At the end: “Try another”, “Watch again” and an optional brief reflection (“Which move kept the rooms balanced?”).
- Reduced motion: reveal completed panels and lines without bouncing or simulated handwriting; maintain the same mathematical content and timing order.
- The write-on effect must use legible text or vector glyphs, not AI-generated illegible lettering.
- Panel thumbnails are replayed from stored **logical snapshots and physical action events**, not screen-capture video.

## Visual direction
Ink-outlined comic panels with a warm paper ground; cinematic miniature scenes inside each panel; graphite pencil strokes; purposeful little handwritten annotations; restrained drama. This is an *illustrated mathematical lab notebook*, not a loud superhero comic.
