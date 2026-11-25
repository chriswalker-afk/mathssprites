import test from "node:test";
import assert from "node:assert/strict";
import {SQUARE_LEVEL_PLAN} from "../src/square-level-plan.mjs";
import {SQUARE_NOTEBOOK_OPTIMAL_MOVES} from "../src/square-star-benchmarks.mjs";
import {findCampaignWorld,findCampaignStage,findCampaignLevel,nextCampaignLevel,isCampaignPlayable} from "../src/campaign-registry.mjs";
import {initialState,isSolved,perform,equation,balanceDifference} from "../src/engine.mjs";
import {startNotebook,tryNotebookLine,undoNotebookLine,notebookReplayScript} from "../src/notebook-engine.mjs";
import {parseNotebookOperation,previewNotebookOperation,tryNotebookOperation,notebookEquationMathML,notebookOperationMathML} from "../src/notebook-maths-editor.mjs";
import {shortestSquareRoute} from "../scripts/square-shortest-routes.mjs";
import {squareInspectionPolicy} from "../src/square-inspection.mjs";
import {blankCampaignRecords,campaignStarTotals,campaignStageRecord,campaignStars,campaignOptimalMoves,withCampaignCompleted,withCampaignLastPlayed,normalizeCampaignResume,stageResumeLevel,saveCampaignRecords,loadCampaignRecords,saveCampaignResume,loadCampaignResume} from "../src/campaign-records.mjs";

const world="squares",stage="notebook";
const level=n=>findCampaignLevel(world,stage,n).level;
const squareMode={squareLaboratory:true};
const command=a=>a.op==="square"?"²":a.op==="sqrt"?"√":
  a.op==="divide"?"÷"+a.factor:a.op==="multiply"?"×"+a.factor:
  (a.op==="add"?"+":"−")+(a.count===1&&a.kind!=="posOne"?"":a.count)+
  (a.kind==="posX2"?"x²":a.kind==="posX"?"x":"");
const apply=(s,op)=>{
  const result=tryNotebookOperation(s,op);
  assert.equal(result.ok,true,op+": "+result.message);
  return result.session;
};

