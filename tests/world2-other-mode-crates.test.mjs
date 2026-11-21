import test from "node:test";
import assert from "node:assert/strict";
import {OPPOSITE_LEVELS,OPPOSITE_CHAPTERS,OPPOSITE_CRATE_OPERATIONS}
  from "../src/opposite-levels.mjs";
import {OPPOSITE_OPTIMAL_MOVES} from "../src/opposite-star-benchmarks.mjs";
import {initialState,perform,undo,validInitialLevel,evaluate,
  equation,isSolved,balanceDifference} from "../src/engine.mjs";
import {crateExpansionPlan} from "../src/crate-expansion.mjs";
import {crateMarkup} from "../src/group-crates.mjs";
import {startNotebook,notebookReplayScript,undoNotebookLine}
  from "../src/notebook-engine.mjs";
import {tryNotebookOperation,previewNotebookOperation,notebookEquationMathML}
  from "../src/notebook-maths-editor.mjs";
import {curriculumForLevel} from "../src/curriculum.mjs";
import {signedActionsFor} from "../scripts/world2-shortest-routes.mjs";
import {blankCampaignRecords,withCampaignCompleted,campaignStars,campaignStarTotals}
  from "../src/campaign-records.mjs";

const independent=OPPOSITE_LEVELS.independent.slice(16);
const apprentice=OPPOSITE_LEVELS.notebook.slice(12);
const expectations={
  independent:[
    ["op-i-17","2(x − 1) + 2 = 8",4,"left",2,2],
    ["op-i-18","3(x − 1) = 12",5,"left",3,3],
    ["op-i-19","x + 3 = 2(x − 1)",5,"right",2,3],
    ["op-i-20","2(x − 2) + x + 3 = x + 11",6,"left",2,4]
  ],
  notebook:[
    ["op-a-13","2(x + 1) − 2 = 10",5,"left",2,2],
    ["op-a-14","3(x + 1) = 18",5,"left",3,3],
    ["op-a-15","x + 4 = 2(x − 1)",6,"right",2,3],
    ["op-a-16","2(x − 1) + x + 2 = x + 12",6,"left",2,3]
  ]
};

test("eight appended signed-crate puzzles preserve 52 old signed IDs and all old star thresholds",()=>{
  assert.deepEqual(OPPOSITE_LEVELS.independent.slice(0,16).map(s=>s.id),
    Array.from({length:16},(_,i)=>"op-i-"+String(i+1).padStart(2,"0")));
  assert.deepEqual(OPPOSITE_LEVELS.notebook.slice(0,12).map(s=>s.id),
    Array.from({length:12},(_,i)=>"op-a-"+String(i+1).padStart(2,"0")));
  assert.equal(OPPOSITE_LEVELS.guided.length,24);
  assert.equal(OPPOSITE_LEVELS.independent.length,20);
  assert.equal(OPPOSITE_LEVELS.notebook.length,16);
  assert.equal(OPPOSITE_CHAPTERS.independent[4].id,"independent-crates");
  assert.equal(OPPOSITE_CHAPTERS.notebook[3].id,"signed-brackets");
  assert.deepEqual(OPPOSITE_OPTIMAL_MOVES.independent.slice(0,16),
    [1,1,1,1,2,2,3,3,2,2,3,3,3,3,3,3]);
  assert.deepEqual(OPPOSITE_OPTIMAL_MOVES.notebook.slice(0,12),
    [1,1,2,2,2,3,3,3,3,3,3,3]);
  for(const stage of ["independent","notebook"]){
    const rows=stage==="independent"?independent:apprentice;
    for(const [i,slot] of rows.entries()){
      const [id,expression,solution,side,count,par]=expectations[stage][i];
      assert.equal(slot.id,id);
      assert.equal(slot.level.contentRevision,1);
      assert.equal(slot.chapterIndex,stage==="independent"?4:3);
      assert.equal(equation(initialState(slot.level)),expression,id);
      assert.equal(slot.level.solution,solution);
      assert.equal(validInitialLevel(slot.level),true);
      assert.equal(balanceDifference(initialState(slot.level)),0);
      assert.equal(isSolved(initialState(slot.level)),false);
      assert.deepEqual(slot.level.allowedOperations,OPPOSITE_CRATE_OPERATIONS);
      assert.equal(slot.level.groupedPrototype,true);
      assert.equal(initialState(slot.level)[side].crates.count,count);
      assert.equal(initialState(slot.level)[side==="left"?"right":"left"].crates,undefined);
      assert.ok(signedActionsFor(slot.level).some(a=>a.op==="unpack"&&a.side===side));
      assert.equal(OPPOSITE_OPTIMAL_MOVES[stage][slot.number-1],par);
      assert.equal(curriculumForLevel("opposites",stage,slot.number).flags.sealedCrates,true);
    }
  }
});

