import test from "node:test";
import assert from "node:assert/strict";
import {
  WEIGHT_PILE_SIZE,WEIGHT_COUNT_LABEL_THRESHOLD,
  weightPilePosition,weightCountPlaque
} from "../src/weight-piles.mjs";

test("weight piles always use three lower slots then two resting above",()=>{
  assert.equal(WEIGHT_PILE_SIZE,5);
  assert.equal(WEIGHT_COUNT_LABEL_THRESHOLD,10);
  for(const count of [1,2,3,4,5,6,7,8,9,10,11,12,14,15,16,23,25,29,48]){
    const plan=Array.from({length:count},(_,i)=>weightPilePosition(i,count));
    assert.equal(plan.length,count);
    assert.ok(plan.every(Object.isFrozen));
    const groups=new Map();
    for(const position of plan){
      if(!groups.has(position.pile))groups.set(position.pile,[]);
      groups.get(position.pile).push(position);
    }
    assert.equal(groups.size,Math.ceil(count/5));
    for(const [index,items] of groups){
      const size=Math.min(5,count-index*5);
      assert.equal(items.length,size);
      assert.deepEqual(items.map(x=>x.slot),Array.from({length:size},(_,i)=>i+1));
      assert.ok(items.every(x=>x.pileSize===size));
      assert.deepEqual(items.map(x=>x.row),
        Array.from({length:size},(_,i)=>i<3?"lower":"upper"));
      assert.deepEqual(items.map(x=>x.last),
        Array.from({length:size},(_,i)=>i===size-1?size:0));
      assert.equal(items.filter(x=>x.row==="lower").length,Math.min(3,size));
      assert.equal(items.filter(x=>x.row==="upper").length,Math.max(0,size-3));
    }
  }
});

test("only eleven or more loose weights receive one crate-style count plaque",()=>{
  for(let n=0;n<=10;n++)assert.equal(weightCountPlaque(n),"",n);
  for(const n of [11,12,14,15,16,23,25,29,48]){
    const text=weightCountPlaque(n);
    assert.match(text,/class="weight-stack-count"/);
    assert.match(text,new RegExp(">"+n+" weights<"));
    assert.match(text,/weight-count-connector/);
    assert.match(text,/aria-hidden="true"/);
    assert.equal((text.match(/weight-stack-count/g)||[]).length,1);
  }
});
test("pile planner rejects non-physical or phantom slots",()=>{
  for(const args of [[-1,5],[5,5],[2,0],[0,-1],[1.5,8],[0,2.5],[0,0]])
    assert.throws(()=>weightPilePosition(...args),RangeError);
  for(const count of [-1,2.2,NaN,Infinity])
    assert.throws(()=>weightCountPlaque(count),RangeError);
});
