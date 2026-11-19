# PR23 — A home-screen question and a living balance scale

The first view now asks **“How much does the sprite weigh?”** and shows a lightweight miniature two-pan brass scale. The same mystery sprite value is used in every scene. This is decorative mathematics, **not a second game engine**; it writes no progress and does not unlock any stage.

## Storyboard

A single sprite is equivalent to **three unit weights** in all four scenes, though this value is not explained in the headline.

| Scene | Left pan | Right pan | Message |
| --- | --- | --- | --- |
| A · mystery | 1 sprite | 3 weights | The mystery reveals itself through balancing |
| B · add equally | 1 sprite + 2 weights | 5 weights | Add two weights to BOTH sides of A |
| C · two sprites | 2 sprites | 6 weights | Start a different, balanced arrangement |
| D · both sides | 2 sprites + 1 weight | 1 sprite + 4 weights | Unknowns can be on BOTH sides |

The reset between unrelated scenes is a short fade, while A flows into B without clearing the pan contents. Each new object appears first, lands, and then contributes its weight to the beam's target angle. Thus the target follows exactly what is visible: `visualMass = 3 × sprites + weights`.

The controller uses a single `requestAnimationFrame` loop for time, landing completion and spring-damped beam motion. The beam rotates around the central pivot while the hanging trays counter-rotate to remain upright. They are attached to the rotating beam ends rather than animated independently.

The four scenes, their additions and the consistent mass model are defined in `src/home-hero-scenes.mjs`. The controller is isolated in `src/home-hero.mjs`; the CSS illustration is isolated in `src/home-hero.css`. No runtime animation library or network calls are introduced.

## Interaction and accessibility

- **Pause animation / Play animation** is a button, keyboard-operable and accurately reports `aria-pressed`. It freezes both the physics and CSS landing animations rather than silently resetting their progress.
- The controller runs only while the site homepage is visible and the browser tab is active. Navigation and tab hiding suspend the same existing controller; no second animation loop is created.
- **PR24 correction:** A stored, explicit in-game **Motion: on** preference takes priority over a device's default reduced-motion preference and enables the complete animation after reload. Without an explicit choice, the device preference is honoured but an explanatory **Play animation** button stays visible. Choosing Play explicitly enables the full falling and bouncing animation without changing the device or saved game preference; Pause/Resume remains available.
- The opening headline is not automatically focused on initial page load or reload, preventing an unintended rectangular highlight. Heading focus is retained on intentional screen navigation.
- The persistent in-game Motion setting sends a single `mathssprites:motion-change` event to the homepage animation, without duplicating or replacing its storage key.
- Browser `prefers-reduced-motion: reduce` is respected even if the game setting says animations are on. In either reduced-motion mode, the hero shows a stationary balanced illustration (one sprite and three weights) and hides its now-irrelevant playback control.
- The illustration has a stable spoken description. Decorative scene captions are `aria-hidden` to avoid continuously announcing motion to a screen reader. The static illustration is in the initial HTML so the homepage is usable while scripts load or when JavaScript is unavailable.
- Home's progress-aware `#home-play` button is unchanged, as are the Worlds, Help, Settings, stages and free-play Equation Workshop screens.
- No campaign local-storage keys are read or written by the hero.

## Acceptance and QA

- Pure `tests/home-hero-scenes.test.mjs`: verify each final configuration, every intermediate imbalance, correct tilt sign, physically meaningful sprite mass and approximate loop pacing.
- Browser `e2e/home-hero.spec.mjs`: test headline, correct physical tilt, full scene loop, freeze/resume, browser and in-game reduced motion, stopping on navigation, intact campaign Start, no storage writes, and layouts at 375/768/1440px. Screenshots of each viewport are retained in the test report.
- Existing `e2e/site-navigation.spec.mjs` updated to assert the exact new question.
- Original World 1 gameplay, the Equation Workshop and advanced regression previews remain unchanged.

## Scope boundaries

This release changes only the home hero and the wiring required to respect navigation and motion settings. It does not change the four-world roadmap, game-engine physics, hand tools, level maps, comic replay, progress records, or mathematical restrictions.

After this PR: review the home-page loop visually, particularly on a narrow phone. Further polish can address sprite reactions and small details in a separate PR; it must preserve the hidden-mass consistency.
