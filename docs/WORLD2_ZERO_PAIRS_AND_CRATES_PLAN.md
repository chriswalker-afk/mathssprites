# World 2 — explicit zero pairs and signed crate/bracket progression

**Status:** PR55 implements the initial free-pair interactions. The crate chapter below is an **implementation proposal**, not additional playable content in PR55.

## Audit of the current progression

World 2 currently contains **48 levels**: Guided 20 (five four-level chapters), Independent 16 (four chapters) and Algebra Apprentice 12 (three chapters). Their existing shortest legal **scored** routes have been independently certified in PR50: 10 one-move puzzles, 8 two-move puzzles and 30 three-move puzzles. These numbers are not interchangeable with conceptual difficulty.

| Guided levels | Current learning demand | Gap and planned response |
|---|---|---|
| 1–4 | Balloons represent −1; balance with positive weights | Physical matching should be explicitly available when a room already has both signs |
| 5–8 | White sprites represent −x; solving with variable signs | No published level starts with both black and white sprites in the **same** chamber; direct matching needs an authored starting example |
| 9–12 | Coordinate different kinds of zero pairs | Provide a start where **both** pair types already exist, so students choose which to simplify first |
| 13–16 | Reversed layouts and negative variables | Preserve the need to reason about sign and orientation |
| 17–20 | Signed multi-step strategy and alternatives | Preserve existing certified stars and accepted progress |
| Proposed 21–24 | Physical groups become brackets; coordinate grouped and signed terms | New content, not edits to previously completed levels |

World 2 has starting weight+balloon pairs at Guided 18, Independent 6 and 15, and Apprentice 5 and 8. It has **no existing same-chamber black+white starting pair** and **no authored crate level**.

## What PR55 changes

When a room already contains `+1` weights and `−1` balloons, show an *in that room* action to physically attach as many matching pairs as available: e.g. five weights and three balloons leave two weights. Similarly, three black `+x` sprites and two white `−x` sprites leave one black sprite. Both animations operate on the **actual scene objects**, one pair at a time; they do not create a duplicate result or add an extra object.

This is a one-room, value-preserving **representation change**, not an add/remove/multiply/divide operation on both sides. It is free for the star benchmark, available without preselecting a tool, and undoable. Do not permit it while the manual stage has an unfinished matching hand visit.

Do not automatically cancel initial pairs in the rendered starting scene. The student must be able to observe and choose the pairing. Existing engine-driven cancellation after genuine operations is retained for continuity.

## Proposed sixth Guided chapter — *The Sealed Opposites* (World 2 levels 21–24)

**Append** these four stable IDs to World 2 Guided. Do not renumber or rewrite the original 20 Guided levels or any existing Independent/Apprentice levels. Four small, progressively harder challenges:

| Proposed level | Starting physical arrangement | Underlying maths (teacher only) | Learning focus |
|---|---|---|---|
| 21 · A weight for a balloon | West: 2 crates, each holding `x+1`, plus **one loose weight and one balloon**. East: 12 weights | `2(x+1)+1−1=12`, so `x=5` | Attach the ready-made unit zero pair, group two whole crates, then unpack and isolate |
| 22 · The pale passenger | West: 3 crates, each holding `x+2`, plus **one black and one white sprite**. East: 21 weights | `3(x+2)+x−x=21`, so `x=5` | Explicit initial black/white matching; group three whole crates and reveal brackets |
| 23 · Three floating friends | West: 2 crates, each holding `x+2`, plus **four weights and three balloons**. East: 15 weights | `2(x+2)+4−3=15`, so `x=5` | Three sequential balloon lifts leave one loose weight; choose order of equivalence-preserving operations |
| 24 · The sealed negatives | West: 2 crates, each holding `x−2` (**one black sprite and two balloons per crate**), plus one loose black sprite and three loose weights. East: 14 weights | `2(x−2)+x+3=14`, so `x=5` | Signed **inside** brackets, physical balloon release, and deliberate simplification before division |

### Engine/art prerequisites for level 24

The existing `group-crates.mjs` maths and crate sign can represent negative objects inside groups, but `crate-expansion.mjs` **rejects** signed crate contents, and `crate-expansion-view.mjs` only releases black sprites and positive weights. Implement signed crate release **before** authoring level 24:

1. Crowbar opens each actual wooden crate; black/white creatures and balloons emerge using the same established physical assets and timing. Crate panels fall, with no separate fake diagram.
2. The group sign and crate count agree with real contents while sealed; after release, the model and actors agree about each individual sign.
3. Never let the engine silently erase a released opposite pair without showing the pair animation. If loose values and newly released signed contents create a pair, leave it visible for the contextual attach action, or show the same physical cancellation explicitly during opening.
4. Preserve existing positive-only World 1 crate animations. If the new signed crate animation is not ready, only release 21–23; do not substitute a misleading visual for 24.

### Technical acceptance before making 21–24 playable

- World 2 stage/chapter registry and 1–5 difficulty metadata include the new **four-level** chapter, with stable IDs `op-g-21` to `op-g-24`.
- The shortest-route audit currently explicitly rejects World 2 crates. Extend its legal action enumeration and physical state key for sealed groups and unpacking, then **independently certify** scores for these four levels. Do not assign guessed star thresholds. Existing 48 benchmarks must remain unchanged.
- No authored route, mathematical equation, operation hint or difficulty number should leak into the student scene before solving. Use optional conceptual hints only.
- Guided hands mirror true algebraic operations; unpacking/zero pairing are one-room identity rewrites; Independent still requires two hand visits for true operations.
- All old progress IDs, achieved stars, best moves and saved resumes remain valid. Additional possible stars come only from newly added IDs; existing content is not quietly revised.
- QA on phone and short laptop: labels, visual groups of 5, unopened/partially opened crates, zero pairs, Undo/Reset, no duplicated weights, basket physics, scene continuity, and correct algebra replay.
- Add at least one browser test **starting with black+white together**, and one with both signs **inside and outside** crates.

## Suggested implementation order

1. **PR55** (current): explicit starting zero-pair controls for weights/balloons and black/white sprites, with real animations, engine invariance and Undo.
2. **PR56**: signed crate contents art/physics, action and replay compatibility, unit and browser tests; no changes to existing levels.
3. **PR57**: add the four-level Guided chapter and certify actual shortest moves; update curriculum, stage counts, badges, saves and test fixtures.
4. Only then consider optional Independent/Algebra Apprentice crate challenges; these must reinforce the new concept without introducing a superficial spike in difficulty or invalidating existing completions.
