import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVELS, TOKEN_KINDS, initialState, validInitialLevel, areaArrangement,
  perform, prepare, equation, isSolved, balanceDifference, undo, evaluate,
  operationDescription, algebraOperation
} from "../src/engine.mjs";
import { floorScaleToFit, previewCells, areaMathLabel } from "../src/area-layout.mjs";

const square = {op:"square"};
const sqrt = {op:"sqrt"};
const divide2 = {op:"divide",factor:2};
function apply(state,action) {
  const r = perform(state,action);
  assert.equal(r.ok,true,r.reason);
  return r.state;
}
test("the three additional experiments are valid and explicitly assume a nonnegative root", () => {
  assert.equal(LEVELS.length,10);
  assert.deepEqual(LEVELS.slice(5,8).map(l=>l.id),
    ["make-square","take-root","root-then-share"]);
  for (const level of LEVELS) assert.equal(validInitialLevel(level),true,level.id);
  for (const level of LEVELS.slice(5)) assert.match(level.prompt,/x ≥ 0|x is nonnegative/);
  assert.ok(TOKEN_KINDS.includes("posX2"));
});
test("squaring turns one round x sprite into a square x² and 3 weights into a 3-by-3 array", () => {
  const before = initialState(LEVELS[5]);
  assert.equal(isSolved(before),false,"area-building is its own lesson objective");
  const result = apply(before,square);
  assert.equal(result.left.posX,0);
  assert.equal(result.left.posX2,1);
  assert.equal(result.right.posOne,9);
  assert.equal(equation(result),"x² = 9");
  assert.equal(isSolved(result),true);
  assert.equal(balanceDifference(result),0);
  assert.equal(equation(undo(result)),"x = 3");
  assert.deepEqual(result.history[0].action,square);
});
test("taking principal roots of x²=9 turns square x² into round x", () => {
  const before = initialState(LEVELS[6]);
  assert.equal(equation(before),"x² = 9");
  const after = apply(before,sqrt);
  assert.equal(equation(after),"x = 3");
  assert.equal(after.left.posX2,0);
  assert.equal(after.left.posX,1);
  assert.equal(after.right.posOne,3);
  assert.equal(isSolved(after),true);
  assert.equal(balanceDifference(after),0);
  assert.equal(equation(undo(after)),"x² = 9");
});
test("the root-then-share puzzle keeps the whole side of both squares", () => {
  const start = initialState(LEVELS[7]);
  assert.equal(equation(start),"4x² = 36");
  const rooted = apply(start,sqrt);
  assert.equal(equation(rooted),"2x = 6");
  assert.equal(balanceDifference(rooted),0);
  const done = apply(rooted,divide2);
  assert.equal(equation(done),"x = 3");
  assert.equal(isSolved(done),true);
});
test("square turns 2x=6 into 4x²=36, and sqrt reverses it", () => {
  const start = initialState({id:"test-square", solution:3,
    left:{posX:2},right:{posOne:6}});
  const sq = apply(start,square);
  assert.equal(equation(sq),"4x² = 36");
  assert.equal(balanceDifference(sq),0);
  const restored = apply(sq,sqrt);
  assert.equal(equation(restored),"2x = 6");
});
test("squaring the entire mixed expression creates BOTH missing cross-term regions", () => {
  const start = initialState(LEVELS[0]); // x + 2 = 5
  const checked = prepare(start,square);
  assert.equal(checked.ok,true);
  const result=apply(start,square);
  assert.equal(equation(result),"x² + 4x + 4 = 25");
  assert.equal(balanceDifference(result),0);
  assert.equal(start.history.length,0);
  assert.equal(equation(start),"x + 2 = 5");
  assert.equal(prepare(initialState(LEVELS[6]),square).ok,false,
    "cannot square x² as though x⁴ were supported");
});
test("taking roots rejects an imperfect-square area and algebraic mixtures", () => {
  const level={id:"bad-root",solution:3,left:{posX2:2},right:{posOne:18}};
  assert.equal(prepare(initialState(level),sqrt).ok,false);
  assert.equal(prepare(initialState(LEVELS[0]),sqrt).ok,false);
  const tiny={id:"simple",solution:3,left:{posOne:16},right:{posOne:16}};
  assert.equal(equation(apply(initialState(tiny),sqrt)),"4 = 4");
});
test("manual mode still requires the matching square operation in both rooms", () => {
  const start = initialState(LEVELS[5]);
  const pending=perform(start,square,"manual","left");
  assert.equal(pending.ok,true);
  assert.equal(isSolved(pending.state),false);
  assert.equal(balanceDifference(pending.state),6);
  const mismatched=perform(pending.state,sqrt,"manual","right");
  assert.equal(mismatched.ok,false);
  const done=perform(pending.state,square,"manual","right");
  assert.equal(done.ok,true);
  assert.equal(done.state.history.length,1);
  assert.equal(isSolved(done.state),true);
  assert.equal(equation(undo(done.state)),"x = 3");
});
test("area diagram builds row, matching column, then inner squares in order", () => {
  const row = areaArrangement({posOne:3},"square");
  assert.deepEqual(row,{op:"square",kind:"posOne",side:3,cells:9,symbolic:false});
  const cells=previewCells(row);
  assert.equal(cells.length,9);
  assert.deepEqual(cells.filter(x=>x.role==="row").map(x=>x.index),[0,1,2]);
  assert.deepEqual(cells.filter(x=>x.role==="column").map(x=>x.index),[3,6]);
  assert.deepEqual(cells.filter(x=>x.role==="fill").map(x=>x.index),[4,5,7,8]);
  assert.ok(cells.find(x=>x.role==="fill").delay > cells[2].delay);
  assert.equal(areaMathLabel(row),"3 × 3 = 9");
  assert.equal(areaMathLabel(areaArrangement({posX:2},"square")),"2x × 2x = 4x²");
  assert.equal(areaMathLabel(areaArrangement({posX2:4},"sqrt")),"√(4x²) = 2x");
  assert.equal(areaMathLabel(areaArrangement({posOne:36},"sqrt")),"√(36) = 6");
});
test("floor row fits to any room width without changing object count", () => {
  assert.equal(floorScaleToFit(700,500),1);
  const fitted=floorScaleToFit(180,36*47);
  assert.ok(fitted>0 && fitted<.2);
  assert.equal(floorScaleToFit(200,100),1);
  assert.equal(floorScaleToFit(0,100),1);
  assert.equal(previewCells(areaArrangement({posOne:36},"sqrt")).length,36);
  assert.throws(()=>previewCells({side:3,cells:8}),TypeError);
});
test("algebra notes describe principal roots, not an unjustified ± sign", () => {
  assert.match(algebraOperation(sqrt),/principal root/);
  assert.match(operationDescription(square),/Square both entire sides/);
  assert.doesNotMatch(algebraOperation(sqrt),/±/);
  const room={posX2:4,posX:2,posOne:3,negX:0,negOne:0};
  assert.equal(evaluate(room,3),45);
});
