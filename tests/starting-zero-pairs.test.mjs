import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,attachAvailablePairs,undo,evaluate,validInitialLevel,
  isSolved,perform
} from "../src/engine.mjs";
import {neutralPairSequence} from "../src/neutral-pairs.mjs";

const signedLevel={
  id:"initial-mixed-opposites",quantityMode:"signed",solution:4,
  left:{posX:3,negX:2,posOne:5,negOne:3},
  right:{posOne:6}
};

test("both initial types of zero pair can be explicitly attached, in either order",()=>{
  assert.equal(validInitialLevel(signedLevel),true);
  const first=initialState(signedLevel);
  const originalValue=evaluate(first.left,4);
  assert.equal(originalValue,6);
  const units=attachAvailablePairs(first,"left","constants");
  assert.equal(units.ok,true);
  assert.equal(units.count,3);
  assert.deepEqual([units.state.left.posOne,units.state.left.negOne],[2,0]);
  assert.deepEqual([units.state.left.posX,units.state.left.negX],[3,2]);
  assert.equal(units.state.history.length,0);
  assert.deepEqual(units.events.map(x=>x.type),["constants","constants","constants"]);
  assert.deepEqual(units.events.map(x=>x.after.posOne),[4,3,2]);
  const sprites=attachAvailablePairs(units.state,"left","sprites");
  assert.equal(sprites.ok,true);
  assert.equal(sprites.count,2);
  assert.deepEqual([sprites.state.left.posX,sprites.state.left.negX],[1,0]);
  assert.deepEqual([sprites.state.left.posOne,sprites.state.left.negOne],[2,0]);
  assert.equal(evaluate(sprites.state.left,4),originalValue);
  assert.deepEqual(sprites.state.right,first.right);
  assert.equal(sprites.state.history.length,0);
  assert.equal(isSolved(sprites.state),false);
  const reversedSprites=attachAvailablePairs(first,"left","sprites");
  const reversedUnits=attachAvailablePairs(reversedSprites.state,"left","constants");
  assert.deepEqual(reversedUnits.state.left,sprites.state.left);
  assert.deepEqual(first.left.posOne,5);
  assert.deepEqual(first.left.negX,2);
});

test("Undo restores original physical objects without costing a mathematical move",()=>{
  const start=initialState(signedLevel);
  const afterUnits=attachAvailablePairs(start,"left","constants").state;
  const afterBoth=attachAvailablePairs(afterUnits,"left","sprites").state;
  assert.deepEqual(undo(afterBoth).left,afterUnits.left);
  assert.deepEqual(undo(undo(afterBoth)).left,start.left);
  assert.equal(undo(undo(afterBoth)).history.length,0);
  const next=perform(afterBoth,{op:"add",kind:"posOne",count:1});
  assert.equal(next.ok,true);
  assert.equal(next.state.pairUndo.length,0);
  assert.equal(next.state.history.length,1);
  assert.deepEqual(undo(next.state).left,afterBoth.left);
});

test("empty, invalid or pending attempts cannot change a chamber",()=>{
  const start=initialState(signedLevel);
  assert.equal(attachAvailablePairs(start,"right","constants").code,"no-pairs");
  assert.equal(attachAvailablePairs(start,"centre","sprites").code,"pair-choice");
  assert.equal(attachAvailablePairs(start,"left","weight").code,"pair-choice");
  assert.equal(attachAvailablePairs({...start,pending:{first:"left"}},"left","sprites").code,"pending");
  assert.equal(attachAvailablePairs({...start,quantityMode:"positive"},"left","sprites").code,"locked-negative");
  assert.equal(start.history.length,0);
});

test("pair animations affect only the chosen kind and keep sealed crates",()=>{
  const mixed={posX:3,negX:2,posOne:5,negOne:3};
  const pairs=neutralPairSequence(mixed,"left","sprites");
  assert.equal(pairs.length,2);
  assert.deepEqual(pairs.map(p=>p.after.negX),[1,0]);
  assert.equal(pairs.at(-1).after.negOne,3);
  const level={id:"signed-with-crate",quantityMode:"signed",solution:4,
    left:{...mixed,crates:{count:1,contents:{posX:1,posOne:1}}},
    right:{posOne:11}};
  assert.equal(validInitialLevel(level),true);
  const state=initialState(level);
  const next=attachAvailablePairs(state,"left","constants");
  assert.equal(next.ok,true);
  assert.deepEqual(next.state.left.crates,state.left.crates);
  assert.deepEqual(next.events[0].before.crates,state.left.crates);
  assert.deepEqual(next.events.at(-1).after.crates,state.left.crates);
  assert.equal(evaluate(next.state.left,4),evaluate(state.left,4));
});
