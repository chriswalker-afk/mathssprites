import test from "node:test";
import assert from "node:assert/strict";
import {APPRENTICE_LEVELS} from "../src/apprentice-levels.mjs";
import {isSolved,equation} from "../src/engine.mjs";
import {startNotebook,undoNotebookLine,notebookReplayScript} from "../src/notebook-engine.mjs";
import {
  parseNotebookOperation,previewNotebookOperation,tryNotebookOperation,
  notebookEquationMathML,notebookOperationMathML
} from "../src/notebook-maths-editor.mjs";

const level=n=>APPRENTICE_LEVELS[n-1].level;
const apply=(session,command)=>{
  const attempt=tryNotebookOperation(session,command);
  assert.equal(attempt.ok,true,command+": "+attempt.message);
  return attempt.session;
};

test("student types an OPERATION, not the resulting equation",()=>{
  const variants=[
    ["+3",{op:"add",kind:"posOne",count:3}],
    ["−3",{op:"remove",kind:"posOne",count:3}],
    ["-3",{op:"remove",kind:"posOne",count:3}],
    ["-x",{op:"remove",kind:"posX",count:1}],
    ["-2x",{op:"remove",kind:"posX",count:2}],
    ["+12x",{op:"add",kind:"posX",count:12}],
    ["×3",{op:"multiply",factor:3}],
    ["*3",{op:"multiply",factor:3}],
    ["÷2",{op:"divide",factor:2}],
    ["/2",{op:"divide",factor:2}]
  ];
  for(const [typed,expected] of variants)
    assert.deepEqual(parseNotebookOperation(typed).action,expected,typed);
  for(const typed of ["x=5","2x = 8","x + 3 = 8","x/2=3","-","÷",
    "×x","÷x","÷1","×6","-0","-13","-1.5","--3","-1/2","+03",
    "-2x+3","<img src=x>"]){
    const result=parseNotebookOperation(typed);
    assert.equal(result.ok,false,typed);
  }
});

test("operation +3 previews BOTH sides automatically, without changing paper or stars",()=>{
  const session=startNotebook(level(1));
  const before=JSON.stringify(session);
  const preview=previewNotebookOperation(session,"+3");
  assert.equal(preview.ok,true);
  assert.equal(preview.line,"x + 6 = 11");
  assert.equal(preview.explanation,"+ 3 on both sides");
  assert.equal(preview.state.history.length,1);
  assert.equal(JSON.stringify(session),before,"previews may not commit or mutate the original session");
  assert.match(notebookEquationMathML(preview.state),/<math/);
  assert.match(notebookEquationMathML(preview.state),/<mo>=<\/mo>/);
  assert.match(notebookOperationMathML(preview.action),/<mo>\+<\/mo><mn>3<\/mn>/);
  const committed=apply(session,"+3");
  assert.equal(committed.steps.length,1);
  assert.equal(equation(committed.state),preview.line);
  assert.equal(isSolved(committed.state),false);
  assert.equal(equation(session.state),"x + 3 = 8");
});

test("correct −3 operation solves the first level and preserves exact sprite replay script",()=>{
  const session=startNotebook(level(1));
  const result=tryNotebookOperation(session,"−3");
  assert.equal(result.ok,true);
  assert.equal(result.line,"x = 5");
  assert.equal(result.solved,true);
  assert.equal(result.session.state.history.length,1);
  assert.deepEqual(result.session.steps[0].action,{op:"remove",kind:"posOne",count:3});
  const script=notebookReplayScript(result.session);
  assert.equal(script.length,1);
  assert.equal(script[0].action.count,3);
  assert.equal(script[0].after.left.posX,1);
  assert.equal(script[0].after.right.posOne,5);
});

test("whole-group division, sprite removal and reversed equations remain valid",()=>{
  const one=apply(startNotebook(level(2)),"÷2");
  assert.equal(equation(one.state),"x = 6");
  assert.equal(isSolved(one.state),true);
  const two=apply(apply(startNotebook(level(3)),"−4"),"÷2");
  assert.equal(equation(two.state),"x = 4");
  const reverse=apply(apply(apply(startNotebook(level(10)),"−x"),"−3"),"÷2");
  assert.equal(equation(reverse.state),"10 = 2x".replace("10 = 2x","5 = x"));
  assert.equal(isSolved(reverse.state),true);
  const across=apply(apply(startNotebook(level(9)),"−x"),"−3");
  assert.equal(equation(across.state),"x = 5");
});

test("no fractions, unavailable objects, overcrowding or guess-the-answer shortcuts",()=>{
  const start=startNotebook(level(1));
  const original=JSON.stringify(start);
  const failures=[
    ["÷2","fraction"],
    ["−5","missing"],
    ["x = 5","syntax"],
    ["×6","factor"],
    ["-13","range"]
  ];
  for(const [op,code] of failures){
    const result=tryNotebookOperation(start,op);
    assert.equal(result.ok,false,op);
    assert.equal(result.code,code,op);
    assert.equal(JSON.stringify(start),original,op+" must not change the equation");
  }
  const crowded=startNotebook(level(11));
  const overflow=tryNotebookOperation(crowded,"×5");
  assert.equal(overflow.ok,false);
  assert.equal(overflow.code,"overflow");
});

test("undo and alternate routes still count exactly one operation per line",()=>{
  const level5=level(5); // 3x + 6 = 18
  let a=apply(startNotebook(level5),"÷3");
  assert.equal(equation(a.state),"x + 2 = 6");
  a=apply(a,"−2");
  assert.equal(equation(a.state),"x = 4");
  assert.equal(a.state.history.length,2);
  assert.equal(notebookReplayScript(a).length,2);
  let b=apply(startNotebook(level5),"−6");
  b=apply(b,"÷3");
  assert.equal(isSolved(b.state),true);
  assert.deepEqual(b.steps.map(step=>step.action.op),["remove","divide"]);
  const undone=undoNotebookLine(b);
  assert.equal(undone.steps.length,1);
  assert.equal(isSolved(undone.state),false);
  assert.equal(equation(undone.state),"3x = 12");
});

test("MathML is derived from numeric engine state, never from raw student strings",()=>{
  const current=startNotebook(level(3));
  const markup=notebookEquationMathML(current.state);
  assert.match(markup,/<mn>2<\/mn><mi>x<\/mi>/);
  assert.match(markup,/<mo>\+<\/mo>/);
  assert.ok(!markup.includes("script"));
  assert.throws(()=>notebookEquationMathML(null));
  assert.throws(()=>notebookOperationMathML({op:"root",factor:2}));
});
