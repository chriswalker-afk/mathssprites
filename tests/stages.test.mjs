import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 WORLD1_STAGES,EQUATION_WORKSHOP,findWorld1Stage,
 canOpenWorld1Stage,stageOneComplete
} from "../src/stages.mjs";
import { WORLD1_LEVELS } from "../src/worlds.mjs";
import {loadProgress,saveProgress,PROGRESS_KEY,markWorld1Complete} from "../src/progress.mjs";

test("World 1 has three teaching stages and a separate, honestly planned free-play tool",()=>{
  assert.equal(WORLD1_STAGES.length,3);
  assert.deepEqual(WORLD1_STAGES.map(x=>x.id),["guided","independent","notebook"]);
  assert.deepEqual(WORLD1_STAGES.map(x=>x.method),["auto","manual","notebook"]);
  assert.deepEqual(WORLD1_STAGES.map(x=>x.count),[20,16,12]);
  assert.deepEqual(WORLD1_STAGES.map(x=>x.available),[true,false,false]);
  assert.equal(WORLD1_STAGES[0].count,WORLD1_LEVELS.length);
  assert.equal(EQUATION_WORKSHOP.available,false);
  assert.equal(findWorld1Stage("guided"),WORLD1_STAGES[0]);
  assert.equal(findWorld1Stage("inexistent"),null);
});

test("Teacher access and completed earlier stages never unlock unbuilt content",()=>{
  assert.equal(canOpenWorld1Stage("guided"),true);
  for(const id of ["independent","notebook"]){
    for(const teacher of [true,false])
      for(const completed of [true,false])
        assert.equal(canOpenWorld1Stage(id,{teacher,stage1Completed:completed,stage2Completed:completed}),false);
  }
  assert.equal(canOpenWorld1Stage("equation-workshop",{teacher:true,stage1Completed:true}),false);
  assert.equal(canOpenWorld1Stage("bogus"),false);
});
test("the existing twenty records are still Stage 1; no progress reset",()=>{
  const saved={completed:[1,2,3,9],lastPlayed:10};
  const store=new Map([[PROGRESS_KEY,JSON.stringify(saved)]]);
  const storage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};
  assert.deepEqual(loadProgress(storage),saved);
  assert.deepEqual(markWorld1Complete(saved,10).completed,[1,2,3,9,10]);
  assert.deepEqual(saveProgress(saved,storage),saved);
  assert.deepEqual(JSON.parse(store.get(PROGRESS_KEY)),saved);
  assert.equal(stageOneComplete(saved.completed),false);
  assert.equal(stageOneComplete(Array.from({length:20},(_,i)=>i+1)),true);
  assert.equal(stageOneComplete([...Array.from({length:20},(_,i)=>i+1),20]),true);
});
test("campaign controls cannot select manual while QA preview keeps both methods",()=>{
  const source=readFileSync(new URL("../src/app.mjs",import.meta.url),"utf8");
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const site=readFileSync(new URL("../src/site.mjs",import.meta.url),"utf8");
  assert.match(source,/if \(campaignLevelNumber !== null\) mode = "auto";/);
  assert.match(source,/if\(campaignLevelNumber !== null \|\| busy \|\| isSolved\(state\)\)return;/);
  assert.match(source,/if \(campaignLevelNumber !== null\) \{ mode = "auto"; return render\(\); \}/);
  assert.match(source,/\$\("mode-wrapper"\)\.hidden = stageOne/);
  assert.match(html,/id="campaign-hand-mode"/);
  assert.match(html,/id="mode-select"/);
  assert.match(site,/name === "stages"/);
  assert.match(html,/id="world1-stage-cards"/);
  assert.match(html,/id="world1-workshop"/);
});
