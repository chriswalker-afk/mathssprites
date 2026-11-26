# PR80 — Fraction campaign rendering repair

The reported screenshots show the new header/actor markup with the old 1220px lab shell, a stacked control strip, a focus rectangle and raw fraction labels. PR79's clean-browser layout test passed; that mismatch is consistent with stale, unversioned shadow-root styles, not proof of the precise production cache state. A separate PR79 motion test failed during a cargo collection.

- Version the campaign entry module, changed renderer imports and every shadow-root stylesheet. Keep the board hidden until all styles load; offer navigation back to levels on failure. Never present a half-styled scene.
- Render whole sprites as one actor only in the campaign (including cargo, baskets, comics and spills). Preserve exact SVG sectors for fraction pieces and static artwork previews.
- Match the other worlds' wide/compact scene and rail budgets, one-line chapter information and evenly sized header controls. Keep mobile stacking, exact maths and paper-first Apprentice.
- Improve collection arc when the hand is already close to the object, so actual motion remains visible. Sample maximum real displacement in the browser test rather than only one late animation frame.
- New regression checks cover missing duplicate SVG, plaque position, aligned header, desktop parity and delayed/versioned stylesheet loading. The deployed release check also verifies presentation before the existing maths/free-play check.

Manual acceptance: inspect actual World 1 and World 3 at the same browser zoom and viewport, including a normal refresh of a previously loaded site. Do not merge PR80 before checks and screenshots are reviewed. No curriculum/progress changes.
