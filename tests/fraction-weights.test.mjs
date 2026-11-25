import test from "node:test";
import assert from "node:assert/strict";
import {rational as q,radd,rmul,req} from "../src/rational.mjs";
import {FRACTION_DENOMINATORS,fractionTransform} from "../src/fraction-engine.mjs";
import {WEIGHT_BODY,polygonArea,weightPartition,weightInventoryPlan,weightGrid,
  weightChangeStages,weightAssemblyMarkup,weightInventoryMarkup} from "../src/fraction-weights.mjs";

test("all supported silhouettes partition the original brass body into equal areas",()=>{
  const total=polygonArea(WEIGHT_BODY);
  for(const d of FRACTION_DENOMINATORS){
    const pieces=weightPartition(d);
    assert.equal(pieces.length,d);
    assert.equal(pieces[0].left,8);assert.equal(pieces.at(-1).right,90);
    for(let i=0;i<d;i++){
      const piece=pieces[i];
      assert.deepEqual(piece.value,q(1,d));
      assert.ok(Math.abs(polygonArea(piece.polygon)-total/d)<1e-8);
      assert.ok(piece.polygon.every(p=>p[0]>=piece.left-1e-8&&p[0]<=piece.right+1e-8));
      if(i)assert.equal(piece.left,pieces[i-1].right);
    }
    assert.ok(Math.abs(pieces.reduce((sum,p)=>sum+polygonArea(p.polygon),0)-total)<1e-8);
  }
  assert.throws(()=>weightPartition(7));
});
test("whole-weight pile layout and fractional residue conserve every planned quantity",()=>{
  for(const d of FRACTION_DENOMINATORS)for(let n=0;n<d;n++){
    const value=q(12*d+n,d),p=weightInventoryPlan(value);
    assert.deepEqual(p.piles.map(p=>p.length),[5,5,2]);
    assert.deepEqual(p.piles[0].map(x=>x.row),["lower","lower","lower","upper","upper"]);
    assert.equal(p.countPlaque,12);
    const sum=p.pieces.reduce((s,piece)=>radd(s,piece.value),q(p.whole));
    assert.deepEqual(sum,value);
  }
  assert.equal(weightInventoryPlan(10).countPlaque,null);
  assert.throws(()=>weightInventoryPlan(49));
});
function change(before,amount,op){
  const result=fractionTransform({posOne:before},{op,kind:"posOne",count:amount});
  assert.equal(result.ok,true,result.reason);
  return weightChangeStages(result.fractionPlans[1],op);
}
test("common grids and borrowing faithfully follow exact engine plans",()=>{
  assert.deepEqual(weightGrid(q(1,2),6),{value:q(1,2),whole:0,units:3,denominator:6});
  const half=change(q(1,2),q(1,4),"remove");
  assert.deepEqual(half.prepared,{whole:0,units:2,denominator:4,borrowed:0});
  assert.equal(half.raw.units,1);
  const whole=change(q(1),q(1,4),"remove");
  assert.deepEqual(whole.prepared,{whole:0,units:4,denominator:4,borrowed:1});
  assert.equal(whole.raw.units,3);
  const sixths=change(q(1,2),q(1,3),"add");
  assert.equal(sixths.prepared.units,3);assert.equal(sixths.amount.units,2);
  assert.equal(sixths.raw.units,5);assert.deepEqual(sixths.after.value,q(5,6));
  const tenths=change(q(3,5),q(1,2),"add");
  assert.equal(tenths.raw.units,11);assert.equal(tenths.after.whole,1);
  assert.deepEqual(tenths.after.value,q(11,10));
  assert.throws(()=>weightGrid(q(1,5),6));
});
test("art markup exposes actual fragments, non-counted outlines and unique SVG paint IDs",()=>{
  const a=weightAssemblyMarkup(4,[0,1,2]);
  assert.equal((a.match(/class="fw-piece"/g)||[]).length,3);
  assert.equal((a.match(/class="fw-whole-outline"/g)||[]).length,1);
  assert.match(a,/aria-label="3\/4 of one weight \(3 equal pieces\)"/);
  const b=weightAssemblyMarkup(4,[0,1,2]);
  assert.notEqual(a.match(/<linearGradient id="([^"]+)"/)[1],b.match(/<linearGradient id="([^"]+)"/)[1]);
  assert.throws(()=>weightAssemblyMarkup(4,[0,0]));
  const mixed=weightInventoryMarkup(q(51,4));
  assert.equal((mixed.match(/class="fw-pile-weight"/g)||[]).length,12);
  assert.equal((mixed.match(/class="fw-piece"/g)||[]).length,15);
  assert.match(mixed,/12 whole weights/);
  assert.match(mixed,/aria-label="51\/4 weights"/);
});
