import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/scene-polish.css",import.meta.url),"utf8");
const app=readFileSync(new URL("../src/app.mjs",import.meta.url),"utf8");

test("scene no longer contains unnecessary lab lettering, roof props, or visible idle narration",()=>{
  assert.doesNotMatch(html,/THE BALANCE CHAMBERS|LAB № 04|room-roof|roof-line/);
  assert.doesNotMatch(html,/class="scene-caption"/);
  assert.doesNotMatch(app,/Two rooms\. One perfectly balanced mystery/);
  assert.match(html,/<div id="balance-caption" class="scene-status-visually-hidden" role="status" aria-live="polite"><\/div>/);
  assert.match(css,/\.scene-status-visually-hidden/);
  assert.match(css,/\.playfield::before\{content:none/);
});

test("sprite branding uses the full playable creature rather than a flat pair of eyes",()=>{
  const mascots=html.match(/class="brand-sprite-actor token sprite sprite-black"/g)||[];
  assert.equal(mascots.length,2); // portal + gameplay
  assert.equal((html.match(/class="sprite-motion"/g)||[]).length>=2,true);
  assert.equal((html.match(/class="sprite-body"/g)||[]).length>=2,true);
  assert.match(html,/<button[^>]*id="game-brand-home"[^>]*aria-label="Return to Maths Sprites home"/);
  assert.match(app,/\$\("game-brand-home"\)\.disabled = busy/);
  assert.match(app,/\$\("game-brand-home"\)\.addEventListener\("click", \(\) => leaveGame\("home"\)\)/);
});

test("removed decorative roof is replaced with height-equivalent chamber spacing across viewports",()=>{
  assert.match(css,/\.playfield \.chamber\{padding-top:30px\}/);
  assert.match(css,/@media \(max-width:800px\)\{\.playfield \.chamber\{padding-top:20px\}\}/);
  assert.match(css,/@media \(max-width:600px\)\{\.playfield \.chamber\{padding-top:15px\}\}/);
  assert.match(css,/\.playfield \.chamber\{padding-top:19px\}/);
  assert.doesNotMatch(css,/\.scale-beam\s*\{[^}]*transform:/);
  assert.doesNotMatch(css,/#scene\s*\{[^}]*transform:/);
});
