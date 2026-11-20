# Maths Sprites — Fast GitHub Actions QA

The goal is to make a CSS/art/wording PR get a useful browser signal without
waiting for every animated level, whilst keeping real mathematical regression
coverage for risky edits.

## Three tiers

| Tier | When | What | Expected order of magnitude |
| --- | --- | --- | --- |
| Mathematical & syntax | Every PR and push | `npm run check` (unit tests, equation invariants, source syntax) | Tens of seconds |
| Quick browser gate | Every PR | **15 high-signal** Playwright cases tagged `@quick` in navigation, modes, stars, notebook, signed worlds and viewport | About a minute (target; verify using Action run) |
| Focused feature browser checks | When PR changes a relevant feature path | Parallel, specific spec files selected by `scripts/browser-qa-plan.mjs` | Varies by feature; real animations can take longer |
| Full browser regression | Push to `main`, weekly Monday, manual dispatch, or PR label `full-browser-qa` | All Playwright tests, across three shards | Several minutes, non-blocking for routine PRs |

### What is protected?

- **15 quick scenarios always run on PRs**, including entry to lessons, changing
  modes, the signed-world doorway, notebook editor, star map and small-screen fit.
- **Source-aware focused checks** run after classifying changed paths. Crate
  changes trigger the crate opening, counting, divide-first and basket tests.
  Notebook, navigation, signed-world, layout and physical maths each have
  their own groups. Multiple affected groups run in separate runners.
- **Shared-core changes are deliberately conservative.** Changes to
  `src/app.mjs` run all feature groups. An unknown `src/*.mjs`,
  `src/*.js`, `src/*.css` or unclassified new `e2e/*.spec.mjs` file
  triggers all groups rather than silently skipping browser testing.
- **Tests for choosing groups are unit-tested.** Docs-only changes skip
  focused suites but still get normal unit and quick browser checks.
- **Full regression is not deleted.** It runs on every merge to `main`,
  weekly and on demand. For high-risk PRs add the `full-browser-qa` label.

### Screenshots

By default, passing quick/feature jobs do not upload huge screenshot bundles.
A failed browser check retains its failure trace/screenshots.

When visual review of a PR is needed, add the `visual-review` label. The
focused feature jobs will upload their `artifacts/` screenshots and
`test-results/` for download. (This is an optional, intentional overhead.)

### How to run tests

```bash
npm run check
npx playwright test --grep @quick --workers=2
npx playwright test e2e/crate-expansion.spec.mjs e2e/group-crates.spec.mjs --workers=2
npx playwright test --workers=2
```

### Guide to labels

- `visual-review`: retain detailed screenshots for feature-specific browser
  tests on this PR. It does not replace passing tests.
- `full-browser-qa`: run the unabridged three-shard browser suite before
  merging a particularly risky PR. The full suite also runs on `main` after
  every merge.

### CI safeguards

- **Required check-name continuity:** the existing `Browser smoke QA`,
  `tests` and `public-pages-check` job names remain intact.
- **Cancellation:** a new push cancels older PR browser runs, avoiding
  concurrent obsolete suites. Bundle related edits before pushing where possible.
- **No hiding failures:** quick, focused and full suites fail their respective
  checks normally. Do not merge a PR with a failing relevant feature check.
- **No testing shortcuts:** `@quick` is an extra tag on existing tests,
  not a rewrite or weaker version of their assertions.
- **Report actual runtime** after the new workflow completes; the timing
  figures above are targets, not measured guarantees.

To change the 15 core checks, edit the relevant test title to include or
remove `@quick`. To teach the router about a new feature, update the pure
selectors in `scripts/browser-qa-plan.mjs` and their unit tests.
