import test from "node:test";
import assert from "node:assert/strict";
import {
  APPRENTICE_CHAPTERS,APPRENTICE_LEVELS,findApprenticeLevel,
  isApprenticeUnlocked,nextApprenticeLevel
} from "../src/apprentice-levels.mjs";
import {WORLD1_OPERATIONS} from "../src/worlds.mjs";
import {validInitialLevel,initialState,isSolved,equation,perform} from "../src/engine.mjs";
import {startNotebook,tryNotebookLine,notebookReplayScript} from "../src/notebook-engine.mjs";
import {stageThreeComplete,canOpenWorld1Stage} from "../src/stages.mjs";
import {
  PROGRESS_KEY,STAGE2_PROGRESS_KEY,STAGE3_PROGRESS_KEY,
  loadProgress,loadStage2Progress,loadStage3Progress,
  saveStage3Progress,markStage3Complete,normalizeStage3Progress
} from "../src/progress.mjs";

// Complete routes are TEACHER/QA only. None are included in the student manifest.
const routes=[
  ["x = 5"],
  ["x = 6"],
  ["2x = 8","x = 4"],
  ["3x = 15","x = 5"],
  ["x + 2 = 6","x = 4"],
  ["4x = 20","x = 5"],
  ["10 = 2x","5 = x"],
  ["3x = 15","x = 5"],
  ["x + 3 = 8","x = 5"],
  ["13 = 2x + 3","10 = 2x","5 = x"],
  ["2x + 7 = 17","2x = 10","x = 5"],
  ["3x + 17 = 29","3x + 5 = 17","3x = 12","x = 4"]
];

test("Stage 3 provides twelve different balanced positive-whole-number equations across three chapters",()=>{
  assert.equal(APPRENTICE_CHAPTERS.length,3);
  assert.equal(APPRENTICE_LEVELS.length,12);
  assert.equal(new Set(APPRENTICE_LEVELS.map(s=>s.id)).size,12);
  assert.deepEqual(APPRENTICE_LEVELS.map(s=>s.chapterIndex),
    Array.from({length:12},(_,i)=>Math.floor(i/4)));
  for(const [i,slot] of APPRENTICE_LEVELS.entries()){
    assert.equal(slot.number,i+1);
    assert.equal(slot.available,true);
    const level=slot.level;
    assert.equal(validInitialLevel(level),true,slot.id);
    assert.equal(level.lockPositive,true);
    assert.equal(level.quantityMode,"positive");
    assert.deepEqual(level.allowedOperations,WORLD1_OPERATIONS);
    assert.ok(Number.isInteger(level.solution)&&level.solution>0);
    for(const side of [level.left,level.right]){
      assert.equal(side.negX??0,0);
      assert.equal(side.negOne??0,0);
      assert.equal(side.posX2??0,0);
      assert.ok((side.posX??0)+(side.posOne??0)<=48);
    }
    assert.equal(isSolved(initialState(level)),false);
    assert.equal(typeof level.suggested,"string");
    assert.equal(level.scaffold?.kind,
      ["model","first","last","none"][Math.min(i,3)]);
  }
});

test("all twelve Stage 3 routes are checked, complete, and replayable one physical move at a time",()=>{
  for(const [i,slot] of APPRENTICE_LEVELS.entries()){
    let session=startNotebook(slot.level);
    const initial=equation(session.state);
    assert.notEqual(initial,"");
    for(const line of routes[i]){
      const result=tryNotebookLine(session,line);
      assert.equal(result.ok,true,
        slot.id+" at "+initial+" → "+line+": "+(result.message||result.code));
      session=result.session;
      assert.equal(session.steps.at(-1).line,equation(session.state));
    }
    assert.equal(isSolved(session.state),true,slot.id);
    const script=notebookReplayScript(session);
    assert.equal(script.length,routes[i].length,slot.id);
    let replay=initialState(slot.level);
    for(const [j,step] of script.entries()){
      assert.equal(equation(replay),equation(step.before),slot.id+" step "+j);
      assert.deepEqual(step.line,session.steps[j].line);
      const action=perform(replay,step.action,"auto");
      assert.equal(action.ok,true,slot.id+" physical step "+j);
      assert.equal(equation(action.state),equation(step.after),slot.id+" after "+j);
      replay=action.state;
    }
    assert.equal(isSolved(replay),true);
  }
});

