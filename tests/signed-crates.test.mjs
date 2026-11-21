import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,perform,undo,evaluate,equation,isSolved,validInitialLevel
} from "../src/engine.mjs";
import {crateExpansionPlan,crateExpansionReplayNotes} from "../src/crate-expansion.mjs";
import {crateFloorLandingPlan,balloonEscapeKeyframes} from "../src/crate-physical-layout.mjs";
import {crateMarkup,looseAfterUnpack} from "../src/group-crates.mjs";
import {startNotebook,notebookReplayScript} from "../src/notebook-engine.mjs";
import {tryNotebookOperation} from "../src/notebook-maths-editor.mjs";

const actions=["remove","add","divide","multiply","unpack"];
const kinds=["posX","negX","posOne","negOne"];
const fixture={
  id:"signed-crates-physical-fixture",quantityMode:"signed",
  allowedOperations:actions,allowedKinds:kinds,groupedPrototype:true,
  solution:5,
  left:{crates:{count:2,contents:{posX:1,negOne:2}},posX:1,posOne:3},
  right:{posOne:14}
};
const openLeft={op:"unpack",side:"left"};

test("signed crate plans retain EVERY real kind while World 1 remains positive",()=>{
  assert.equal(validInitialLevel(fixture),true);
  const original=initialState(fixture);
  const plan=crateExpansionPlan(original.left);
  assert.equal(plan.signed,true);
  assert.deepEqual(plan.perCrate,{posX:1,negX:0,posOne:0,negOne:2});
  assert.deepEqual(plan.totalByKind,{posX:2,negX:0,posOne:0,negOne:4});
  assert.equal(plan.totalSprites,2);
  assert.equal(plan.totalBalloons,4);
  assert.equal(plan.totalWhiteSprites,0);
  assert.equal(plan.totalWeights,0);
  assert.deepEqual(plan.physicalPhases.map(x=>x.phase),[
    "open","open","sprites-bouncing","sprites-landed",
    "panels-falling","units-revealed","units-tumbling",
    "units-tumbling","settle"
  ]);
  assert.deepEqual(plan.physicalPhases.filter(x=>x.phase==="units-tumbling")
    .map(x=>x.count),[2,2]);
  assert.match(crateExpansionReplayNotes(original.left).summary,/4 balloons/);
  const html=crateMarkup(original.left);
  assert.equal((html.match(/class="token sealed-crate"/g)||[]).length,2);
  assert.equal((html.match(/class="crate-bay-balloon"/g)||[]).length,4);
  assert.match(html,/crate-sign-balloon/);
  assert.equal((html.match(/class="token balloon"/g)||[]).length,0,
    "sealed balloons must not already be loose tokens");
});

test("opening real signed crates keeps equality, shows the actual pairs in its history and undoes atomically",()=>{
  const start=initialState(fixture),snapshot=JSON.stringify(start);
  const raw=looseAfterUnpack(start.left);
  assert.equal(raw.posX,3);
  assert.equal(raw.posOne,3);
  assert.equal(raw.negOne,4);
  assert.equal(evaluate(raw,5),evaluate(start.left,5));
  const result=perform(start,openLeft);
  assert.equal(result.ok,true,result.reason);
  assert.equal(JSON.stringify(start),snapshot,"preview must not mutate the sealed original");
  const entry=result.state.history.at(-1);
  assert.equal(entry.mode,"rewrite");
  assert.equal(entry.action.op,"unpack");
  assert.deepEqual(entry.cancellationEvents.left.map(e=>e.type),
    ["constants","constants","constants"]);
  assert.deepEqual(entry.cancellationEvents.right,[]);
  assert.deepEqual([result.state.left.posX,result.state.left.posOne,
    result.state.left.negOne],[3,0,1]);
  assert.equal(result.state.left.crates,undefined);
  assert.deepEqual(result.state.right,start.right);
  assert.equal(evaluate(result.state.left,5),14);
  assert.equal(equation(result.state),"3x − 1 = 14");
  assert.deepEqual(undo(result.state),start);
});

