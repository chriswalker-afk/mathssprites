import test from "node:test";
import assert from "node:assert/strict";
import {
  SPRITE_HAND_REACTION_CHANCES, pickSpriteHandReaction, dodgeOffsetPx
} from "../src/sprite-reactions.mjs";
import { LEVELS, initialState, perform, balanceDifference, equation } from "../src/engine.mjs";

const removeSprite = Object.freeze({ op: "remove", kind: "posX", count: 1 });

test("the occasional reactions include duck, dodge and no reaction", () => {
  assert.equal(pickSpriteHandReaction(removeSprite, 0), "duck");
  assert.equal(pickSpriteHandReaction(removeSprite, 0.27), "duck");
  assert.equal(pickSpriteHandReaction(removeSprite, 0.28), "dodge");
  assert.equal(pickSpriteHandReaction(removeSprite, 0.5), "dodge");
  assert.equal(pickSpriteHandReaction(removeSprite, 0.55), null);
  assert.equal(pickSpriteHandReaction(removeSprite, 0.99), null);
  assert.equal(SPRITE_HAND_REACTION_CHANCES.dodge, 0.55);
});
test("reactions happen only when taking away a whole living sprite", () => {
  for (const op of ["add", "multiply", "divide"])
    assert.equal(pickSpriteHandReaction({ op, kind: "posX", count: 1 }, 0), null);
  for (const kind of ["posOne", "negOne"])
    assert.equal(pickSpriteHandReaction({ op: "remove", kind, count: 1 }, 0), null);
  assert.equal(pickSpriteHandReaction({ op: "remove", kind: "negX", count: 1 }, 0.32), "dodge");
  assert.equal(pickSpriteHandReaction({ op: "remove", kind: "posX", count: 0 }, 0), null);
  assert.equal(pickSpriteHandReaction(null, 0), null);
});
test("reaction chooser validates sampled probabilities", () => {
  for (const value of [-1, 1, NaN, Infinity, undefined, "0.1"])
    assert.throws(() => pickSpriteHandReaction(removeSprite, value), RangeError);
});
test("dodging is always toward the middle of the room", () => {
  assert.equal(dodgeOffsetPx(200, 300), 20);
  assert.equal(dodgeOffsetPx(400, 300), -20);
  assert.equal(dodgeOffsetPx(300, 300), -20);
  assert.throws(() => dodgeOffsetPx(NaN, 5), TypeError);
});
test("a reaction does not modify the action or the mathematical result", () => {
  const original = JSON.stringify(removeSprite);
  const start = initialState(LEVELS[3]);
  for (const roll of [0.11, 0.4, 0.9]) {
    const reaction = pickSpriteHandReaction(removeSprite, roll);
    const result = perform(start, removeSprite, "auto");
    assert.equal(result.ok, true);
    assert.equal(equation(result.state), "x + 3 = 7");
    assert.equal(balanceDifference(result.state), 0);
    assert.equal(result.state.history.length, 1);
    assert.equal(JSON.stringify(removeSprite), original);
    assert.ok(reaction === null || reaction === "duck" || reaction === "dodge");
  }
});