test("the curriculum fades its model and first/last prompts without leaking current answers",()=>{
  const kinds=APPRENTICE_LEVELS.map(slot=>slot.level.scaffold.kind);
  assert.deepEqual(kinds.slice(0,4),["model","first","last","none"]);
  assert.equal(kinds.slice(4).every(k=>k==="none"),true);
  for(const slot of APPRENTICE_LEVELS){
    assert.doesNotMatch(slot.level.prompt,/x\s*=\s*\d+/);
    if(slot.level.scaffold.kind==="none")continue;
    const support=slot.level.scaffold.text;
    if(slot.number===1)
      assert.match(support,/different example/i);
    assert.ok(support.length>35);
  }
});

test("Stage 3 sequential unlocking, teacher access and stage gating",()=>{
  assert.equal(canOpenWorld1Stage("notebook"),false);
  assert.equal(canOpenWorld1Stage("notebook",{stage1Completed:true}),false);
  assert.equal(canOpenWorld1Stage("notebook",{stage2Completed:true}),true);
  assert.equal(canOpenWorld1Stage("notebook",{teacher:true}),true);
  assert.equal(canOpenWorld1Stage("equation-workshop",{teacher:true,stage2Completed:true}),false);
  assert.equal(isApprenticeUnlocked(1,[]),true);
  assert.equal(isApprenticeUnlocked(2,[]),false);
  assert.equal(isApprenticeUnlocked(2,[1]),true);
  assert.equal(isApprenticeUnlocked(12,[1]),false);
  assert.equal(isApprenticeUnlocked(12,[],true),true);
  assert.equal(isApprenticeUnlocked(13,[],true),false);
  assert.equal(findApprenticeLevel(0),null);
  assert.equal(nextApprenticeLevel(1,[1])?.number,2);
  assert.equal(nextApprenticeLevel(12,[],true),null);
  assert.equal(stageThreeComplete([]),false);
  assert.equal(stageThreeComplete(Array.from({length:12},(_,i)=>i+1)),true);
});

test("new Stage 3 storage cannot overwrite Stage 1 or Stage 2 records",()=>{
  const one={completed:[1,2,3],lastPlayed:4};
  const two={completed:[1,2],lastPlayed:3};
  const contents=new Map([[PROGRESS_KEY,JSON.stringify(one)],
    [STAGE2_PROGRESS_KEY,JSON.stringify(two)]]);
  const storage={getItem:k=>contents.get(k)||null,setItem:(k,v)=>contents.set(k,v)};
  assert.deepEqual(loadStage3Progress(storage),{completed:[],lastPlayed:1});
  const progressed=markStage3Complete({completed:[],lastPlayed:1},1);
  assert.deepEqual(progressed,{completed:[1],lastPlayed:2});
  saveStage3Progress(progressed,storage);
  assert.deepEqual(loadStage3Progress(storage),progressed);
  assert.deepEqual(loadProgress(storage),one);
  assert.deepEqual(loadStage2Progress(storage),two);
  assert.deepEqual(JSON.parse(contents.get(PROGRESS_KEY)),one);
  assert.deepEqual(JSON.parse(contents.get(STAGE2_PROGRESS_KEY)),two);
  assert.deepEqual(normalizeStage3Progress({completed:[2,1,1,"3",13,-1],lastPlayed:99}),
    {completed:[1,2],lastPlayed:1});
  assert.deepEqual(loadStage3Progress({getItem(){throw Error("blocked")}}),
    {completed:[],lastPlayed:1});
  assert.deepEqual(saveStage3Progress({completed:[1]}, {setItem(){throw Error("blocked")}}),
    {completed:[1],lastPlayed:1});
  assert.equal(markStage3Complete(progressed,99).completed.length,1);
  assert.equal(STAGE3_PROGRESS_KEY!=="mathssprites.progress.v1",true);
});

test("whole-object alternatives work without allowing a shortcut or signed fractions",()=>{
  const level=APPRENTICE_LEVELS[4].level; // 3x + 6 = 18
  const session=startNotebook(level);
  assert.equal(tryNotebookLine(session,"x=4").code,"not-one-move");
  const a=tryNotebookLine(session,"3x=12");
  const b=tryNotebookLine(session,"x+2=6");
  assert.equal(a.ok,true);
  assert.equal(b.ok,true);
  assert.equal(a.action.op,"remove");
  assert.equal(b.action.op,"divide");
  for(const attempt of ["x²=16","x/2=2","-x=-4","x+2.5=6.5"]){
    assert.equal(tryNotebookLine(session,attempt).ok,false);
  }
  assert.equal(session.steps.length,0);
});
