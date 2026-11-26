import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {WEIGHT_SHAPES,ALTERNATIVE_WEIGHT_SHAPES,weightShape,weightShapeClip,resolveWeightShape} from "../src/weight-shapes.mjs";
import {FRACTION_DENOMINATORS} from "../src/fraction-engine.mjs";
import {rational as q} from "../src/rational.mjs";
import {weightPartition,weightContourArea,weightAssemblyMarkup,weightInventoryMarkup,weightGridMarkup} from "../src/fraction-weights.mjs";
import {COSMETIC_REWARDS} from "../src/cosmetic-catalog.mjs";
test("six approved skins share native CSS and exact SVG silhouettes; unknown shapes safely fall back",()=>{
  assert.deepEqual(ALTERNATIVE_WEIGHT_SHAPES,["dumbbell","hexagonal-weight","kettlebell","cube-weight","metal-ingot","cylindrical-weight"]);
  const css=readFileSync(new URL("../src/weight-shapes.css",import.meta.url),"utf8");
  for(const id of ALTERNATIVE_WEIGHT_SHAPES){
    const s=weightShape(id);
    assert.equal(COSMETIC_REWARDS.find(r=>r.id===id).slot,"weight-shape");
    const rule=css.split('[data-weight-shape="'+id+'"]{')[1].split("}")[0];
    assert.ok(rule.includes("--ws-clip:"+weightShapeClip(id)+";"),id);
    assert.ok(rule.includes("--ws-rise:"+s.rise+"px;"),id);
    assert.ok(rule.includes("--ws-fraction-rise:"+s.fractionRise+"px;"),id);
    assert.ok(s.outer.every(p=>p.every(n=>n>=0&&n<=100)));
    assert.ok(s.rise>0&&s.rise<=33);
  }
  assert.equal(resolveWeightShape("__proto__"),"original");
  assert.equal(resolveWeightShape("unknown"),"original");
  assert.equal(weightShape("kettlebell").holes.length,1);
  assert.ok(weightContourArea(weightShape("kettlebell").outer,weightShape("kettlebell").holes)<weightContourArea(weightShape("kettlebell").outer));
});
test("every shape partitions into equal physical areas, excluding the kettlebell opening, even for refusal trials",()=>{
  for(const [shape,s] of Object.entries(WEIGHT_SHAPES)){
    const total=weightContourArea(s.outer,s.holes);
    for(const d of [...FRACTION_DENOMINATORS,7,120]){
      const parts=weightPartition(d,{shape,trial:true});
      assert.equal(parts.length,d);
      let area=0;
      for(let i=0;i<parts.length;i++){
        const p=parts[i],value=weightContourArea(p.polygon,p.holes);
        assert.deepEqual(p.value,q(1,d));
        assert.ok(Math.abs(value-total/d)<1e-7,shape+" / "+d+" at "+i);
        assert.ok(p.polygon.every(([x])=>x>=p.left-1e-8&&x<=p.right+1e-8));
        if(i)assert.equal(p.left,parts[i-1].right);
        area+=value;
      }
      assert.ok(Math.abs(area-total)<1e-6,shape+" / "+d);
    }
  }
  assert.notDeepEqual(weightPartition(3,{shape:"original"}),weightPartition(3,{shape:"dumbbell"}));
});
test("all inventory, borrowing and refusal art retains shape, exact labels and fragment counts",()=>{
  for(const shape of ALTERNATIVE_WEIGHT_SHAPES){
    const art=weightAssemblyMarkup(3,[0,1],{shape});
    assert.match(art,new RegExp('data-shape="'+shape+'"'));
    assert.equal((art.match(/class="fw-piece"/g)||[]).length,2);
    assert.match(art,/aria-label="2\/3 of one weight/);
    assert.match(art,/class="fw-material-light"/);
    const inventory=weightInventoryMarkup(q(17,3),{shape});
    assert.equal((inventory.match(/class="fw-pile-weight"/g)||[]).length,5);
    assert.equal((inventory.match(new RegExp('data-shape="'+shape+'"',"g"))||[]).length,6);
    const grid=weightGridMarkup({whole:1,units:5,denominator:3},{shape});
    assert.equal((grid.match(new RegExp('data-shape="'+shape+'"',"g"))||[]).length,3);
    assert.equal((grid.match(/class="fw-piece"/g)||[]).length,6);
    assert.equal((weightAssemblyMarkup(7,[0,1,2,3,4,5,6],{shape,trial:true}).match(/class="fw-piece"/g)||[]).length,7);
  }
  assert.match(weightAssemblyMarkup(3,[1],{shape:"kettlebell"}),/fill-rule="evenodd" clip-rule="evenodd"/);
});