test("all Independent authored routes obey two-hand algebra, single-room expansion and exact Undo",()=>{
  for(const slot of independent){
    let state=initialState(slot.level);
    const snapshot=JSON.stringify(state);
    for(const [i,action] of slot.level.referenceRoute.entries()){
      const before=state;
      if(action.op==="unpack"){
        assert.equal(perform(state,action,"manual",action.side).code,"unpack-mode");
        const result=perform(state,action,"auto");
        assert.equal(result.ok,true,slot.id+" local expansion");
        assert.equal(result.state.history.at(-1).mode,"rewrite");
        assert.deepEqual(result.state[action.side==="left"?"right":"left"],
          state[action.side==="left"?"right":"left"]);
        assert.equal(balanceDifference(result.state),0);
        state=result.state;
      }else{
        const first=perform(state,action,"manual","left");
        assert.equal(first.ok,true,slot.id+" step "+(i+1)+" first hand");
        assert.equal(first.committed,false);
        assert.ok(first.state.pending);
        const second=perform(first.state,action,"manual","right");
        assert.equal(second.ok,true,slot.id+" step "+(i+1)+" matching hand");
        assert.equal(second.committed,true);
        assert.equal(second.state.history.at(-1).mode,"manual");
        state=second.state;
      }
      assert.deepEqual(undo(state),before,slot.id+" undo for step "+(i+1));
      assert.equal(balanceDifference(state),0);
      assert.equal(isSolved(state),i===slot.level.referenceRoute.length-1);
    }
    assert.equal(state.history.length,slot.level.referenceRoute.length);
    for(let i=0;i<slot.level.referenceRoute.length;i++)state=undo(state);
    assert.equal(JSON.stringify(state),snapshot);
  }
});

test("Independent crate opening is blocked during an unmatched first hand visit",()=>{
  const level=independent[0].level,initial=initialState(level);
  const first=perform(initial,{op:"divide",factor:2},"manual","left");
  assert.equal(first.ok,true);
  assert.equal(first.state.history.length,0);
  assert.equal(perform(first.state,{op:"unpack",side:"left"},"auto").code,"unpack-mode");
  const finished=perform(first.state,{op:"divide",factor:2},"manual","right");
  assert.equal(finished.ok,true);
  assert.equal(perform(finished.state,{op:"unpack",side:"left"},"auto").ok,true);
});

test("right-chamber crates can open without moving or cancelling left-chamber objects",()=>{
  for(const stage of [independent,apprentice]){
    const level=stage[2].level,initial=initialState(level);
    assert.equal(initial.right.crates.count,2);
    const opened=perform(initial,{op:"unpack",side:"right"});
    assert.equal(opened.ok,true);
    assert.equal(opened.state.right.crates,undefined);
    assert.deepEqual(opened.state.left,initial.left);
    assert.equal(evaluate(opened.state.right,level.solution),
      evaluate(initial.right,level.solution));
    assert.equal(crateExpansionPlan(initial.right).totalBalloons,2);
    assert.equal((crateMarkup(initial.right).match(/class="crate-bay-balloon"/g)||[]).length,2);
    assert.deepEqual(undo(opened.state),initial);
  }
});

