/**
 * QA invariant: browsers should test the navigation students can actually
 * reach. Historical portal/stage DOM remains for compatibility but is not
 * a supported navigation route after PR53.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";

const specsDir=new URL("../e2e/",import.meta.url);
const retired=[
  /data-screen=["']worlds["']/,
  /#site-worlds\b/,
  /#site-stages\b/,
  /Explore stages/,
  /Choose Stage [123] levels/,
  /#world1-workshop\b/,
  /data-world-stages=/,
  /data-stage-open=/
];
test("browser specs do not navigate through retired multi-screen menus",()=>{
  const files=readdirSync(specsDir).filter(n=>n.endsWith(".spec.mjs"));
  assert.ok(files.length>=40,"the browser suite should not disappear");
  for(const file of files){
    const content=readFileSync(new URL(file,specsDir),"utf8");
    for(const pattern of retired)
      assert.doesNotMatch(content,pattern,file+" must target the current Experiment Board");
  }
});
test("critical QA remains available for level selection, progress and stage-specific behaviour",()=>{
  const checks={
    "menu-polish.spec.mjs":["#world-cards [data-world-stages]","#site-stages","#world1-progress-number"],
    "site-navigation.spec.mjs":["#world1-finale","#world1-progress-bar","#object-picker"],
    "star-ratings.spec.mjs":["#replay-star-summary","mathssprites.stars.v1"],
    "viewport-fit.spec.mjs":["#amount-control","noDocumentScroll"],
    "world2-other-mode-crates.spec.mjs":["#unpack-crates","data-notebook-expand"]
  };
  for(const [file,needles] of Object.entries(checks)){
    const content=readFileSync(new URL(file,specsDir),"utf8");
    for(const needle of needles)assert.ok(content.includes(needle),file+" lacks "+needle);
  }
});
