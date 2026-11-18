import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LEVELS } from "../src/engine.mjs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/app.mjs", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("every static DOM id referenced by the game exists in index.html", () => {
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
  const refs = new Set([...app.matchAll(/\$\("([^"]+)"\)/g)].map(m => m[1]));
  for (const ref of refs) {
    if (ref === "watch-again") continue; // This is created after a puzzle is solved.
    assert.ok(ids.has(ref), "Missing element #" + ref);
  }
});
test("the game supports two hand modes and four operation choices", () => {
  for (const op of ["remove", "add", "divide", "multiply"])
    assert.match(html, new RegExp('data-operation="' + op + '"'));
  assert.match(html, /value="auto"/);
  assert.match(html, /value="manual"/);
  assert.match(app, /manualMove\("left"\)/);
  assert.match(app, /manualMove\("right"\)/);
});
test("algebra notebook starts hidden and appears only on a solved state", () => {
  assert.match(html, /id="replay-backdrop" hidden/);
  assert.match(app, /if \(!isSolved\(state\)\) return;/);
  assert.match(html, /id="comic-panels"/);
  assert.match(html, /id="pencil-lines"/);
  assert.match(html, /id="pencil"/);
});
test("the room visuals have grouping, hand and responsive style rules", () => {
  for (const selector of [".group-basket", ".basket-row", ".giant-hand", ".mini-stage",
    ".sprite", ".sprite-white", ".balloon", ".paper-line", ".needs-match"])
    assert.ok(css.includes(selector), "Missing " + selector);
  // The user can explicitly switch Motion back on even if the OS suggests
  // reduced motion; CSS must not permanently suppress that choice.
  assert.match(app, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.reduce-motion/);
  assert.doesNotMatch(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /max-width:600px/);
});
test("fifth level really exercises a divide-by-five followed by subtraction", () => {
  assert.equal(LEVELS.length, 5);
  assert.equal(LEVELS[4].left.posX, 5);
  assert.equal(LEVELS[4].left.posOne, 10);
  assert.equal(LEVELS[4].right.posOne, 20);
  assert.match(app, /levelIndex === 4 \? 5/);
});
test("browser imports are local and the prototype has no external runtime dependencies", () => {
  assert.match(html, /src="\.\/src\/app\.mjs"/);
  assert.match(html, /href="\.\/src\/styles\.css"/);
  assert.doesNotMatch(html, /https?:\/\//);
  assert.match(app, /from "\.\/engine\.mjs"/);
});

test("hand performs scene changes at contact, before retracting or revealing the replay", () => {
  assert.match(html, /id="hand-cargo"/);
  assert.match(html, /id="action-caption"/);
  assert.match(app, /async function handAct\(/);
  assert.match(app, /hand\.classList\.add\("reaching"\)/);
  assert.match(app, /hand\.classList\.add\("grasping"\)/);
  assert.match(app, /applyAtContact\(\)/);
  assert.match(app, /hand\.classList\.remove\("grasping", "reaching"\)/);
  assert.match(app, /await handAct\("left"/);
  assert.match(app, /await handAct\("right"/);
  assert.match(app, /await sleep\(reducedMotion \? 1100 : 1800\)/);
  assert.match(css, /\.giant-hand\.reaching/);
  assert.match(css, /\.hand-cargo/);
});
test("idle sprite motion is strong and persistent across unrelated room renders", () => {
  assert.match(css, /@keyframes sprite-hop/);
  assert.match(css, /translateY\(var\(--hop-height/);
  assert.match(css, /@keyframes sprite-wiggle/);
  assert.match(css, /@keyframes sprite-blink/);
  assert.match(css, /@keyframes sprite-look/);
  assert.match(css, /\.hand-target \.sprite-motion/);
  assert.match(app, /node\.dataset\.signature === signature/);
  assert.match(app, /style\.setProperty\("--hand-reach"/);
});
