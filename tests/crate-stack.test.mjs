import test from "node:test";
import assert from "node:assert/strict";
import {room,initialState,perform,undo,evaluate} from "../src/engine.mjs";
import {crateMarkup} from "../src/group-crates.mjs";
import {WORLD1_LEVELS} from "../src/worlds.mjs";

const level=WORLD1_LEVELS[18].level;
function crateRoom(count=2){
  return room({crates:{count,contents:{posX:1,posOne:3}}});
}
test("two individually movable sealed crates form a vertical stack, with ONE picture",()=>{
  const html=crateMarkup(crateRoom());
  assert.equal((html.match(/class="token sealed-crate"/g)||[]).length,2);
  assert.equal((html.match(/class="crate-wood-face"/g)||[]).length,2);
  assert.equal((html.match(/class="crate-diagonal-brace"/g)||[]).length,2);
  assert.equal((html.match(/class="crate-picture-sign"/g)||[]).length,1);
  assert.equal((html.match(/class="crate-stack-count"/g)||[]).length,1);
  assert.equal((html.match(/class="crate-sign-sprite"/g)||[]).length,1);
  assert.equal((html.match(/class="crate-sign-weight"/g)||[]).length,3);
  assert.match(html,/>2 crates</);
  assert.doesNotMatch(html,/Each crate:|crate-contents-note|crate-name|x\s*\+\s*3/);
  assert.equal((html.match(/data-crate-index="/g)||[]).length,2);
  assert.match(html,/data-crate-index="0"/);
  assert.match(html,/data-crate-index="1"/);
});
test("the picture and count change dynamically for one or three sealed crates",()=>{
  for(const n of [1,2,3,4]){
    const html=crateMarkup(crateRoom(n));
    assert.equal((html.match(/class="token sealed-crate"/g)||[]).length,n);
    assert.equal((html.match(/class="crate-picture-sign"/g)||[]).length,1);
    assert.equal((html.match(/class="crate-stack-count"/g)||[]).length,1);
    assert.match(html,new RegExp(">"+n+" crates?<"));
    assert.equal((html.match(/class="crate-mini-sprite"/g)||[]).length,n,
      "Hidden physical inventory must remain one sprite PER crate");
    assert.equal((html.match(/class="crate-mini-weight"/g)||[]).length,3*n);
  }
});
test("hidden inventory remains separate from the hanging picture and never creates loose tokens",()=>{
  const html=crateMarkup(crateRoom(3));
  assert.equal((html.match(/class="crate-hidden-contents"/g)||[]).length,3);
  assert.doesNotMatch(html,/class="token sprite|class="token weight/);
  const s=initialState(level);
  assert.equal(evaluate(s.left,4),14);
  assert.equal(evaluate(s.right,4),14);
  const divided=perform(s,{op:"divide",factor:2});
  assert.equal(divided.ok,true);
  const one=crateMarkup(divided.state.left);
  assert.match(one,/>1 crate</);
  assert.equal((one.match(/class="crate-picture-sign"/g)||[]).length,1);
  assert.deepEqual(undo(divided.state),s);
});
