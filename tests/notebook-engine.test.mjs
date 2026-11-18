import test from "node:test";
import assert from "node:assert/strict";
import {WORLD1_LEVELS} from "../src/worlds.mjs";
import {INDEPENDENT_LEVELS} from "../src/independent-levels.mjs";
import {isSolved,initialState,perform,equation} from "../src/engine.mjs";
import {
 parseNotebookSide,parseNotebookEquation,notebookStateMatches,
 startNotebook,tryNotebookLine,undoNotebookLine,notebookReplayScript,
 NOTEBOOK_MAX_INPUT,NOTEBOOK_MAX_STEPS
} from "../src/notebook-engine.mjs";

const level=id=>[...WORLD1_LEVELS,...INDEPENDENT_LEVELS].find(slot=>slot.id===id)?.level;
const input=(session,line)=>{
  const result=tryNotebookLine(session,line);
  assert.equal(result.ok,true,`${line}: ${result.message||result.code||"unexpected"}`);
  return result.session;
};

test("strict positive whole-number parser handles reordered terms but never signed, fractional or squared terms",()=>{
  assert.deepEqual(parseNotebookSide("3 + x + 2x"),{ok:true,x:3,constant:3});
  assert.deepEqual(parseNotebookEquation("2x + 3 = 11"),{
    ok:true,left:{x:2,constant:3},right:{x:0,constant:11}
  });
  assert.deepEqual(parseNotebookEquation("0 = x"),{
    ok:true,left:{x:0,constant:0},right:{x:1,constant:0}
  });
  const failures=[
    ["x-2=5","negative"],["x + (2) = 5","fraction"],
    ["x/2=5","fraction"],["x²=9","fraction"],
    ["x+1.5=5","fraction"],["x + = 5","syntax"],
    ["x==5","equation"],["x=5=6","equation"],
    ["x=5x+100","capacity"],["x=5x+001","syntax"],
    ["x=1e3","syntax"],["x=5;alert(1)","fraction"]
  ];
  for(const [line,code] of failures)
    assert.equal(parseNotebookEquation(line).code,code,line);
  assert.equal(parseNotebookEquation("a".repeat(NOTEBOOK_MAX_INPUT+1)).code,"length");
});

test("notebook only accepts ONE physically representable balanced action per line",()=>{
  let s=startNotebook(level("resident"));
  assert.equal(equation(s.state),"x + 2 = 5");
  assert.equal(tryNotebookLine(s,"x=3").ok,true);
  const changed=tryNotebookLine(s,"x + 2 = 5");
  assert.equal(changed.code,"unchanged");
  assert.equal(s.steps.length,0,"rejected lines must not mutate session");
  const invalid=tryNotebookLine(s,"x + 1 = 5");
  assert.equal(invalid.code,"not-equivalent");
  s=input(s,"x = 3");
  assert.equal(isSolved(s.state),true);
  assert.equal(s.steps[0].action.op,"remove");
  assert.equal(s.steps[0].action.count,2);
  assert.equal(tryNotebookLine(s,"x=3").code,"complete");
  assert.equal(notebookReplayScript(s).length,1);
});

test("rejects correct answer jumps that hide more than one physical operation",()=>{
  let s=startNotebook(level("two-step-09"));
  assert.equal(tryNotebookLine(s,"x=4").code,"not-one-move");
  assert.equal(s.steps.length,0);
  s=input(s,"2x = 8");
  s=input(s,"x=4");
  assert.equal(isSolved(s.state),true);
  assert.deepEqual(s.steps.map(step=>step.action.op),["remove","divide"]);
  assert.deepEqual(notebookReplayScript(s).map(step=>step.line),["2x = 8","x = 4"]);
});

test("alternative VALID routes and equation term reordering produce the same physical history",()=>{
  const lvl=level("two-step-10"); // 3x+6=18, x=4
  const a=input(input(startNotebook(lvl),"x+2=6"),"x=4"); // share then tidy
  const b=input(input(startNotebook(lvl),"3x=12"),"x=4"); // tidy then share
  assert.deepEqual(a.steps.map(x=>x.action.op),["divide","remove"]);
  assert.deepEqual(b.steps.map(x=>x.action.op),["remove","divide"]);
  for(const session of [a,b]){
    assert.equal(isSolved(session.state),true);
    const script=notebookReplayScript(session);
    assert.equal(script.length,2);
    assert.equal(script[0].before.left.posX,3);
    assert.equal(script.at(-1).after.left.posX,1);
    assert.equal(script.at(-1).after.right.posOne,4);
    assert.equal(session.state.history.length,2);
  }
});

test("supports x on both sides, reverse orientation, addition, multiplication and undo",()=>{
  const across=level("across-13");
  let s=startNotebook(across); // 2x+3 = x+7
  s=input(s,"x + 3 = 7");
  s=input(s,"x=4");
  assert.equal(isSolved(s.state),true);
  const reverse=startNotebook(level("independent-03")); // 9=x+3
  const solved=input(reverse,"6 = x");
  assert.equal(isSolved(solved.state),true);

  // Whole-object alternative operations are accepted if the engine permits them.
  let a=startNotebook(level("resident")); // x+2=5
  a=input(a,"2x + 4 = 10"); // multiply both sides by two
  assert.equal(a.steps[0].action.op,"multiply");
  a=input(a,"2x = 6"); // remove four weights on both sides
  assert.equal(isSolved(a.state),false);
  a=input(a,"x=3"); // divide by two
  assert.equal(isSolved(a.state),true);
  let reverted=undoNotebookLine(a);
  assert.equal(isSolved(reverted.state),false);
  assert.equal(reverted.steps.length,2);
  reverted=undoNotebookLine(reverted);
  assert.equal(reverted.steps.length,1);
  assert.equal(reverted.state.history.length,1);
  assert.throws(()=>notebookReplayScript(reverted),/Finish your checked algebra/);
});

test("cannot sneak signs, fractions or square-root operations through a correct-looking line",()=>{
  const lvl=level("two-step-09");
  const base=startNotebook(lvl);
  for(const line of ["2x+1.5=9.5","x²=16","-2x=-8","x/2 = 2"]){
    assert.equal(tryNotebookLine(base,line).ok,false,line);
    assert.equal(base.steps.length,0);
  }
  assert.equal(tryNotebookLine(base,"x + 3 = 7").ok,false,
    "An equivalent-looking shortcut must still match a SINGLE physical step");
  assert.throws(()=>notebookReplayScript(base),/Finish your checked algebra/);
  const bad={...lvl,left:{posX:1,negOne:2},quantityMode:"signed"};
  assert.throws(()=>startNotebook(bad),/positive whole-number/);
  const square={...lvl,allowedOperations:["square"]};
  assert.throws(()=>startNotebook(square),/positive whole-number/);
});

test("valid scripts replay the exact existing engine history, never an invented mathematical action",()=>{
  const lvl=level("independent-14"); // x+11=3x+1 => -x,-1,/2
  let session=startNotebook(lvl);
  session=input(session,"11 = 2x + 1");
  session=input(session,"10 = 2x");
  session=input(session,"5 = x");
  const script=notebookReplayScript(session);
  let replay=initialState(lvl);
  for(const step of script){
    assert.equal(equation(replay),equation(step.before));
    const result=perform(replay,step.action,"auto");
    assert.equal(result.ok,true);
    assert.equal(equation(result.state),equation(step.after));
    replay=result.state;
  }
  assert.equal(isSolved(replay),true);
  assert.equal(replay.history.length,session.steps.length);
  assert.equal(NOTEBOOK_MAX_STEPS,16);
});
