import test from "node:test";
import assert from "node:assert/strict";
import {SQUARE_LEVEL_PLAN} from "../src/square-level-plan.mjs";
import {SQUARE_INDEPENDENT_OPTIMAL_MOVES} from "../src/square-star-benchmarks.mjs";
import {findCampaignWorld,findCampaignStage,findCampaignLevel,isCampaignPlayable,nextCampaignLevel} from "../src/campaign-registry.mjs";
import {initialState,perform,isSolved,undo,balanceDifference,visibleRooms,validInitialLevel} from "../src/engine.mjs";
import {squareInspectionPolicy,squareInspectionPlan} from "../src/square-inspection.mjs";
import {shortestSquareRoute} from "../scripts/square-shortest-routes.mjs";
import {blankCampaignRecords,campaignStarTotals,campaignStageRecord,campaignStars,withCampaignCompleted,withCampaignLastPlayed,campaignOptimalMoves,normalizeCampaignResume,stageResumeLevel,saveCampaignRecords,loadCampaignRecords,saveCampaignResume,loadCampaignResume} from "../src/campaign-records.mjs";

const stageId="independent",worldId="squares";
const level=n=>findCampaignLevel(worldId,stageId,n).level;
const add=(kind,count)=>({op:"add",kind,count});
const remove=(kind,count)=>({op:"remove",kind,count});
const square={op:"square"},sqrt={op:"sqrt"};
const other=side=>side==="left"?"right":"left";

test("Independent Squares publishes exactly 20 stable levels in five chapters; Apprentice remains locked",()=>{
  const world=findCampaignWorld(worldId),stage=findCampaignStage(worldId,stageId);
  assert.deepEqual(world.stages.map(s=>[s.id,s.available,s.count]),[["guided",true,24],["independent",true,20],["notebook",false,16]]);
  assert.equal(stage.method,"manual");
  assert.equal(stage.chapters.length,5);
  assert.equal(stage.levels.filter(s=>s.level.goal==="area").length,3);
  for(const [i,slot] of stage.levels.entries()){
    assert.equal(slot.id,"square-i-"+String(i+1).padStart(2,"0"));
    assert.equal(slot.chapterIndex,Math.floor(i/4));
    assert.equal(validInitialLevel(slot.level),true);
    assert.equal(isSolved(initialState(slot.level)),false);
    assert.equal(isCampaignPlayable(worldId,stageId,slot.id),true);
    assert.equal(Object.hasOwn(slot.level,"reference"),false);
    assert.equal(squareInspectionPolicy(slot.level,{mode:"manual"}),i>=12?"independent":null);
    assert.equal(squareInspectionPolicy(slot.level,{mode:"auto"}),null);
    assert.equal(campaignOptimalMoves(worldId,stageId,slot.id),SQUARE_INDEPENDENT_OPTIMAL_MOVES[i]);
    assert.equal(nextCampaignLevel(worldId,stageId,slot.id)?.id,stage.levels[i+1]?.id);
  }
  assert.equal(isCampaignPlayable(worldId,"notebook",1),false);
  assert.equal(normalizeCampaignResume({worldId,stageId:"notebook",levelId:"square-a-01"}),null);
  assert.equal(stageResumeLevel(blankCampaignRecords(),worldId,"notebook"),null);
  assert.deepEqual(campaignStarTotals(blankCampaignRecords(),{worldId,stageId}),{earned:0,available:60,completed:0,count:20});
  assert.deepEqual(campaignStarTotals(blankCampaignRecords(),{worldId}),{earned:0,available:132,completed:0,count:44});
});

