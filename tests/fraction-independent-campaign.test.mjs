import test from "node:test";
import assert from "node:assert/strict";
import {FRACTION_LEVEL_PLAN} from "../src/fraction-level-plan.mjs";
import {fractionMoveLowerBound} from "../src/fraction-campaign-levels.mjs";
import {findCampaignStage,isCampaignPlayable,nextCampaignLevel} from "../src/campaign-registry.mjs";
import {blankCampaignRecords,withCampaignCompleted,campaignStageRecord,campaignStars,campaignStarTotals,normalizeCampaignResume} from "../src/campaign-records.mjs";
import {initialState,perform,isSolved,visibleRooms,balanceDifference,undo,validInitialLevel} from "../src/engine.mjs";
import {rational as q,req} from "../src/rational.mjs";

test("all twenty Independent fraction levels are published with stable IDs, five chapters and certified optimal targets",()=>{
  const stage=findCampaignStage("fractions","independent");
  assert.equal(stage.available,true);
  assert.equal(stage.method,"manual");
  assert.equal(stage.chapters.length,5);
  assert.equal(stage.levels.length,20);
  assert.equal(new Set(stage.levels.map(s=>s.id)).size,20);
  for(const c of stage.chapters)assert.equal(stage.levels.filter(s=>s.chapterIndex===c.index).length,4);
  for(const slot of stage.levels){
    assert.equal(slot.id,"frac-i-"+String(slot.number).padStart(2,"0"));
    assert.equal(isCampaignPlayable("fractions","independent",slot.id),true);
    assert.equal(validInitialLevel(slot.level),true);
    assert.equal(Object.hasOwn(slot.level,"reference"),false);
    const ref=FRACTION_LEVEL_PLAN.find(l=>l.id===slot.id).reference;
    assert.equal(stage.optimalMoves[slot.id],fractionMoveLowerBound(slot.level));
    assert.equal(ref.length,stage.optimalMoves[slot.id]);
    // Every operation must be legal in either visit order. Alternate the
    // starting side and independently re-enter equivalent rational amounts.
    for(const reverse of [false,true]){
      const initial=initialState(slot.level);
      let state=initial;
      for(const [i,a] of ref.entries()){
        const first=(i%2===Number(reverse))?"left":"right";
        const other=first==="left"?"right":"left";
        const visit=perform(state,a,"manual",first);
        assert.equal(visit.ok,true,slot.id);
        assert.equal(visit.committed,false);
        assert.equal(visit.state.history.length,state.history.length);
        assert.equal(isSolved(visit.state),false);
        assert.notEqual(balanceDifference(visit.state).n,0);
        assert.deepEqual(visibleRooms(visit.state)[other],state[other]);
        assert.deepEqual(undo(visit.state),state);
        const same=a.count?{...a,count:{n:a.count.n*2,d:a.count.d*2}}:a;
        const match=perform(visit.state,same,"manual",other);
        assert.equal(match.ok,true,slot.id+" "+match.reason);
        assert.equal(match.committed,true);
        assert.equal(match.state.pending,null);
        assert.equal(match.state.history.length,state.history.length+1);
        assert.equal(req(balanceDifference(match.state),0),true);
        state=match.state;
      }
      assert.equal(isSolved(state),true,slot.id);
      assert.equal(state.history.length,stage.optimalMoves[slot.id]);
      while(state.history.length)state=undo(state);
      assert.deepEqual(state,initial);
    }
  }
  assert.equal(nextCampaignLevel("fractions","independent",20),null);
  assert.equal(isCampaignPlayable("fractions","notebook",1),true);
});

test("Independent completion awards stars only for completed moves and retains world and stage save isolation",()=>{
  const start=blankCampaignRecords();
  let state=withCampaignCompleted(start,"fractions","independent","frac-i-01",1);
  assert.deepEqual(campaignStageRecord(state,"fractions","independent").completed,["frac-i-01"]);
  assert.equal(campaignStageRecord(state,"fractions","independent").lastPlayed,"frac-i-02");
  assert.equal(campaignStars(state,"fractions","independent","frac-i-01"),3);
  assert.equal(campaignStars(state,"fractions","guided","frac-g-01"),0);
  assert.deepEqual(campaignStageRecord(state,"fractions","guided").completed,[]);
  assert.deepEqual(campaignStageRecord(state,"workshop","independent").completed,[]);
  assert.deepEqual(campaignStageRecord(state,"opposites","independent").completed,[]);
  assert.deepEqual(campaignStarTotals(state,{worldId:"fractions",stageId:"independent"}),{earned:3,available:60,completed:1,count:20});
  assert.deepEqual(campaignStarTotals(state,{worldId:"fractions"}),{earned:3,available:180,completed:1,count:60});
  assert.equal(campaignStarTotals(state).count,180);
  assert.equal(campaignStarTotals(state).available,540);
  assert.equal(normalizeCampaignResume({worldId:"fractions",stageId:"independent",levelId:"frac-i-02"}).levelId,"frac-i-02");
  assert.equal(normalizeCampaignResume({worldId:"fractions",stageId:"notebook",levelId:"unknown"}),null);
  assert.deepEqual(withCampaignCompleted(state,"fractions","notebook","unknown",1),state);
});
