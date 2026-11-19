import test from "node:test";
import assert from "node:assert/strict";
import {divisionBasketTiming, divisionBasketSlots, divisionBasketMarkup}
  from "../src/division-baskets.mjs";

test("division distributes EACH kind equally without inventing or losing tokens",()=>{
  const kinds=["posX","posX","posX","posOne","posOne","posOne",
    "posOne","posOne","posOne","negOne","negOne","negOne"];
  const slots=divisionBasketSlots(kinds,3);
  const groups=[0,1,2].map(index=>kinds.filter((_,i)=>slots[i]===index));
  assert.equal(groups.length,3);
  assert.deepEqual(groups[0],["posX","posOne","posOne","negOne"]);
  assert.deepEqual(groups[1],groups[0]);
  assert.deepEqual(groups[2],groups[0]);
  assert.equal(slots.length,kinds.length);
});
test("basket positions are independently round-robin, not one coefficient split twice",()=>{
  assert.deepEqual(divisionBasketSlots(["posX","posX","posOne","posOne"],2),[0,1,0,1]);
  assert.deepEqual(divisionBasketSlots([],5),[]);
  assert.throws(()=>divisionBasketSlots(["posX"],1),RangeError);
});
test("factors 2–5 have physical basket props that begin empty and separate",()=>{
  for(const factor of [2,3,4,5]){
    const markup=divisionBasketMarkup(factor);
    assert.equal((markup.match(/class="group-basket"/g)||[]).length,factor);
    assert.equal((markup.match(/basket-contents/g)||[]).length,factor);
    assert.equal((markup.match(/data-state="waiting"/g)||[]).length,factor);
    assert.equal((markup.match(/data-basket-index=/g)||[]).length,factor);
    assert.doesNotMatch(markup,/sprite-black|sprite-white|weight|balloon/);
    assert.match(markup,new RegExp("Basket "+factor+" of "+factor));
  }
  assert.throws(()=>divisionBasketMarkup(1),RangeError);
});
test("throws accelerate with more baskets but still remove them one by one",()=>{
  const small=divisionBasketTiming(2);
  const medium=divisionBasketTiming(5);
  const many=divisionBasketTiming(10);
  assert.ok(small.throwMs>medium.throwMs);
  assert.ok(medium.throwMs>many.throwMs);
  assert.ok(small.dropGap>medium.dropGap);
  assert.ok(medium.dropGap>many.dropGap);
  assert.ok(medium.keepMs>=500);
  assert.equal(many.factor,10);
  assert.throws(()=>divisionBasketTiming(1),RangeError);
  assert.throws(()=>divisionBasketTiming(40),RangeError);
});
test("reduced motion gives staged snapshots without falling or flying",()=>{
  for(const factor of [2,3,5]){
    const plan=divisionBasketTiming(factor,true);
    assert.equal(plan.dropMs,0);
    assert.equal(plan.dropGap,0);
    assert.equal(plan.throwMs,0);
    assert.equal(plan.shareMs,0);
    assert.ok(plan.keepMs>0);
  }
});
