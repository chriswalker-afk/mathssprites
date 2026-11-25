import test from "node:test";
import assert from "node:assert/strict";
import {rational as q,radd,rmul,req} from "../src/rational.mjs";
import {FRACTION_DENOMINATORS,fractionTransform,fractionParts} from "../src/fraction-engine.mjs";
import {FRACTION_LEVEL_PLAN} from "../src/fraction-level-plan.mjs";
import {initialState,perform,isSolved} from "../src/engine.mjs";
import {SPRITE_RADIUS,SPRITE_CENTER,spritePartition,spriteInventoryPlan,spriteGrid,
  spriteChangeStages,spriteAssemblyMarkup,spriteInventoryMarkup,spriteGridMarkup} from "../src/fraction-sprites.mjs";

test("every denominator partitions the same circular sprite into exactly equal radial sectors",()=>{
  const area=Math.PI*SPRITE_RADIUS**2;
  for(const d of FRACTION_DENOMINATORS){
    const parts=spritePartition(d);
    assert.equal(parts.length,d);
    for(let i=0;i<d;i++){
      const p=parts[i];
      assert.deepEqual(p.value,q(1,d));
      assert.ok(Math.abs(p.to-p.from-2*Math.PI/d)<1e-12);
      assert.ok(Math.abs(p.area-area/d)<1e-10);
      assert.ok(Math.abs(Math.hypot(p.start[0]-SPRITE_CENTER[0],p.start[1]-SPRITE_CENTER[1])-SPRITE_RADIUS)<1e-5);
      if(i){assert.equal(p.from,parts[i-1].to);assert.deepEqual(p.start,parts[i-1].end);}
      assert.match(p.path,/^M .* A 32 32 /);
    }
    assert.deepEqual(parts[0].start,parts.at(-1).end);
    assert.ok(Math.abs(parts.reduce((sum,p)=>sum+p.area,0)-area)<1e-10);
    assert.deepEqual(parts.reduce((sum,p)=>radd(sum,p.value),q(0)),q(1));
  }
  assert.throws(()=>spritePartition(7));
});
test("every mixed inventory counts actual whole and residual pieces exactly",()=>{
  for(const d of FRACTION_DENOMINATORS)for(let n=0;n<d;n++){
    const value=q(3*d+n,d),plan=spriteInventoryPlan(value);
    assert.equal(plan.whole,3);
    assert.deepEqual(plan.pieces.reduce((sum,p)=>radd(sum,p.value),q(plan.whole)),value);
    assert.equal(plan.pieces.length,fractionParts(value).pieces);
  }
  assert.throws(()=>spriteInventoryPlan(49));
  assert.throws(()=>spriteInventoryPlan(q(1,7)));
  assert.throws(()=>spriteInventoryPlan(-1));
});
function change(before,action){
  const result=fractionTransform({posX:before},action);
  assert.equal(result.ok,true,result.reason);
  return spriteChangeStages(result.fractionPlans[0],action.op);
}
test("copying fractional sprites creates the exact original number of pieces and recombines",()=>{
  const thirds=change(q(2,3),{op:"multiply",factor:3});
  assert.deepEqual(thirds.raw,{whole:0,units:6,denominator:3});
  assert.equal(thirds.after.whole,2);assert.equal(thirds.after.pieces.length,0);
  const quarters=change(q(3,4),{op:"multiply",factor:4});
  assert.equal(quarters.raw.units,12);assert.equal(quarters.after.whole,3);
  const mixed=change(q(5,4),{op:"multiply",factor:2});
  assert.deepEqual(mixed.raw,{whole:2,units:2,denominator:4});
  assert.deepEqual(mixed.after.value,q(5,2));
});
test("common-grid equivalence and borrowing are driven by the existing rational engine",()=>{
  assert.deepEqual(spriteGrid(q(1,2),6),{value:q(1,2),whole:0,units:3,denominator:6});
  const sixths=change(q(1,2),{op:"add",kind:"posX",count:q(1,3)});
  assert.equal(sixths.prepared.units,3);assert.equal(sixths.amount.units,2);
  assert.equal(sixths.raw.units,5);assert.deepEqual(sixths.after.value,q(5,6));
  const borrow=change(1,{op:"remove",kind:"posX",count:q(1,4)});
  assert.deepEqual(borrow.prepared,{whole:0,units:4,denominator:4,borrowed:1});
  assert.equal(borrow.raw.units,3);assert.deepEqual(borrow.after.value,q(3,4));
  assert.throws(()=>spriteGrid(q(1,5),6));
});
test("fragment markup has exactly one original face, unique clip IDs and a non-counted reference",()=>{
  const a=spriteAssemblyMarkup(3,[0,1]);
  assert.equal((a.match(/class="fs-piece"/g)||[]).length,2);
  assert.equal((a.match(/class="fs-eye"/g)||[]).length,2);
  assert.equal((a.match(/class="fs-whole-outline"/g)||[]).length,1);
  assert.doesNotMatch(a,/class="fs-joined-art"/);
  assert.match(a,/aria-label="2\/3 of one dark sprite \(2 equal pieces\)"/);
  const b=spriteAssemblyMarkup(3,[0,1,2]);
  assert.match(b,/class="fs-joined-art"/);
  assert.equal((b.match(/class="fs-piece"/g)||[]).length,3);
  assert.notEqual(a.match(/<radialGradient id="([^"]+)"/)[1],b.match(/<radialGradient id="([^"]+)"/)[1]);
  assert.throws(()=>spriteAssemblyMarkup(4,[0,0]));
  const mixed=spriteInventoryMarkup(q(8,3));
  assert.equal((mixed.match(/class="fs-piece"/g)||[]).length,4);
  assert.match(mixed,/aria-label="8\/3 sprites"/);
  const raw=spriteGridMarkup({whole:0,units:6,denominator:3});
  assert.equal((raw.match(/class="fs-piece"/g)||[]).length,6);
  assert.equal((raw.match(/is-separated/g)||[]).length,2);
});
test("sprite inventory data supports every settled state in the sixty reference routes",()=>{
  for(const level of FRACTION_LEVEL_PLAN){
    let s=initialState(level);
    const check=state=>{
      for(const side of ["left","right"]){
        const p=spriteInventoryPlan(state[side].posX);
        assert.deepEqual(p.pieces.reduce((sum,piece)=>radd(sum,piece.value),q(p.whole)),state[side].posX,level.id);
      }
    };
    check(s);
    for(const action of level.reference){
      const result=perform(s,action);
      assert.equal(result.ok,true,level.id+" "+result.reason);
      s=result.state;check(s);
      const tx=s.history.at(-1);
      if(action.op==="multiply"||(["add","remove"].includes(action.op)&&action.kind==="posX")){
        for(const side of ["left","right"]){
          const stage=spriteChangeStages(tx.fractionPlans[side][0],action.op);
          assert.deepEqual(stage.after.value,s[side].posX);
        }
      }
    }
    assert.equal(isSolved(s),true,level.id);
  }
});