test("all sixteen Apprentice puzzles are published with stable IDs, distinct paper-first goals and no inspection",()=>{
  const w=findCampaignWorld(world),s=findCampaignStage(world,stage);
  assert.deepEqual(w.stages.map(s=>[s.id,s.available,s.count]),[["guided",true,24],["independent",true,20],["notebook",true,16]]);
  assert.equal(s.method,"notebook");
  assert.equal(s.chapters.length,4);
  assert.equal(s.levels.filter(s=>s.level.goal==="area").length,2);
  for(const [i,slot] of s.levels.entries()){
    assert.equal(slot.id,"square-a-"+String(i+1).padStart(2,"0"));
    assert.equal(slot.chapterIndex,Math.floor(i/4));
    assert.equal(isCampaignPlayable(world,stage,slot.id),true);
    assert.equal(Object.hasOwn(slot.level,"reference"),false);
    assert.equal(squareInspectionPolicy(slot.level,{mode:"auto",notebook:true}),null);
    assert.equal(squareInspectionPolicy(slot.level,{mode:"manual",notebook:true}),null);
    assert.equal(isSolved(startNotebook(slot.level).state),false);
    assert.equal(campaignOptimalMoves(world,stage,slot.id),SQUARE_NOTEBOOK_OPTIMAL_MOVES[i]);
    assert.equal(nextCampaignLevel(world,stage,slot.id)?.id,s.levels[i+1]?.id);
  }
  assert.deepEqual(campaignStarTotals(blankCampaignRecords(),{worldId:world,stageId:stage}),{earned:0,available:48,completed:0,count:16});
  assert.deepEqual(campaignStarTotals(blankCampaignRecords(),{worldId:world}),{earned:0,available:180,completed:0,count:60});
  assert.equal(campaignStarTotals(blankCampaignRecords()).count,240);
  assert.equal(campaignStarTotals(blankCampaignRecords()).available,720);
});
test("square and principal-root commands and x² terms are explicitly scoped and typeset",()=>{
  for(const [typed,action] of [
    ["square",{op:"square"}],["²",{op:"square"}],["^2",{op:"square"}],
    ["sqrt",{op:"sqrt"}],["√",{op:"sqrt"}],
    ["−x²",{op:"remove",kind:"posX2",count:1}],
    ["-2x^2",{op:"remove",kind:"posX2",count:2}],
    ["+12x²",{op:"add",kind:"posX2",count:12}]
  ]){
    assert.deepEqual(parseNotebookOperation(typed,squareMode).action,action,typed);
    assert.equal(parseNotebookOperation(typed).ok,false,typed);
    assert.match(notebookOperationMathML(action),/<math/);
  }
  for(const bad of ["x=3","√9","square x","sqrt(x)","x²","^3","+0x²","+13x²","+01x²","×x²","÷x²","+(−x²)","-x³","-x^3","+x^2+3","-1/2","<svg>"]){
    assert.equal(parseNotebookOperation(bad,squareMode).ok,false,bad);
  }
  assert.match(notebookOperationMathML({op:"square"}),/<msup>/);
  assert.match(notebookOperationMathML({op:"sqrt"}),/<msqrt>/);
  assert.match(notebookOperationMathML({op:"remove",kind:"posX2",count:2}),/<mn>2<\/mn><msup><mi>x<\/mi><mn>2<\/mn><\/msup>/);
  assert.match(notebookEquationMathML(startNotebook(level(3)).state),/<msup><mi>x<\/mi><mn>2<\/mn><\/msup>/);
});
test("construction has a distinct area goal; preview does not commit and paper solution alone is not a scene replay",()=>{
  const s=startNotebook(level(1)),original=JSON.stringify(s);
  assert.equal(equation(s.state),"x + 1 = 4");
  assert.throws(()=>notebookReplayScript(s),/Finish your checked algebra/);
  const p=previewNotebookOperation(s,"²");
  assert.equal(p.ok,true);
  assert.equal(p.line,"x² + 2x + 1 = 16");
  assert.equal(p.solved,true);
  assert.equal(JSON.stringify(s),original);
  assert.equal(tryNotebookLine(s,p.line).code,"square-editor");
  const written=apply(s,"square");
  assert.equal(isSolved(written.state),true);
  assert.equal(written.steps.length,1);
  const replay=notebookReplayScript(written);
  assert.deepEqual(replay[0].action,{op:"square"});
  assert.deepEqual(replay[0].after.left,written.state.left);
  assert.deepEqual(undoNotebookLine(written),s);
});
test("incomplete roots, unsupported operations, and unavailable terms leave paper unchanged",()=>{
  const start=startNotebook(level(10)); // x²+4x=32
  const before=JSON.stringify(start);
  assert.equal(tryNotebookOperation(start,"√").code,"unsupported-area");
  assert.equal(tryNotebookOperation(start,"square").ok,false);
  assert.equal(tryNotebookOperation(start,"−x²").ok,false);
  assert.equal(tryNotebookOperation(start,"÷3").ok,false);
  assert.equal(tryNotebookOperation(start,"+(-1)").ok,false);
  assert.equal(tryNotebookOperation(start,"expand left").ok,false);
  assert.equal(tryNotebookOperation(start,"x=4").ok,false);
  assert.equal(JSON.stringify(start),before);
  assert.throws(()=>notebookReplayScript(start),/Finish your checked algebra/);
  let s=apply(start,"+4");
  assert.equal(equation(s.state),"x² + 4x + 4 = 36");
  s=apply(s,"sqrt");
  assert.equal(equation(s.state),"x + 2 = 6");
  s=apply(s,"−2");
  assert.equal(equation(s.state),"x = 4");
  assert.equal(isSolved(s.state),true);
  assert.equal(s.steps.length,3);
  assert.match(s.steps[1].explanation,/principal root/);
  assert.equal(tryNotebookOperation(s,"+1").code,"complete");
  while(s.steps.length)s=undoNotebookLine(s);
  assert.deepEqual(s,start);
});
test("all sixteen certified shortest and authored routes pass the actual operation editor and replay exactly",()=>{
  for(const f of SQUARE_LEVEL_PLAN.filter(l=>l.stage===stage)){
    const l=level(f.number),min=SQUARE_NOTEBOOK_OPTIMAL_MOVES[f.number-1];
    const proof=shortestSquareRoute(l,min);
    assert.ok(proof,f.id);assert.equal(proof.moves,min,f.id);
    assert.equal(f.reference.length,min,f.id);
    if(min>1)assert.equal(shortestSquareRoute(l,min-1),null,f.id);
    for(const route of [proof.route,f.reference]){
      const start=startNotebook(l);let s=start;
      for(const action of route){
        const original=JSON.stringify(s),op=command(action);
        const preview=previewNotebookOperation(s,op);
        assert.equal(preview.ok,true,f.id+" "+op+" "+preview.message);
        assert.deepEqual(preview.action,action);
        assert.equal(JSON.stringify(s),original);
        s=apply(s,op);
        assert.equal(s.steps.length,s.state.history.length);
        assert.equal(balanceDifference(s.state),0);
      }
      assert.equal(isSolved(s.state),true,f.id);
      assert.equal(s.steps.length,min);
      let scene=initialState(l);
      for(const step of notebookReplayScript(s)){
        assert.deepEqual(scene.left,step.before.left);
        assert.deepEqual(scene.right,step.before.right);
        const result=perform(scene,step.action,"auto");
        assert.equal(result.ok,true,f.id);
        scene=result.state;
        assert.deepEqual(scene.left,step.after.left);
        assert.deepEqual(scene.right,step.after.right);
        assert.equal(equation(scene),step.line);
      }
      assert.deepEqual(scene,s.state);
      while(s.steps.length)s=undoNotebookLine(s);
      assert.deepEqual(s,start);
    }
  }
});
test("World 4 notebook validation preserves older-world restrictions and nonnegative uniqueness",()=>{
  const ordinary=findCampaignLevel("workshop","notebook",1).level;
  const old=startNotebook(ordinary);
  for(const op of ["square","√","-x²"])assert.equal(tryNotebookOperation(old,op).ok,false);
  assert.throws(()=>startNotebook({...level(3),squareLaboratory:false}),/positive whole-number/);
  assert.throws(()=>startNotebook({...level(3),solution:-3}),/valid whole-object/);
  assert.throws(()=>startNotebook({...level(3),left:{posX2:1,negOne:1}}),/valid whole-object/);
});
test("Apprentice scoring and resume are separate, and all 48 new stars can be earned",()=>{
  const store={data:new Map(),getItem(k){return this.data.get(k)??null},setItem(k,v){this.data.set(k,v)}};
  let data=blankCampaignRecords();
  data=withCampaignCompleted(data,world,"guided","square-g-01",1);
  data=withCampaignCompleted(data,world,"independent","square-i-01",1);
  const g=JSON.stringify(data.worlds.squares.stages.guided),i=JSON.stringify(data.worlds.squares.stages.independent);
  data=withCampaignLastPlayed(data,world,stage,"square-a-10");
  assert.equal(campaignStageRecord(data,world,stage).completed.length,0);
  data=withCampaignCompleted(data,world,stage,"square-a-10",4);
  assert.equal(campaignStars(data,world,stage,"square-a-10"),2);
  data=withCampaignCompleted(data,world,stage,"square-a-10",3);
  data=withCampaignCompleted(data,world,stage,"square-a-10",6);
  assert.equal(campaignStars(data,world,stage,"square-a-10"),3);
  assert.equal(campaignStageRecord(data,world,stage).lastPlayed,"square-a-11");
  assert.equal(stageResumeLevel(data,world,stage).id,"square-a-11");
  assert.equal(JSON.stringify(data.worlds.squares.stages.guided),g);
  assert.equal(JSON.stringify(data.worlds.squares.stages.independent),i);
  const resume={worldId:world,stageId:stage,levelId:"square-a-11"};
  assert.deepEqual(normalizeCampaignResume(resume),resume);
  saveCampaignRecords(data,store);saveCampaignResume(resume,store);
  assert.deepEqual(loadCampaignRecords(store),data);
  assert.deepEqual(loadCampaignResume(store),resume);
  for(const slot of findCampaignStage(world,stage).levels)
    data=withCampaignCompleted(data,world,stage,slot.id,campaignOptimalMoves(world,stage,slot.id));
  assert.deepEqual(campaignStarTotals(data,{worldId:world,stageId:stage}),{earned:48,available:48,completed:16,count:16});
  assert.equal(campaignStarTotals(data).count,240);
  assert.equal(campaignStarTotals(data).available,720);
});
