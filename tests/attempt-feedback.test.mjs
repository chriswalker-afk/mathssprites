import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVELS, initialState, perform, prepare, previewRoomAction, undo, equation,
  balanceDifference, visibleRooms, evaluate
} from "../src/engine.mjs";
import {
  fractionDisplay, attemptMessage, mismatchedMoveMessage, shortMove
} from "../src/attempt-feedback.mjs";

test("a failed division returns exact non-whole basket data without changing any token", () => {
  const room = { posX: 3 };
  const failure = previewRoomAction(room, { op:"divide", factor:2 });
  assert.equal(failure.ok,false);
  assert.deepEqual({
    code:failure.code,kind:failure.kind,count:failure.count,
    factor:failure.factor,whole:failure.whole,remainder:failure.remainder
  },{code:"fraction",kind:"posX",count:3,factor:2,whole:1,remainder:1});
  assert.equal(room.posX,3);
  assert.deepEqual(fractionDisplay(failure),{
    baskets:2, whole:1,numerator:1,denominator:2,portion:50,
    kind:"posX",parts:[0,1]
  });
  assert.match(attemptMessage(failure,{op:"divide",factor:2}),/1\/2 of a sprite/);
  assert.match(attemptMessage(failure,{op:"divide",factor:2}),/undo/);
});

test("fractional weight groups are presented just as honestly as sprites", () => {
  const problem=previewRoomAction({posOne:5},{op:"divide",factor:2});
  assert.equal(problem.code,"fraction");
  assert.equal(problem.kind,"posOne");
  assert.equal(problem.whole,2);
  assert.equal(problem.remainder,1);
  assert.match(attemptMessage(problem,{op:"divide",factor:2},"right"),/1\/2 of a weight/);
  const thirds=previewRoomAction({posX2:2},{op:"divide",factor:3});
  assert.equal(thirds.code,"fraction");
  assert.equal(fractionDisplay(thirds).portion,67);
  assert.equal(fractionDisplay(thirds).denominator,3);
  assert.equal(fractionDisplay(thirds).numerator,2);
});

test("overflow reports real projected object count, not a generic refusal", () => {
  const source={posOne:47};
  const failure=previewRoomAction(source,{op:"add",kind:"posOne",count:3});
  assert.equal(failure.ok,false);
  assert.equal(failure.code,"overflow");
  assert.deepEqual([failure.total,failure.capacity,failure.excess],[50,48,2]);
  assert.equal(source.posOne,47);
  assert.match(attemptMessage(failure,{op:"add",kind:"posOne",count:3}),/50 objects/);
  assert.match(attemptMessage(failure,{op:"add",kind:"posOne",count:3}),/tumbling/);
  const doubling=previewRoomAction({posX:25},{op:"multiply",factor:2});
  assert.equal(doubling.code,"overflow");
  assert.equal(doubling.total,50);
});

test("missing objects and unsupported squares also produce reversible teaching explanations", () => {
  const missing=previewRoomAction({posX:1},{op:"remove",kind:"posX",count:2});
  assert.equal(missing.code,"missing");
  assert.equal(missing.available,1);
  assert.equal(missing.needed,2);
  assert.match(attemptMessage(missing,{op:"remove",kind:"posX",count:2}),/can't pick up 2/);
  const mixed=previewRoomAction({posX:1,posOne:2},{op:"square"});
  assert.equal(mixed.code,"unsupported-area");
  assert.match(attemptMessage(mixed,{op:"square"}),/mixed rooms/);
  assert.match(attemptMessage(mixed,{op:"square"}),/undo/);
});

test("guided-mode validation identifies the specific failing chamber", () => {
  const state=initialState({id:"overflow-east",solution:0,
    left:{posOne:1},right:{posOne:47}});
  const result=prepare(state,{op:"add",kind:"posOne",count:2});
  assert.equal(result.ok,false);
  assert.equal(result.side,"right");
  assert.equal(result.code,"overflow");
  assert.equal(state.history.length,0);
});

test("different manual actions are rejected without committing or changing the first move", () => {
  const start=initialState(LEVELS[0]);
  const first=perform(start,{op:"remove",kind:"posOne",count:2},"manual","left");
  assert.equal(first.ok,true);
  assert.equal(first.state.history.length,0);
  assert.equal(first.state.pending.first,"left");
  const different=perform(first.state,{op:"add",kind:"posOne",count:1},"manual","right");
  assert.equal(different.ok,false);
  assert.equal(different.code,"mismatch");
  assert.equal(first.state.history.length,0);
  assert.equal(equation(first.state),equation(start));
  assert.equal(balanceDifference(first.state),-2);
  const visualSecond=previewRoomAction(start.right,{op:"add",kind:"posOne",count:1});
  assert.equal(visualSecond.ok,true);
  const proposed={left:visibleRooms(first.state).left,right:visualSecond.after};
  assert.equal(evaluate(proposed.left,start.solution)-evaluate(proposed.right,start.solution),-3);
  assert.equal(equation(undo(first.state)),equation(start));
  assert.equal(undo(first.state).history.length,0);
});

test("misleading visual tipping is avoided for mathematically equivalent different moves", () => {
  assert.match(mismatchedMoveMessage(
    {op:"add",kind:"posOne",count:1},
    {op:"remove",kind:"negOne",count:1},
    "left",0),/balance stays level/);
  assert.match(mismatchedMoveMessage(
    {op:"remove",kind:"posOne",count:2},
    {op:"add",kind:"posOne",count:1},
    "left",-3),/scale tips/);
  assert.match(mismatchedMoveMessage(
    {op:"remove",kind:"posOne",count:2},
    {op:"add",kind:"posOne",count:1},
    "left",-3),/undo both moves/);
  assert.equal(shortMove({op:"square"}),"squared the entire room");
});

test("a rejected attempt cannot alter Undo, the current equation or replay history", () => {
  const start=initialState(LEVELS[4]);
  const before=JSON.stringify(start);
  const failed=perform(start,{op:"divide",factor:3},"auto");
  assert.equal(failed.ok,false);
  assert.equal(failed.code,"fraction");
  assert.equal(JSON.stringify(start),before);
  assert.equal(start.history.length,0);
  assert.equal(equation(start),"5x + 10 = 20");
  assert.equal(undo(start),start);
});

test("fractionDisplay refuses invalid slice ratios rather than drawing misleading pieces", () => {
  assert.equal(fractionDisplay({code:"missing"}),null);
  assert.equal(fractionDisplay({code:"fraction",factor:2,remainder:0}),null);
  assert.equal(fractionDisplay({code:"fraction",factor:3,remainder:3}),null);
});
