import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  compactWorldProgress,compactStageProgress,briefStageIntro
} from "../src/menu-copy.mjs";
import {CAMPAIGN_REGISTRY} from "../src/campaign-registry.mjs";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const site=readFileSync(new URL("../src/site.mjs",import.meta.url),"utf8");
const app=readFileSync(new URL("../src/app.mjs",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/menu-polish.css",import.meta.url),"utf8");

test("world statuses are concise and work for any future world",()=>{
  assert.equal(compactWorldProgress({available:false},{completed:4,count:20}),"COMING SOON");
  assert.equal(compactWorldProgress({available:true},{completed:4,count:20}),"4 / 20 complete");
  assert.equal(compactWorldProgress({available:true},{completed:0,count:0}),"0 / 0 complete");
  assert.equal(compactWorldProgress({available:true},{completed:7,count:3}),"7 / 7 complete");
});
test("stage summaries preserve completion and best-star data",()=>{
  assert.equal(compactStageProgress(3,20,7,60),"3 of 20 complete · 7 / 60 ★");
  assert.equal(compactStageProgress(0,16,0,48),"0 of 16 complete · 0 / 48 ★");
});
test("stage guidance is data-first, then method-based for later worlds",()=>{
  assert.equal(briefStageIntro({menuIntro:"  Our new instructions. "}),"Our new instructions.");
  assert.equal(briefStageIntro({intro:"Match both sides."}),"Match both sides.");
  assert.match(briefStageIntro({method:"auto"}),/hand/i);
  assert.match(briefStageIntro({method:"manual"}),/both rooms/i);
  assert.match(briefStageIntro({method:"notebook"}),/sprites/i);
  assert.equal(briefStageIntro({method:"new-mode"}),"Choose an experiment.");
});
test("all 48 existing campaign levels remain registered and open",()=>{
  const world=CAMPAIGN_REGISTRY.find(w=>w.id==="workshop");
  assert.deepEqual(world.stages.map(s=>s.levels.length),[24,20,16]);
  assert.ok(world.stages.every(s=>s.available&&s.levels.every(l=>l.available)));
  assert.equal(CAMPAIGN_REGISTRY.filter(w=>!w.available).length,2);
});
test("the portal has optional help, rules and star details without extra required menu steps",()=>{
  assert.match(html,/id="home-title"[^>]*>How much does the sprite weigh\?/);
  assert.match(html,/id="home-stage-shortcuts"/);
  assert.match(html,/id="level-star-legend" class="level-star-legend"><summary>/);
  assert.match(html,/id="help-stages"/);
  assert.match(html,/id="help-experiments"/);
  assert.match(html,/class="workshop-rules"><summary>/);
  assert.match(html,/id="workshop-form"/);
  assert.match(html,/id="site-motion"/);
  assert.match(html,/menu-polish\.css\?v=34/);
  assert.match(html,/id="site-guided-help"/);
});
test("visible copy is short, but feedback, controls and accessibility are preserved",()=>{
  assert.doesNotMatch(html,/In the first two stages, an inadvisable experiment is safe/);
  assert.doesNotMatch(site,/clean\(stage\.description\)/);
  assert.match(site,/compactWorldProgress\(world,totals\)/);
  assert.match(site,/aria-current","page"/);
  assert.match(site,/if\(name==="workshop"\)\$\("workshop-equation"\)\.focus/);
  assert.match(app,/function setFeedback\(message,tone="info"\)/);
  assert.match(app,/setFeedback\(message,"warning"\)/);
  assert.match(css,/\[data-tone="warning"\]/);
  assert.match(css,/focus-visible/);
  assert.match(css,/@media\(max-width:600px\)/);
});
