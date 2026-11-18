import test from "node:test";
import assert from "node:assert/strict";
import {
  GUIDE_ENABLED_KEY, GUIDE_SEEN_KEY,
  introductionCue, readGuideEnabled, writeGuideEnabled,
  readGuideSeen, writeGuideSeen
} from "../src/onboarding.mjs";
import { readFileSync } from "node:fs";

test("first lesson has four specific physical, spoiler-free cues", () => {
  const expected = ["scene","remove","amount","do-both"];
  for (let step = 0; step < 4; step++) {
    const cue = introductionCue(step);
    assert.equal(cue.target,expected[step]);
    assert.equal(cue.progress,(step+1)+" of 4");
    assert.ok(cue.title.length>7 && cue.text.length>30);
    assert.doesNotMatch(cue.text,/x\s*=\s*\d+/,"Introduction must not reveal algebra");
    assert.equal(typeof cue.action,step === 3 ? "object":"string");
  }
});
test("manual matching highlights the actual other room, not always the east", () => {
  assert.equal(introductionCue(3,{mode:"manual",pending:"left"}).target,"right-action");
  assert.equal(introductionCue(3,{mode:"manual",pending:"right"}).target,"left-action");
  assert.equal(introductionCue(3,{mode:"manual",pending:null}).target,"left-action");
  assert.equal(introductionCue(3,{mode:"manual",busy:true}).target,"scene");
  assert.equal(introductionCue(3,{mode:"auto",pending:null}).target,"do-both");
});

test("first-visit preference and completed-guide flag survive reloads", () => {
  const map=new Map();
  const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
  assert.equal(readGuideEnabled(storage),true);
  assert.equal(readGuideSeen(storage),false);
  assert.equal(writeGuideEnabled(false,storage),false);
  assert.equal(map.get(GUIDE_ENABLED_KEY),"off");
  assert.equal(readGuideEnabled(storage),false);
  assert.equal(writeGuideSeen(true,storage),true);
  assert.equal(map.get(GUIDE_SEEN_KEY),"yes");
  assert.equal(readGuideSeen(storage),true);
  writeGuideSeen(false,storage);
  writeGuideEnabled(true,storage);
  assert.equal(readGuideSeen(storage),false);
  assert.equal(readGuideEnabled(storage),true);
});
test("tutorial controls degrade when localStorage property access is blocked", () => {
  const blocked={getItem(){throw new Error("blocked")},setItem(){throw new Error("blocked")}};
  assert.equal(readGuideEnabled(blocked),true);
  assert.equal(readGuideSeen(blocked),false);
  assert.equal(writeGuideEnabled(false,blocked),false);
  assert.equal(writeGuideSeen(true,blocked),true);
});
test("guided tutorial, mobile replay controls and completion ceremony exist in UI", () => {
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const css=readFileSync(new URL("../src/polish.css",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.mjs",import.meta.url),"utf8");
  const site=readFileSync(new URL("../src/site.mjs",import.meta.url),"utf8");
  for (const id of ["site-guided-help","site-replay-intro","game-guide-restart",
    "apprentice-guide","guide-next","guide-skip","guide-progress",
    "level-clear","replay-level-stamp","replay-end-note",
    "world1-progress-bar","world1-finale"]) assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(app,/function renderFirstGuide\(/);
  assert.match(app,/function updateReplayEndNote\(/);
  assert.match(app,/window\.dispatchEvent\(new CustomEvent\("mathssprites:solved"/);
  assert.match(site,/restartFirstExperimentGuide/);
  assert.match(css,/\.replay-end-actions \.secondary-btn\{display:block!important/);
});
