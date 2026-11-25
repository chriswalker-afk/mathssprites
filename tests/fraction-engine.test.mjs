import test from "node:test";
import assert from "node:assert/strict";
import {rational,radd,rsub,rmul,rdiv,rcompare,req} from "../src/rational.mjs";
import {FRACTION_DENOMINATORS,fractionParts,fractionRoom,fractionRoomCount} from "../src/fraction-engine.mjs";
import {FRACTION_LEVEL_PLAN} from "../src/fraction-level-plan.mjs";
import {CAMPAIGN_REGISTRY} from "../src/campaign-registry.mjs";
import {LEVELS,initialState,validInitialLevel,prepare,perform,undo,isSolved,
  balanceDifference,visibleRooms,canonical,evaluate,equation,algebraOperation,previewRoomAction} from "../src/engine.mjs";

const q=rational, act=(op,kind,count)=>({op,kind,count}), factor=(op,factor)=>({op,factor});
const fixture=(left,right,solution,extra={})=>({id:"fraction-test",quantityMode:"fractions",left,right,solution,...extra});
function step(s,a){
  const result=perform(s,a);
  assert.equal(result.ok,true,result.reason);
  assert.equal(result.committed,true);
  assert.deepEqual(balanceDifference(result.state),q(0));
  return result.state;
}

test("exact reduced JSON-safe rationals; no decimal or zero-denominator input",()=>{
  assert.deepEqual(q(2,4),q(1,2));
  assert.deepEqual(q(2,-4),q(-1,2));
  assert.deepEqual(q(0,5),q(0));
  assert.deepEqual(radd(q(1,3),q(1,6)),q(1,2));
  assert.deepEqual(rsub(q(7,3),q(1,2)),q(11,6));
  assert.deepEqual(rmul(q(2,3),q(3,4)),q(1,2));
  assert.deepEqual(rdiv(q(3,4),q(3,2)),q(1,2));
  assert.equal(rcompare(q(1,3),q(2,5)),-1);
  assert.equal(req(q(3,6),q(1,2)),true);
  assert.deepEqual(JSON.parse(JSON.stringify(q(2,3))),q(2,3));
  assert.throws(()=>q(0.333));
  assert.throws(()=>q(1,0));
  assert.throws(()=>rdiv(q(1),q(0)));
});

test("every supported proper fraction is representable as whole objects and exact pieces",()=>{
  assert.deepEqual(FRACTION_DENOMINATORS,[1,2,3,4,5,6,8,10,12]);
  for(const d of FRACTION_DENOMINATORS)for(let n=1;n<d;n++){
    const value=q(n+2*d,d),p=fractionParts(value),room=fractionRoom({posOne:value});
    assert.deepEqual(radd(p.whole,q(p.pieces,p.denominator)),value);
    assert.equal(fractionRoomCount(room),p.whole+p.pieces);
  }
  assert.throws(()=>fractionRoom({posOne:q(1,7)}));
  assert.throws(()=>fractionRoom({posX:0.5}));
  assert.throws(()=>fractionRoom({negOne:1}));
  assert.throws(()=>fractionRoom({posX2:1}));
  assert.throws(()=>fractionRoom({crates:{count:1}}));
});

test("whole-number division succeeds exactly in fractions only, including a fractional answer",()=>{
  const start=initialState(fixture({posX:2},{posOne:5},q(5,2)));
  const done=step(start,factor("divide",2));
  assert.equal(equation(done),"x = 5/2");
  assert.equal(isSolved(done),true);
  assert.deepEqual(canonical(done.right).constant,q(5,2));
  assert.deepEqual(evaluate(done.left,done.solution),q(5,2));
  assert.deepEqual(done.history[0].fractionPlans.right[1].groups,{count:2,wholePerGroup:2,unitsPerGroup:1,denominator:2});
  assert.deepEqual(undo(done),start);
  const old=initialState({id:"whole",left:{posX:2},right:{posOne:5},solution:2});
  assert.equal(perform(old,factor("divide",2)).code,"fraction");
  assert.equal(perform(initialState(LEVELS[0]),act("remove","posOne",q(1,2))).ok,false);
  assert.throws(()=>initialState(LEVELS[0],"fractions"));
  assert.throws(()=>initialState(fixture({posX:2},{posOne:5},q(5,2)),"positive"));
});

test("borrowing, equivalent parts, recombination and whole-room multiplication",()=>{
  let start=initialState(fixture({posX:1,posOne:q(1,4)},{posOne:q(7,2)},q(13,4)));
  let done=step(start,act("remove","posOne",q(1,4)));
  assert.equal(equation(done),"x = 13/4");
  assert.equal(done.history[0].fractionPlans.right[1].grid,4);
  start=initialState(fixture({posX:1,posOne:q(1,2)},{posOne:q(7,3)},q(11,6)));
  done=step(start,act("remove","posOne",q(1,2)));
  assert.equal(done.history[0].fractionPlans.right[1].grid,6);
  assert.equal(equation(done),"x = 11/6");
  start=initialState(fixture({posX:q(2,3)},{posOne:4},6));
  const middle=step(start,factor("multiply",3));
  assert.equal(equation(middle),"2x = 12");
  assert.equal(middle.history[0].fractionPlans.left[0].copies,3);
  assert.equal(isSolved(step(middle,factor("divide",2))),true);
  assert.equal(algebraOperation(act("remove","posX",q(2,4))),"− (1/2)x on both sides");
  const withAdd=step(start,act("add","posX",q(1,3)));
  assert.equal(equation(withAdd),"x = (1/3)x + 4");
  const mixed=initialState(fixture({posX:q(1,2),posOne:q(1,2)},{posOne:2},3));
  assert.equal(equation(step(mixed,factor("multiply",2))),"x + 1 = 4");
});

