# PR35 — Student navigation audit

PR35 builds on the PR34 menu polish. It fixes a small number of real friction points for new players, returning students, keyboard users and phone users without changing curriculum, saved records, level availability or experiment physics.

## Journeys examined

| Student journey | Prior friction | PR35 behaviour |
|---|---|---|
| New student, start playing | The 20-level board offered individual tiles but no prominent starting action | **Play Level 1** appears alongside stage progress. Home still starts the first level in a single click. |
| Returning student, resume unfinished work | Opening the board required hunting through chapters to find the most recent unfinished experiment | **Continue Level N** targets the last unfinished level for the chosen world/stage. |
| Completed level / mastered stage | Reopening the board did not clearly suggest the next unfinished level | The button selects the earliest incomplete level; a fully mastered stage offers **Replay Level N** instead. |
| Switch learning stage by keyboard | Stage buttons were replaced when the board rerendered, leaving the keyboard focus behind | The active replacement button receives focus; a polite live region announces the newly selected world/stage and completion. |
| Move between chapter cards | Students had to Tab through every level, despite the chapter grid | Arrow keys navigate by **actual rendered geometry** (five chapter columns on laptop, two tiles per row on a phone). Home/End go to the first/last available tile. Enter plays the focused level. Normal Tab access remains. |
| Visit Help/Settings during level selection | Both screens had fixed destinations, causing unnecessary travel back to the board | A visible contextual Back action remembers the calling screen. Escape returns to it; the stage selection is unchanged. |
| Look at explanatory disclosures | Escape could be used accidentally while a disclosure was open | Escape closes the disclosure first, then returns on the following press. |
| Equation editing and active gameplay | Global shortcut keys risk interfering with gameplay or typing | Escape never exits a running experiment and never navigates while an input or editor has focus. |

## Navigation rules and future worlds

- The **Foyer** continues to provide one-click stage resume and the primary start action.
- The **Experiment Board** remains one click away from the Foyer; any implemented level remains two clicks away.
- Stage and world choices remain data-driven. Locked future worlds are skipped by keyboard selection and cannot be opened early.
- The continue target uses stable world/stage/level IDs and campaign v2 records. Nothing new is written to localStorage or to legacy progress keys by simply navigating.
- No new compulsory screens, invented world levels, extra tutorial, game-engine changes, hand-coordinate changes or star-scoring changes were introduced.

## Implementation

- `src/navigation-journey.mjs`: pure, campaign-safe continue/replay decision and spatial keyboard navigation helper.
- `index.html`: compact board Continue button, hidden accessible keyboard instructions and announcements, contextual Help/Settings Back controls.
- `src/site.mjs`: focus restoration after stage or world selection; keyboard and Escape routing; contextual support return; continue action.
- `src/navigation-journey.css`: fits the Continue action within the existing board heading on 1024×720 and 1092×540 laptops; 44px phone action.
- `tests/navigation-journey.test.mjs` and `e2e/navigation-journey.spec.mjs`: unit and browser checks for first-time, returning, completed, keyboard, phone and support journeys.

## QA checklist

- [ ] GitHub unit + browser smoke + public-pages checks pass.
- [ ] At 1024×720 and 1092×540 the stage-switcher, board Continue and final level remain in one viewport.
- [ ] At 375×812, no sideways scrolling; board Continue remains at least 44px high and its corresponding level launches.
- [ ] After stage switching, keyboard focus stays on the active stage; Arrow, Home/End, Enter work.
- [ ] Help / Settings Back returns to the correct originating menu with existing selection intact.
- [ ] Closing a disclosure with Escape does not navigate, and Escape in an equation input leaves the text alone.
- [ ] No changes to puzzle definitions, saved progress, stars or physical scene coordinates.

## Suggested PR36

Prepare the **Negative Numbers world** as its own world data, visual language, tutorials and solver rules, using the now-world-independent menu and navigation. Keep the three World 1 learning representations and preserve World 1 progress migrations.
