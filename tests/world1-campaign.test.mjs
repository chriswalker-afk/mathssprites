import test from "node:test";
import assert from "node:assert/strict";
import { WORLD1_LEVELS, WORLD1_OPERATIONS } from "../src/worlds.mjs";
import {
  LEVELS, TOKEN_KINDS, initialState, perform, undo, isSolved, evaluate,
  equation, validInitialLevel, algebraOperation
} from "../src/engine.mjs";

const removeWeights = n => ({op:"remove",kind:"posOne",count:n});
const removeSprites = n => ({op:"remove",kind:"posX",count:n});
const addWeights = n => ({op:"add",kind:"posOne",count:n});
const split = factor => ({op:"divide",factor});
const unpack = side => ({op:"unpack",side});

// Explicit human-authored solution paths are independent of the mathematics
// engine. Each step is exercised in both Guided Mirror and Your Turn modes.
// This also guards against regressions to the actual comic transaction history.
const solutions = [
  [removeWeights(2)],
  [removeWeights(3)],
  [removeWeights(5)],
  [removeWeights(7)],
  [split(3)],
  [split(2)],
  [split(4)],
  [split(5)],
  [removeWeights(3),split(2)],
  [split(3),removeWeights(2)],
  [split(4),removeWeights(2)],
  [removeWeights(7),split(3)],
  [removeSprites(1),removeWeights(3)],
  [removeSprites(1),removeWeights(1),split(2)],
  [removeSprites(2),removeWeights(3),split(2)],
  [removeSprites(2),removeWeights(4),split(3)],
  [split(2),removeSprites(1),removeWeights(3)],
  [removeSprites(2),removeWeights(2)],
  [unpack("left"),removeWeights(6),split(2)],
  [removeSprites(2),addWeights(1),split(3),removeWeights(6)],
  // Equal groups; more groups; an ungrouped sprite on the opposite side;
  // then a mixed sealed and loose-object final challenge.
  [split(2),unpack("left"),removeWeights(1)],
  [split(3),unpack("left"),removeWeights(2)],
  [unpack("left"),removeSprites(1),removeWeights(8)],
  [unpack("left"),removeSprites(1),removeWeights(7),split(4)]
];

const alternateRoutes = new Map([
  [10,[removeWeights(6),split(3)]],
  [11,[removeWeights(8),split(4)]],
  [17,[removeSprites(2),removeWeights(6),split(2)]],
  [19,[split(2),unpack("left"),removeWeights(3)]],
  [20,[removeSprites(2),removeWeights(12),removeWeights(5),split(3)]],
  [21,[unpack("left"),removeWeights(2),split(2)]],
  [22,[unpack("left"),removeWeights(6),split(3)]],
  [24,[removeSprites(1),unpack("left"),removeWeights(7),split(4)]]
]);

function checkRoom(r, label) {
  let count = 0;
  for (const kind of TOKEN_KINDS) {
    const n = r[kind];
    assert.ok(Number.isInteger(n) && n >= 0, label + " has non-whole objects");
    if (kind !== "posX" && kind !== "posOne")
      assert.equal(n,0,label + " must not expose signed/square objects");
    count += n;
  }
  if(r.crates){
    assert.equal(Number.isInteger(r.crates.count),true,label+" crate count is not whole");
    assert.ok(r.crates.count>=1,label+" must have complete crates");
    for(const kind of TOKEN_KINDS){
      assert.ok(Number.isInteger(r.crates.contents[kind])&&r.crates.contents[kind]>=0);
      if(kind!=="posX"&&kind!=="posOne")
        assert.equal(r.crates.contents[kind],0,"This is a positive-only prototype");
    }
    count+=r.crates.count;
  }
  assert.ok(count <= 48,label + " exceeds room capacity: " + count);
}
function verifySolution(level, steps, mode = "auto") {
  let state = initialState(level);
  const start = equation(state);
  assert.equal(isSolved(state),false,"Level starts already solved");
  assert.ok(steps.length > 0);
  for (const [i,action] of steps.entries()) {
    assert.ok(level.allowedOperations.includes(action.op),"Unexpected operation");
    if (mode === "auto") {
      const response = perform(state,action,"auto");
      assert.equal(response.ok,true,level.id + " failed step " + (i+1) + " " + JSON.stringify(action) + ": " + response.reason);
      state = response.state;
    } else if(action.op==="unpack"){
      // An intact group opens in ONE room only, even in manual hand mode.
      const rewrite=perform(state,action,"auto");
      assert.equal(rewrite.ok,true,level.id+" local identity rewrite");
      assert.equal(rewrite.state.history.at(-1).mode,"rewrite");
      state=rewrite.state;
    } else {
      const first = perform(state,action,"manual","left");
      assert.equal(first.ok,true,level.id + " manual first room, step " + (i+1));
      assert.equal(isSolved(first.state),false,"A single room must not finish the puzzle");
      const second = perform(first.state,action,"manual","right");
      assert.equal(second.ok,true,level.id + " manual matching room, step " + (i+1));
      state = second.state;
    }
    assert.equal(state.history.length,i+1);
    assert.equal(state.history.at(-1).action.op,action.op);
    assert.equal(typeof algebraOperation(action),"string");
    checkRoom(state.left,level.id + " left after " + (i+1));
    checkRoom(state.right,level.id + " right after " + (i+1));
    assert.equal(evaluate(state.left,level.solution),evaluate(state.right,level.solution),
      level.id + " became unbalanced during solution");
    assert.equal(isSolved(state),i===steps.length-1,
      level.id + " was solved too early / did not finish at step " + (i+1));
  }
  assert.equal(state.history.length,steps.length);
  assert.ok(equation(state) === "x = " + level.solution ||
    equation(state) === level.solution + " = x",
    level.id + " final algebra is wrong: " + equation(state));
  const previous = undo(state);
  assert.equal(previous.history.length,steps.length-1,"Undo reverts one complete operation");
  return {initial:start,final:equation(state)};
}

