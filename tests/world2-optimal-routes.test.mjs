import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {OPPOSITE_LEVELS,OPPOSITE_STAGE_ORDER} from "../src/opposite-levels.mjs";
import {
  OPPOSITE_OPTIMAL_MOVES,OPPOSITE_TOTAL_AVAILABLE_STARS
} from "../src/opposite-star-benchmarks.mjs";
import {ALL_SIGNED_ACTIONS,signedActionsFor,shortestSignedRoute}
  from "../scripts/world2-shortest-routes.mjs";
import {
  initialState,perform,undo,isSolved,balanceDifference,equation,attachAvailablePairs
} from "../src/engine.mjs";
import {
  CAMPAIGN_REGISTRY,findCampaignStage,findCampaignLevel
} from "../src/campaign-registry.mjs";
import {
  blankCampaignRecords,withCampaignCompleted,campaignStars,
  campaignOptimalMoves,campaignStarTotals,saveCampaignRecords,loadCampaignRecords
} from "../src/campaign-records.mjs";
import {startNotebook} from "../src/notebook-engine.mjs";
import {tryNotebookOperation} from "../src/notebook-maths-editor.mjs";
import {curriculumForLevel} from "../src/curriculum.mjs";

const stageLengths={guided:24,independent:20,notebook:16};
const applyFreePairs=(state,pairings=[],at)=>{
  let current=state;
  for(const pairing of pairings.filter(p=>p.at===at)){
    const next=attachAvailablePairs(current,pairing.side,pairing.type);
    assert.equal(next.ok,true,"an audit pairing must be physically available");
    current=next.state;
  }
  return current;
};
const moveText=action=>{
  if(action.op==="unpack")return "open"+action.side;
  if(action.op==="divide")return "÷"+action.factor;
  if(action.op==="multiply")return "×"+action.factor;
  const negative=action.kind==="negX"||action.kind==="negOne";
  const variable=action.kind==="posX"||action.kind==="negX";
  const n=action.count===1&&variable?"":String(action.count);
  return (action.op==="add"?"+":"−")+
    (negative?"(−"+n+(variable?"x":"")+")":n+(variable?"x":""));
};

test("60 independently certified signed par targets cover exactly the shipped stages",()=>{
  assert.equal(OPPOSITE_TOTAL_AVAILABLE_STARS,180);
  assert.deepEqual(Object.keys(OPPOSITE_OPTIMAL_MOVES),OPPOSITE_STAGE_ORDER);
  const histogram={1:0,2:0,3:0,4:0};
  for(const [stage,count] of Object.entries(stageLengths)){
    const targets=OPPOSITE_OPTIMAL_MOVES[stage];
    assert.equal(targets.length,count);
    assert.ok(Object.isFrozen(targets));
    for(const n of targets){
      assert.ok(Number.isInteger(n)&&n>0&&n<=4);
      histogram[n]++;
    }
  }
  assert.deepEqual(histogram,{1:10,2:10,3:39,4:1});
  assert.equal(ALL_SIGNED_ACTIONS.length,104,
    "Two operations × four kinds × 12 counts, plus eight factor actions");
  assert.deepEqual(new Set(ALL_SIGNED_ACTIONS.map(a=>a.op)),
    new Set(["remove","add","divide","multiply"]));
  for(const stage of OPPOSITE_STAGE_ORDER)
    assert.equal(signedActionsFor(OPPOSITE_LEVELS[stage][0].level).length,104);
});

test("ALL 60 World 2 par targets are shortest legal paths under the real engine",()=>{
  // Exhaustively breadth-first enumerate the exact engine's permitted moves.
  // Every shorter physical state/action is searched before a solution at par.
  // The stored reference routes are deliberately NOT used by the explorer.
  for(const stage of OPPOSITE_STAGE_ORDER){
    const registryStage=findCampaignStage("opposites",stage);
    for(const slot of OPPOSITE_LEVELS[stage]){
      const level=slot.level,id=slot.id;
      const par=OPPOSITE_OPTIMAL_MOVES[stage][slot.number-1];
      const result=shortestSignedRoute(level,{maxMoves:par});
      assert.ok(result,id+" must be solvable at published par "+par+
        "; equation: "+equation(initialState(level)));
      assert.equal(result.moves,par,id+" has an unexpected quicker route");
      assert.equal(result.route.length,par);
      assert.ok(result.visitedStates>0);
      assert.equal(registryStage.optimalMoves[id],par);
      assert.equal(campaignOptimalMoves("opposites",stage,id),par);
      assert.equal(findCampaignLevel("opposites",stage,id).level,level);
      assert.equal(curriculumForLevel("opposites",stage,slot.number)
        .difficulty.complexitySignals.benchmarkMoves,par);
      assert.equal(curriculumForLevel("opposites",stage,slot.number)
        .difficulty.complexitySignals.benchmarkType,"proven-minimum");
      let state=initialState(level);
      for(const [i,action] of result.route.entries()){
        state=applyFreePairs(state,result.freePairings,i);
        const before=state;
        const outcome=perform(state,action,"auto");
        assert.equal(outcome.ok,true,id+" certified step "+i);
        assert.equal(outcome.committed,true);
        state=outcome.state;
        assert.equal(balanceDifference(state),0,id+" every step remains balanced");
        // A scored operation consumes any preceding free-pair Undo marker.
        const undone=undo(state);
        assert.deepEqual([undone.left,undone.right],
          [before.left,before.right],id+" Undo restores the same actual rooms");
        assert.equal(undone.history.length,before.history.length);
        if(i<par-1)assert.equal(isSolved(state),false);
      }
      state=applyFreePairs(state,result.freePairings,par);
      assert.equal(isSolved(state),true,id+" shortest certified final state");
      assert.equal(state.history.length,par);
    }
  }
});

