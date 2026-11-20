import test from "node:test";
import assert from "node:assert/strict";
import {
  INDEPENDENT_LEVELS,INDEPENDENT_CHAPTERS,findIndependentLevel,
  isIndependentUnlocked,nextIndependentLevel
} from "../src/independent-levels.mjs";
import {WORLD1_OPERATIONS} from "../src/worlds.mjs";
import {
  initialState,validInitialLevel,perform,isSolved,balanceDifference,undo,equation,levelActionPermission
} from "../src/engine.mjs";
import {
  PROGRESS_KEY,STAGE2_PROGRESS_KEY,loadProgress,loadStage2Progress,
  normalizeStage2Progress,saveStage2Progress,markStage2Complete
} from "../src/progress.mjs";
import {
  INDEPENDENT_GUIDE_SEEN_KEY,INDEPENDENT_BRIEFINGS,
  independentIntroductionCue,readIndependentGuideSeen,writeIndependentGuideSeen
} from "../src/onboarding.mjs";

const removeWeights=n=>({op:"remove",kind:"posOne",count:n});
const removeSprites=n=>({op:"remove",kind:"posX",count:n});
const divide=n=>({op:"divide",factor:n});
const MODEL_ROUTES=[
 [removeWeights(2)],[removeWeights(4)],[removeWeights(3)],[removeWeights(7)],
 [divide(2)],[divide(3)],[divide(4)],[divide(5)],
 [removeWeights(3),divide(2)],
 [divide(3),removeWeights(2)],
 [removeWeights(5),divide(4)],
 [removeWeights(7),divide(3)],
 [removeSprites(1),removeWeights(2)],
 [removeSprites(1),removeWeights(1),divide(2)],
 [removeSprites(2),removeWeights(3),divide(2)],
 [divide(2),removeSprites(1),removeWeights(7)]
];

test("Stage 2 has 16 different valid positive whole-number puzzles in four chapters",()=>{
  assert.equal(INDEPENDENT_CHAPTERS.length,4);
  assert.equal(INDEPENDENT_LEVELS.length,16);
  assert.equal(new Set(INDEPENDENT_LEVELS.map(slot=>slot.id)).size,16);
  assert.deepEqual(INDEPENDENT_LEVELS.map(slot=>slot.number),
    Array.from({length:16},(_,i)=>i+1));
  assert.deepEqual(INDEPENDENT_LEVELS.map(slot=>slot.chapterIndex),
    Array.from({length:16},(_,i)=>Math.floor(i/4)));
  for(const slot of INDEPENDENT_LEVELS){
    const lvl=slot.level;
    assert.equal(slot.available,true,slot.id);
    assert.ok(validInitialLevel(lvl),"balanced and physically valid: "+slot.id);
    assert.equal(lvl.lockPositive,true,slot.id);
    assert.equal(lvl.quantityMode,"positive");
    assert.deepEqual(lvl.allowedOperations,WORLD1_OPERATIONS);
    assert.equal(Number.isInteger(lvl.solution)&&lvl.solution>0,true);
    assert.equal(lvl.solution<=12,true);
    for(const side of [lvl.left,lvl.right]){
      assert.ok(!side.negX&&!side.negOne&&!side.posX2);
      assert.ok((side.posX||0)+(side.posOne||0)<=48);
    }
    const engine=initialState(lvl);
    assert.equal(levelActionPermission(engine,{op:"square"}).code,"locked-operation");
    assert.equal(levelActionPermission(engine,{op:"sqrt"}).code,"locked-operation");
    assert.equal(perform(engine,{op:"add",kind:"negOne",count:1},"manual","left").code,"locked-negative");
  }
});

test("every puzzle has a complete checked manual route, with a genuine provisional tilt",()=>{
  for(const [i,slot] of INDEPENDENT_LEVELS.entries()){
    let state=initialState(slot.level);
    assert.equal(isSolved(state),false,slot.id+" should require a move");
    for(const [j,action] of MODEL_ROUTES[i].entries()){
      const side=(i+j)%2?"right":"left"; // both starting directions work
      const opposite=side==="left"?"right":"left";
      const before=equation(state);
      const p=perform(state,action,"manual",side);
      assert.equal(p.ok,true,slot.id+" first "+JSON.stringify(action)+" from "+before);
      assert.equal(p.committed,false);
      assert.equal(p.state.history.length,j,"first hand visit cannot commit an equation");
      assert.equal(p.state.pending.first,side);
      assert.notEqual(balanceDifference(p.state),0,"physical scale must tip after first move "+slot.id);
      assert.equal(isSolved(p.state),false,"pending pair cannot solve level");
      const matched=perform(p.state,action,"manual",opposite);
      assert.equal(matched.ok,true,slot.id+" opposite "+JSON.stringify(action));
      assert.equal(matched.committed,true,"pair is a single algebra step");
      assert.equal(matched.state.pending,null);
      assert.equal(matched.state.history.length,j+1);
      assert.equal(matched.state.history[j].mode,"manual");
      assert.equal(balanceDifference(matched.state),0,"scale levels when matched");
      state=matched.state;
    }
    assert.equal(isSolved(state),true,slot.id+" should end isolated: "+equation(state));
  }
});