test("all 20 shortest move targets are certified; every matched action works in either chamber order",()=>{
  for(const f of SQUARE_LEVEL_PLAN.filter(l=>l.stage===stageId)){
    const l=level(f.number),min=SQUARE_INDEPENDENT_OPTIMAL_MOVES[f.number-1];
    const proof=shortestSquareRoute(l,min);
    assert.ok(proof,f.id);assert.equal(proof.moves,min,f.id);
    assert.equal(f.reference.length,min,f.id);
    if(min>1)assert.equal(shortestSquareRoute(l,min-1),null,f.id);
    for(const route of [proof.route,f.reference])for(const firstSide of ["left","right"]){
      const start=initialState(l);let state=start;
      for(const action of route){
        assert.equal(isSolved(state),false,f.id);
        const first=perform(state,action,"manual",firstSide);
        assert.equal(first.ok,true,f.id+" first: "+first.reason);
        assert.equal(first.committed,false);
        assert.equal(first.state.pending.first,firstSide);
        assert.equal(first.state.history.length,state.history.length);
        assert.deepEqual(first.state.left,state.left);assert.deepEqual(first.state.right,state.right);
        assert.deepEqual(visibleRooms(first.state)[other(firstSide)],state[other(firstSide)]);
        assert.equal(isSolved(first.state),false);
        assert.deepEqual(undo(first.state),state);
        assert.equal(perform(first.state,action,"manual",firstSide).code,"wrong-side");
        const second=perform(first.state,action,"manual",other(firstSide));
        assert.equal(second.ok,true,f.id+" second: "+second.reason);
        assert.equal(second.committed,true);
        assert.equal(second.state.pending,null);
        assert.equal(second.state.history.length,state.history.length+1);
        const mirrored=perform(state,action,"auto");
        assert.deepEqual(second.state.left,mirrored.state.left);
        assert.deepEqual(second.state.right,mirrored.state.right);
        assert.equal(balanceDifference(second.state),0);
        state=second.state;
      }
      assert.equal(isSolved(state),true,f.id);
      assert.equal(state.history.length,min);
      while(state.history.length)state=undo(state);
      assert.deepEqual(state,start);
    }
  }
});
test("mismatched actions, wrong room and different object counts cannot commit or award a build goal",()=>{
  const start=initialState(level(1));
  const first=perform(start,square,"manual","left");
  assert.equal(first.ok,true);assert.equal(first.committed,false);
  assert.equal(visibleRooms(first.state).left.posX2,1);
  assert.equal(visibleRooms(first.state).right.posOne,4);
  assert.equal(perform(first.state,sqrt,"manual","right").code,"mismatch");
  assert.equal(perform(first.state,square,"manual","left").code,"wrong-side");
  assert.equal(isSolved(first.state),false);
  assert.deepEqual(undo(first.state),start);
  const init=initialState(level(14));
  const pending=perform(init,add("posOne",3),"manual","right").state;
  for(const a of [add("posOne",2),add("posX",3),remove("posOne",3),sqrt])
    assert.equal(perform(pending,a,"manual","left").code,"mismatch");
  assert.deepEqual(undo(pending),init);
});
test("a valid first root and impossible matching second root roll back to the preceding committed equation",()=>{
  const start=initialState(level(9));
  const firstAdd=perform(start,add("posOne",11),"manual","left");
  const added=perform(firstAdd.state,add("posOne",11),"manual","right").state;
  assert.equal(added.left.posOne,12);assert.equal(added.right.posOne,36);
  assert.equal(added.history.length,1);
  const firstRoot=perform(added,sqrt,"manual","right");
  assert.equal(firstRoot.ok,true);assert.equal(firstRoot.committed,false);
  assert.equal(visibleRooms(firstRoot.state).right.posOne,6);
  const rejected=perform(firstRoot.state,sqrt,"manual","left");
  assert.equal(rejected.ok,false);assert.equal(rejected.code,"unsupported-area");
  assert.equal(firstRoot.state.history.length,1);
  assert.deepEqual(undo(firstRoot.state),added);
  assert.deepEqual(undo(added),start);
});
test("manual inspection candidates do not change the source and only matched additions fill the corner",()=>{
  const start=initialState(level(14)),snapshot=JSON.stringify(start);
  const incorrect=squareInspectionPlan(start.left,{a:1,b:1});
  assert.equal(incorrect.excess.posX,2);
  const fitting=squareInspectionPlan(start.left,{a:1,b:2});
  assert.equal(fitting.missing.posOne,3);
  assert.equal(JSON.stringify(start),snapshot);
  const first=perform(start,add("posOne",3),"manual","left");
  assert.equal(first.state.history.length,0);
  assert.equal(isSolved(first.state),false);
  const next=perform(first.state,add("posOne",3),"manual","right");
  assert.equal(next.committed,true);
  assert.equal(squareInspectionPlan(next.state.left,{a:1,b:2}).missing.posOne,0);
  assert.equal(next.state.right.posOne,16);
});
test("Independent completion, best scores and resume are isolated from Guided, other worlds and locked Apprentice",()=>{
  const store={data:new Map(),getItem(k){return this.data.get(k)??null},setItem(k,v){this.data.set(k,v)}};
  let data=blankCampaignRecords();
  data=withCampaignCompleted(data,worldId,"guided","square-g-01",1);
  data=withCampaignCompleted(data,"fractions","guided","frac-g-01",1);
  const previous=JSON.stringify(data.worlds.squares.stages.guided);
  const priorFraction=JSON.stringify(data.worlds.fractions);
  data=withCampaignLastPlayed(data,worldId,stageId,"square-i-14");
  assert.equal(campaignStageRecord(data,worldId,stageId).completed.length,0);
  for(const [moves,stars] of [[5,1],[4,2],[3,3],[6,3]]){
    data=withCampaignCompleted(data,worldId,stageId,"square-i-14",moves);
    assert.equal(campaignStars(data,worldId,stageId,"square-i-14"),stars);
  }
  assert.equal(campaignStageRecord(data,worldId,stageId).lastPlayed,"square-i-15");
  assert.equal(JSON.stringify(data.worlds.squares.stages.guided),previous);
  assert.equal(JSON.stringify(data.worlds.fractions),priorFraction);
  assert.deepEqual(withCampaignCompleted(data,worldId,"notebook","square-a-01",1),data);
  saveCampaignRecords(data,store);
  saveCampaignResume({worldId,stageId,levelId:"square-i-15"},store);
  assert.deepEqual(loadCampaignRecords(store),data);
  assert.deepEqual(loadCampaignResume(store),{worldId,stageId,levelId:"square-i-15"});
  for(const slot of findCampaignStage(worldId,stageId).levels)
    data=withCampaignCompleted(data,worldId,stageId,slot.id,campaignOptimalMoves(worldId,stageId,slot.id));
  assert.deepEqual(campaignStarTotals(data,{worldId,stageId}),{earned:60,available:60,completed:20,count:20});
  assert.equal(campaignStageRecord(data,worldId,stageId).lastPlayed,"square-i-20");
  assert.equal(campaignStarTotals(data).count,224);
  assert.equal(campaignStarTotals(data).available,672);
});
