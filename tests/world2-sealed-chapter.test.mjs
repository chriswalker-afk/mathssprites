import test from "node:test";
import assert from "node:assert/strict";
import {OPPOSITE_LEVELS,OPPOSITE_CHAPTERS,OPPOSITE_CRATE_OPERATIONS}
  from "../src/opposite-levels.mjs";
import {OPPOSITE_OPTIMAL_MOVES} from "../src/opposite-star-benchmarks.mjs";
import {initialState,validInitialLevel,evaluate,equation,perform,isSolved,undo,
  balanceDifference,attachAvailablePairs} from "../src/engine.mjs";
import {crateExpansionPlan} from "../src/crate-expansion.mjs";
import {crateMarkup} from "../src/group-crates.mjs";
import {curriculumForLevel} from "../src/curriculum.mjs";
import {shortestSignedRoute,signedActionsFor} from "../scripts/world2-shortest-routes.mjs";
import {blankCampaignRecords,withCampaignCompleted,campaignStarTotals,
  saveCampaignRecords,loadCampaignRecords,campaignStars}
  from "../src/campaign-records.mjs";

const added=OPPOSITE_LEVELS.guided.slice(20);
test("World 2 appends four sealed-opposites levels with immutable old IDs and unchanged past stars",()=>{
  assert.equal(OPPOSITE_LEVELS.guided.length,24);
  assert.equal(OPPOSITE_CHAPTERS.guided.length,6);
  assert.equal(OPPOSITE_CHAPTERS.guided[5].id,"sealed-opposites");
  assert.deepEqual(OPPOSITE_LEVELS.guided.slice(0,20).map(s=>s.id),
    Array.from({length:20},(_,i)=>"op-g-"+String(i+1).padStart(2,"0")));
  assert.deepEqual(added.map(s=>s.id),
    ["op-g-21","op-g-22","op-g-23","op-g-24"]);
  assert.deepEqual(OPPOSITE_OPTIMAL_MOVES.guided.slice(0,20),
    [1,1,1,1,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3]);
  for(const [i,slot] of added.entries()){
    const level=slot.level;
    assert.equal(slot.chapterIndex,5);
    assert.equal(level.contentRevision,1);
    assert.equal(level.groupedPrototype,true);
    assert.deepEqual(level.allowedOperations,OPPOSITE_CRATE_OPERATIONS);
    assert.equal(validInitialLevel(level),true);
    assert.equal(level.solution,5);
    assert.equal(evaluate(initialState(level).left,5),evaluate(initialState(level).right,5));
    assert.equal(OPPOSITE_OPTIMAL_MOVES.guided[20+i],3);
    assert.ok(signedActionsFor(level).some(a=>a.op==="unpack"&&a.side==="left"));
    assert.equal(curriculumForLevel("opposites","guided",i+21).difficulty.tier,[3,3,4,5][i]);
  }
});

test("all four new authored routes use legitimate physical identity rewrites and solve in 3 scored moves",()=>{
  for(const slot of added){
    let state=initialState(slot.level);
    const snapshot=JSON.stringify(state);
    assert.equal(state.history.length,0);
    assert.equal(isSolved(state),false);
    assert.equal(slot.level.referenceRoute.length,3);
    for(const [i,action] of slot.level.referenceRoute.entries()){
      const before=state;
      const out=perform(state,action,"auto");
      assert.equal(out.ok,true,slot.id+" step "+(i+1)+" "+
        JSON.stringify(action)+": "+(out.reason||""));
      assert.equal(out.committed,true);
      state=out.state;
      assert.equal(balanceDifference(state),0);
      assert.deepEqual(undo(state),before,slot.id+" exact Undo");
      assert.equal(isSolved(state),i===2);
    }
    assert.equal(state.history.length,3);
    for(let i=0;i<3;i++)state=undo(state);
    assert.equal(JSON.stringify(state),snapshot);
  }
});

