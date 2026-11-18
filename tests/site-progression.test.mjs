import test from "node:test";
import assert from "node:assert/strict";
import {
  WORLD1_LEVELS, WORLD1_CHAPTERS, WORLD1_OPERATIONS, WORLDS,
  isWorld1Unlocked, nextWorld1Level
} from "../src/worlds.mjs";
import {
  normalizeProgress, markWorld1Complete, loadProgress, saveProgress
} from "../src/progress.mjs";
import { initialState, perform, validInitialLevel, isSolved, LEVELS } from "../src/engine.mjs";

test("four visible worlds, five four-level World 1 chapters and five real first puzzles", () => {
  assert.equal(WORLDS.length, 4);
  assert.deepEqual(WORLDS.map(w => w.available), [true,false,false,false]);
  assert.equal(WORLD1_CHAPTERS.length, 5);
  assert.equal(WORLD1_LEVELS.length, 20);
  assert.deepEqual(WORLD1_LEVELS.filter(x => x.available).map(x => x.number), [1,2,3,4,5]);
  assert.equal(LEVELS.length, 13, "Original advanced experiments remain intact");
  for (const slot of WORLD1_LEVELS.filter(s => s.available)) {
    assert.ok(validInitialLevel(slot.level), "Level " + slot.number + " has a valid balance");
    assert.deepEqual(slot.level.allowedOperations, WORLD1_OPERATIONS);
    assert.equal(slot.level.lockPositive, true);
    assert.ok(Number.isInteger(slot.level.solution) && slot.level.solution > 0);
  }
});

test("the first four levels can be completed by removing positive whole weights", () => {
  for (const slot of WORLD1_LEVELS.slice(0,4)) {
    const s = initialState(slot.level);
    const n = slot.level.left.posOne;
    const result = perform(s, { op:"remove", kind:"posOne", count:n });
    assert.equal(result.ok, true, slot.title);
    assert.equal(isSolved(result.state), true, slot.title);
  }
});

test("the fifth level introduces exactly three whole baskets", () => {
  const state = initialState(WORLD1_LEVELS[4].level);
  const result = perform(state, { op:"divide", factor:3 });
  assert.equal(result.ok, true);
  assert.equal(isSolved(result.state), true);
});

test("campaign restrictions are enforced by the engine, not only by hiding buttons", () => {
  const s = initialState(WORLD1_LEVELS[0].level);
  for (const op of ["square","sqrt"]) {
    const result = perform(s,{op});
    assert.equal(result.ok,false);
    assert.equal(result.code,"locked-operation");
  }
  assert.equal(perform(s,{op:"add",kind:"negOne",count:1}).code,"locked-negative");
  assert.throws(() => initialState(WORLD1_LEVELS[0].level, "signed"), /positive/i);
  assert.equal(perform(initialState(LEVELS[5]),{op:"square"}).ok,true,
    "Advanced preview experiments still support squares");
});

test("unlocking is sequential; teacher access unlocks only implemented levels", () => {
  assert.equal(isWorld1Unlocked(1,[]),true);
  assert.equal(isWorld1Unlocked(2,[]),false);
  assert.equal(isWorld1Unlocked(2,[1]),true);
  assert.equal(isWorld1Unlocked(5,[],true),true);
  assert.equal(isWorld1Unlocked(6,[1,2,3,4,5],true),false);
  assert.equal(nextWorld1Level(1,[1]),WORLD1_LEVELS[1]);
  assert.equal(nextWorld1Level(5,[1,2,3,4,5]),null);
});

test("progress survives reloads, ignores invalid data and works without localStorage", () => {
  const store = new Map();
  const storage = {
    getItem:key=>store.get(key)||null,
    setItem:(key,value)=>store.set(key,value)
  };
  let progress = loadProgress(storage);
  assert.deepEqual(progress,{completed:[],lastPlayed:1});
  progress = markWorld1Complete(progress,1);
  assert.deepEqual(saveProgress(progress,storage),{completed:[1],lastPlayed:2});
  assert.deepEqual(loadProgress(storage),{completed:[1],lastPlayed:2});
  assert.deepEqual(normalizeProgress({completed:[1,1,500,-1,2,"3"],lastPlayed:200}),
    {completed:[1,2],lastPlayed:1});
  assert.deepEqual(loadProgress({getItem:()=>{throw Error("blocked")}}),
    {completed:[],lastPlayed:1});
});
