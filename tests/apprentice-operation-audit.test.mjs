import test from "node:test";
import assert from "node:assert/strict";
import {findCampaignLevel,findCampaignStage} from "../src/campaign-registry.mjs";
import {canonical,equation,perform,balanceDifference,isSolved,initialState} from "../src/engine.mjs";
import {startNotebook,undoNotebookLine,notebookReplayScript} from "../src/notebook-engine.mjs";
import {parseNotebookOperation,previewNotebookOperation,tryNotebookOperation,notebookAreaOperationMathML} from "../src/notebook-maths-editor.mjs";
import {startFractionNotebook,previewFractionNotebookOperation} from "../src/fraction-notebook-engine.mjs";

const level=(world,n)=>findCampaignLevel(world,"notebook",n).level;
const apply=(s,command)=>{
  const p=tryNotebookOperation(s,command);
  assert.equal(p.ok,true,command+": "+p.message);
  return p.session;
};

test("reported level 5 accepts subtract 8, preserves its written operation, and physically replays the alternate solution",()=>{
  const start=startNotebook(level("opposites",5)),snapshot=JSON.stringify(start);
  const p=previewNotebookOperation(start,"−8");
  assert.equal(p.ok,true);
  assert.equal(p.line,"2x − 5 = x");
  assert.deepEqual(p.action,{op:"remove",kind:"posOne",count:8});
  assert.deepEqual(p.physicalAction,{op:"add",kind:"negOne",count:8});
  assert.equal(p.explanation,"− 8 on both sides");
  assert.match(p.representation,/8 balloons.*zero pairs/);
  assert.equal(JSON.stringify(start),snapshot);
  let s=apply(start,"−8");
  assert.deepEqual(undoNotebookLine(s),start);
  s=apply(s,"−x");
  assert.equal(equation(s.state),"x − 5 = 0");
  s=apply(s,"+5");
  assert.equal(equation(s.state),"x = 5");
  assert.equal(isSolved(s.state),true);
  const script=notebookReplayScript(s);
  assert.equal(script.length,3);
  assert.deepEqual(script[0].action,p.physicalAction);
  assert.equal(script[0].explanation,p.explanation);
  assert.equal(script[0].representation,p.representation);
  let physical=initialState(start.level);
  for(const step of script){
    const next=perform(physical,step.action,"auto");
    assert.equal(next.ok,true);
    assert.deepEqual(next.state.left,step.after.left);
    assert.deepEqual(next.state.right,step.after.right);
    assert.equal(equation(next.state),step.line);
    physical=next.state;
  }
  assert.deepEqual(physical,s.state);
});

test("all four signed object removals can use equivalent opposite additions, without silently opening sealed groups",()=>{
  const s=startNotebook(level("opposites",5));
  for(const [command,kind,line] of [
    ["−8","negOne","2x − 5 = x"],
    ["−(−8)","posOne","2x + 11 = x + 16"],
    ["−2x","negX","3 = −x + 8"],
    ["−(−x)","posX","3x + 3 = 2x + 8"]
  ]){
    const p=previewNotebookOperation(s,command);
    assert.equal(p.ok,true,command);
    assert.equal(p.physicalAction.kind,kind,command);
    assert.equal(p.line,line,command);
    assert.equal(balanceDifference(p.state),0);
  }
  const sealed=startNotebook(level("opposites",13));
  const p=previewNotebookOperation(sealed,"−x");
  assert.equal(p.ok,true,p.message);
  assert.deepEqual(p.state.left.crates,sealed.state.left.crates);
  assert.deepEqual(p.physicalAction,{op:"add",kind:"negX",count:1});
  assert.equal(balanceDifference(p.state),0);
  const literal=previewNotebookOperation(startNotebook(level("opposites",8)),"−(−4)");
  assert.equal(literal.ok,true);
  assert.equal(literal.physicalAction,undefined);
  assert.equal(literal.representation,undefined);
});

