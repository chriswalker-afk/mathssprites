import test from "node:test";
import assert from "node:assert/strict";
import {CAMPAIGN_REGISTRY} from "../src/campaign-registry.mjs";
import {quickBoardDestination} from "../src/navigation-journey.mjs";
import {usesPhysicalFirstLesson,routeGuideSeen,setRouteGuideSeen,resetFirstVisitGuides,routeGuideCues} from "../src/route-guide.mjs";
import {readGuideSeen,readIndependentGuideSeen} from "../src/onboarding.mjs";
import {readOppositesGuideSeen} from "../src/opposite-onboarding.mjs";
test("quick switch keeps the learning method across all available worlds",()=>{
  for(const source of CAMPAIGN_REGISTRY)for(const stage of source.stages)
    for(const destination of CAMPAIGN_REGISTRY)
      assert.equal(quickBoardDestination(destination,stage)?.method,stage.method);
  assert.equal(quickBoardDestination({available:true,stages:[{id:"guided",method:"auto",available:true}]},{id:"notebook",method:"notebook"}),null);
  assert.equal(quickBoardDestination({available:false,stages:[]},{id:"guided",method:"auto"}),null);
});
test("all twelve route guides have independent seen states and reset preserves non-guide data",()=>{
  const map=new Map([["mathssprites.campaign.v2","saved-progress"],["mathssprites.resume.v2","saved-resume"]]);
  const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
  for(const world of CAMPAIGN_REGISTRY)for(const stage of world.stages){
    assert.equal(routeGuideSeen(world.id,stage.id,storage),false);
    setRouteGuideSeen(world.id,stage.id,true,storage);
    assert.equal(routeGuideSeen(world.id,stage.id,storage),true);
    const cues=routeGuideCues(world.id,stage.id);
    assert.equal(cues.length,3);
    assert.ok(cues.every(c=>c.title&&c.text));
    assert.equal(usesPhysicalFirstLesson(world.id,stage.id,1),
      ["workshop","opposites"].includes(world.id)&&stage.id!=="notebook");
    assert.equal(usesPhysicalFirstLesson(world.id,stage.id,8),false);
  }
  assert.ok(readGuideSeen(storage)&&readIndependentGuideSeen(storage)&&readOppositesGuideSeen("guided",storage)&&readOppositesGuideSeen("independent",storage));
  resetFirstVisitGuides(CAMPAIGN_REGISTRY,storage);
  for(const world of CAMPAIGN_REGISTRY)for(const stage of world.stages)
    assert.equal(routeGuideSeen(world.id,stage.id,storage),false);
  assert.equal(map.get("mathssprites.campaign.v2"),"saved-progress");
  assert.equal(map.get("mathssprites.resume.v2"),"saved-resume");
});
test("guide preferences safely degrade with blocked storage",()=>{
  const storage={getItem(){throw Error("blocked")},setItem(){throw Error("blocked")}};
  for(const world of CAMPAIGN_REGISTRY)for(const stage of world.stages){
    assert.equal(routeGuideSeen(world.id,stage.id,storage),false);
    assert.equal(setRouteGuideSeen(world.id,stage.id,true,storage),true);
  }
  assert.doesNotThrow(()=>resetFirstVisitGuides(CAMPAIGN_REGISTRY,storage));
});
