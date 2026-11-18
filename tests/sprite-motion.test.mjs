import test from "node:test";
import assert from "node:assert/strict";
import { spriteMotionProfile, spriteMotionStyle } from "../src/sprite-motion.mjs";

test("sprite motion is deterministic for the same experiment, room and sprite", () => {
  const a = spriteMotionProfile("resident", "left", "posX", 0);
  const b = spriteMotionProfile("resident", "left", "posX", 0);
  assert.deepEqual(a, b);
  assert.equal(spriteMotionStyle(a), spriteMotionStyle(b));
});
test("multiple sprites have distinct hop timings and eye events", () => {
  const profiles = Array.from({ length: 12 }, (_, i) =>
    spriteMotionProfile("across", "left", "posX", i));
  assert.ok(new Set(profiles.map(x => x.hopMs + ":" + x.hopDelayMs)).size >= 10);
  assert.ok(new Set(profiles.map(x => x.wiggleMs + ":" + x.wiggleDelayMs)).size >= 10);
  assert.ok(new Set(profiles.map(x => x.blinkMs + ":" + x.blinkDelayMs)).size >= 10);
  assert.ok(new Set(profiles.map(x => x.lookMs + ":" + x.lookDelayMs)).size >= 10);
});
test("two rooms and different levels have independent phases", () => {
  const a = spriteMotionProfile("across", "left", "posX", 0);
  const b = spriteMotionProfile("across", "right", "posX", 0);
  const c = spriteMotionProfile("five-baskets", "left", "posX", 0);
  const d = spriteMotionProfile("across", "left", "negX", 0);
  assert.notDeepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.notDeepEqual(a, d);
});
test("restless but bounded motion does not physically displace the balance", () => {
  for (let i = 0; i < 50; i++) {
    const p = spriteMotionProfile("across", "left", "posX", i);
    assert.ok(p.hopMs >= 1380 && p.hopMs <= 1819);
    assert.ok(p.hopPx >= 32 && p.hopPx <= 44);
    assert.ok(p.hopDelayMs <= 0 && p.hopDelayMs > -p.hopMs);
    assert.ok(p.wiggleMs >= 820 && p.wiggleMs <= 1339);
    assert.ok(p.blinkMs >= 4600 && p.blinkMs <= 7999);
    assert.ok(p.lookMs >= 3200 && p.lookMs <= 5499);
    assert.ok(p.leftWiggleDeg <= -3 && p.rightWiggleDeg >= 4);
    assert.equal(p.halfwayPx, -Math.round(p.hopPx * .55));
  }
});
test("motion style uses numeric, safe CSS custom properties", () => {
  const p = spriteMotionProfile("resident", "left", "posX", 0);
  const style = spriteMotionStyle(p);
  for (const property of [
    "--hop-period:", "--hop-delay:", "--hop-height:", "--hop-half:",
    "--wiggle-period:", "--wiggle-delay:", "--wiggle-left:",
    "--wiggle-right:", "--blink-period:", "--blink-delay:",
    "--look-period:", "--look-delay:"
  ]) assert.ok(style.includes(property));
  assert.match(style, /--hop-height:-\d+px/);
  assert.doesNotMatch(style, /[<>]|NaN|undefined/);
});
test("invalid creature identities cannot generate motion styles", () => {
  for (const args of [
    ["", "left", "posX", 0], ["resident", "", "posX", 0],
    ["resident", "left", "posOne", 0],
    ["resident", "left", "posX", -1],
    ["resident", "left", "posX", 1.5]
  ]) assert.throws(() => spriteMotionProfile(...args), TypeError);
});
