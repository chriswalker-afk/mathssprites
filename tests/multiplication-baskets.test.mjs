import test from "node:test";
import assert from "node:assert/strict";
import {initialState,perform,previewRoomAction} from "../src/engine.mjs";
import {divisionBasketMarkup} from "../src/division-baskets.mjs";
import {
  multiplicationBasketTiming,multiplicationBasketMarkup,
  multiplicationGroupCopies,multiplicationHandProp
} from "../src/multiplication-baskets.mjs";

test("2–5 groups are exact complete copies of the ORIGINAL mixed basket",()=>{
  const kinds=["posX","posX","negX","posX2","posOne","posOne","negOne"];
  for(const factor of [2,3,4,5]){
    const groups=multiplicationGroupCopies(kinds,factor);
    assert.equal(groups.length,factor);
    for(const group of groups)assert.deepEqual(group,kinds);
    assert.equal(groups.flat().length,kinds.length*factor);
    groups[1].pop(); // all copy plans must be independent
    assert.equal(groups[0].length,kinds.length);
  }
  assert.deepEqual(multiplicationGroupCopies([],3),[[],[],[]]);
  for(const factor of [0,1,6,2.5,"3",null]){
    assert.throws(()=>multiplicationGroupCopies(kinds,factor),RangeError);
    assert.throws(()=>multiplicationBasketMarkup(factor),RangeError);
    assert.throws(()=>multiplicationBasketTiming(factor),RangeError);
  }
});
test("multiplication uses the EXACT solid wicker basket markup already used by division",()=>{
  for(const factor of [2,3,4,5]){
    const physical=multiplicationBasketMarkup(factor);
    assert.equal(physical,divisionBasketMarkup(factor));
    assert.equal((physical.match(/class="group-basket"/g)||[]).length,factor);
    assert.equal((physical.match(/basket-lip/g)||[]).length,factor);
    assert.equal((physical.match(/data-state="waiting"/g)||[]).length,factor);
    assert.doesNotMatch(physical,/held-basket|ghost|opacity:/);
  }
  const hand=multiplicationHandProp();
  assert.match(hand,/class="group-basket basket-in-hand"/);
  assert.match(hand,/basket-contents/);
  assert.match(hand,/basket-lip/);
  assert.doesNotMatch(hand,/held-basket|held-basket-double/);
});
test("extra copy and pouring tempo accelerates at factors four and five",()=>{
  const normal3=multiplicationBasketTiming(3);
  const normal5=multiplicationBasketTiming(5);
  assert.ok(normal3.deliverMs>normal5.deliverMs);
  assert.ok(normal3.placeMs>normal5.placeMs);
  assert.ok(normal3.pourMs>normal5.pourMs);
  assert.ok(normal3.throwMs>normal5.throwMs);
  assert.ok(normal3.settleMs>normal5.settleMs);
  for(const factor of [2,3,4,5]){
    const m=multiplicationBasketTiming(factor,true);
    assert.equal(m.dropMs,0);
    assert.equal(m.shareMs,0);
    assert.equal(m.deliverMs,0);
    assert.equal(m.placeMs,0);
    assert.equal(m.pourMs,0);
    assert.equal(m.throwMs,0);
    assert.ok(m.settleMs>=150);
  }
});
test("whole-object multiplication totals match the unchanged engine for both chambers",()=>{
  const level={id:"multiplication-test",left:{posX:1,posOne:2},
    right:{posOne:5},solution:3,lockPositive:true};
  for(const factor of [2,3,4,5]){
    const before=initialState(level,"positive");
    const trial=perform(before,{op:"multiply",factor},"auto");
    assert.equal(trial.ok,true);
    assert.deepEqual([trial.state.left.posX,trial.state.left.posOne,
      trial.state.right.posOne],[factor,2*factor,5*factor]);
    assert.equal(trial.state.history.length,1);
    assert.equal(before.history.length,0);
    assert.equal(before.left.posX,1);
  }
});
test("signed groups can copy balloons and sprites without changing cancellation rules",()=>{
  const level={id:"signed-baskets",left:{posX:2,posOne:1,negOne:1},
    right:{posOne:8},solution:4,quantityMode:"signed"};
  const before=initialState(level);
  const preview=previewRoomAction(before.left,{op:"multiply",factor:3},"signed");
  assert.equal(preview.ok,true);
  assert.equal(preview.raw.posX,6);
  assert.equal(preview.raw.posOne,3);
  assert.equal(preview.raw.negOne,3);
  assert.equal(preview.after.posX,6);
  assert.equal(preview.after.posOne,0);
  assert.equal(preview.after.negOne,0);
  const result=perform(before,{op:"multiply",factor:3},"auto");
  assert.equal(result.ok,true);
  assert.equal(result.state.left.posX,6);
  assert.equal(result.state.right.posOne,24);
  assert.equal(result.state.history.length,1);
});
test("invalid multiplication overflow is rejected by the engine before creating copies",()=>{
  const before=initialState({id:"overflow-test",left:{posX:1},right:{posOne:36},solution:6});
  const tooMany=perform(before,{op:"multiply",factor:2},"auto");
  assert.equal(tooMany.ok,false);
  assert.equal(tooMany.code,"overflow");
  assert.equal(before.right.posOne,36);
  assert.equal(before.history.length,0);
});
