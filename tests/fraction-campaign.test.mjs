import test from "node:test";
import assert from "node:assert/strict";
import {FRACTION_LEVEL_PLAN} from "../src/fraction-level-plan.mjs";
import {FRACTION_CAMPAIGN_STAGES,fractionMoveLowerBound,fractionScalingLowerBound} from "../src/fraction-campaign-levels.mjs";
import {findCampaignWorld,findCampaignStage,findCampaignLevel,isCampaignPlayable,nextCampaignLevel} from "../src/campaign-registry.mjs";
import {blankCampaignRecords,withCampaignCompleted,campaignStageRecord,campaignStars,campaignStarTotals,normalizeCampaignResume} from "../src/campaign-records.mjs";
import {initialState,perform,isSolved,validInitialLevel} from "../src/engine.mjs";
import {fractionEquationMarkup,fractionOperationMarkup,fractionComicMarkup} from "../src/fraction-campaign.mjs";
import {rational as q} from "../src/rational.mjs";

test("World 3 exposes Guided and Independent puzzles and locks Apprentice",()=>{
  const world=findCampaignWorld("fractions");
  assert.equal(world.available,true);
  assert.deepEqual(world.stages.map(s=>s.available),[true,true,false]);
  assert.deepEqual(world.stages.map(s=>s.levels.length),[24,20,16]);
  const stage=findCampaignStage("fractions","guided");
  assert.equal(stage.chapters.length,6);
  for(const chapter of stage.chapters)assert.equal(stage.levels.filter(s=>s.chapterIndex===chapter.index).length,4);
  assert.equal(new Set(stage.levels.map(s=>s.id)).size,24);
  for(const slot of stage.levels){
    assert.equal(isCampaignPlayable("fractions","guided",slot.id),true);
    assert.equal(validInitialLevel(slot.level),true);
    assert.equal(slot.level.quantityMode,"fractions");
    assert.equal(Object.hasOwn(slot.level,"reference"),false);
  }
  assert.equal(isCampaignPlayable("fractions","independent",1),true);
  assert.equal(isCampaignPlayable("fractions","notebook",1),false);
  assert.equal(nextCampaignLevel("fractions","guided",1).number,2);
  assert.equal(nextCampaignLevel("fractions","guided",24),null);
});
test("all Guided optimal targets have an independent algebraic lower bound attained by a legal exact route",()=>{
  const stage=findCampaignStage("fractions","guided");
  assert.equal(fractionScalingLowerBound(q(5,12)),3);
  assert.equal(fractionScalingLowerBound(q(1,8)),2);
  assert.equal(fractionScalingLowerBound(q(4)),1);
  assert.throws(()=>fractionScalingLowerBound(q(1,7)));
  for(const slot of stage.levels){
    const plan=FRACTION_LEVEL_PLAN.find(l=>l.id===slot.id);
    const lower=fractionMoveLowerBound(slot.level);
    assert.ok(lower>=1,slot.id);
    assert.equal(stage.optimalMoves[slot.id],lower);
    assert.equal(plan.reference.length,lower,slot.id);
    let state=initialState(slot.level);
    assert.equal(isSolved(state),false);
    for(const action of plan.reference){
      const result=perform(state,action);
      assert.equal(result.ok,true,slot.id+" "+result.reason);state=result.state;
    }
    assert.equal(isSolved(state),true,slot.id);
    assert.equal(state.history.length,lower);
  }
});
test("World 3 completion, stars and resume are isolated from old worlds and future stages",()=>{
  const first=findCampaignLevel("fractions","guided",1);
  const second=findCampaignLevel("fractions","guided",2);
  let data=blankCampaignRecords();
  data=withCampaignCompleted(data,"fractions","guided",first.id,1);
  assert.deepEqual(campaignStageRecord(data,"fractions","guided").completed,[first.id]);
  assert.equal(campaignStageRecord(data,"fractions","guided").lastPlayed,second.id);
  assert.equal(campaignStars(data,"fractions","guided",first.id),3);
  assert.deepEqual(campaignStarTotals(data,{worldId:"fractions"}),{earned:3,available:132,completed:1,count:44});
  assert.equal(campaignStarTotals(data).available,492);
  assert.deepEqual(campaignStageRecord(data,"workshop","guided").completed,[]);
  assert.deepEqual(campaignStageRecord(data,"opposites","guided").completed,[]);
  assert.equal(normalizeCampaignResume({worldId:"fractions",stageId:"guided",levelId:second.id}).levelId,second.id);
  assert.equal(normalizeCampaignResume({worldId:"fractions",stageId:"notebook",levelId:"frac-a-01"}),null);
  assert.deepEqual(withCampaignCompleted(data,"fractions","notebook","frac-a-01",1),data);
});
test("fraction comic replay shows exact before/after artwork and MathML rather than rounded decimals",()=>{
  const slot=findCampaignLevel("fractions","guided",1);
  const result=perform(initialState(slot.level),{op:"divide",factor:2});
  const tx=result.state.history[0];
  assert.match(fractionEquationMarkup(tx.after),/<mfrac><mn>5<\/mn><mn>2<\/mn><\/mfrac>/);
  assert.match(fractionOperationMarkup(tx.action),/<mo>÷<\/mo><mn>2<\/mn>/);
  const comic=fractionComicMarkup(tx,0);
  assert.match(comic,/Before/);assert.match(comic,/After/);
  assert.match(comic,/5\/2 weights/);
  assert.match(comic,/on both rooms/);
});
