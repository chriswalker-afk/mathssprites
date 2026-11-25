import test from "node:test";
import assert from "node:assert/strict";
import {auditSquareWorld} from "../scripts/world4-square-audit.mjs";
import {curriculumForId} from "../src/curriculum.mjs";
test("release audit certifies all sixty exact minima, controllers, frames, custom starts and stars",()=>{
  const {summary,levels}=auditSquareWorld();
  assert.equal(summary.levels,60);assert.equal(summary.buildGoals,9);assert.equal(summary.solveGoals,51);
  assert.deepEqual(summary.minima,{1:15,2:13,3:22,4:6,5:1,6:3});
  assert.equal(summary.peakAuthored,40);
  assert.ok(summary.peakFound<=48);
  assert.equal(summary.maxSide,6);assert.equal(summary.frames,120);assert.equal(summary.stars,180);
  assert.deepEqual(Object.values(summary.byStage).map(s=>[s.levels,s.buildGoals,s.solveGoals,s.stars]),[[24,4,20,72],[20,3,17,60],[16,2,14,48]]);
  assert.equal(new Set(levels.map(r=>r.id)).size,60);
  assert.equal(levels.filter(r=>r.inspection!=="none").length,16);
  assert.equal(levels.filter(r=>r.stage==="notebook"&&r.inspection!=="none").length,0);
  for(const stage of Object.values(summary.byStage)){
    const averages=stage.chapters.map(c=>c.minima.reduce((a,b)=>a+b,0)/4);
    for(let i=1;i<averages.length;i++)assert.ok(averages[i]>=averages[i-1],"chapter mean move demand does not fall");
  }
});
test("teacher metadata distinguishes building, mixed complete squares, missing corners and principal roots",()=>{
  assert.equal(curriculumForId("square-g-01").strand,"Algebra: squaring expressions");
  assert.equal(curriculumForId("square-g-13").flags.mixedSquare,true);
  const missing=curriculumForId("square-g-18");
  assert.equal(missing.flags.mixedExpression,true);assert.equal(missing.flags.mixedSquare,false);
  assert.equal(missing.flags.completesCorner,true);
  assert.ok(missing.skillIds.includes("complete-square"));
  assert.ok(curriculumForId("square-a-16").skillIds.includes("principal-root"));
  assert.equal(curriculumForId("square-i-14").flags.independentlyMatchedHands,true);
  assert.equal(curriculumForId("square-a-10").flags.notebookFirst,true);
  assert.throws(()=>auditSquareWorld({stage:"unknown"}),/Unknown stage/);
});
