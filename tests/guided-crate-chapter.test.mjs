import test from "node:test";
import assert from "node:assert/strict";
import {WORLD1_LEVELS,WORLD1_CHAPTERS,WORLD1_OPERATIONS} from "../src/worlds.mjs";
import {CAMPAIGN_REGISTRY,findCampaignLevel,nextCampaignLevel} from "../src/campaign-registry.mjs";
import {initialState,perform,undo,evaluate,equation,balanceDifference,isSolved,validInitialLevel} from "../src/engine.mjs";
import {crateCount} from "../src/group-crates.mjs";
import {OPTIMAL_MOVES,optimalMoves} from "../src/star-ratings.mjs";
import {CURRICULUM_CHAPTERS,curriculumForLevel} from "../src/curriculum.mjs";
import {loadProgress} from "../src/progress.mjs";
import {stageOneComplete} from "../src/stages.mjs";
import {loadCampaignRecords,campaignStageRecord} from "../src/campaign-records.mjs";

const levels=WORLD1_LEVELS.slice(20);
const unpack={op:"unpack",side:"left"};
const divide=n=>({op:"divide",factor:n});
const removeWeights=n=>({op:"remove",kind:"posOne",count:n});
const removeSprites=n=>({op:"remove",kind:"posX",count:n});
const equationText=[
  "2(x + 1) = 8",
  "3(x + 2) = 21",
  "2(x + 4) = x + 13",
  "3(x + 2) + 2x + 1 = x + 23"
];
const solutions=[
  [divide(2),unpack,removeWeights(1)],
  [divide(3),unpack,removeWeights(2)],
  [unpack,removeSprites(1),removeWeights(8)],
  [unpack,removeSprites(1),removeWeights(7),divide(4)]
];

test("Guided has six four-level chapters; the previous twenty IDs and equations stay fixed",()=>{
  assert.equal(WORLD1_CHAPTERS.length,6);
  assert.equal(WORLD1_LEVELS.length,24);
  assert.equal(CAMPAIGN_REGISTRY[0].stages[0].count,24);
  assert.equal(CAMPAIGN_REGISTRY[0].stages[0].chapters.length,6);
  assert.equal(CURRICULUM_CHAPTERS.workshop.guided.length,6);
  assert.equal(WORLD1_LEVELS[18].id,"master-19");
  assert.equal(WORLD1_LEVELS[19].id,"master-20");
  assert.equal(equation(initialState(WORLD1_LEVELS[18].level)),"2(x + 3) = 14");
  assert.equal(equation(initialState(WORLD1_LEVELS[19].level)),"5x + 17 = 2x + 29");
  for(const [i,slot] of levels.entries()){
    assert.equal(slot.number,21+i);
    assert.equal(slot.chapterIndex,5);
    assert.equal(slot.id,"crates-"+(21+i));
    assert.equal(slot.level.groupedPrototype,true);
    assert.deepEqual(slot.level.allowedOperations,[...WORLD1_OPERATIONS,"unpack"]);
    assert.equal(slot.level.lockPositive,true);
    assert.equal(slot.level.quantityMode,"positive");
    assert.equal(validInitialLevel(slot.level),true,slot.id);
    assert.equal(equation(initialState(slot.level)),equationText[i],slot.id);
    assert.equal(slot.level.startingOperation,undefined);
    assert.equal(slot.level.startingFactor,undefined);
    assert.equal(slot.level.startingKind,undefined);
    assert.equal(slot.level.startingAmount,undefined);
    assert.equal(findCampaignLevel("workshop","guided",slot.id).number,21+i);
    assert.equal(optimalMoves("guided",21+i),[3,3,3,4][i]);
  }
  assert.equal(nextCampaignLevel("workshop","guided","master-20").id,"crates-21");
  assert.equal(nextCampaignLevel("workshop","guided","crates-24"),null);
  assert.equal(OPTIMAL_MOVES.guided.length,24);
  assert.deepEqual(OPTIMAL_MOVES.guided.slice(0,20),
    [1,1,1,1,1,1,1,1,2,2,2,2,2,3,3,3,3,2,3,4]);
});

