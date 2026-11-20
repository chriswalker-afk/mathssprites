import test from "node:test";
import assert from "node:assert/strict";
import {crateDiscardPlan,isCrateOnlyDivisionRoom} from "../src/crate-division.mjs";
import {WORLD1_LEVELS} from "../src/worlds.mjs";
import {initialState,perform,undo,evaluate} from "../src/engine.mjs";

const level=WORLD1_LEVELS[18].level;

test("a sealed-only chamber uses hand crate discard; a loose or mixed chamber still needs baskets",()=>{
  const original=initialState(level);
  assert.equal(isCrateOnlyDivisionRoom(original.left),true);
  assert.equal(isCrateOnlyDivisionRoom(original.right),false);
  assert.equal(isCrateOnlyDivisionRoom({...original.left,posOne:2}),false);
  assert.equal(isCrateOnlyDivisionRoom({posX:2}),false);
  assert.equal(isCrateOnlyDivisionRoom({crates:{count:0}}),false);
});
test("2 crates ÷ 2 physically discards top crate and keeps the signed bottom crate",()=>{
  assert.deepEqual(crateDiscardPlan(2,2),{
    count:2,factor:2,retained:1,pictureIndex:1,keep:[1],discard:[0]
  });
});
test("larger stacks retain one contiguous signed section and discard only whole originals",()=>{
  for(const [count,factor] of [[3,3],[4,2],[6,2],[6,3],[8,4],[12,3]]){
    const plan=crateDiscardPlan(count,factor);
    assert.equal(plan.keep.length,count/factor);
    assert.equal(plan.discard.length,count-count/factor);
    assert.ok(plan.keep.includes(plan.pictureIndex),
      "Picture sign must remain with a kept crate");
    assert.equal(new Set([...plan.keep,...plan.discard]).size,count);
    assert.deepEqual([...plan.keep].sort((a,b)=>a-b),plan.keep);
    for(let i=1;i<plan.keep.length;i++)
      assert.equal(plan.keep[i]-plan.keep[i-1],1,"Survivors must form one stack");
  }
});
test("invalid and fractional crate division cannot start the physical throw",()=>{
  for(const [count,factor] of [[2,3],[3,2],[0,2],[1,2],[4,1],[13,2],[2,0],[2,33]])
    assert.throws(()=>crateDiscardPlan(count,factor),RangeError);
});
test("animation plan does not touch mathematical values, Undo or three-move star benchmark",()=>{
  const before=initialState(level);
  const snapshot=JSON.stringify(before);
  crateDiscardPlan(2,2);
  assert.equal(JSON.stringify(before),snapshot);
  const divided=perform(before,{op:"divide",factor:2},"auto");
  assert.equal(divided.ok,true);
  assert.equal(divided.state.left.crates.count,1);
  assert.equal(divided.state.right.posOne,7);
  assert.equal(evaluate(divided.state.left,4),7);
  assert.equal(evaluate(divided.state.right,4),7);
  assert.deepEqual(undo(divided.state),before);
  let state=divided.state;
  for(const action of [{op:"unpack",side:"left"},
    {op:"remove",kind:"posOne",count:3}]){
    const result=perform(state,action,"auto");
    assert.equal(result.ok,true,result.reason);
    state=result.state;
  }
  assert.equal(state.history.length,3);
});
