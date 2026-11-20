/**
 * CI routing for Maths Sprites. The quick suite runs on EVERY PR; these
 * focused groups run only when their feature is affected. Full Playwright
 * regression still runs on main, weekly, or via the full-browser-qa label.
 *
 * This module is deliberately pure and unit-tested. A missed feature path
 * must not silently turn off safety checks for shared game code.
 */
import {readFileSync} from "node:fs";

export const GROUP_SPECS=Object.freeze({
  crates:Object.freeze(["e2e/crate-expansion.spec.mjs","e2e/crate-stack.spec.mjs","e2e/group-crates.spec.mjs"]),
  navigation:Object.freeze(["e2e/experiment-board.spec.mjs","e2e/navigation-journey.spec.mjs","e2e/menu-polish.spec.mjs"]),
  notebook:Object.freeze(["e2e/notebook-operation-editor.spec.mjs","e2e/notebook-first.spec.mjs"]),
  signed:Object.freeze(["e2e/opposites-world.spec.mjs"]),
  layout:Object.freeze(["e2e/adaptive-viewport.spec.mjs","e2e/viewport-fit.spec.mjs"]),
  physics:Object.freeze(["e2e/division-baskets.spec.mjs","e2e/multiplication-baskets.spec.mjs","e2e/star-ratings.spec.mjs"])
});
const ALL=Object.freeze(Object.keys(GROUP_SPECS));
const RULES=Object.freeze([
  [/^(?:src\/(?:group-crates|crate-[^/]+|hand-timeline|division-baskets)\.mjs|src\/(?:crate-[^/]+|group-crates)\.css|e2e\/(?:crate-[^/]+|group-crates)\.spec\.mjs|tests\/(?:crate-[^/]+|group-crates)\.test\.mjs)$/,["crates"]],
  [/^(?:src\/(?:site|stages|menu-[^/]+|navigation-[^/]+|portal-[^/]+|home-[^/]+|onboarding)\.mjs|src\/(?:site|portal|menu|home)[^/]*\.css|e2e\/(?:experiment-board|navigation-journey|menu-polish|menu-polish-visual|site-navigation|home-hero|portal-art)\.spec\.mjs)$/,["navigation"]],
  [/^(?:src\/(?:notebook-[^/]+|equation-workshop|apprentice-levels)\.mjs|e2e\/(?:notebook-[^/]+|apprentice-campaign|equation-workshop|replay-writing)\.spec\.mjs)$/,["notebook"]],
  [/^(?:src\/(?:opposite-[^/]+|signed-[^/]+)\.mjs|e2e\/(?:opposites-world|signed-objects)\.spec\.mjs)$/,["signed"]],
  [/^(?:src\/(?:viewport-[^/]+|scene-[^/]+|stages|adaptive-[^/]+)\.css|e2e\/(?:adaptive-viewport|viewport-fit|scene-polish|hand-art|motion-notice)\.spec\.mjs)$/,["layout"]],
  [/^(?:src\/(?:division-baskets|multiplication-baskets|sprite-[^/]+|hand-[^/]+|star-ratings)\.mjs|e2e\/(?:division-baskets|multiplication-baskets|star-ratings|failed-attempts|animations|sprite-[^/]+|independent-balance|squares)\.spec\.mjs)$/,["physics"]],
  [/^src\/engine\.mjs$/,["crates","notebook","signed","physics"]],
  [/^src\/worlds\.mjs$/,["crates","navigation","signed","physics"]],
  [/^src\/app\.mjs$/,ALL],
  [/^index\.html$/,["crates","navigation","notebook","signed","layout"]],
  [/^src\/styles\.css$/,["navigation","layout","physics"]]
]);
export function selectBrowserGroups(paths){
  const selected=new Set();
  for(const raw of paths){
    const path=String(raw||"").trim().replaceAll("\\","/");
    if(!path)continue;
    let matched=false;
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
