import test from "node:test";
import assert from "node:assert/strict";
import {
  cloneCrate,crateCount,crateLabel,crateMarkup,crateAlgebra,looseAfterUnpack
} from "../src/group-crates.mjs";
import {
  initialState,perform,undo,room,canonical,evaluate,equation,isSolved,
  previewRoomAction,validInitialLevel,algebraOperation,balanceDifference
} from "../src/engine.mjs";
import {WORLD1_LEVELS} from "../src/worlds.mjs";
import {findCampaignLevel,CAMPAIGN_REGISTRY} from "../src/campaign-registry.mjs";
import {starsForMoves,optimalMoves} from "../src/star-ratings.mjs";
const slot=WORLD1_LEVELS[18],level=slot.level;
const unpack={op:"unpack",side:"left"};
const divide={op:"divide",factor:2};
const weights=n=>({op:"remove",kind:"posOne",count:n});

test("the prototype replaces exactly the existing Guided Level 19 without changing its identity",()=>{
  assert.equal(WORLD1_LEVELS.length,20);
  assert.equal(slot.number,19);
  assert.equal(slot.id,"master-19");
  assert.equal(findCampaignLevel("workshop","guided",19).id,"master-19");
  assert.equal(level.title,"Sealed Crates");
  assert.equal(level.groupedPrototype,true);
  assert.equal(level.lockPositive,true);
  assert.equal(level.quantityMode,"positive");
  assert.deepEqual(level.allowedOperations,["remove","add","divide","multiply","unpack"]);
  assert.equal(optimalMoves("guided",19),3);
  assert.equal(starsForMoves(3,optimalMoves("guided",19)),3);
  assert.equal(level.solution,4);
  assert.equal(validInitialLevel(level),true);
  assert.deepEqual(CAMPAIGN_REGISTRY[0].stages.map(s=>s.count),[20,20,16]);
});
test("a sealed crate has exactly x+3 value, not three added loose weights",()=>{
  const state=initialState(level);
  assert.equal(crateCount(state.left),2);
  assert.deepEqual([state.left.posX,state.left.posOne],[0,0]);
  assert.equal(crateLabel(state.left.crates.contents),"x + 3");
  assert.deepEqual(crateAlgebra(state.left),{x2:0,x:2,constant:6});
  assert.deepEqual(canonical(state.left),{x2:0,x:2,constant:6});
  assert.equal(evaluate(state.left,4),14);
  assert.equal(evaluate(state.right,4),14);
  assert.equal(balanceDifference(state),0);
  assert.equal(equation(state),"2(x + 3) = 14");
  assert.equal(isSolved(state),false);
  const loose=looseAfterUnpack(state.left);
  assert.equal(loose.crates,undefined);
  assert.equal(loose.posX,2);
  assert.equal(loose.posOne,6);
  assert.equal(evaluate(loose,4),14);
});
test("Route A: unpack first, remove six loose weights, divide by two",()=>{
  let state=initialState(level);
  const order=[unpack,weights(6),divide];
  const algebra=["2x + 6 = 14","2x = 8","x = 4"];
  for(const [i,action] of order.entries()){
    const result=perform(state,action,"auto");
    assert.equal(result.ok,true,result.reason||JSON.stringify(action));
    state=result.state;
    assert.equal(equation(state),algebra[i]);
    assert.equal(balanceDifference(state),0);
    assert.equal(state.history.length,i+1);
    assert.equal(state.history.at(-1).action.op,action.op);
  }
  assert.equal(isSolved(state),true);
  assert.equal(state.history[0].mode,"rewrite");
  assert.deepEqual(state.history[0].before.left.crates.count,2);
  assert.equal(state.history[0].after.left.crates,undefined);
  for(let i=order.length-1;i>=0;i--)state=undo(state);
  assert.deepEqual(state,initialState(level),"Undo restores BOTH real glass-fronted crates");
});
test("Route B: divide whole crates first, unpack a single crate, remove three weights",()=>{
  let state=initialState(level);
  for(const [i,action] of [divide,unpack,weights(3)].entries()){
    const result=perform(state,action,"auto");
    assert.equal(result.ok,true,result.reason||JSON.stringify(action));
    state=result.state;
    assert.equal(equation(state),["(x + 3) = 7","x + 3 = 7","x = 4"][i]);
    assert.equal(balanceDifference(state),0);
    if(i===0){
      assert.equal(crateCount(state.left),1);
      assert.equal(state.left.posX,0);
      assert.equal(state.right.posOne,7);
    }
  }
  assert.equal(isSolved(state),true);
  assert.equal(state.history.length,3);
  assert.deepEqual(undo(undo(undo(state))),initialState(level));
});
test("opening one chamber is an identity rewrite; other unpaired operations are not permitted",()=>{
  const initial=initialState(level);
  const result=perform(initial,unpack,"auto");
  assert.equal(result.ok,true);
  assert.deepEqual(result.state.right,initial.right,"right remains unchanged");
  assert.equal(evaluate(result.state.left,4),evaluate(initial.left,4));
  assert.equal(result.state.history[0].mode,"rewrite");
  assert.equal(algebraOperation(unpack).includes("Expand the brackets"),true);
  assert.equal(perform(initial,unpack,"manual","left").code,"unpack-mode");
  assert.equal(perform(initial,{op:"unpack",side:"right"}).code,"no-crates");
  assert.equal(perform(initial,{op:"unpack",side:"west"}).code,"invalid");
  assert.equal(perform(result.state,unpack).code,"no-crates");
  assert.equal(initial.history.length,0,"previews never mutate originals");
});
test("sealed contents cannot be removed until unpacked",()=>{
  const initial=initialState(level);
  for(const action of [weights(3),{op:"remove",kind:"posX",count:1}]){
    const result=perform(initial,action);
    assert.equal(result.ok,false);
    assert.equal(result.code,"locked-crate");
    assert.match(result.reason,/sealed/i);
    assert.equal(initial.history.length,0);
  }
  assert.equal(perform(initial,{op:"divide",factor:3}).code,"crate-split");
  const first=perform(initial,unpack).state;
  assert.equal(perform(first,weights(6)).ok,true);
  assert.equal(previewRoomAction(initial.left,unpack,"positive","left").after.posOne,6);
  assert.equal(previewRoomAction(initial.right,unpack,"positive","right").after.posOne,14);
});
test("regular worlds and other World 1 levels reject unpack actions",()=>{
  for(const slot of [...WORLD1_LEVELS.slice(0,18),WORLD1_LEVELS[19]]){
    const result=perform(initialState(slot.level),{op:"unpack",side:"left"});
    assert.equal(result.ok,false,slot.id);
    assert.equal(result.code,"locked-operation",slot.id);
  }
  const signed=CAMPAIGN_REGISTRY[1].stages[0].levels[0].level;
  assert.equal(perform(initialState(signed),unpack).ok,false);
});
test("physical crates are whole, renderable objects (not loose sprite actors)",()=>{
  const c=cloneCrate({count:2,contents:{posX:1,posOne:3}});
  assert.deepEqual(c.contents,{posX:1,negX:0,posX2:0,posOne:3,negOne:0});
  assert.throws(()=>cloneCrate({count:1,contents:{posX:1.5}}),/whole/i);
  assert.throws(()=>cloneCrate({count:1,contents:{}}),/empty/i);
  const markup=crateMarkup(room(level.left));
  assert.equal((markup.match(/class="token sealed-crate"/g)||[]).length,2);
  assert.match(markup,/crate-mini-sprite/);
  assert.match(markup,/crate-mini-weight/);
  assert.doesNotMatch(markup,/class="token sprite"/);
});
