import test from "node:test";
import assert from "node:assert/strict";
import {WORLD1_LEVELS} from "../src/worlds.mjs";
import {initialState,perform,evaluate,equation,isSolved,undo} from "../src/engine.mjs";
import {crateMarkup} from "../src/group-crates.mjs";
import {
  crateContentsDescription,crateExpansionPlan,crateExpansionReplayNotes
} from "../src/crate-expansion.mjs";

const level=WORLD1_LEVELS[18].level;
const unpack={op:"unpack",side:"left"};
test("a single contents plaque describes the physical contents, never algebra printed on a crate",()=>{
  const state=initialState(level);
  assert.equal(crateContentsDescription(state.left),"Each crate: 1 sprite + 3 weights");
  assert.equal(crateContentsDescription(state.right),"");
  const html=crateMarkup(state.left);
  assert.equal((html.match(/class="token sealed-crate"/g)||[]).length,2);
  assert.doesNotMatch(html,/crate-name|x\s*\+\s*3|title="[^"]*x\s*\+/i);
  assert.match(html,/1 dark sprite and 3 brass weights/);
  assert.equal((html.match(/crate-mini-sprite/g)||[]).length,2);
  assert.equal((html.match(/crate-mini-weight/g)||[]).length,6);
});
test("two crates have the exact open-all/sprites-first/weights-second stage order",()=>{
  const state=initialState(level);
  const plan=crateExpansionPlan(state.left);
  assert.deepEqual([
    plan.count,plan.spritesPerCrate,plan.weightsPerCrate,
    plan.totalSprites,plan.totalWeights
  ],[2,1,3,2,6]);
  assert.equal(plan.spriteMath,"2 × x = 2x");
  assert.equal(plan.weightMath,"2 × 3 = 6");
  assert.deepEqual(plan.steps.map(s=>s.phase),[
    "open","open","sprites","sprites","sprite-total",
    "weights","weights","weight-total","settle"
  ]);
  assert.deepEqual(plan.steps.filter(s=>s.phase==="open").map(s=>s.crateIndex),[0,1]);
  assert.deepEqual(plan.steps.filter(s=>s.phase==="weights").map(s=>s.count),[3,3]);
  const replay=crateExpansionReplayNotes(state.left);
  assert.match(replay.opening,/each of the 2 crates/);
  assert.match(replay.summary,/2 sprites and 2 groups of 3 weights/);
});
test("divide-first has only one crowbar opening, one sprite, three weights",()=>{
  const original=initialState(level);
  const next=perform(original,{op:"divide",factor:2},"auto");
  assert.equal(next.ok,true);
  const plan=crateExpansionPlan(next.state.left);
  assert.equal(plan.count,1);
  assert.deepEqual(plan.steps.map(s=>s.phase),[
    "open","sprites","sprite-total","weights","weight-total","settle"
  ]);
  assert.equal(plan.spriteMath,"1 × x = x");
  assert.equal(plan.weightMath,"1 × 3 = 3");
  assert.equal(plan.totalSprites,1);
  assert.equal(plan.totalWeights,3);
  const notes=crateExpansionReplayNotes(next.state.left);
  assert.match(notes.opening,/remaining crate/);
  assert.match(notes.summary,/One crate gives 1 sprite and 1 group of 3 weights/);
  assert.equal(equation(next.state),"(x + 3) = 7");
});
test("the expansion plan is purely descriptive, with no early algebra or saved-state changes",()=>{
  const state=initialState(level);
  const snapshot=JSON.stringify(state);
  crateExpansionPlan(state.left);
  assert.equal(JSON.stringify(state),snapshot);
  const result=perform(state,unpack,"auto");
  assert.equal(result.ok,true);
  assert.equal(result.state.history.length,1);
  assert.equal(result.state.history[0].mode,"rewrite");
  assert.equal(evaluate(state.left,4),evaluate(result.state.left,4));
  assert.equal(equation(result.state),"2x + 6 = 14");
  assert.deepEqual(undo(result.state),state);
});
test("plans are rejected for non-crate rooms and unsupported signed contents",()=>{
  assert.throws(()=>crateExpansionPlan({posX:1,posOne:3}),/sealed crates/);
  assert.throws(()=>crateExpansionPlan({
    crates:{count:2,contents:{posX:1,negOne:3}}
  }),/positive sprites/);
  assert.throws(()=>crateExpansionPlan({
    crates:{count:0,contents:{posX:1,posOne:3}}
  }),/sealed crates/);
});
test("special crowbar action preserves ordinary hand timing and a single contact",async()=>{
  const {handMotionPlan,CROWBAR_BEATS}=await import("../src/hand-timeline.mjs");
  const pry=handMotionPlan({op:"unpack",side:"left",crateIndex:0});
  assert.deepEqual(pry.phases.map(x=>x.name),
    ["approach","reach","aim","grip","contact","lift","exit"]);
  assert.equal(pry.phases.filter(x=>x.applyChange).length,1);
  assert.equal(pry.phases.find(x=>x.applyChange).name,"contact");
  assert.equal(pry.phases.find(x=>x.name==="contact").delay,CROWBAR_BEATS.contact);
  const reduced=handMotionPlan({op:"unpack",side:"left",crateIndex:0},true);
  assert.deepEqual(pry.phases.map(x=>x.name),reduced.phases.map(x=>x.name));
  assert.ok(reduced.phases.reduce((sum,x)=>sum+x.delay,0) <
    pry.phases.reduce((sum,x)=>sum+x.delay,0));
  assert.equal(isSolved(initialState(level)),false);
});
