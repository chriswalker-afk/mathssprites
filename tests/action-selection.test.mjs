import test from "node:test";
import assert from "node:assert/strict";
import {neutralToolSelection,actionFromToolSelection,stepToolQuantity} from "../src/action-selection.mjs";

test("new levels start without an operation, object, quantity or actionable command",()=>{
  const blank=neutralToolSelection();
  assert.deepEqual(blank,{operation:null,kind:null,amount:null,factor:null});
  assert.equal(actionFromToolSelection(blank),null);
  for(const operation of ["remove","add","divide","multiply"]){
    assert.equal(actionFromToolSelection({...blank,operation}),null);
  }
  assert.equal(actionFromToolSelection({...blank,operation:"remove",kind:"posOne"}),null);
  assert.equal(actionFromToolSelection({...blank,operation:"divide",factor:undefined}),null);
});
test("a student must explicitly choose every relevant part of a move",()=>{
  const blank=neutralToolSelection();
  assert.deepEqual(actionFromToolSelection({...blank,operation:"remove",kind:"posOne",amount:5}),
    {op:"remove",kind:"posOne",count:5});
  assert.deepEqual(actionFromToolSelection({...blank,operation:"add",kind:"negX",amount:1}),
    {op:"add",kind:"negX",count:1});
  assert.deepEqual(actionFromToolSelection({...blank,operation:"divide",factor:3}),
    {op:"divide",factor:3});
  assert.deepEqual(actionFromToolSelection({...blank,operation:"multiply",factor:5}),
    {op:"multiply",factor:5});
  assert.deepEqual(actionFromToolSelection({...blank,operation:"square"}),{op:"square"});
  assert.deepEqual(actionFromToolSelection({...blank,operation:"sqrt"}),{op:"sqrt"});
  for(const amount of [null,0,13,2.5])assert.equal(
    actionFromToolSelection({...blank,operation:"remove",kind:"posOne",amount}),null);
  for(const factor of [null,1,6,2.5])assert.equal(
    actionFromToolSelection({...blank,operation:"divide",factor}),null);
});
test("steppers do not guess an initial amount or reuse an authored solution",()=>{
  assert.equal(stepToolQuantity("remove",null,-1),null);
  assert.equal(stepToolQuantity("remove",null,1),1);
  assert.equal(stepToolQuantity("divide",null,1),2);
  assert.equal(stepToolQuantity("multiply",null,-1),null);
  assert.equal(stepToolQuantity("divide",2,-1),2);
  assert.equal(stepToolQuantity("divide",5,1),5);
  assert.equal(stepToolQuantity("add",12,1),12);
  assert.equal(stepToolQuantity("remove",3,1),4);
  assert.equal(stepToolQuantity(null,null,1),null);
});
