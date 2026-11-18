import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVELS,QUANTITY_MODES,levelQuantityMode,quantityPermission,initialState,
  validInitialLevel,room,canonical,evaluate,normalize,prepare,perform,
  previewRoomAction,visibleRooms,balanceDifference,isSolved,undo,equation,algebraOperation
} from "../src/engine.mjs";
import {neutralPairSequence,neutralPairSummary,neutralPairValue} from "../src/neutral-pairs.mjs";

const add=(kind,count)=>({op:"add",kind,count});
const remove=(kind,count)=>({op:"remove",kind,count});
function committed(state,action) {
  const r=perform(state,action,"auto");
  assert.equal(r.ok,true,r.reason);
  assert.equal(r.committed,true);
  return r.state;
}
test("thirteen curated levels include three intentional signed-object lessons",()=>{
  assert.deepEqual(QUANTITY_MODES,["positive","signed"]);
  assert.equal(LEVELS.length,13);
  assert.deepEqual(LEVELS.slice(10).map(l=>l.id),
    ["balloon-rescue","opposite-sprites","two-zero-pairs"]);
  for(const lv of LEVELS) {
    assert.equal(validInitialLevel(lv),true,lv.id);
    const state=initialState(lv);
    assert.equal(balanceDifference(state),0,lv.id);
    assert.equal(isSolved(state),false,lv.id);
    assert.equal(state.quantityMode,lv.quantityMode||"positive");
  }
  assert.ok(LEVELS.slice(10).every(l=>l.quantityMode==="signed"));
  assert.ok(LEVELS.slice(0,10).every(l=>levelQuantityMode(l)==="positive"));
  for(const level of LEVELS.slice(10)){
    // The hidden equations appear in the pencil replay, not level prompts or
    // the optional hint: pupils discover the value from the physical rooms.
    assert.doesNotMatch(level.prompt+" "+level.suggested,/\bx\s*(?:=|−|\+|\d)/i);
  }
});
test("positive-only mode rejects white sprites and balloons at engine and preview level",()=>{
  const state=initialState(LEVELS[0]);
  const before=JSON.stringify(state);
  for(const action of [
    add("negX",1),add("negOne",2),remove("negX",1),remove("negOne",2)
  ]) {
    const check=prepare(state,action);
    assert.equal(check.ok,false);
    assert.equal(check.code,"locked-negative");
    assert.match(check.reason,/positive objects only/i);
    assert.equal(perform(state,action).code,"locked-negative");
    assert.equal(perform(state,action,"manual","left").code,"locked-negative");
    assert.equal(previewRoomAction(state.left,action,"positive").code,"locked-negative");
  }
  assert.equal(JSON.stringify(state),before);
  assert.equal(state.history.length,0);
  assert.equal(quantityPermission("signed",add("negX",1)).ok,true);
});
test("mode switch on introductory experiments allows signed objects without changing algebra",()=>{
  const old=initialState(LEVELS[0]);
  const signed=initialState(LEVELS[0],"signed");
  assert.equal(signed.quantityMode,"signed");
  assert.equal(equation(signed),equation(old));
  const changed=committed(signed,add("negX",1));
  assert.equal(changed.left.posX,0);
  assert.equal(changed.left.negX,0);
  assert.equal(changed.right.negX,1);
  assert.equal(changed.history[0].cancellationEvents.left.length,1);
  assert.equal(changed.history[0].cancellationEvents.right.length,0);
  assert.equal(balanceDifference(changed),0);
  assert.equal(JSON.stringify(undo(changed)),JSON.stringify(signed));
});
test("signed chapters cannot be forced into impossible positive-only mode",()=>{
  assert.throws(()=>initialState(LEVELS[10],"positive"),RangeError);
  assert.equal(validInitialLevel({
    id:"invalid",quantityMode:"positive",solution:4,
    left:{posX:1,negOne:2},right:{posOne:2}
  }),false);
  assert.equal(validInitialLevel({
    id:"negative-x",quantityMode:"signed",solution:-2,
    left:{posX:1},right:{negOne:2}
  }),false);
  assert.equal(levelQuantityMode({left:{negX:1},right:{posOne:2}}),"signed",
    "older custom signed puzzles retain their correct mode");
});
test("balloon rescue: two balloon-weight pairs float away and x=4 is preserved",()=>{
  const initial=initialState(LEVELS[10]);
  assert.equal(equation(initial),"x − 2 = 2");
  const done=committed(initial,add("posOne",2));
  assert.equal(equation(done),"x = 4");
  assert.equal(isSolved(done),true);
  assert.deepEqual(done.history[0].cancellations.left,{sprites:0,constants:2});
  assert.equal(done.history[0].cancellationEvents.left.length,2);
  assert.equal(done.history[0].cancellationEvents.right.length,0);
  assert.deepEqual(done.history[0].cancellationEvents.left.map(e=>e.id),
    ["left:constants:1","left:constants:2"]);
  assert.deepEqual(done.history[0].cancellationEvents.left.map(e=>e.action),
    ["balloon-lift","balloon-lift"]);
  assert.deepEqual(done.left,room({posX:1}));
  assert.deepEqual(done.right,room({posOne:4}));
  assert.deepEqual(undo(done).left,initial.left);
});
test("white sprites: they collide and cancel locally in BOTH rooms",()=>{
  const initial=initialState(LEVELS[11]);
  assert.equal(equation(initial),"2x + 3 = x + 7");
  const middle=committed(initial,add("negX",1));
  assert.equal(equation(middle),"x + 3 = 7");
  assert.equal(balanceDifference(middle),0);
  assert.deepEqual(middle.history[0].cancellations,{
    left:{sprites:1,constants:0},right:{sprites:1,constants:0}
  });
  assert.equal(middle.history[0].cancellationEvents.left[0].id,"left:sprites:1");
  assert.equal(middle.history[0].cancellationEvents.right[0].id,"right:sprites:1");
  assert.equal(middle.history[0].cancellationEvents.left[0].action,"mutual-hop");
  const done=committed(middle,remove("posOne",3));
  assert.equal(equation(done),"x = 4");
  assert.equal(isSolved(done),true);
});
test("two separate sorts of neutral pair complete the intended signed puzzle",()=>{
  const initial=initialState(LEVELS[12]);
  assert.equal(equation(initial),"2x − 2 = x + 2");
  const afterUnits=committed(initial,add("posOne",2));
  assert.equal(equation(afterUnits),"2x = x + 4");
  assert.equal(afterUnits.history[0].cancellationEvents.left.length,2);
  const afterSprites=committed(afterUnits,add("negX",1));
  assert.equal(equation(afterSprites),"x = 4");
  assert.equal(afterSprites.history[1].cancellationEvents.left.length,1);
  assert.equal(afterSprites.history[1].cancellationEvents.right.length,1);
  assert.equal(isSolved(afterSprites),true);
  assert.equal(afterSprites.history.length,2);
  assert.deepEqual(undo(undo(afterSprites)).left,initial.left);
  assert.deepEqual(undo(undo(afterSprites)).right,initial.right);
});
test("every ordered cancellation event is value-preserving at every x",()=>{
  const raw=room({posX:4,negX:3,posOne:5,negOne:4});
  const events=neutralPairSequence(raw,"left");
  assert.equal(events.length,7);
  assert.deepEqual(events.map(e=>e.type),[
    "sprites","sprites","sprites","constants","constants","constants","constants"
  ]);
  assert.equal(new Set(events.map(e=>e.id)).size,events.length);
  for(const event of events)for(const x of [-5,-1,0,2,4,17]) {
    assert.equal(neutralPairValue(event.before,x),
      neutralPairValue(event.after,x),event.id);
  }
  assert.deepEqual(events[0].before,raw);
  assert.deepEqual(events.at(-1).after,normalize(raw).after);
  assert.deepEqual(raw,room({posX:4,negX:3,posOne:5,negOne:4}));
  assert.equal(neutralPairSummary(events),"3 black/white pairs; 4 weight/balloon pairs");
});
test("in manual mode one room can cancel first but cannot commit until matching action",()=>{
  const initial=initialState(LEVELS[10]);
  const first=perform(initial,add("posOne",2),"manual","left");
  assert.equal(first.ok,true);
  assert.equal(first.committed,false);
  assert.equal(first.state.pending.first,"left");
  assert.equal(first.state.history.length,0);
  assert.equal(visibleRooms(first.state).left.negOne,0);
  assert.equal(visibleRooms(first.state).right.posOne,2);
  assert.equal(balanceDifference(first.state),2);
  assert.equal(isSolved(first.state),false);
  assert.equal(first.state.pending.pair.left.cancellationEvents.length,2);
  const done=perform(first.state,add("posOne",2),"manual","right");
  assert.equal(done.ok,true);
  assert.equal(done.committed,true);
  assert.equal(done.state.history.length,1);
  assert.equal(done.state.history[0].mode,"manual");
  assert.equal(isSolved(done.state),true);
  assert.equal(balanceDifference(done.state),0);
  assert.equal(equation(undo(done.state)),equation(initial));
});
test("division neutralizes zero pairs BEFORE whole baskets and logs each subevent",()=>{
  const level={id:"group-signed",quantityMode:"signed",solution:3,
    left:{posX:3,negX:1,posOne:4,negOne:2},right:{posOne:8}};
  const initial=initialState(level);
  const preview=previewRoomAction(initial.left,{op:"divide",factor:2},"signed","left");
  assert.equal(preview.ok,true);
  assert.deepEqual(preview.beforeGroups,room({posX:2,posOne:2}));
  assert.deepEqual(preview.cancellations,{sprites:1,constants:2});
  assert.deepEqual(preview.cancellationEvents.map(e=>e.type),
    ["sprites","constants","constants"]);
  assert.equal(preview.cancellationEvents[0].before.negX,1);
  const done=committed(initial,{op:"divide",factor:2});
  assert.equal(equation(done),"x + 1 = 4");
  assert.equal(done.history[0].cancellationEvents.left.length,3);
  assert.equal(done.history[0].cancellationEvents.right.length,0);
  assert.equal(balanceDifference(done),0);
  assert.deepEqual(undo(done).left,initial.left);
});
test("removing a balloon correctly subtracts a NEGATIVE unit",()=>{
  assert.equal(algebraOperation(remove("negOne",1)),"− (−1) on both sides");
  assert.equal(algebraOperation(add("negX",1)),"+ (−x) on both sides");
  const source=room({posOne:4,negOne:2});
  const result=previewRoomAction(source,remove("negOne",1),"signed");
  assert.equal(result.ok,true);
  assert.equal(evaluate(result.after,5)-evaluate(source,5),1);
});
test("signed terms remain unsupported inside current square/root box model",()=>{
  for(const action of [{op:"square"},{op:"sqrt"}]){
    const trial=previewRoomAction({posX:1,negOne:2},action,"signed");
    assert.equal(trial.ok,false);
    assert.equal(trial.code,"unsupported-area");
  }
});
