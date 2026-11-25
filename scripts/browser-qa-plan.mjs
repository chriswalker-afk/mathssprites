/**
 * CI routing for Maths Sprites. The quick suite runs on EVERY PR; these
 * focused groups run only when their feature is affected. Full Playwright
 * regression replaces those groups on main, weekly, manual or labelled runs.
 *
 * This module is deliberately pure and unit-tested. A missed feature path
 * must not silently turn off safety checks for shared game code.
 */
import {readFileSync} from "node:fs";

export const GROUP_SPECS=Object.freeze({
  crates:Object.freeze(["e2e/crate-expansion.spec.mjs","e2e/crate-stack.spec.mjs","e2e/crate-division.spec.mjs","e2e/group-crates.spec.mjs","e2e/grouped-progression.spec.mjs","e2e/guided-crate-chapter.spec.mjs","e2e/signed-crate-physics.spec.mjs","e2e/signed-crate-chapter.spec.mjs","e2e/world2-other-mode-crates.spec.mjs"]),
  navigation:Object.freeze(["e2e/fraction-independent-campaign.spec.mjs","e2e/fraction-campaign.spec.mjs","e2e/experiment-board.spec.mjs","e2e/navigation-journey.spec.mjs","e2e/menu-polish.spec.mjs","e2e/site-navigation.spec.mjs","e2e/onboarding-polish.spec.mjs"]),
  visual:Object.freeze(["e2e/fraction-sprite-preview.spec.mjs","e2e/fraction-weight-preview.spec.mjs","e2e/menu-polish-visual.spec.mjs","e2e/portal-art.spec.mjs","e2e/home-hero.spec.mjs"]),
  notebook:Object.freeze(["e2e/fraction-workshop.spec.mjs","e2e/fraction-notebook-campaign.spec.mjs","e2e/notebook-operation-editor.spec.mjs","e2e/notebook-first.spec.mjs","e2e/equation-workshop.spec.mjs","e2e/apprentice-campaign.spec.mjs","e2e/replay-writing.spec.mjs"]),
  signed:Object.freeze(["e2e/opposites-world.spec.mjs","e2e/world2-difficulty-pass.spec.mjs","e2e/signed-objects.spec.mjs","e2e/starting-zero-pairs.spec.mjs","e2e/future-world-runtime.spec.mjs"]),
  layout:Object.freeze(["e2e/adaptive-viewport.spec.mjs","e2e/viewport-fit.spec.mjs","e2e/six-chapter-layout.spec.mjs","e2e/weight-piles.spec.mjs","e2e/motion-notice.spec.mjs","e2e/scene-polish.spec.mjs"]),
  physics:Object.freeze(["e2e/fraction-balance-preview.spec.mjs","e2e/division-baskets.spec.mjs","e2e/multiplication-baskets.spec.mjs","e2e/star-ratings.spec.mjs","e2e/independent-balance.spec.mjs"]),
  controls:Object.freeze(["e2e/neutral-starting-controls.spec.mjs","e2e/operation-first-zero-pair.spec.mjs"]),
  motion:Object.freeze(["e2e/animations.spec.mjs","e2e/sprite-idle.spec.mjs","e2e/sprite-reactions.spec.mjs","e2e/hand-art.spec.mjs"]),
  attempts:Object.freeze(["e2e/failed-attempts.spec.mjs","e2e/fraction-release.spec.mjs"]),
  area:Object.freeze(["e2e/squares.spec.mjs","e2e/square-sprite-preview.spec.mjs","e2e/square-construction.spec.mjs","e2e/square-root-construction.spec.mjs"])
});
const ALL=Object.freeze(Object.keys(GROUP_SPECS));
// The file map above is the single source of truth for spec routing.
// Keep source dependencies here; a spec belongs to exactly one primary
// group, with deliberately broader routing for cross-feature weight piles.
const RULES=Object.freeze([
  [/^src\/square-root-construction\.mjs$/ ,["area","layout","attempts"]],
  [/^src\/square-construction\.(?:mjs|css)$/ ,["area","layout","attempts"]],
  [/^(?:src\/square-sprite(?:s|-preview)\.(?:mjs|css)|square-sprite-preview\.html)$/ ,["visual","motion","area"]],
  [/^src\/square-(?:rules|level-plan)\.mjs$/,["area"]],
  [/^src\/fraction-workshop\.mjs$/ ,["notebook","navigation"]],
  [/^src\/fraction-notebook(?:-engine)?\.(?:mjs|css)$/ ,["notebook"]],
  [/^src\/fraction-campaign(?:-levels|-scene)?\.(?:mjs|css)$/ ,["navigation","notebook"]],
  [/^(?:src\/fraction-(?:balance(?:-preview)?|choreography)\.(?:mjs|css)|fraction-balance-preview\.html)$/ ,["physics","attempts"]],
  [/^(?:src\/fraction-sprite(?:s|-preview)\.(?:mjs|css)|fraction-sprite-preview\.html)$/ ,["visual"]],
  [/^(?:src\/fraction-weight(?:s|-preview)\.(?:mjs|css)|fraction-weight-preview\.html)$/ ,["visual"]],
  [/^(?:src\/(?:group-crates|crate-[^/]+|hand-timeline|division-baskets)\.mjs|src\/(?:crate-[^/]+|group-crates)\.css|tests\/(?:crate-[^/]+|group-crates)\.test\.mjs)$/,["crates"]],
  [/^src\/(?:site|stages|menu-[^/]+|navigation-[^/]+|portal-[^/]+|home-[^/]+|onboarding|resume|progress)\.mjs$|^src\/(?:site|portal|menu|home)[^/]*\.css$/,["navigation"]],
  [/^src\/(?:home-[^/]+|portal-[^/]+)\.(?:mjs|css)$/,["visual"]],
  [/^src\/(?:notebook-[^/]+|equation-workshop|apprentice-levels|replay-timeline)\.mjs$|^src\/(?:notebook[^/]*|workshop)\.css$/,["notebook"]],
  [/^src\/(?:opposite-[^/]+|signed-[^/]+)\.mjs$|^src\/opposites-world\.css$/,["signed"]],
  [/^src\/(?:viewport-[^/]+|scene-[^/]+|stages|adaptive-[^/]+)\.css$/,["layout"]],
  [/^src\/(?:division-baskets|multiplication-baskets|independent-levels|star-ratings)\.mjs$/,["physics"]],
  [/^src\/(?:sprite-[^/]+|hand-[^/]+|replay-timeline)\.mjs$/,["motion"]],
  [/^src\/(?:attempt-feedback|fraction-theatre|hand-timeline)\.mjs$/,["attempts"]],
  [/^src\/(?:area-layout|hand-timeline)\.mjs$/,["area"]],
  [/^src\/(?:action-selection|neutral-pairs)\.mjs$|^src\/zero-pair-actions\.css$/,["signed","controls"]],
  [/^src\/neutral-pairs\.mjs$/,["crates","physics"]],
  [/^src\/action-selection\.mjs$/,["physics","attempts","area"]],
  [/^src\/zero-pair-actions\.css$/,["layout"]],
  [/^src\/campaign-registry\.mjs$/,["navigation","notebook","signed","physics"]],
  [/^src\/opposite-star-benchmarks\.mjs$/,["navigation","signed","physics"]],
  [/^src\/campaign-records\.mjs$/,["navigation","signed","physics"]],
  [/^src\/polish\.css$/,["navigation","layout"]],
  [/^src\/weight-piles\.(?:css|mjs)$/,["crates","signed","layout","physics"]],
  [/^e2e\/weight-piles\.spec\.mjs$/,["crates","signed","layout","physics"]],
  [/^src\/experiment-board\.css$/,["navigation","layout"]],
  [/^src\/engine\.mjs$/,["crates","notebook","signed","physics","controls","motion","attempts","area"]],
  [/^src\/worlds\.mjs$/,["crates","navigation","signed","physics"]],
  [/^src\/curriculum\.mjs$/,[]],
  [/^src\/app\.mjs$/,ALL],
  [/^index\.html$/,["crates","navigation","notebook","signed","layout","controls"]],
  [/^src\/styles\.css$/,["navigation","visual","layout","physics","controls","motion","attempts","area"]],
  // A change to the shared browser helper affects its old physics and
  // animation callers; test coverage must not silently vanish.
  [/^e2e\/reference-move-helper\.mjs$/,ALL]
]);
export function selectBrowserGroups(paths){
  const selected=new Set();
  for(const raw of paths){
    const path=String(raw||"").trim().replaceAll("\\","/");
    if(!path)continue;
    let matched=false;
    for(const [group,specs] of Object.entries(GROUP_SPECS)){
      if(!specs.includes(path))continue;
      matched=true;
      selected.add(group);
    }
    for(const [rule,groups] of RULES){
      if(!rule.test(path))continue;
      matched=true;
      for(const group of groups)selected.add(group);
    }
    // A newly added shared source file cannot bypass focused QA simply
    // because nobody has added a rule for its filename yet.
    if(!matched&&/^src\//.test(path)&&/\.(mjs|js|css)$/.test(path))
      for(const group of ALL)selected.add(group);
    // Unrecognised browser test changes should be exercised before merge.
    if(!matched&&/^e2e\//.test(path)&&/\.spec\.mjs$/.test(path))
      for(const group of ALL)selected.add(group);
  }
  return ALL.filter(group=>selected.has(group));
}
export function featureMatrix(paths){
  return {include:selectBrowserGroups(paths).map(group=>({
    group,specs:GROUP_SPECS[group].join(" ")
  }))};
}
if(process.argv.includes("--matrix")){
  const paths=readFileSync(0,"utf8").split(/\r?\n/);
  process.stdout.write(JSON.stringify(featureMatrix(paths)));
}
