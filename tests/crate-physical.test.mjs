import test from "node:test";
import assert from "node:assert/strict";
import {
  crateFloorLandingPlan,spriteEscapeKeyframes,weightEscapeKeyframes
} from "../src/crate-physical-layout.mjs";
import {crateExpansionPlan} from "../src/crate-expansion.mjs";
import {WORLD1_LEVELS} from "../src/worlds.mjs";
import {initialState,perform,undo,evaluate} from "../src/engine.mjs";
import {crateMarkup} from "../src/group-crates.mjs";

const level=WORLD1_LEVELS[18].level;
test("Sealed Crates retains original identity, three-step solution and no student algebra instructions",()=>{
  assert.equal(level.id,"master-19");
  assert.equal(level.title,"Sealed Crates");
  assert.doesNotMatch(level.prompt,/bracket|expand|transparent|2x|equation/i);
  assert.doesNotMatch(level.suggested,/bracket|expand|transparent|2x|equation/i);
  assert.equal(level.solution,4);
  let state=initialState(level);
  for(const action of [
    {op:"divide",factor:2},{op:"unpack",side:"left"},
    {op:"remove",kind:"posOne",count:3}
  ]){
    const r=perform(state,action);assert.equal(r.ok,true,r.reason);
    state=r.state;
  }
  assert.equal(state.history.length,3);
  assert.deepEqual(undo(undo(undo(state))),initialState(level));
});
test("the physical storyboard opens every lid, then sprites together, then panels and weights",()=>{
  const plan=crateExpansionPlan(initialState(level).left);
  assert.deepEqual(plan.physicalPhases.map(s=>s.phase),[
    "open","open","sprites-bouncing","sprites-landed",
    "panels-falling","weights-revealed",
    "weights-tumbling","weights-tumbling","settle"
  ]);
  assert.deepEqual(plan.physicalPhases.filter(s=>s.phase==="weights-tumbling")
    .map(s=>s.count),[3,3]);
  assert.equal(plan.totalSprites,2);
  assert.equal(plan.totalWeights,6);
  const before=initialState(level);
  assert.equal(evaluate(before.left,4),evaluate(before.right,4));
});
test("divide-first produces the same shorter physical sequence with one sprite and three weights",()=>{
  const first=perform(initialState(level),{op:"divide",factor:2});
  assert.equal(first.ok,true);
  const plan=crateExpansionPlan(first.state.left);
  assert.deepEqual(plan.physicalPhases.map(s=>s.phase),[
    "open","sprites-bouncing","sprites-landed","panels-falling",
    "weights-revealed","weights-tumbling","settle"
  ]);
  assert.equal(plan.totalSprites,1);
  assert.equal(plan.totalWeights,3);
});
test("each sealed crate has a genuinely hinged front, two side panels, and a separate hidden weight bay",()=>{
  const html=crateMarkup(initialState(level).left);
  assert.equal((html.match(/class="crate-wood-face"/g)||[]).length,2);
  assert.equal((html.match(/class="crate-side-panel crate-side-left"/g)||[]).length,2);
  assert.equal((html.match(/class="crate-side-panel crate-side-right"/g)||[]).length,2);
  assert.equal((html.match(/class="crate-weight-bay"/g)||[]).length,2);
  assert.equal((html.match(/class="crate-bay-weight"/g)||[]).length,6);
  assert.equal((html.match(/class="crate-picture-sign"/g)||[]).length,1);
  assert.equal((html.match(/class="crate-stack-count"/g)||[]).length,1);
  assert.doesNotMatch(html,/transparent|brackets|x\s*\+\s*3/i);
});
test("floor landing positions stay inside the real chamber for short phone and large monitor widths",()=>{
  for(const width of [112,170,245,340,620]){
    const plan=crateFloorLandingPlan(width,198,2,6);
    assert.equal(plan.slots.length,8);
    assert.ok(plan.scale>0&&plan.scale<=1);
    for(const slot of plan.slots){
      assert.ok(slot.left>=0);
      assert.ok(slot.left+slot.width<=width+0.01,
        "actor must fit inside chamber width "+width);
      assert.ok(slot.top+slot.height<=198+0.01,"actor must land on actual floor");
    }
    assert.deepEqual(plan.slots.map(s=>s.kind),
      ["sprite","sprite","weight","weight","weight","weight","weight","weight"]);
  }
});
test("bounce paths land exactly on the floor, and reduced-motion still has a beginning and end",()=>{
  for(const path of [
    spriteEscapeKeyframes(20,-77,0),
    spriteEscapeKeyframes(-30,-122,1),
    weightEscapeKeyframes(16,-60,2),
    spriteEscapeKeyframes(10,-44,0,true),
    weightEscapeKeyframes(-10,-55,0,true)
  ]){
    assert.ok(path.length>=2);
    assert.match(path[0].transform,/translate/);
    assert.match(path.at(-1).transform,/translate\(0px,0px\)/);
    assert.equal(path.at(-1).opacity,1);
  }
});