const operationText=action=>action.op==="unpack"?"open"+action.side:
  action.op==="divide"?"÷"+action.factor:action.op==="multiply"?"×"+action.factor:
  (action.op==="add"?"+":"−")+
    ((action.kind==="negX"||action.kind==="negOne")?"(−":"")+
    (action.count===1&&action.kind.endsWith("X")?"":String(action.count))+
    (action.kind.endsWith("X")?"x":"")+
    ((action.kind==="negX"||action.kind==="negOne")?")":"");

test("all four paper-first signed-bracket levels validate their real editor steps and exact replay",()=>{
  for(const slot of apprentice){
    let session=startNotebook(slot.level);
    const initial=session.state;
    for(const [i,action] of slot.level.referenceRoute.entries()){
      const written=operationText(action);
      const preview=previewNotebookOperation(session,written);
      assert.equal(preview.ok,true,slot.id+" preview "+written+" "+(preview.message||""));
      const saved=tryNotebookOperation(session,written);
      assert.equal(saved.ok,true,slot.id+" checked "+written+" "+(saved.message||""));
      assert.equal(saved.session.steps.length,i+1);
      if(action.op==="unpack"){
        assert.equal(saved.session.state.history.at(-1).mode,"rewrite");
        assert.deepEqual(saved.session.state[action.side==="left"?"right":"left"],
          session.state[action.side==="left"?"right":"left"]);
      }
      assert.deepEqual(undoNotebookLine(saved.session).state,session.state);
      session=saved.session;
    }
    assert.equal(isSolved(session.state),true,slot.id);
    const script=notebookReplayScript(session);
    assert.deepEqual(script.map(step=>step.action),slot.level.referenceRoute);
    assert.equal(script.length,slot.level.referenceRoute.length);
    assert.deepEqual(script[0].before.left,initial.left);
  }
});

test("bracketed paper shows the physical signed contents rather than prematurely simplifying",()=>{
  const a14=notebookEquationMathML(initialState(apprentice[1].level));
  const a16=notebookEquationMathML(initialState(apprentice[3].level));
  const a13=notebookEquationMathML(initialState(apprentice[0].level));
  assert.match(a14,/<mn>3<\/mn><mo>\(<\/mo><mn>2<\/mn><mi>x<\/mi><mo>−<\/mo><mi>x<\/mi><mo>\+<\/mo><mn>1<\/mn>/);
  assert.match(a16,/<mn>2<\/mn><mo>\(<\/mo><mn>2<\/mn><mi>x<\/mi><mo>−<\/mo><mi>x<\/mi><mo>−<\/mo><mn>1<\/mn>/);
  assert.doesNotMatch(a13,/<mo>\+<\/mo><mo>−<\/mo>/,
    "minus two outside brackets should be minus, not plus-minus");
  assert.match(a13,/<mo>−<\/mo><mn>2<\/mn>/);
});

test("old progress and stars remain unchanged when Independent and Apprentice get four new IDs",()=>{
  let save=blankCampaignRecords();
  for(const stage of ["independent","notebook"]){
    const old=stage==="independent"?16:12;
    for(let n=1;n<=old;n++){
      const id=OPPOSITE_LEVELS[stage][n-1].id;
      save=withCampaignCompleted(save,"opposites",stage,id,
        OPPOSITE_OPTIMAL_MOVES[stage][n-1]);
    }
  }
  const totals=campaignStarTotals(save,{worldId:"opposites"});
  assert.equal(totals.count,60);
  assert.equal(totals.completed,28);
  assert.equal(totals.earned,84);
  assert.equal(totals.available,180);
  for(const slot of [...independent,...apprentice])
    assert.equal(campaignStars(save,"opposites",
      slot.id.startsWith("op-i")?"independent":"notebook",slot.id),0);
});