test("each new Guided crate challenge has a real legal solution and full Undo history",()=>{
  for(const [i,slot] of levels.entries()){
    const initial=initialState(slot.level);
    let state=initial;
    assert.equal(balanceDifference(state),0);
    assert.equal(isSolved(state),false);
    for(const [step,action] of solutions[i].entries()){
      const before=state;
      const result=perform(state,action,"auto");
      assert.equal(result.ok,true,slot.id+" step "+(step+1)+" "+(result.reason||""));
      assert.equal(result.committed,true);
      state=result.state;
      assert.equal(state.history.length,step+1);
      assert.equal(state.history.at(-1).action.op,action.op);
      assert.equal(state.history.at(-1).mode,action.op==="unpack"?"rewrite":"auto");
      assert.equal(balanceDifference(state),0);
      assert.equal(evaluate(state.left,slot.level.solution),
        evaluate(state.right,slot.level.solution));
      assert.equal(isSolved(state),step===solutions[i].length-1);
      assert.deepEqual(undo(state),before,"Undo one complete step: "+slot.id);
    }
    assert.equal(equation(state),"x = "+slot.level.solution,slot.id);
    for(let step=solutions[i].length;step>0;step--)state=undo(state);
    assert.deepEqual(state,initial,"Undo all the way to original sealed groups");
  }
});

test("the first two puzzles deliberately allow either open-first or group-first",()=>{
  for(const [i,n] of [[0,2],[1,3]]){
    let state=initialState(levels[i].level);
    for(const action of [unpack,removeWeights(i===0?2:6),divide(n)]){
      const response=perform(state,action,"auto");
      assert.equal(response.ok,true,levels[i].id+" alternate route");
      state=response.state;
    }
    assert.equal(isSolved(state),true);
  }
});

test("later puzzles prevent misleading division and require reasoning about loose sprites",()=>{
  const third=initialState(levels[2].level);
  assert.equal(crateCount(third.left),2);
  assert.equal(third.right.posX,1);
  assert.equal(perform(third,divide(2)).ok,false,
    "a loose sprite must not be silently divided into a fractional half");
  assert.equal(perform(third,removeSprites(1)).ok,false,
    "the sprite inside an unopened crate cannot be picked up");
  const opened=perform(third,unpack,"auto");
  assert.equal(opened.ok,true);
  assert.equal(equation(opened.state),"2x + 8 = x + 13");
  assert.equal(opened.state.history.at(-1).mode,"rewrite");

  const fourth=initialState(levels[3].level);
  assert.equal(fourth.left.posX,2);
  assert.equal(fourth.left.posOne,1);
  assert.equal(crateCount(fourth.left),3);
  const first=perform(fourth,removeSprites(1),"auto");
  assert.equal(first.ok,true,"loose sprites MAY be removed while other sprites are still boxed");
  const second=perform(first.state,unpack,"auto");
  assert.equal(second.ok,true);
  assert.equal(equation(second.state),"4x + 7 = 23");
  const thirdMove=perform(second.state,removeWeights(7));
  assert.equal(thirdMove.ok,true);
  const final=perform(thirdMove.state,divide(4));
  assert.equal(final.ok,true);
  assert.equal(isSolved(final.state),true);
});

test("difficulty metadata rises within the chapter and flags genuine crate complexity",()=>{
  assert.deepEqual(levels.map(x=>curriculumForLevel("workshop","guided",x.number).difficulty.tier),
    [3,3,4,5]);
  const third=curriculumForLevel("workshop","guided",23);
  const fourth=curriculumForLevel("workshop","guided",24);
  assert.equal(third.flags.sealedCrates,true);
  assert.equal(third.flags.variablesOnBothSides,true);
  assert.equal(third.flags.fractionTrap,true);
  assert.equal(fourth.flags.variablesOnBothSides,true);
  assert.equal(fourth.flags.alternativeRoutes,true);
  assert.equal(fourth.difficulty.complexitySignals.benchmarkMoves,4);
  assert.equal(fourth.difficulty.complexitySignals.sealedGroupReasoning,true);
});

test("twenty-level student saves remain intact but do not claim the new four levels",()=>{
  const old={completed:Array.from({length:20},(_,i)=>i+1),lastPlayed:20};
  const contents=new Map([["mathssprites.progress.v1",JSON.stringify(old)]]);
  const storage={
    getItem:k=>contents.get(k)||null,
    setItem:(k,v)=>contents.set(k,v)
  };
  assert.deepEqual(loadProgress(storage),old);
  assert.equal(stageOneComplete(old.completed),false);
  assert.equal(stageOneComplete([...old.completed,21,22,23,24]),true);
  const records=loadCampaignRecords(storage);
  const guided=campaignStageRecord(records,"workshop","guided");
  assert.equal(guided.completed.length,20);
  assert.equal(guided.completed.includes("master-20"),true);
  assert.equal(guided.completed.includes("crates-21"),false);
  assert.deepEqual(JSON.parse(contents.get("mathssprites.progress.v1")),old,
    "do not rewrite legacy progress when adding Guided levels");
});
