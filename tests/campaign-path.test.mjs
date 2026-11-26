import test from "node:test";
import assert from "node:assert/strict";
import {CAMPAIGN_REGISTRY} from "../src/campaign-registry.mjs";
import {campaignMenuScreen,campaignHomeLabel} from "../src/navigation-journey.mjs";
test("a level board needs an available world and an available learning method",()=>{
  assert.equal(campaignMenuScreen("levels",null,null),"worlds");
  assert.equal(campaignMenuScreen("stages",null,null),"worlds");
  for(const world of CAMPAIGN_REGISTRY){
    assert.equal(campaignMenuScreen("stages",world,null),"stages");
    assert.equal(campaignMenuScreen("levels",world,null),"stages");
    assert.equal(campaignMenuScreen("levels",world,{id:"invalid",available:true}),"stages");
    for(const stage of world.stages)assert.equal(campaignMenuScreen("levels",world,stage),"levels");
    assert.equal(campaignMenuScreen("levels",{...world,available:false},world.stages[0]),"worlds");
    assert.equal(campaignMenuScreen("levels",world,{...world.stages[0],available:false}),"stages");
  }
  assert.equal(campaignMenuScreen("workshop",null,null),"workshop");
  assert.equal(campaignMenuScreen("atelier",null,null),"atelier");
});
test("resume shortcut names the actual world, method and level",()=>{
  const [balance,opposites,fractions,squares]=CAMPAIGN_REGISTRY;
  assert.equal(campaignHomeLabel(balance,balance.stages[0],1),"Continue: Balance · Guided · Level 1 →");
  assert.equal(campaignHomeLabel(opposites,opposites.stages[1],7,true),"Replay: Opposites · Independent · Level 7 →");
  assert.equal(campaignHomeLabel(fractions,fractions.stages[2],9),"Continue: Fractions · Algebra Apprentice · Level 9 →");
  assert.equal(campaignHomeLabel(squares,squares.stages[0],24),"Continue: Squares · Guided · Level 24 →");
});
