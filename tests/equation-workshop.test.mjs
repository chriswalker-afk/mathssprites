import test from "node:test";
import assert from "node:assert/strict";
import {createWorkshopEquation,proveWorkshopRoute,WORKSHOP_EXAMPLES} from "../src/equation-workshop.mjs";
import {
  initialState,perform,isSolved,equation,validInitialLevel,levelActionPermission
} from "../src/engine.mjs";
import {startNotebook,tryNotebookLine} from "../src/notebook-engine.mjs";

function accepted(input){
  const result=createWorkshopEquation(input);
  assert.equal(result.ok,true,input+" "+(result.message||""));
  assert.ok(validInitialLevel(result.level));
  assert.deepEqual(result.level.allowedOperations,["remove","add","divide","multiply"]);
  assert.equal(result.level.lockPositive,true);
  assert.equal(result.level.quantityMode,"positive");
  return result;
}
test("safe creation of arbitrary valid equations, both orientations, both-sided x",()=>{
  for(const input of WORKSHOP_EXAMPLES){
    const result=accepted(input);
    assert.ok(result.normalizedEquation.includes("="));
    assert.equal(isSolved(initialState(result.level)),false);
  }
  assert.equal(accepted(" 3X + 5  =  20 ").normalizedEquation,"3x + 5 = 20");
  assert.equal(accepted("3 + x = 9").normalizedEquation,"x + 3 = 9");
  assert.equal(accepted("5x + 5 = 2x + 20").level.solution,5);
  assert.equal(accepted("19=2x+9").level.solution,5);
  assert.equal(accepted("2x+0=10").level.solution,5);
});
test("each generated equation has a physically legal route to one isolated sprite",()=>{
  for(const text of [
    ...WORKSHOP_EXAMPLES,"6x=42","25x=25","x+47=48",
    "15x + 5 = 5x + 45","30x + 10 = 20x + 40",
    "48 = 3x + 12","2x+4=3x+1"
  ]){
    const {level}=accepted(text);
    const route=proveWorkshopRoute(level);
    assert.ok(route?.length>0,text);
    let state=initialState(level);
    for(const action of route){
      const move=perform(state,action,"auto");
      assert.equal(move.ok,true,text+" "+JSON.stringify(action));
      state=move.state;
      assert.equal(state.pending,null);
      assert.equal(state.history.length<=20,true);
    }
    assert.equal(isSolved(state),true,text+" final "+equation(state));
    assert.equal(state.history.length,route.length);
    assert.equal(levelActionPermission(state,{op:"square"}).code,"locked-operation");
    assert.equal(levelActionPermission(state,{op:"sqrt"}).code,"locked-operation");
    assert.equal(perform(state,{op:"add",kind:"negOne",count:1},"auto").ok,false);
  }
});
test("clear, specific feedback for unsupported algebra and physical limits",()=>{
  const cases=[
    ["x=x","infinitely-many"],["x+5=x+5","infinitely-many"],
    ["2x+5=2x+6","no-solution"],["2x=2x+1","no-solution"],
    ["x=0","zero-solution"],["x+5=5","zero-solution"],
    ["x+5=3","negative-solution"],["3x+5=x+1","negative-solution"],
    ["2x=5","fraction-solution"],["2x+3=8","fraction-solution"],
    ["x=49","solution-overflow"],["7x=21","unrepresentable"],
    ["11x=33","unrepresentable"],["13x+2=41","unrepresentable"],
    ["x=5","already-solved"],["5=x","already-solved"],
    ["x-2=5","negative"],["x/2=4","fraction"],
    ["x²=9","fraction"],["x+1.5=4","fraction"],
    ["x=2=3","equation"],["x+999=1000","capacity"],
    ["<script>alert(1)</script>","syntax"],
    ["2x+5=foo","syntax"],["","equation"]
  ];
  for(const [input,code] of cases){
    const out=createWorkshopEquation(input);
    assert.equal(out.ok,false,input);
    assert.equal(out.code,code,input+" "+out.code+" "+out.message);
    assert.ok(out.message.length>10);
    assert.equal("level" in out,false,"invalid input must never create a scene");
  }
});
test("generated levels remain compatible with notebook validator and without unwanted mutations",()=>{
  const first=accepted("3x+5=20");
  let notebook=startNotebook(first.level);
  const before=equation(notebook.state);
  const bad=tryNotebookLine(notebook,"x=5");
  assert.equal(bad.ok,false);
  assert.equal(equation(notebook.state),before);
  const next=tryNotebookLine(notebook,"3x=15");
  assert.equal(next.ok,true);
  notebook=next.session;
  const finish=tryNotebookLine(notebook,"x=5");
  assert.equal(finish.ok,true);
  assert.equal(finish.solved,true);
  assert.equal(createWorkshopEquation("2x+3=11").normalizedEquation,"2x + 3 = 11");
});
test("route proof does not leak user-facing answer or mark any campaign level",()=>{
  const result=accepted("3x+5=20");
  assert.equal(Object.hasOwn(result,"route"),false);
  assert.equal(Object.hasOwn(result,"solution"),false);
  assert.equal(result.level.number,undefined);
  assert.equal(result.level.title.includes("= 5"),false);
  assert.equal(result.level.prompt.includes("x = 5"),false);
  assert.equal(result.level.id,"workshop-custom");
  assert.equal(result.level.suggested.includes("x = 5"),false);
});
