import test from "node:test";
import assert from "node:assert/strict";
import {SQUARE_LEVEL_PLAN} from "../src/square-level-plan.mjs";
import {SQUARE_CAMPAIGN_STAGES} from "../src/square-campaign-levels.mjs";
import {SQUARE_GUIDED_OPTIMAL_MOVES} from "../src/square-star-benchmarks.mjs";
import {CAMPAIGN_REGISTRY,findCampaignWorld,findCampaignStage,findCampaignLevel,isCampaignPlayable,nextCampaignLevel} from "../src/campaign-registry.mjs";
import {initialState,perform,isSolved,undo,balanceDifference,validInitialLevel} from "../src/engine.mjs";
import {shortestSquareRoute} from "../scripts/square-shortest-routes.mjs";
import {blankCampaignRecords,campaignStarTotals,campaignStageRecord,campaignStars,withCampaignCompleted,withCampaignLastPlayed,campaignOptimalMoves,normalizeCampaignRecords,normalizeCampaignResume,stageResumeLevel,saveCampaignRecords,loadCampaignRecords,saveCampaignResume,loadCampaignResume} from "../src/campaign-records.mjs";

test("World 4 publishes exactly 24 Guided slots with six chapters and stable IDs, alongside Independent and Apprentice",()=>{
  const world=findCampaignWorld("squares");
  assert.equal(world.available,true);
  assert.deepEqual(world.stages.map(s=>[s.id,s.available,s.count]),[["guided",true,24],["independent",true,20],["notebook",true,16]]);
  const guided=world.stages[0];
  assert.equal(guided.method,"auto");
  assert.equal(guided.chapters.length,6);
  assert.equal(guided.levels.filter(s=>s.level.goal==="area").length,4);
  assert.equal(guided.levels.filter(s=>s.level.squareInspection==="guided").length,8);
  for(const [i,s] of guided.levels.entries()){
    assert.equal(s.id,"square-g-"+String(i+1).padStart(2,"0"));
    assert.equal(s.chapterIndex,Math.floor(i/4));
    assert.equal(isCampaignPlayable("squares","guided",s.id),true);
    assert.equal(validInitialLevel(s.level),true);
    assert.equal(isSolved(initialState(s.level)),false);
    assert.equal(Object.hasOwn(s.level,"reference"),false);
    assert.equal(campaignOptimalMoves("squares","guided",s.id),SQUARE_GUIDED_OPTIMAL_MOVES[i]);
    assert.equal(nextCampaignLevel("squares","guided",s.id)?.id,guided.levels[i+1]?.id);
  }
  for(const stage of world.stages.filter(s=>!s.available)){
    assert.equal(stageResumeLevel(blankCampaignRecords(),"squares",stage.id),null);
    for(const s of stage.levels){
      assert.equal(isCampaignPlayable("squares",stage.id,s.id),false);
      assert.equal(campaignOptimalMoves("squares",stage.id,s.id),null);
      assert.equal(normalizeCampaignResume({worldId:"squares",stageId:stage.id,levelId:s.id}),null);
    }
  }
  assert.equal(SQUARE_CAMPAIGN_STAGES[0].available,true);
  assert.deepEqual(campaignStarTotals(blankCampaignRecords(),{worldId:"squares"}),{earned:0,available:180,completed:0,count:60});
  assert.equal(campaignStarTotals(blankCampaignRecords()).count,240);
  assert.equal(campaignStarTotals(blankCampaignRecords()).available,720);
});
test("all 24 star targets are exact BFS minima and both the computed and authored routes work on the actual engine",()=>{
  for(const fixture of SQUARE_LEVEL_PLAN.filter(l=>l.stage==="guided")){
    const l=findCampaignLevel("squares","guided",fixture.id).level;
    const min=SQUARE_GUIDED_OPTIMAL_MOVES[fixture.number-1];
    assert.equal(fixture.reference.length,min,fixture.id);
    const proof=shortestSquareRoute(l,min);
    assert.ok(proof,fixture.id);
    assert.equal(proof.moves,min,fixture.id);
    if(min>1)assert.equal(shortestSquareRoute(l,min-1),null,fixture.id);
    for(const route of [proof.route,fixture.reference]){
      const start=initialState(l);let state=start;
      for(const action of route){
        assert.equal(isSolved(state),false,fixture.id);
        const result=perform(state,action,"auto");
        assert.equal(result.ok,true,fixture.id+" "+result.reason);
        assert.equal(result.committed,true,fixture.id);
        state=result.state;
        assert.equal(balanceDifference(state),0);
      }
      assert.equal(isSolved(state),true,fixture.id);
      assert.equal(state.history.length,min);
      while(state.history.length)state=undo(state);
      assert.deepEqual(state,start);
    }
  }
});
test("progress, best scores and resume belong to World 4 only and survive reload",()=>{
  const store={values:new Map(),getItem(k){return this.values.get(k)??null},setItem(k,v){this.values.set(k,v)}};
  let records=blankCampaignRecords();
  records=withCampaignCompleted(records,"workshop","guided","resident",1);
  records=withCampaignCompleted(records,"opposites","guided","op-g-01",1);
  records=withCampaignCompleted(records,"fractions","guided","frac-g-01",1);
  const earlier=Object.fromEntries(Object.entries(records.worlds).filter(([id])=>id!=="squares"));
  records=withCampaignLastPlayed(records,"squares","guided","square-g-18");
  records=withCampaignCompleted(records,"squares","guided","square-g-18",4);
  assert.equal(campaignStars(records,"squares","guided","square-g-18"),2);
  records=withCampaignCompleted(records,"squares","guided","square-g-18",3);
  records=withCampaignCompleted(records,"squares","guided","square-g-18",5);
  assert.equal(campaignStars(records,"squares","guided","square-g-18"),3);
  assert.equal(campaignStageRecord(records,"squares","guided").lastPlayed,"square-g-19");
  assert.deepEqual(Object.fromEntries(Object.entries(records.worlds).filter(([id])=>id!=="squares")),earlier);
  const unknown=withCampaignCompleted(records,"squares","notebook","square-a-99",1);
  assert.deepEqual(unknown,records);
  saveCampaignRecords(records,store);
  saveCampaignResume({worldId:"squares",stageId:"guided",levelId:"square-g-19"},store);
  assert.deepEqual(loadCampaignRecords(store),records);
  assert.deepEqual(loadCampaignResume(store),{worldId:"squares",stageId:"guided",levelId:"square-g-19"});
  const tampered=JSON.parse(JSON.stringify(records));
  tampered.worlds.squares.stages.notebook.completed=["square-a-99"];
  tampered.worlds.squares.stages.notebook.bestMoves={"square-a-99":1};
  assert.deepEqual(normalizeCampaignRecords(tampered),records);
});
test("each completion adds one distinct guided record and all 72 stars are attainable",()=>{
  let data=blankCampaignRecords();
  for(const slot of findCampaignStage("squares","guided").levels)
    data=withCampaignCompleted(data,"squares","guided",slot.id,campaignOptimalMoves("squares","guided",slot.id));
  assert.deepEqual(campaignStarTotals(data,{worldId:"squares"}),{earned:72,available:180,completed:24,count:60});
  assert.equal(campaignStageRecord(data,"squares","guided").lastPlayed,"square-g-24");
  assert.deepEqual(campaignStageRecord(data,"squares","independent").completed,[]);
  assert.deepEqual(campaignStageRecord(data,"squares","notebook").completed,[]);
});