test("division of existing pieces shares their units instead of inventing smaller pieces",()=>{
  const room=fractionRoom({posX:q(2,3),posOne:q(3,2)});
  const result=previewRoomAction(room,factor("divide",2),"fractions");
  assert.equal(result.ok,true);
  assert.deepEqual(result.fractionPlans[0].groups,{count:2,wholePerGroup:0,unitsPerGroup:1,denominator:3});
  assert.deepEqual(result.after.posOne,q(3,4));
  for(const p of result.fractionPlans){
    const group=radd(p.groups.wholePerGroup,q(p.groups.unitsPerGroup,p.groups.denominator));
    assert.deepEqual(rmul(group,p.groups.count),p.before);
  }
});

test("unsupported denominators, overflow, missing amounts, signed/square tools and invalid factors reject atomically",()=>{
  const start=initialState(fixture({posX:q(1,3)},{posOne:1},3));
  assert.equal(prepare(start,factor("divide",5)).code,"unsupported-denominator");
  assert.equal(prepare(start,act("add","posX",q(1,5))).code,"unsupported-denominator");
  assert.equal(prepare(start,act("add","posOne",q(1,7))).code,"unsupported-denominator");
  assert.equal(prepare(start,act("remove","posX",q(1,2))).code,"missing");
  assert.equal(prepare(start,act("add","negX",1)).code,"locked-kind");
  assert.equal(prepare(start,{op:"square"}).code,"locked-operation");
  assert.equal(prepare(start,{op:"unpack",side:"left"}).code,"locked-operation");
  assert.equal(prepare(start,factor("divide",0)).ok,false);
  assert.equal(prepare(start,factor("multiply",6)).ok,false);
  assert.equal(prepare(start,act("add","posOne",0.5)).ok,false);
  const full=initialState(fixture({posX:1},{posOne:48},48));
  assert.equal(prepare(full,act("add","posOne",q(1,2))).code,"overflow");
  assert.equal(start.history.length,0);
  assert.deepEqual(balanceDifference(start),q(0));
  assert.equal(validInitialLevel(fixture({posX:1},{posOne:0},0)),false);
  assert.equal(validInitialLevel(fixture({posX:1},{posOne:1},2)),false);
  assert.equal(validInitialLevel(fixture({posX:1},{posX:1},2)),false);
});

test("independent matching accepts equal fractions and never commits a unilateral move",()=>{
  const start=initialState(fixture({posX:1,posOne:q(1,2)},{posOne:q(7,3)},q(11,6)));
  const action=act("remove","posOne",q(1,2));
  const pending=perform(start,action,"manual","left").state;
  assert.equal(pending.history.length,0);
  assert.equal(isSolved(pending),false);
  assert.deepEqual(balanceDifference(pending),q(-1,2));
  assert.deepEqual(visibleRooms(pending).right,start.right);
  assert.equal(perform(pending,action,"manual","left").code,"wrong-side");
  assert.equal(perform(pending,act("remove","posOne",q(1,3)),"manual","right").code,"mismatch");
  assert.deepEqual(undo(pending),start);
  const done=perform(pending,act("remove","posOne",q(2,4)),"manual","right");
  assert.equal(done.ok,true);
  assert.equal(done.state.history.length,1);
  assert.equal(isSolved(done.state),true);
  assert.deepEqual(undo(done.state),start);
  const impossible=initialState(fixture({posX:2},{posOne:5},q(5,2)));
  const first=perform(impossible,act("remove","posX",q(1,2)),"manual","left");
  assert.equal(first.ok,true);
  assert.equal(perform(first.state,act("remove","posX",q(1,2)),"manual","right").code,"missing");
  assert.deepEqual(undo(first.state),impossible);
});

test("all sixty planned puzzles have exact unique answers and replayable legal reference routes",()=>{
  assert.equal(FRACTION_LEVEL_PLAN.length,60);
  assert.equal(new Set(FRACTION_LEVEL_PLAN.map(l=>l.id)).size,60);
  assert.deepEqual(["guided","independent","notebook"].map(stage=>FRACTION_LEVEL_PLAN.filter(l=>l.stage===stage).length),[24,20,16]);
  for(const level of FRACTION_LEVEL_PLAN){
    assert.equal(validInitialLevel(level),true,level.id);
    const start=initialState(level);
    assert.equal(isSolved(start),false,level.id);
    let s=start;
    for(const action of level.reference){
      if(level.stage==="independent"){
        const first=perform(s,action,"manual","left");
        assert.equal(first.ok,true,level.id+": "+first.reason);
        const second=perform(first.state,action,"manual","right");
        assert.equal(second.ok,true,level.id+": "+second.reason);
        s=second.state;
        assert.deepEqual(balanceDifference(s),q(0),level.id);
      }else s=step(s,action);
      assert.ok(fractionRoomCount(s.left)<=48&&fractionRoomCount(s.right)<=48,level.id);
    }
    assert.equal(isSolved(s),true,level.id+" "+equation(s));
    assert.equal(s.history.length,level.reference.length,level.id);
    for(let i=0;i<level.reference.length;i++)s=undo(s);
    assert.deepEqual(s,start,level.id);
  }
  // The Guided campaign is published; the other two modes remain locked.
  assert.deepEqual(CAMPAIGN_REGISTRY.map(w=>w.available),[true,true,true,false]);
});
