import test from "node:test";
import assert from "node:assert/strict";
import {worldChoiceIntro,methodChoiceIntro} from "../src/menu-copy.mjs";
import {CAMPAIGN_REGISTRY} from "../src/campaign-registry.mjs";
test("each menu choice has short, meaningful concept-led copy",()=>{
  for(const world of CAMPAIGN_REGISTRY){
    assert.ok(worldChoiceIntro(world).length>0&&worldChoiceIntro(world).length<80);
    for(const stage of world.stages)assert.ok(methodChoiceIntro(stage).length>0&&methodChoiceIntro(stage).length<80);
  }
  assert.match(methodChoiceIntro({method:"auto"}),/mirrors/);
  assert.match(methodChoiceIntro({method:"manual"}),/each side/);
  assert.match(methodChoiceIntro({method:"notebook"}),/editor/);
  assert.equal(worldChoiceIntro({id:"future",description:"New world"}),"New world");
});
