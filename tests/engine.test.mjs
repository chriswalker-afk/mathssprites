import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVELS, initialState, validInitialLevel, perform, undo, isSolved,
  prepare, equation, expression, normalize, evaluate, visibleRooms, balanceDifference,
  operationDescription, algebraOperation
} from "../src/engine.mjs";

const act = (op, kind, count) => ({ op, kind, count });
const factor = (op, number) => ({ op, factor: number });
function committed(state, action) {
  const result = perform(state, action);
  assert.equal(result.ok, true, result.reason);
  assert.equal(result.committed, true);
  return result.state;
}

test("the curated puzzles have a unique intended integer solution", () => {
  for (const level of LEVELS) {
    assert.equal(validInitialLevel(level), true, level.id);
    const state = initialState(level);
    assert.equal(balanceDifference(state), 0, level.id);
    assert.equal(isSolved(state), false);
  }
});
test("level 1: take two weights from both sides", () => {
  const start = initialState(LEVELS[0]);
  const next = committed(start, act("remove", "posOne", 2));
  assert.equal(isSolved(next), true);
  assert.equal(equation(next), "x = 3");
  assert.equal(equation(start), "x + 2 = 5");
  assert.equal(next.history.length, 1);
  assert.equal(equation(next.history[0].before), "x + 2 = 5");
  assert.equal(equation(next.history[0].after), "x = 3");
  assert.equal(equation(undo(next)), equation(start));
});
test("level 2: divide each entire room into 3 equal baskets", () => {
  const next = committed(initialState(LEVELS[1]), factor("divide", 3));
  assert.equal(equation(next), "x = 3");
  assert.equal(isSolved(next), true);
});
test("level 3: remove constants, then divide complete expressions", () => {
  const cleaned = committed(initialState(LEVELS[2]), act("remove", "posOne", 4));
  assert.equal(equation(cleaned), "2x = 8");
  const solved = committed(cleaned, factor("divide", 2));
  assert.equal(equation(solved), "x = 4");
  assert.equal(isSolved(solved), true);
  assert.equal(solved.history.length, 2);
});
test("level 4: remove a variable from both rooms, then weights", () => {
  const middle = committed(initialState(LEVELS[3]), act("remove", "posX", 1));
  assert.equal(equation(middle), "x + 3 = 7");
  const done = committed(middle, act("remove", "posOne", 3));
  assert.equal(equation(done), "x = 4");
  assert.equal(isSolved(done), true);
});
test("manual mode requires second room and records only one step", () => {
  const start = initialState(LEVELS[0]);
  const first = perform(start, act("remove", "posOne", 2), "manual", "left");
  assert.equal(first.ok, true);
  assert.equal(first.committed, false);
  assert.equal(first.state.history.length, 0);
  assert.equal(isSolved(first.state), false);
  assert.equal(balanceDifference(first.state), -2);
  assert.equal(visibleRooms(first.state).left.posOne, 0);
  assert.equal(visibleRooms(first.state).right.posOne, 5);
  const wrong = perform(first.state, act("remove", "posX", 1), "manual", "left");
  assert.equal(wrong.ok, false);
  const wrongKind = perform(first.state, act("remove", "posX", 1), "manual", "right");
  assert.equal(wrongKind.ok, false);
  const second = perform(first.state, act("remove", "posOne", 2), "manual", "right");
  assert.equal(second.ok, true);
  assert.equal(second.committed, true);
  assert.equal(second.state.history.length, 1);
  assert.equal(isSolved(second.state), true);
  assert.equal(balanceDifference(second.state), 0);
  assert.equal(second.state.history[0].mode, "manual");
});
test("undo cancels pending manual operation without committing", () => {
  const start = initialState(LEVELS[0]);
  const first = perform(start, act("remove", "posOne", 2), "manual", "right");
  assert.equal(equation(undo(first.state)), equation(start));
  assert.equal(undo(first.state).pending, null);
});
test("refuses invalid removal, fractional division and factor zero", () => {
  const start = initialState(LEVELS[0]);
  assert.equal(prepare(start, act("remove", "posX", 1)).ok, false);
  assert.match(prepare(start, factor("divide", 2)).reason, /fractions/i);
  assert.equal(prepare(start, factor("divide", 0)).ok, false);
  assert.equal(start.history.length, 0);
});
test("division by five groups all terms, not just the constant", () => {
  const level = {id:"five",solution:2,left:{posX:5,posOne:10},right:{posOne:20}};
  const next = committed(initialState(level), factor("divide", 5));
  assert.equal(equation(next), "x + 2 = 4");
  assert.equal(evaluate(next.left, 2), 4);
  assert.equal(evaluate(next.right, 2), 4);
});
test("multiplication copies the entire contents of both rooms", () => {
  const start = initialState(LEVELS[0]);
  const next = committed(start, factor("multiply", 2));
  assert.equal(equation(next), "2x + 4 = 10");
  assert.equal(balanceDifference(next), 0);
  assert.equal(undo(next).left.posX, 1);
});
test("adding object changes both sides equally", () => {
  const start = initialState(LEVELS[0]);
  const next = committed(start, act("add", "posOne", 2));
  assert.equal(equation(next), "x + 4 = 7");
  assert.equal(balanceDifference(next), 0);
});
test("black / white sprites cancel locally without changing algebra", () => {
  const value = {posX:3,negX:2,posOne:2,negOne:2};
  const n = normalize(value);
  assert.deepEqual(n.cancellations,{sprites:2,constants:2});
  assert.equal(expression(n.after),"x");
  assert.equal(evaluate(value,4),evaluate(n.after,4));
});
test("balloon lifting a weight is an exact zero pair", () => {
  const level = {id:"signed", solution:4,left:{posX:2,negOne:2},
    right:{posX:1,posOne:2}};
  const start = initialState(level);
  assert.equal(equation(start),"2x − 2 = x + 2");
  const first = committed(start, act("remove","posX",1));
  assert.equal(equation(first),"x − 2 = 2");
  const next = committed(first, act("add","posOne",2));
  assert.equal(isSolved(next),true);
  assert.equal(next.history[1].cancellations.left.constants,2);
  assert.equal(equation(next),"x = 4");
});
test("adding a white sprite cancels a black sprite; removing a balloon means subtracting negative one", () => {
  const start = initialState(LEVELS[0]);
  const next = committed(start,act("add","negX",1));
  assert.equal(next.left.posX,0);
  assert.equal(next.right.negX,1);
  assert.equal(next.history[0].cancellations.left.sprites,1);
  assert.equal(algebraOperation(act("remove","negOne",1)),"− (−1) on both sides");
  assert.match(operationDescription(factor("divide",5)),/5 equal groups/);
});
test("a failed second action cannot corrupt committed history", () => {
  const start = initialState(LEVELS[1]);
  const first = perform(start,factor("divide",3),"manual","right");
  assert.equal(first.ok,true);
  const bad = perform(first.state,factor("multiply",2),"manual","right");
  assert.equal(bad.ok,false);
  assert.equal(first.state.history.length,0);
  assert.equal(equation(undo(first.state)),equation(start));
});

test("divide records zero-pair normalisation before making groups", () => {
  const level = { id:"signed-groups", solution:3,
    left:{posX:3,negX:1,posOne:4,negOne:2}, right:{posOne:8} };
  const next = committed(initialState(level),factor("divide",2));
  assert.equal(equation(next),"x + 1 = 4");
  assert.equal(next.history[0].cancellations.left.sprites,1);
  assert.equal(next.history[0].cancellations.left.constants,2);
  assert.equal(balanceDifference(next),0);
});