test("teacher-authored World 2 reference routes remain separately executable",()=>{
  for(const stage of OPPOSITE_STAGE_ORDER)
    for(const slot of OPPOSITE_LEVELS[stage]){
      const par=OPPOSITE_OPTIMAL_MOVES[stage][slot.number-1];
      assert.ok(slot.level.referenceRoute.length>=par,slot.id);
      const meta=curriculumForLevel("opposites",stage,slot.number);
      assert.equal(meta.difficulty.complexitySignals.authoredRouteMoves,
        slot.level.referenceRoute.length);
      let state=initialState(slot.level);
      for(const action of slot.level.referenceRoute){
        const outcome=perform(state,action,"auto");
        assert.equal(outcome.ok,true,slot.id+" authored legal step");
        state=outcome.state;
      }
      assert.equal(isSolved(state),true,slot.id+" author witness isolates one sprite");
    }
});

test("each certified Independent route works as TWO matching hand visits per step",()=>{
  for(const slot of OPPOSITE_LEVELS.independent){
    const par=OPPOSITE_OPTIMAL_MOVES.independent[slot.number-1];
    const witness=shortestSignedRoute(slot.level,{maxMoves:par});
    let state=initialState(slot.level);
    for(const [i,action] of witness.route.entries()){
      state=applyFreePairs(state,witness.freePairings,i);
      if(action.op==="unpack"){
        assert.equal(perform(state,action,"manual",action.side).code,"unpack-mode");
        const opened=perform(state,action,"auto");
        assert.equal(opened.ok,true,slot.id+" local expansion is legal");
        assert.equal(opened.state.history.at(-1).mode,"rewrite");
        assert.equal(opened.state.pending,null);
        state=opened.state;
        continue;
      }
      const first=perform(state,action,"manual","left");
      assert.equal(first.ok,true,slot.id+" first room");
      assert.equal(first.committed,false);
      assert.equal(first.state.history.length,state.history.length);
      assert.equal(first.state.pending!==null,true);
      const second=perform(first.state,action,"manual","right");
      assert.equal(second.ok,true,slot.id+" matched room");
      assert.equal(second.committed,true);
      state=second.state;
    }
    state=applyFreePairs(state,witness.freePairings,par);
    assert.equal(isSolved(state),true,slot.id);
    assert.equal(state.history.length,par,"Paired visits count once; local expansion once");
  }
});

test("each certified Signed Algebra Apprentice route is accepted by the maths editor",()=>{
  for(const slot of OPPOSITE_LEVELS.notebook){
    const par=OPPOSITE_OPTIMAL_MOVES.notebook[slot.number-1];
    const witness=shortestSignedRoute(slot.level,{maxMoves:par});
    assert.deepEqual(witness.freePairings,[],
      slot.id+" the maths editor does not expose separate physical zero-pair clicks");
    let session=startNotebook(slot.level);
    for(const action of witness.route){
      const changed=tryNotebookOperation(session,moveText(action));
      assert.equal(changed.ok,true,slot.id+" signed notebook operation "+
        moveText(action)+": "+(changed.message||""));
      session=changed.session;
    }
    assert.equal(isSolved(session.state),true,slot.id);
    assert.equal(session.steps.length,par);
  }
});

test("certifying World 2 minima does not clear existing scores, completion or revision history",()=>{
  let current=blankCampaignRecords();
  current=withCampaignCompleted(current,"opposites","guided","op-g-01",1);
  current=withCampaignCompleted(current,"opposites","guided","op-g-05",2);
  current=withCampaignCompleted(current,"opposites","guided","op-g-06",4);
  current=withCampaignCompleted(current,"opposites","independent","op-i-01",1);
  current=withCampaignCompleted(current,"opposites","independent","op-i-15",3);
  current=withCampaignCompleted(current,"opposites","notebook","op-a-08",3);
  const signed=current.worlds.opposites.stages.guided;
  signed.historical["op-g-05"]={revision:1,bestMoves:2};
  const before=campaignStarTotals(current,{worldId:"opposites"});
  assert.equal(before.count,60);
  assert.equal(before.available,180);
  assert.equal(before.completed,6);
  assert.equal(campaignStars(current,"opposites","guided","op-g-05"),3);
  assert.equal(campaignStars(current,"opposites","guided","op-g-06"),2);
  assert.equal(campaignStars(current,"opposites","independent","op-i-15"),3);
  const raw=new Map();
  const storage={getItem:key=>raw.get(key)||null,
    setItem:(key,value)=>raw.set(key,value)};
  const saved=saveCampaignRecords(current,storage);
  const reloaded=loadCampaignRecords(storage);
  assert.deepEqual(reloaded,saved);
  assert.deepEqual(campaignStarTotals(reloaded,{worldId:"opposites"}),before);
  assert.equal(reloaded.worlds.opposites.stages.guided.completedRevisions["op-g-05"],2);
  assert.deepEqual(reloaded.worlds.opposites.stages.guided.historical["op-g-05"],
    {revision:1,bestMoves:2});
  assert.equal(campaignStarTotals(reloaded).available,492,
    "Worlds 1 and 2 retain 360 stars, with 132 more in the two available fraction modes");
});

test("World 2 shortest-route script and curriculum remain author-only",()=>{
  for(const path of ["src/app.mjs","src/site.mjs","src/stages.mjs"]){
    const content=readFileSync(new URL("../"+path,import.meta.url),"utf8");
    assert.doesNotMatch(content,/world2-shortest-routes|audit-world2-routes|curriculum\.mjs/,
      path+" must not ship route searching or solutions to students");
  }
});
