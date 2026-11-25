import test from "node:test";
import assert from "node:assert/strict";
import {rational as q,req,rmul,radd} from "../src/rational.mjs";
import {FRACTION_LEVEL_PLAN} from "../src/fraction-level-plan.mjs";
import {initialState,perform,prepare,undo,isSolved,balanceDifference} from "../src/engine.mjs";
import {fractionTransform,FRACTION_KINDS,FRACTION_DENOMINATORS} from "../src/fraction-engine.mjs";
import {gridValue,gridRoom,roomChoreography,canonicalGrid,failureDiagram,failureSpeech} from "../src/fraction-choreography.mjs";
const action=(op,kind,count)=>({op,kind,count}),factor=(op,factor)=>({op,factor});
const verify=(room,a)=>{const p=fractionTransform(room,a);assert.equal(p.ok,true,p.reason);return roomChoreography(a,p);};
test("division shares complete quantities, splitting only the remaining whole objects",()=>{
  const p=verify({posX:2,posOne:5},factor("divide",2));
  assert.equal(p.borrowed,true);
  assert.deepEqual(p.prepared.posOne,{whole:4,units:2,denominator:2});
  assert.deepEqual(p.group.posOne,{whole:2,units:1,denominator:2});
  assert.deepEqual(p.group.posX,{whole:1,units:0,denominator:1});
  const existing=verify({posX:q(2,3),posOne:q(3,2)},factor("divide",2));
  assert.deepEqual(existing.group.posX,{whole:0,units:1,denominator:3});
  assert.deepEqual(gridValue(existing.group.posOne),q(3,4));
  for(const kind of FRACTION_KINDS)
    assert.deepEqual(rmul(gridValue(existing.group[kind]),2),existing.before[kind]);
});
test("multiplication copies both whole and fractional contents",()=>{
  const p=verify({posX:q(2,3),posOne:q(3,2)},factor("multiply",3));
  assert.equal(p.groups,3);assert.deepEqual(p.raw.posX,{whole:0,units:6,denominator:3});
  assert.deepEqual(p.raw.posOne,{whole:3,units:3,denominator:2});
  assert.deepEqual(gridRoom(p.raw),p.after);
});
test("add and remove use exact common pieces and borrowing without changing the other kind",()=>{
  const p=verify({posX:q(1,2),posOne:q(7,3)},action("remove","posOne",q(1,2)));
  assert.equal(p.borrowed,true);assert.equal(p.changedGrid,true);
  assert.deepEqual(p.prepared.posOne,{whole:1,units:8,denominator:6,borrowed:1});
  assert.deepEqual(p.raw.posOne,{whole:1,units:5,denominator:6});
  assert.deepEqual(p.after.posX,q(1,2));
  const s=verify({posX:q(1,2),posOne:2},action("add","posX",q(1,3)));
  assert.equal(s.changedGrid,true);assert.deepEqual(s.raw.posX,{whole:0,units:5,denominator:6});
  assert.deepEqual(s.after.posX,q(5,6));
});
test("every planned level and reference action has exact physical staging on each room",()=>{
  for(const level of FRACTION_LEVEL_PLAN){
    let state=initialState(level);
    for(const a of level.reference){
      const prepared=prepare(state,a);assert.equal(prepared.ok,true,level.id);
      for(const side of ["left","right"]){
        const p=roomChoreography(a,prepared.pair[side]);
        assert.deepEqual(gridRoom(p.prepared),state[side],level.id);
        assert.deepEqual(gridRoom(p.raw),p.after,level.id);
        assert.deepEqual(gridRoom(canonicalGrid(p.after)),p.after,level.id);
        if(p.group)for(const k of FRACTION_KINDS){
          const expected=a.op==="divide"?p.before[k]:p.after[k];
          assert.deepEqual(rmul(gridValue(p.group[k]),p.groups),expected,level.id);
        }
      }
      const result=perform(state,a);assert.equal(result.ok,true,level.id);state=result.state;
      assert.deepEqual(balanceDifference(state),q(0),level.id);
    }
    assert.equal(isSolved(state),true,level.id);
    assert.equal(state.history.length,level.reference.length,level.id);
    while(state.history.length)state=undo(state);
    assert.deepEqual(state,initialState(level));
  }
});
test("refused moves use bounded illustrative diagrams and mathematical language",()=>{
  const unsupported=fractionTransform({posX:q(3,4)},factor("divide",5));
  assert.equal(unsupported.ok,false);assert.deepEqual(failureDiagram(unsupported),{type:"grid",denominator:20});
  assert.match(failureSpeech(unsupported),/valid/);
  const overflow=fractionTransform({posOne:48},factor("multiply",2));
  assert.equal(overflow.code,"overflow");assert.deepEqual(failureDiagram(overflow),{type:"overflow",excess:48});
  assert.throws(()=>roomChoreography(factor("divide",5),unsupported));
  assert.equal(failureDiagram({code:"missing"}).type,"shake");
});