test("either room can be first; unequal second hand actions are rejected without history",()=>{
  let state=initialState(INDEPENDENT_LEVELS[0].level);
  for(const first of ["left","right"]){
    const a=perform(state,removeWeights(2),"manual",first);
    assert.equal(a.ok,true);
    const opposite=first==="left"?"right":"left";
    assert.equal(perform(a.state,removeWeights(1),"manual",opposite).code,"mismatch");
    assert.equal(a.state.history.length,0);
    const u=undo(a.state);
    assert.equal(u.pending,null);
    assert.deepEqual(u.left,state.left);
    assert.deepEqual(u.right,state.right);
    const b=perform(a.state,removeWeights(2),"manual",opposite);
    assert.equal(b.ok,true);
    assert.equal(isSolved(b.state),true);
  }
});

test("every Stage 2 level is directly selectable without completion or teacher access",()=>{
  for(const slot of INDEPENDENT_LEVELS)
    assert.equal(isIndependentUnlocked(slot.number,[],false),true);
  assert.equal(isIndependentUnlocked(17,[],true),false);
  assert.equal(nextIndependentLevel(1,[]),findIndependentLevel(2));
  assert.equal(nextIndependentLevel(16,[],false),null);
  assert.equal(findIndependentLevel(17),null);
});

test("Stage 2 storage preserves Stage 1 bytes and handles denied storage",()=>{
  const stage1={completed:[1,2,3],lastPlayed:4};
  const map=new Map([[PROGRESS_KEY,JSON.stringify(stage1)]]);
  const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
  const original=map.get(PROGRESS_KEY);
  assert.deepEqual(loadStage2Progress(storage),{completed:[],lastPlayed:1});
  const first=markStage2Complete({completed:[],lastPlayed:1},1);
  assert.deepEqual(first,{completed:[1],lastPlayed:2});
  saveStage2Progress(first,storage);
  assert.deepEqual(loadStage2Progress(storage),first);
  assert.equal(map.get(PROGRESS_KEY),original,"Stage 1 storage is never touched");
  assert.deepEqual(loadProgress(storage),stage1);
  assert.deepEqual(normalizeStage2Progress({completed:[1,1,"2",17,-1,3],lastPlayed:99}),
    {completed:[1,3],lastPlayed:1});
  assert.deepEqual(loadStage2Progress({getItem(){throw Error("storage denied")}}),
    {completed:[],lastPlayed:1});
  assert.equal(markStage2Complete(first,99).completed.length,1);
  assert.equal(STAGE2_PROGRESS_KEY!=="mathssprites.progress.v1",true);
});

test("Stage 2 guided introduction tells students when the other room is waiting",()=>{
  assert.deepEqual([0,1,2,3].map(step=>independentIntroductionCue(step).target),
    ["scene","actions","tools","left-action"]);
  assert.equal(independentIntroductionCue(3,{pending:"left"}).target,"right-action");
  assert.equal(independentIntroductionCue(1,{pending:"right"}).target,"left-action",
    "real unmatched move takes priority over guide steps");
  assert.equal(independentIntroductionCue(3,{busy:true}).target,"scene");
  assert.match(independentIntroductionCue(3,{pending:"left"}).text,/SAME/);
  for(let n=0;n<4;n++)
    assert.doesNotMatch(independentIntroductionCue(n).text,/x\s*=\s*\d+/);
  assert.deepEqual(Object.keys(INDEPENDENT_BRIEFINGS).map(Number),[5,9,13]);
  const store=new Map();
  const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
  assert.equal(readIndependentGuideSeen(storage),false);
  writeIndependentGuideSeen(true,storage);
  assert.equal(store.get(INDEPENDENT_GUIDE_SEEN_KEY),"yes");
  assert.equal(readIndependentGuideSeen(storage),true);
  writeIndependentGuideSeen(false,storage);
  assert.equal(readIndependentGuideSeen(storage),false);
  assert.equal(readIndependentGuideSeen({getItem(){throw Error("blocked")}}),false);
});
