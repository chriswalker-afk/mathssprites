import test from "node:test";
import assert from "node:assert/strict";
import {INDEPENDENT_LEVELS} from "../src/independent-levels.mjs";
import {APPRENTICE_LEVELS} from "../src/apprentice-levels.mjs";
import {initialState,perform,isSolved,undo,equation,balanceDifference,
  validInitialLevel,levelActionPermission,evaluate,previewRoomAction} from "../src/engine.mjs";
import {startNotebook,notebookReplayScript,undoNotebookLine} from "../src/notebook-engine.mjs";
import {parseNotebookOperation,tryNotebookOperation,previewNotebookOperation,
  notebookEquationMathML,notebookOperationMathML} from "../src/notebook-maths-editor.mjs";
import {crateCount} from "../src/group-crates.mjs";
import {optimalMoves} from "../src/star-ratings.mjs";

const d=n=>({op:"divide",factor:n});
const rm=(kind,n)=>({op:"remove",kind,count:n});
const unpack={op:"unpack",side:"left"};
const independent=INDEPENDENT_LEVELS.slice(16);
const apprentice=APPRENTICE_LEVELS.slice(12);
const independentEquations=[
  "2(x + 1) = 8",
  "3(x + 2) = 21",
  "2(x + 3) + 2 = 16",
  "2(x + 3) + x = 2x + 10"
];
const apprenticeEquations=[
  "2(x + 1) = 8",
  "3(x + 2) = 21",
  "2(x + 3) + 2 = 16",
  "2(x + 4) + 3x = x + 24"
];
test("every newly-authored grouped level has its exact intended linear equation",()=>{
  for(const [stage,slots,ids,expected] of [
    ["independent",independent,"independent",independentEquations],
    ["notebook",apprentice,"apprentice",apprenticeEquations]]){
    assert.equal(slots.length,4);
    for(const [i,slot] of slots.entries()){
      const level=slot.level;
      assert.equal(slot.number,(stage==="independent"?17:13)+i);
      assert.equal(slot.id,ids+"-"+String(slot.number).padStart(2,"0"));
      assert.equal(equation(initialState(level)),expected[i],slot.id);
      assert.equal(validInitialLevel(level),true,slot.id);
      assert.equal(level.groupedPrototype,true,slot.id);
      assert.deepEqual(level.allowedOperations,["remove","add","divide","multiply","unpack"]);
      assert.equal(level.quantityMode,"positive");
      assert.equal(balanceDifference(initialState(level)),0);
      assert.equal(isSolved(initialState(level)),false);
      assert.ok(optimalMoves(stage,slot.number)>=3,slot.id);
      assert.equal(crateCount(initialState(level).left),i===1?3:2);
      assert.equal(crateCount(initialState(level).right),0);
    }
  }
});

test("opening a sealed expression conserves value, needs no paired visit, and is undoable",()=>{
  for(const slot of independent){
    const before=initialState(slot.level);
    const pending=perform(before,rm("posOne",1),"manual","left");
    // Only the crate-only levels have zero loose weights, hence cannot
    // start a physical removal in the west. Explicit opposite visit works
    // as an example of an unmatched, forbidden local expansion.
    if(pending.ok&&pending.state.pending)
      assert.equal(perform(pending.state,unpack,"auto").code,"unpack-mode");
    const opened=perform(before,unpack,"auto");
    assert.equal(opened.ok,true,slot.id);
    assert.equal(opened.committed,true);
    assert.equal(opened.state.history.length,1);
    assert.equal(opened.state.history[0].mode,"rewrite");
    assert.deepEqual(opened.state.right,before.right);
    assert.equal(evaluate(opened.state.left,slot.level.solution),
      evaluate(before.left,slot.level.solution));
    assert.equal(balanceDifference(opened.state),0);
    assert.equal(crateCount(opened.state.left),0);
    assert.equal(perform(before,unpack,"manual","left").code,"unpack-mode");
    assert.deepEqual(undo(opened.state),before);
    assert.equal(levelActionPermission(before,{op:"square"}).code,"locked-operation");
    assert.equal(perform(opened.state,unpack).code,"no-crates");
  }
});