test("World 1 contains 24 unique, viable and entirely positive balances",() => {
  assert.equal(WORLD1_LEVELS.length,24);
  assert.equal(solutions.length,24);
  const ids = new Set();
  for (const slot of WORLD1_LEVELS) {
    const level = slot.level;
    assert.equal(slot.available,true,"All campaign slots are implemented");
    assert.ok(!ids.has(level.id),level.id + " is duplicated");
    ids.add(level.id);
    assert.equal(slot.chapterIndex,Math.floor((slot.number-1)/4));
    assert.equal(level.number,slot.number);
    assert.equal(level.lockPositive,true);
    assert.equal(level.quantityMode,"positive");
    assert.deepEqual(level.allowedOperations,
      level.groupedPrototype?[...WORLD1_OPERATIONS,"unpack"]:WORLD1_OPERATIONS);
    assert.ok(validInitialLevel(level),"Invalid algebra " + level.id);
    assert.ok(Number.isInteger(level.solution) && level.solution > 0);
    assert.ok(level.title && level.prompt && level.suggested);
    checkRoom(initialState(level).left,level.id+" initial left");
    checkRoom(initialState(level).right,level.id+" initial right");
  }
  assert.equal(LEVELS.length,13,"Original advanced experiment library is preserved");
});

test("All 24 model solutions reach one sprite, with only whole-number intermediate states",() => {
  for (const [i,slot] of WORLD1_LEVELS.entries()) {
    const outcome = verifySolution(slot.level,solutions[i]);
    assert.notEqual(outcome.initial,outcome.final);
  }
});

test("All 24 solutions allow two-hand operations and single-room crate rewrites",() => {
  for (const [i,slot] of WORLD1_LEVELS.entries()){
    verifySolution(slot.level,solutions[i],"manual");
  }
});

test("Alternative valid strategies exist, including clearing first and grouping first",() => {
  for (const [number,steps] of alternateRoutes)
    verifySolution(WORLD1_LEVELS[number-1].level,steps);
});

test("World 1 forbids hidden square, square-root, square-object and signed operations",() => {
  for (const slot of WORLD1_LEVELS) {
    const state = initialState(slot.level);
    for (const op of ["square","sqrt"])
      assert.equal(perform(state,{op}).code,"locked-operation");
    for (const op of ["add","remove"])
      assert.equal(perform(state,{op,kind:"posX2",count:1}).code,"locked-kind");
    for (const kind of ["negX","negOne"])
      assert.equal(perform(state,{op:"add",kind,count:1}).code,"locked-negative");
    assert.throws(()=>initialState(slot.level,"signed"),/positive/i);
  }
});

test("Chapter 2 requires equal whole groups; Chapter 3 requires at least two actions",() => {
  for (const slot of WORLD1_LEVELS.slice(4,8)) {
    assert.ok(slot.level.left.posX >= 2 && !slot.level.left.posOne);
    assert.ok(!slot.level.right.posX && slot.level.right.posOne > 0);
    assert.equal(solutions[slot.number-1][0].op,"divide");
  }
  for (const slot of WORLD1_LEVELS.slice(8,12)) {
    assert.ok(slot.level.left.posX > 1 && slot.level.left.posOne > 0);
    assert.ok(solutions[slot.number-1].length >= 2);
  }
});

test("Chapters 4/5 include two-sided sprites, reverse orientation and a strategic addition",() => {
  for (const slot of WORLD1_LEVELS.slice(12))
    if(slot.number!==19)
      assert.ok(slot.level.left.posX > 0 && slot.level.right.posX > 0);
  assert.equal(WORLD1_LEVELS[18].level.left.crates.count,2,
    "Guided Level 19 contains two identical complete crates");
  assert.ok(WORLD1_LEVELS[13].level.right.posX > WORLD1_LEVELS[13].level.left.posX);
  assert.ok(WORLD1_LEVELS[17].level.right.posX > WORLD1_LEVELS[17].level.left.posX);
  assert.ok(solutions[19].some(x=>x.op==="add"),"Final puzzle must allow a positive addition shortcut");
  assert.ok(alternateRoutes.get(20).every(x=>x.op!=="add"),"A subtraction-only alternative remains valid");
});

test("Division requiring fractional pieces stays an unsuccessful, non-mutating operation",() => {
  for (const number of [9,12,20]) {
    const level = WORLD1_LEVELS[number-1].level;
    const state = initialState(level);
    const attempted = perform(state,{op:"divide",factor:2});
    assert.equal(attempted.ok,false);
    assert.equal(attempted.code,"fraction");
    assert.equal(state.history.length,0);
  }
});