test("signed crate white sprites and both signed units reveal before opposite pair cancellation",()=>{
  const level={id:"both-signed-types",quantityMode:"signed",
    allowedKinds:kinds,allowedOperations:actions,groupedPrototype:true,
    solution:5,left:{crates:{count:2,contents:{
      posX:2,negX:1,posOne:1,negOne:1
    }}},right:{posOne:10}};
  assert.equal(validInitialLevel(level),true);
  const original=initialState(level);
  const plan=crateExpansionPlan(original.left);
  assert.deepEqual(plan.totalByKind,{posX:4,negX:2,posOne:2,negOne:2});
  assert.equal(plan.totalWhiteSprites,2);
  assert.equal(plan.totalBalloons,2);
  assert.match(crateMarkup(original.left),/crate-sign-white/);
  assert.match(crateMarkup(original.left),/crate-bay-balloon/);
  const result=perform(original,openLeft);
  assert.equal(result.ok,true);
  const entry=result.state.history.at(-1);
  assert.deepEqual(entry.cancellationEvents.left.map(e=>e.type),
    ["sprites","sprites","constants","constants"]);
  assert.deepEqual(
    [result.state.left.posX,result.state.left.negX,
      result.state.left.posOne,result.state.left.negOne],[2,0,0,0]);
  assert.deepEqual(undo(result.state),original);
});

test("opening a crate on the right leaves existing initial zero pairs on the untouched left",()=>{
  const level={id:"right-hand-group",quantityMode:"signed",
    allowedKinds:kinds,allowedOperations:actions,groupedPrototype:true,
    solution:5,left:{posX:1,posOne:1,negOne:1},
    right:{crates:{count:1,contents:{posOne:5}}}};
  assert.equal(validInitialLevel(level),true);
  const start=initialState(level);
  const changed=perform(start,{op:"unpack",side:"right"});
  assert.equal(changed.ok,true);
  assert.deepEqual(changed.state.left,start.left);
  assert.equal(changed.state.left.posOne,1);
  assert.equal(changed.state.left.negOne,1);
  assert.deepEqual(changed.state.history.at(-1).cancellationEvents.left,[]);
  assert.equal(changed.state.right.posOne,5);
  assert.deepEqual(undo(changed.state),start);
});

test("a checked signed notebook can expand brackets and replay the identical true engine history",()=>{
  let session=startNotebook(fixture);
  for(const action of ["openLeft","+1","÷3"]){
    const r=tryNotebookOperation(session,action);
    assert.equal(r.ok,true,r.message||action);
    session=r.session;
  }
  assert.equal(isSolved(session.state),true);
  const script=notebookReplayScript(session);
  assert.deepEqual(script.map(s=>s.action.op),["unpack","add","divide"]);
  assert.deepEqual(script[0].after.left,perform(initialState(fixture),openLeft).state.left);
  assert.equal(script[0].before.left.crates.count,2);
  assert.equal(script[0].after.left.crates,undefined);
  assert.equal(session.state.history.length,3);
});

test("signed crate landings and balloon releases stay physically bounded on phones",()=>{
  const counts={posX:2,negX:2,posOne:3,negOne:4};
  for(const width of [112,170,245,340,620]){
    const plan=crateFloorLandingPlan(width,180,counts,{rightInset:0});
    assert.equal(plan.slots.length,11);
    assert.deepEqual(plan.slots.map(s=>s.kind),[
      "sprite","sprite","white-sprite","white-sprite",
      "weight","weight","weight",
      "balloon","balloon","balloon","balloon"
    ]);
    for(const slot of plan.slots){
      assert.ok(slot.left>=0);
      assert.ok(slot.left+slot.width<=width+.01);
      assert.ok(slot.top+slot.height<=180+.01);
      assert.ok(slot.scale>0&&slot.scale<=1);
    }
  }
  for(const motion of [
    balloonEscapeKeyframes(10,-55,0),
    balloonEscapeKeyframes(-22,-70,1),
    balloonEscapeKeyframes(10,-55,0,true)
  ]){
    assert.equal(motion.at(-1).opacity,1);
    assert.match(motion.at(-1).transform,/translate\(0px,0px\)/);
  }
});

test("positive-only levels cannot hide negative signs inside sealed crates",()=>{
  const illegal={...fixture,quantityMode:"positive",lockPositive:true};
  assert.equal(validInitialLevel(illegal),false);
  assert.throws(()=>initialState(illegal),/signed|positive/i);
});
