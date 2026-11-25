import test from "node:test";
import assert from "node:assert/strict";
import {SQUARE_LEVEL_PLAN} from "../src/square-level-plan.mjs";
import {SQUARE_WORKSHOP_EXAMPLES,SQUARE_BUILD_EXAMPLES,SQUARE_WORKSHOP_ROUTE_BUDGET,parseSquareWorkshopSide,parseSquareWorkshopEquation,createSquareWorkshopEquation,proveSquareWorkshopRoute} from "../src/square-workshop.mjs";
import {initialState,validInitialLevel,isSolved,perform,undo,equation,balanceDifference} from "../src/engine.mjs";
import {squareInspectionPolicy} from "../src/square-inspection.mjs";
import {startNotebook,notebookReplayScript} from "../src/notebook-engine.mjs";
import {tryNotebookOperation} from "../src/notebook-maths-editor.mjs";
import {shortestSquareRoute} from "../src/square-route-search.mjs";
import {createWorkshopEquation} from "../src/equation-workshop.mjs";
import {createFractionWorkshopEquation} from "../src/fraction-workshop.mjs";

const command=a=>a.op==="square"?"²":a.op==="sqrt"?"√":
  a.op==="divide"?"÷"+a.factor:a.op==="multiply"?"×"+a.factor:
  (a.op==="add"?"+":"−")+(a.count===1&&a.kind!=="posOne"?"":a.count)+
  (a.kind==="posX2"?"x²":a.kind==="posX"?"x":"");
function accepted(input,goal="isolate"){
  const r=createSquareWorkshopEquation(input,{goal});
  assert.equal(r.ok,true,input+" "+r.message);
  assert.equal(r.level.id,"workshop-custom");
  assert.equal(r.level.squareLaboratory,true);
  assert.equal(r.level.goal,goal);
  assert.equal(validInitialLevel(r.level),true);
  assert.equal(isSolved(initialState(r.level)),false);
  assert.equal(Object.hasOwn(r,"route"),false);
  assert.equal(Object.hasOwn(r,"solution"),false);
  assert.equal(Object.hasOwn(r.level,"reference"),false);
  return r.level;
}
function verify(l){
  const route=proveSquareWorkshopRoute(l);
  assert.ok(route?.length>0&&route.length<=16,equation(initialState(l)));
  const start=initialState(l);
  let guided=start,manual=start,notebook=startNotebook(l);
  for(const action of route){
    const next=perform(guided,action,"auto");
    assert.equal(next.ok,true);assert.equal(next.committed,true);
    guided=next.state;
    const first=perform(manual,action,"manual","right");
    assert.equal(first.ok,true);assert.equal(first.committed,false);
    assert.equal(isSolved(first.state),false);
    const second=perform(first.state,action,"manual","left");
    assert.equal(second.ok,true);assert.equal(second.committed,true);
    manual=second.state;
    const paper=tryNotebookOperation(notebook,command(action));
    assert.equal(paper.ok,true,command(action)+" "+paper.message);
    notebook=paper.session;
    assert.equal(balanceDifference(guided),0);
    assert.deepEqual(manual.left,guided.left);assert.deepEqual(manual.right,guided.right);
    assert.deepEqual(notebook.state.left,guided.left);assert.deepEqual(notebook.state.right,guided.right);
  }
  assert.equal(isSolved(guided),true);assert.equal(isSolved(manual),true);
  assert.equal(isSolved(notebook.state),true);
  assert.equal(notebookReplayScript(notebook).length,route.length);
  while(guided.history.length)guided=undo(guided);
  assert.deepEqual(guided,start);
}
test("square grammar accepts reordered whole terms, Unicode and caret superscripts, and either orientation",()=>{
  assert.deepEqual(parseSquareWorkshopSide("3 + x + 2X^2 + x² + 4x"),{ok:true,room:{posX2:3,posX:5,posOne:3}});
  assert.deepEqual(parseSquareWorkshopEquation("25 = x^2"),{ok:true,left:{posX2:0,posX:0,posOne:25},right:{posX2:1,posX:0,posOne:0}});
  assert.equal(accepted("25=x^2").solution,5);
  assert.equal(accepted("2x²+5x+1=x²+x+22").solution,3);
});
test("each example and all sixty authored square levels can be recreated with the appropriate goal",()=>{
  for(const input of SQUARE_WORKSHOP_EXAMPLES)verify(accepted(input));
  for(const input of SQUARE_BUILD_EXAMPLES)verify(accepted(input,"area"));
  for(const fixture of SQUARE_LEVEL_PLAN){
    const level=accepted(equation(initialState(fixture)),fixture.goal);
    assert.equal(level.solution,fixture.solution,fixture.id);
    verify(level);
  }
});
test("rejects impossible, non-unique, out-of-domain, oversized and unsupported input without exposing a solution",()=>{
  for(const [input,goal,code] of [
    ["x²=x²","isolate","infinitely-many"],
    ["x²=x²+1","isolate","no-solution"],
    ["x²+1=0","isolate","no-solution"],
    ["x²+6=5x","isolate","multiple-solutions"],
    ["x²=2x","isolate","multiple-solutions"],
    ["2x²+3=7x","isolate","multiple-solutions"], // roots 3 and 1/2
    ["x²=2","isolate","solution"],
    ["x²=0","isolate","solution"],
    ["x²=49","isolate","capacity"],
    ["2x=4","isolate","linear"],
    ["x²=4","area","build-linear"],
    ["x+1=8","area","area-capacity"],
    ["x²+48x=3","isolate","capacity"],
    ["x²-1=3","isolate","negative"],
    ["x³=8","isolate","syntax"],
    ["x²/2=4","isolate","syntax"],
    ["x²=2.5","isolate","syntax"],
    ["(x+1)^2=9","isolate","syntax"],
    ["x²=2 5","isolate","syntax"],
    ["x²==25","isolate","equation"],
    ["x²="+ "1".repeat(80),"isolate","length"]
  ]){
    const r=createSquareWorkshopEquation(input,{goal});
    assert.equal(r.ok,false,input);assert.equal(r.code,code,input+" "+r.message);
    assert.equal(Object.hasOwn(r,"level"),false);
    assert.equal(Object.hasOwn(r,"route"),false);
  }
  assert.equal(createSquareWorkshopEquation("x²=25",{goal:"custom"}).code,"goal");
});
test("the bounded certificate is only a representability proof and never selects the learner's next action",()=>{
  const l=accepted("x²+4x=21");
  assert.equal(l.squareInspection,"free");
  assert.equal(squareInspectionPolicy(l,{mode:"auto"}),"guided");
  assert.equal(squareInspectionPolicy(l,{mode:"manual"}),"independent");
  assert.equal(squareInspectionPolicy(l,{mode:"auto",notebook:true}),null);
  assert.equal(squareInspectionPolicy(accepted("x=4","area"),{mode:"auto"}),null);
  assert.equal(proveSquareWorkshopRoute(l,{maxVisited:1}),null);
  assert.ok(shortestSquareRoute(l,3,{maxVisited:SQUARE_WORKSHOP_ROUTE_BUDGET}));
  assert.equal(shortestSquareRoute(l,2),null);
  for(const k of ["startingOperation","startingKind","startingAmount","reference","suggested"])
    assert.equal(Object.hasOwn(l,k),false,k);
  assert.equal(createWorkshopEquation("x²=25").ok,false);
  assert.equal(createFractionWorkshopEquation("x²=25").ok,false);
  assert.equal(createWorkshopEquation("3x+5=20").ok,true);
  assert.equal(createFractionWorkshopEquation("2x=5").ok,true);
});
