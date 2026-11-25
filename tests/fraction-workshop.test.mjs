import test from "node:test";
import assert from "node:assert/strict";
import {rational as q,req} from "../src/rational.mjs";
import {FRACTION_LEVEL_PLAN} from "../src/fraction-level-plan.mjs";
import {FRACTION_WORKSHOP_EXAMPLES,createFractionWorkshopEquation,parseFractionWorkshopEquation,parseFractionWorkshopSide,proveFractionWorkshopRoute} from "../src/fraction-workshop.mjs";
import {initialState,prepare,perform,isSolved,equation,balanceDifference} from "../src/engine.mjs";
import {fractionRoomCount} from "../src/fraction-engine.mjs";
import {roomChoreography,gridRoom} from "../src/fraction-choreography.mjs";
import {startFractionNotebook,tryFractionNotebookOperation,fractionNotebookOperationText,fractionNotebookReplayScript} from "../src/fraction-notebook-engine.mjs";
import {createWorkshopEquation} from "../src/equation-workshop.mjs";

function accepted(input){
  const result=createFractionWorkshopEquation(input);
  assert.equal(result.ok,true,input+" "+result.message);
  assert.equal(result.level.id,"fraction-workshop-custom");
  assert.equal(result.level.quantityMode,"fractions");
  assert.equal(Object.hasOwn(result,"route"),false);
  assert.equal(Object.hasOwn(result,"solution"),false);
  assert.equal(Object.hasOwn(result.level,"reference"),false);
  assert.equal(isSolved(initialState(result.level)),false);
  return result.level;
}
function verifyRoute(level){
  const route=proveFractionWorkshopRoute(level);
  assert.ok(route?.length>0&&route.length<=16);
  let state=initialState(level),session=startFractionNotebook(level);
  for(const a of route){
    const p=prepare(state,a);assert.equal(p.ok,true);
    for(const side of ["left","right"]){
      const stages=roomChoreography(a,p.pair[side]);
      assert.deepEqual(gridRoom(stages.prepared),state[side]);
      assert.deepEqual(gridRoom(stages.raw),stages.after);
    }
    const next=perform(state,a,"auto");
    assert.equal(next.ok,true);state=next.state;
    assert.equal(req(balanceDifference(state),0),true);
    assert.ok(fractionRoomCount(state.left)<=48&&fractionRoomCount(state.right)<=48);
    const checked=tryFractionNotebookOperation(session,fractionNotebookOperationText(a));
    assert.equal(checked.ok,true);session=checked.session;
  }
  assert.equal(isSolved(state),true);
  assert.equal(isSolved(session.state),true);
  assert.equal(fractionNotebookReplayScript(session).length,route.length);
  return route;
}
test("fraction equation grammar accepts conventional notation, exact reductions, mixed numbers and either orientation",()=>{
  for(const text of ["(2/3)x+1/2","2x/3 + 2/4","2/3X+1/2","(2x/3)+1/2","1/2 + (2/3)x"]){
    const parsed=parseFractionWorkshopSide(text);
    assert.equal(parsed.ok,true,text);assert.deepEqual(parsed.room.posX,q(2,3));assert.deepEqual(parsed.room.posOne,q(1,2));
  }
  const mixed=parseFractionWorkshopEquation("(1 1/2)x + 2 1/4 = 6");
  assert.equal(mixed.ok,true);assert.deepEqual(mixed.left.posX,q(3,2));assert.deepEqual(mixed.left.posOne,q(9,4));
  assert.deepEqual(accepted("5 = 2x").solution,q(5,2));
  assert.deepEqual(accepted("x + 1 1/2 = 4").solution,q(5,2));
  assert.deepEqual(accepted("x/2 = 7/4").solution,q(7,2));
  assert.deepEqual(accepted("x+14/28=3").solution,q(5,2));
  assert.deepEqual(accepted("x+1/3+1/5+2/3=3").solution,q(9,5));
});
test("all workshop examples and the sixty previously planned equations receive a real engine certificate",()=>{
  for(const input of FRACTION_WORKSHOP_EXAMPLES)verifyRoute(accepted(input));
  for(const fixture of FRACTION_LEVEL_PLAN){
    const original=initialState(fixture);
    const custom=accepted(equation(original));
    assert.deepEqual(custom.solution,fixture.solution,fixture.id);
    verifyRoute(custom);
  }
});
test("certificate search can clear a denominator before cancellation and find routes for large common terms",()=>{
  const level=accepted("x/3 = x/5 + 2/5");
  assert.deepEqual(level.solution,q(3));
  const route=verifyRoute(level);
  assert.equal(route[0].op,"multiply");
  verifyRoute(accepted("24x + 12 = 12x + 24"));
  verifyRoute(accepted("48 = 48x"));
  verifyRoute(accepted("x/2 = 24"));
  verifyRoute(accepted("3x = 1/4"));
});
test("invalid, unsupported, trivial or unproven equations cannot launch a room",()=>{
  const cases=[
    ["x=x","infinitely-many"],["x+1/2=x+1/3","no-solution"],["x+1/2=1/2","zero-solution"],
    ["x+1/2=1/4","negative-solution"],["5x=1/3","fraction-solution"],["x/12=5","solution-overflow"],
    ["x=7/2","already-solved"],["7x=21","unrepresentable"],["x+48=49","capacity"],
    ["x+5/7=2","unsupported-denominator"],["x+1/3+1/5=2","unsupported-denominator"],
    ["x+1/0=2","denominator"],["x-1/2=2","negative"],["x+1.5=4","syntax"],["x^2=4","syntax"],
    ["2(x+1)=4","syntax"],["x+1 3/2=4","syntax"],["x+1 2=4","syntax"],["x=1=2","equation"],
    ["x+<script>=2","syntax"],["x+"+"1".repeat(90)+"=2","length"]
  ];
  for(const [input,code] of cases){
    const result=createFractionWorkshopEquation(input);
    assert.equal(result.ok,false,input);assert.equal(result.code,code,input+" "+result.message);
    assert.equal(Object.hasOwn(result,"level"),false,input);
  }
  assert.equal(proveFractionWorkshopRoute({quantityMode:"fractions",left:{posX:7},right:{posOne:21},solution:3}),null);
});
test("whole-number mode still has its original exact grammar and separate rules",()=>{
  assert.equal(createWorkshopEquation("2x=5").code,"fraction-solution");
  assert.equal(createWorkshopEquation("x+1/2=3").code,"fraction");
  assert.equal(createWorkshopEquation("2x=6").level.quantityMode,"positive");
  assert.equal(createFractionWorkshopEquation("2x=6").level.quantityMode,"fractions");
});