test("audit every bounded subtraction of signed objects across all sixteen published starting balances",()=>{
  const kinds={posOne:"negOne",negOne:"posOne",posX:"negX",negX:"posX"};
  for(const slot of findCampaignStage("opposites","notebook").levels){
    const s=startNotebook(slot.level),snapshot=JSON.stringify(s);
    for(const [kind,opposite] of Object.entries(kinds))for(let count=1;count<=12;count++){
      const variable=kind.endsWith("X"),negative=kind.startsWith("neg");
      const term=(variable&&count===1?"":String(count))+(variable?"x":"");
      const command=negative?"−(−"+term+")":"−"+term;
      const requested={op:"remove",kind,count};
      const direct=perform(s.state,requested,"auto");
      const alternative={op:"add",kind:opposite,count};
      const canFallback=!direct.ok&&["missing","locked-crate"].includes(direct.code);
      const expected=canFallback?perform(s.state,alternative,"auto"):direct;
      const actual=previewNotebookOperation(s,command);
      assert.equal(actual.ok,expected.ok,slot.id+" "+command);
      if(!actual.ok)continue;
      assert.deepEqual(actual.action,requested);
      assert.deepEqual(actual.state,expected.state);
      assert.equal(actual.state.history.length,1);
      assert.equal(balanceDifference(actual.state),0);
      const field=variable?"x":"constant",delta=(negative?1:-1)*count;
      for(const side of ["left","right"])
        assert.equal(canonical(actual.state[side])[field],canonical(s.state[side])[field]+delta,slot.id+" "+command);
    }
    assert.equal(JSON.stringify(s),snapshot);
  }
});

test("operation input accepts unambiguous brackets and uppercase variable notation",()=>{
  for(const [typed,action] of [
    ["−(8)",{op:"remove",kind:"posOne",count:8}],
    ["−(+2X)",{op:"remove",kind:"posX",count:2}],
    ["+(−X)",{op:"add",kind:"negX",count:1}],
    ["−(−X)",{op:"remove",kind:"negX",count:1}]
  ])assert.deepEqual(parseNotebookOperation(typed).action,action,typed);
  assert.equal(parseNotebookOperation("−(2x+3)").ok,false);
  assert.equal(parseNotebookOperation("−−3").ok,false);
});

test("world restrictions remain explicit rather than pretending an unsupported operation is mathematically wrong",()=>{
  const positive=startNotebook(level("workshop",1));
  const missing=previewNotebookOperation(positive,"−5");
  assert.equal(missing.code,"missing");
  assert.match(missing.message,/west chamber.*negative term.*nonnegative objects/);
  const fraction=previewNotebookOperation(positive,"÷2");
  assert.equal(fraction.code,"fraction");
  assert.match(fraction.message,/fractional pieces.*World 3/);
  const fractional=startFractionNotebook(level("fractions",9));
  const unavailable=previewFractionNotebookOperation(fractional,"−3");
  assert.equal(unavailable.code,"missing");
  assert.match(unavailable.message,/negative term.*number system/);
  assert.equal(previewFractionNotebookOperation(fractional,"−1/3").ok,true);
  const square=startNotebook(level("squares",10));
  const root=previewNotebookOperation(square,"square root both sides");
  assert.equal(root.code,"unsupported-area");
  assert.match(root.message,/west chamber.*complete square.*principal root/);
  assert.match(previewNotebookOperation(square,"square both sides").message,/higher powers/);
  assert.equal(previewNotebookOperation(positive,"square both sides").ok,false);
});

test("whole-side square and root notation uses both actual expressions, not a placeholder or single x² term",()=>{
  const build=startNotebook(level("squares",1));
  const square=parseNotebookOperation("square both sides",build.level).action;
  const markup=notebookAreaOperationMathML(build.state,square);
  assert.equal((markup.match(/<msup>/g)||[]).length,2);
  assert.equal((markup.match(/<mo>\(<\/mo>/g)||[]).length,2);
  assert.match(markup,/<mi>x<\/mi><mo>\+<\/mo><mn>1<\/mn>/);
  assert.match(markup,/<mo>=<\/mo>/);
  assert.match(markup,/<mn>4<\/mn>/);
  assert.equal(previewNotebookOperation(build,"square both sides").line,"x² + 2x + 1 = 16");
  const completed=apply(startNotebook(level("squares",10)),"+4");
  const root=parseNotebookOperation("square root both sides",completed.level).action;
  const roots=notebookAreaOperationMathML(completed.state,root);
  assert.equal((roots.match(/<msqrt>/g)||[]).length,2);
  assert.match(roots,/<mn>36<\/mn>/);
  assert.equal(previewNotebookOperation(completed,"square root both sides").line,"x + 2 = 6");
  assert.equal(notebookAreaOperationMathML(completed.state,{op:"remove",kind:"posX2",count:1}),"");
});
