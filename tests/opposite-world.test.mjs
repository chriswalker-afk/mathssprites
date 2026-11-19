import test from "node:test";
import assert from "node:assert/strict";
import {
 OPPOSITE_LEVELS,OPPOSITE_CHAPTERS,OPPOSITE_LEVEL_COUNT,
 OPPOSITE_KINDS,OPPOSITE_OPERATIONS,OPPOSITE_STAGE_ORDER
} from "../src/opposite-levels.mjs";
import {
 CAMPAIGN_REGISTRY,findCampaignWorld,findCampaignLevel,isCampaignPlayable,
 nextCampaignLevel
} from "../src/campaign-registry.mjs";
import {
 initialState,perform,undo,validInitialLevel,isSolved,balanceDifference,
 evaluate,levelActionPermission,levelQuantityMode,equation
} from "../src/engine.mjs";
import {startNotebook,notebookReplayScript} from "../src/notebook-engine.mjs";
import {
 parseNotebookOperation,previewNotebookOperation,tryNotebookOperation,
 notebookEquationMathML,notebookOperationMathML
} from "../src/notebook-maths-editor.mjs";
import {
 blankCampaignRecords,campaignStageRecord,campaignStarTotals,
 withCampaignLastPlayed,withCampaignCompleted,campaignStars
} from "../src/campaign-records.mjs";