test("a student's valid paired operation remains two separate hand visits",()=>{
  for(const slot of independent){
    const original=initialState(slot.level);
    const action=slot.number===18?d(3):slot.number===20?rm("posX",1):d(2);
    const first=perform(original,action,"manual","left");
    if(!first.ok){ // The last mixed balance cannot be halved with a loose x.
      assert.equal(slot.number,20);
      continue;
    }
    assert.equal(first.committed,false);
    assert.equal(first.state.history.length,0);
    assert.ok(first.state.pending);
    assert.equal(isSolved(first.state),false);
    const second=perform(first.state,action,"manual","right");
    assert.equal(second.ok,true);
    assert.equal(second.state.history.length,1);
    assert.equal(second.state.history[0].mode,"manual");
    assert.equal(second.state.pending,null);
    assert.equal(balanceDifference(second.state),0);
  }
});

test("mixed groups divide only if BOTH crates and loose items stay whole",()=>{
  const a=initialState(independent[2].level);
  assert.equal(perform(a,d(3)).code,"crate-split");
  const divided=perform(a,d(2));
  assert.equal(divided.ok,true);
  assert.equal(crateCount(divided.state.left),1);
  assert.equal(divided.state.left.posOne,1);
  assert.equal(divided.state.right.posOne,8);
  let result=perform(divided.state,unpack);
  assert.equal(result.ok,true);
  assert.equal(equation(result.state),"x + 4 = 8");
  result=perform(result.state,rm("posOne",4));
  assert.equal(result.ok,true);
  assert.equal(isSolved(result.state),true);
  const b=initialState(independent[3].level);
  assert.equal(perform(b,d(2)).code,"fraction");
  assert.equal(perform(b,rm("posOne",1)).ok,false);
  assert.equal(perform(b,rm("posX",1)).ok,true);
  assert.equal(previewRoomAction(b.left,unpack,"positive","left").ok,true);
});

test("notebook explicitly chooses a local Expand; never silently expands MathML",()=>{
  const level=apprentice[2].level;
  const session=startNotebook(level);
  const current=notebookEquationMathML(session.state);
  assert.match(current,/<mn>2<\/mn><mo>\(<\/mo>/);
  assert.match(current,/<mo>\)<\/mo><mo>\+<\/mo><mn>2<\/mn>/);
  assert.deepEqual(parseNotebookOperation("expand left").action,unpack);
  assert.deepEqual(parseNotebookOperation("OPEN west").action,unpack);
  assert.deepEqual(parseNotebookOperation("expand right").action,{op:"unpack",side:"right"});
  assert.match(notebookOperationMathML(unpack),/Expand west/);
  assert.equal(previewNotebookOperation(session,"expand right").ok,false);
  assert.equal(previewNotebookOperation(session,"expand left").ok,true);
  assert.equal(session.steps.length,0,"A preview never applies the rewrite");
  const expanded=tryNotebookOperation(session,"expand left");
  assert.equal(expanded.ok,true);
  assert.equal(expanded.action.op,"unpack");
  assert.equal(expanded.session.steps.length,1);
  assert.equal(expanded.session.state.history[0].mode,"rewrite");
  assert.equal(equation(expanded.session.state),"2x + 8 = 16");
  assert.doesNotMatch(notebookEquationMathML(expanded.session.state),/<mo>\(<\/mo>/);
  assert.equal(isSolved(expanded.session.state),false);
  assert.deepEqual(undoNotebookLine(expanded.session).state,session.state);
  assert.equal(previewNotebookOperation(expanded.session,"expand left").ok,false);
  assert.equal(tryNotebookOperation(startNotebook(apprentice[0].level),"−1").ok,false);
});

test("all four notebook challenges replay their exact checked physical route",()=>{
  const routes=[
    ["÷2","expand left","−1"],
    ["÷3","expand left","−2"],
    ["÷2","expand left","−4"],
    ["expand left","−x","−8","÷4"]
  ];
  for(const [i,slot] of apprentice.entries()){
    let session=startNotebook(slot.level);
    for(const expression of routes[i]){
      const applied=tryNotebookOperation(session,expression);
      assert.equal(applied.ok,true,slot.id+" "+expression+" "+applied.message);
      session=applied.session;
    }
    assert.equal(isSolved(session.state),true,slot.id);
    const script=notebookReplayScript(session);
    assert.equal(script.length,routes[i].length);
    assert.equal(script.filter(step=>step.action.op==="unpack").length,1);
    let replay=initialState(slot.level);
    for(const step of script){
      const result=perform(replay,step.action,"auto");
      assert.equal(result.ok,true,slot.id);
      assert.deepEqual(result.state.left,step.after.left);
      assert.deepEqual(result.state.right,step.after.right);
      replay=result.state;
    }
    assert.equal(isSolved(replay),true,slot.id);
  }
});