test("levels 21–23 begin with visible opposite pairs and correct sealed crate counts",()=>{
  const data=[
    {number:21,type:"constants",pairs:1,crates:2,contents:{posX:1,posOne:1}},
    {number:22,type:"sprites",pairs:1,crates:3,contents:{posX:1,posOne:2}},
    {number:23,type:"constants",pairs:3,crates:2,contents:{posX:1,posOne:2}}
  ];
  for(const info of data){
    const initial=initialState(OPPOSITE_LEVELS.guided[info.number-1].level);
    const paired=attachAvailablePairs(initial,"left",info.type);
    assert.equal(paired.ok,true);
    assert.equal(paired.count,info.pairs);
    assert.equal(paired.state.history.length,0);
    assert.deepEqual(undo(paired.state),initial);
    assert.deepEqual(paired.state.left.crates,initial.left.crates);
    assert.equal(initial.left.crates.count,info.crates);
    for(const [kind,count] of Object.entries(info.contents))
      assert.equal(initial.left.crates.contents[kind],count);
    const html=crateMarkup(initial.left);
    assert.equal((html.match(/class="token sealed-crate"/g)||[]).length,info.crates);
  }
});

test("level 24 keeps four negative balloons physically inside the two sealed crates until opened",()=>{
  const level=OPPOSITE_LEVELS.guided[23].level,state=initialState(level);
  assert.equal(state.left.crates.count,2);
  assert.equal(state.left.crates.contents.negOne,2);
  assert.equal(state.left.negOne,0);
  assert.equal(state.left.posOne,3);
  const plan=crateExpansionPlan(state.left);
  assert.equal(plan.signed,true);
  assert.equal(plan.totalBalloons,4);
  assert.equal(plan.totalSprites,2);
  assert.equal(plan.totalWeights,0);
  const html=crateMarkup(state.left);
  assert.equal((html.match(/class="crate-bay-balloon"/g)||[]).length,4);
  const opened=perform(state,{op:"unpack",side:"left"});
  assert.equal(opened.ok,true);
  assert.equal(opened.state.left.posX,3);
  assert.equal(opened.state.left.negOne,1);
  assert.equal(opened.state.left.posOne,0);
  assert.equal(opened.state.right.posOne,14);
  assert.equal(opened.state.history[0].mode,"rewrite");
  assert.deepEqual(opened.state.history[0].cancellationEvents.left.map(e=>e.type),
    ["constants","constants","constants"]);
  assert.deepEqual(undo(opened.state),state);
  assert.equal(curriculumForLevel("opposites","guided",24).flags.negativeUnits,true);
  assert.equal(curriculumForLevel("opposites","guided",24).flags.sealedCrates,true);
});

test("the shortest-route explorer certifies the four new puzzles independently of author hints",()=>{
  for(const slot of added){
    const result=shortestSignedRoute(slot.level,{maxMoves:3});
    assert.ok(result,slot.id+" should be solvable in at most three counted moves");
    assert.equal(result.moves,3,slot.id+" must not have a 0/1/2-move shortcut");
    assert.equal(result.route.length,3);
    assert.ok(result.triedActions>0);
  }
});

test("completing all twenty old Guided levels does not complete the newly appended chapter",()=>{
  let records=blankCampaignRecords();
  for(let i=0;i<20;i++){
    const id=OPPOSITE_LEVELS.guided[i].id;
    records=withCampaignCompleted(records,"opposites","guided",id,
      OPPOSITE_OPTIMAL_MOVES.guided[i]);
  }
  const totals=campaignStarTotals(records,{worldId:"opposites"});
  assert.equal(totals.count,60);
  assert.equal(totals.completed,20);
  assert.equal(totals.earned,60);
  assert.equal(totals.available,180);
  for(const slot of added)
    assert.equal(campaignStars(records,"opposites","guided",slot.id),0);
  const map=new Map(),storage={
    getItem:key=>map.get(key)||null,setItem:(key,val)=>map.set(key,val)
  };
  const saved=saveCampaignRecords(records,storage);
  const reloaded=loadCampaignRecords(storage);
  assert.deepEqual(reloaded,saved);
  assert.equal(campaignStarTotals(reloaded,{worldId:"opposites"}).completed,20);
});