const sizes={guided:20,independent:16,notebook:12};
test("World 2 mirrors the three World 1 stage sizes and chapter shapes",()=>{
 assert.equal(OPPOSITE_LEVEL_COUNT,48);
 assert.deepEqual(OPPOSITE_STAGE_ORDER,["guided","independent","notebook"]);
 const world=findCampaignWorld("opposites");
 assert.equal(world.available,true);
 assert.deepEqual(world.stages.map(s=>s.levels.length),[20,16,12]);
 assert.deepEqual(world.stages.map(s=>s.chapters.length),[5,4,3]);
 assert.deepEqual(CAMPAIGN_REGISTRY.map(x=>x.available),[true,true,false,false]);
 for(const id of OPPOSITE_STAGE_ORDER){
   assert.equal(OPPOSITE_LEVELS[id].length,sizes[id]);
   assert.equal(OPPOSITE_CHAPTERS[id].length,sizes[id]/4);
   const stage=world.stages.find(s=>s.id===id);
   assert.equal(stage.capabilities.quantityMode,"signed");
   assert.equal(stage.capabilities.handMode,{guided:"auto",independent:"manual",notebook:"notebook"}[id]);
   for(const [i,slot] of stage.levels.entries()){
     assert.equal(slot.chapterIndex,Math.floor(i/4));
     assert.equal(slot.chapterId,stage.chapters[Math.floor(i/4)].id);
     assert.equal(isCampaignPlayable("opposites",id,slot.id),true);
     assert.equal(slot.level.allowedKinds.includes("posX2"),false);
     assert.equal(stage.optimalMoves[slot.id],slot.level.referenceRoute.length);
   }
   assert.equal(nextCampaignLevel("opposites",id,sizes[id]),null);
 }
});
test("all 48 signed puzzles have exact positive solutions and executable routes",()=>{
 for(const id of OPPOSITE_STAGE_ORDER)for(const slot of OPPOSITE_LEVELS[id]){
  const level=slot.level;
  assert.equal(validInitialLevel(level),true,slot.id+" initial equation");
  assert.equal(levelQuantityMode(level),"signed");
  assert.equal(level.solution>0,true,slot.id);
  assert.equal(level.lockPositive,false,slot.id);
  assert.deepEqual(level.allowedOperations,OPPOSITE_OPERATIONS,slot.id);
  assert.deepEqual(level.allowedKinds,OPPOSITE_KINDS,slot.id);
  let state=initialState(level);
  assert.equal(balanceDifference(state),0,slot.id);
  assert.equal(isSolved(state),false,slot.id+" must need an action");
  const snapshot=JSON.stringify(state);
  for(const [i,action] of level.referenceRoute.entries()){
    const result=perform(state,action,"auto");
    assert.equal(result.ok,true,slot.id+" step "+(i+1)+": "+(result.reason||"invalid"));
    assert.equal(result.committed,true,slot.id);
    state=result.state;
    assert.equal(balanceDifference(state),0,slot.id+" step "+(i+1));
    if(i+1<level.referenceRoute.length)
      assert.equal(isSolved(state),false,slot.id+" prematurely complete at step "+(i+1));
  }
  assert.equal(isSolved(state),true,slot.id+": "+equation(state));
  assert.equal(state.history.length,level.referenceRoute.length,slot.id);
  for(let i=0;i<level.referenceRoute.length;i++)state=undo(state);
  assert.equal(JSON.stringify(state),snapshot,slot.id+" complete undo");
 }
});
test("each signed route can be performed provisionally and matched manually",()=>{
 for(const slot of OPPOSITE_LEVELS.independent){
  let state=initialState(slot.level);
  for(const action of slot.level.referenceRoute){
   const pending=perform(state,action,"manual","left");
   assert.equal(pending.ok,true,slot.id+" first manual hand");
   assert.equal(pending.committed,false,slot.id);
   assert.equal(pending.state.history.length,state.history.length,slot.id);
   const before=undo(pending.state);
   assert.deepEqual(before,state,slot.id+" pending undo");
   const done=perform(pending.state,action,"manual","right");
   assert.equal(done.ok,true,slot.id+" matching hand");
   assert.equal(done.committed,true,slot.id);
   state=done.state;
  }
  assert.equal(isSolved(state),true,slot.id+" matched manual route");
 }
});
test("all twelve signed notebooks use the same checked engine and exact replay",()=>{
 for(const slot of OPPOSITE_LEVELS.notebook){
   let session=startNotebook(slot.level);
   for(const action of slot.level.referenceRoute){
     const word=action.kind?
       (action.op==="add"?"+":"−")+
         ((action.kind==="negX"||action.kind==="negOne")?"(−":"")+
         String(action.count===1&&action.kind.endsWith("X")?"":action.count)+
         (action.kind.endsWith("X")?"x":"")+
         ((action.kind==="negX"||action.kind==="negOne")?")":"")
       :(action.op==="divide"?"÷":"×")+action.factor;
     const preview=previewNotebookOperation(session,word);
     assert.equal(preview.ok,true,slot.id+" "+word+" "+(preview.message||""));
     const change=tryNotebookOperation(session,word);
     assert.equal(change.ok,true,slot.id+" commit "+word);
     session=change.session;
   }
   assert.equal(isSolved(session.state),true,slot.id);
   assert.equal(notebookReplayScript(session).length,slot.level.referenceRoute.length,slot.id);
 }
});
test("signed editor distinguishes +(−x), −(−x), +(−1), −(−1) and renders negative MathML",()=>{
 const cases=[
  ["+(−x)",{op:"add",kind:"negX",count:1}],
  ["−(−2x)",{op:"remove",kind:"negX",count:2}],
  ["+(−3)",{op:"add",kind:"negOne",count:3}],
  ["−(−4)",{op:"remove",kind:"negOne",count:4}]
 ];
 for(const [label,action] of cases){
  const parsed=parseNotebookOperation(label);
  assert.equal(parsed.ok,true,label);
  assert.deepEqual(parsed.action,action,label);
  assert.match(notebookOperationMathML(action),/<mo>−<\/mo>/);
 }
 const signed=startNotebook(OPPOSITE_LEVELS.notebook[0].level);
 const html=notebookEquationMathML(signed.state);
 assert.match(html,/<mo>−<\/mo>/);
 assert.match(html,/<mi>x<\/mi>/);
 const positive=initialState(CAMPAIGN_REGISTRY[0].stages[0].levels[0].level);
 assert.equal(perform(positive,{op:"add",kind:"negX",count:1}).ok,false);
 assert.equal(previewNotebookOperation(
  startNotebook(CAMPAIGN_REGISTRY[0].stages[2].levels[0].level),"+(−x)").ok,false);
});
test("signed objects and stars are strictly world scoped, never World 1",()=>{
 let save=blankCampaignRecords();
 const first=findCampaignLevel("opposites","guided",1);
 save=withCampaignLastPlayed(save,"opposites","guided",first.id);
 save=withCampaignCompleted(save,"opposites","guided",first.id,
  first.level.referenceRoute.length);
 assert.equal(campaignStageRecord(save,"opposites","guided").completed.length,1);
 assert.equal(campaignStageRecord(save,"workshop","guided").completed.length,0);
 assert.equal(campaignStars(save,"opposites","guided",first.id),3);
 assert.equal(campaignStarTotals(save,{worldId:"opposites"}).count,48);
 assert.equal(campaignStarTotals(save,{worldId:"workshop"}).count,48);
});
