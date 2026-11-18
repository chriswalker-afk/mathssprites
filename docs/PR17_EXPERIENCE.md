# PR17 — Player experience, chapter art and introductory guidance

PR17 refines the **student journey around the 20 solved-and-validated levels**; it does not change the mathematical content or introduce new advanced operations.

## The first-visit apprenticeship

A new student enters through Home, plays the unlocked Level 1, and sees a compact, non-modal coach. It uses the real game controls:

1. **Meet the balance** — identify the dark sprites, brass weights and two equally balanced rooms.
2. **Choose an action** — highlight Remove (preselected), explaining why equal changes preserve balance.
3. **Choose two weights** — highlight the weight/amount control; show the concrete number of objects, without displaying algebra.
4. **Try the move** — highlight Do it to both rooms in Guided Mirror mode, or the west-room action in Your Turn mode. In Your Turn, the cue switches to the *other actual room* once a move is pending.

The tutorial is **advisory rather than modal**. Every real control remains usable even if students ignore the prompts, and an immediate Skip guide button dismisses the guidance.

The tutorial is shown by default on a **first visit to Level 1** only. Completion or Skip marks it seen using a versioned local browser key. The option in Settings can disable coaching; Replay the guided introduction or the in-game Guide button starts Level 1 again with the four cues visible. Local storage denial must not cause the page to fail.

The guide never writes the symbolic equation or solution in advance. The algebra still appears only in the existing solved-state comic replay.

## Chapter arrival and world map

The level selector shows each of the five chapters with its own ink/brass-themed colors and symbolic miniature ornament:

| Chapter | Art symbol | Arrival explanation |
|---|---|---|
| Clearing the Room | − | First-visit coach handles the introductory level |
| Equal Groups | ÷ | Complete, identical baskets on both sides |
| Two-Step Experiments | → | More than one operation, chosen in an appropriate order |
| Across the Hall | ⇄ | Dark sprites can occupy both chambers |
| Master of the Balance | ✦ | Strategically different routes may exist |

Each chapter card displays its own **completed count out of four**. The world-level progress meter reports **completed out of twenty**, with a highlighted Next level and distinct Completed status. Teacher access only affects availability, not the student's completed count.

## Success and final completion

- When the engine reports a genuine solved state, the player sees the actual physically solved rooms before the comic (original delay retained), with a temporary non-blocking "Balance restored!" / "Chapter complete!" / "Workshop mastered!" banner.
- **No mathematical answer** is displayed in this banner. The comic is still the first symbolic reveal.
- The comic identifies the earned Level N / 20. It retains the original timed pencil and actual move history, pause, step, replay and reduced-motion options.
- Once the comic's final writing is complete, the Next level button is available along with a short earned-status note. On Level 20 it instead reads **Finish World 1** and returns to the level map.
- The completed level map displays the **Every balance restored!** mastery banner and 20 / 20 progress. All completed levels can still be replayed; later worlds remain explicitly locked.

## Phone and keyboard considerations

- The home/world/level screens retain a responsive single-column or two-column layout as space permits.
- The in-game header has compact Home, Levels, Guide and motion/mode controls, all with minimum touch-friendly dimensions.
- The guide becomes a short sticky information strip, avoiding an opaque modal that would cover the live balance.
- The mobile comic keeps **Show final working** visible (previously hidden), and its replay/next buttons have at least 40–44px targets and respect safe-area insets.
- The original game scene dimensions, physics and token choreography are preserved; reduced motion remains an explicit option, and the guide highlight pulse also respects it.
- Tutor controls are regular buttons with labels, and moving from a level to a menu stays available at any time when the hand isn't busy.

## Validation

- `npm run check`: onboarding storage and cue unit tests, engine invariants, 20-level solution routes and existing pure tests.
- `npx playwright test`: step-by-step guide and Skip persistence, manual-mode cue targeting, Settings guide disable/replay, real solved-scene/comic handoff, chapter introductions, World 1 completion banner, and phone playback controls.
- Existing signed-object, square/root, fraction-cut, hand-motion and comic tests remain available in the separate prototype preview.
- All three parallel Playwright shards must pass before the PR is merged.

## Future scope

PR17 does not build World 2–4 content, add new tile artwork or alter the mathematical operation rules. A later World 2 phase should introduce negative numbers and planned white-sprite/balloon zero-pair lessons through dedicated levels, using the existing validated preview mechanics.
