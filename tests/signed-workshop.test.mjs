import test from "node:test";
import assert from "node:assert/strict";
import {createSignedWorkshopEquation,parseSignedWorkshopEquation,proveSignedWorkshopRoute,SIGNED_WORKSHOP_EXAMPLES} from "../src/signed-workshop.mjs";
import {initialState,perform,isSolved,balanceDifference,attachAvailablePairs} from "../src/engine.mjs";
import {startNotebook,notebookReplayScript} from "../src/notebook-engine.mjs";
import {tryNotebookOperation} from "../src/notebook-maths-editor.mjs";

const examples=[...SIGNED_WORKSHOP_EXAMPLES,"3x - 2x + 3 - 5 = 6","x - (-3) = 8","-3x + 15 = 0","4x - 8 = -x + 12","0 = -2x + 10","x + 1 - 1 = 5","36x - 36 = 0","-24x + 24 = 24x - 24"];
test("signed workshop parses actual objects, not only simplified coefficients",()=>{
  const result=parseSignedWorkshopEquation("3x − 2x + 3 − 5 = 6");
  assert.ok(result.ok);
  assert.deepEqual([result.left.posX,result.left.negX,result.left.posOne,result.left.negOne],[3,2,3,5]);
  assert.equal(result.right.posOne,6);
  assert.equal(parseSignedWorkshopEquation("x - (-3) = 8").left.posOne,3);
});
test("every accepted example has a verified whole-object route and uses only signed linear tools",()=>{
  for(const input of examples){
    const r=createSignedWorkshopEquation(input);
    assert.ok(r.ok,input+": "+r.message);
    assert.equal(r.level.quantityMode,"signed");
    assert.deepEqual(r.level.allowedKinds,["posX","negX","posOne","negOne"]);
    assert.equal(r.level.allowedOperations.includes("square"),false);
    assert.equal(r.level.id,"workshop-custom");
    assert.equal("route" in r,false);
    let state=initialState(r.level);
    const route=proveSignedWorkshopRoute(r.level);
    assert.ok(route?.length>0&&route.length<=16,input);
    for(const action of route){
      const result=perform(state,action,"auto");
      assert.ok(result.ok,input);
      state=result.state;
      assert.equal(balanceDifference(state),0);
    }
    assert.ok(isSolved(state),input);
  }
});
test("signed free play rejects invalid or unsupported equations without widening World 2",()=>{
  for(const [input,code] of [
    ["x=x","infinitely-many"],["x=x+1","no-solution"],["x+5=3","negative-solution"],
    ["x-2=-2","zero-solution"],["2x=5","fraction-solution"],["7x=21","unrepresentable"],
    ["x=5","already-solved"],["49x-49x+x=4","capacity"],["x/2=5","number-system"],
    ["x²=9","number-system"],["2(x-3)=8","syntax"],["x--3=8","syntax"],["x=1=2","equation"],
    ["x=alert(1)","syntax"]
  ]){
    const result=createSignedWorkshopEquation(input);
    assert.equal(result.ok,false,input);
    assert.equal(result.code,code,input);
  }
});
test("starting opposite objects remain available for local pair cancellation",()=>{
  const result=createSignedWorkshopEquation("3x-2x+3-5=6");
  assert.ok(result.ok);
  let state=initialState(result.level);
  const sprites=attachAvailablePairs(state,"left","sprites");
  assert.ok(sprites.ok);state=sprites.state;
  const weights=attachAvailablePairs(state,"left","constants");
  assert.ok(weights.ok);state=weights.state;
  assert.equal(balanceDifference(state),0);
  assert.equal(state.left.posX,1);assert.equal(state.left.negOne,2);
  assert.equal(state.history.length,0);
});
test("signed custom equations support the existing paper-first operation checker",()=>{
  const result=createSignedWorkshopEquation("2x-3=x+4");
  let session=startNotebook(result.level);
  for(const action of ["-x","+3"]){
    const next=tryNotebookOperation(session,action);
    assert.ok(next.ok,next.message);session=next.session;
  }
  assert.ok(isSolved(session.state));
  assert.equal(notebookReplayScript(session).length,2);
});
