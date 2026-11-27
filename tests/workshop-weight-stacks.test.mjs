import test from "node:test";
import assert from "node:assert/strict";
import {WORKSHOP_WEIGHT_PILE_SIZE,WEIGHT_PILE_SIZE,weightPilePosition,workshopWeightPilePosition,weightCountPlaque} from "../src/weight-piles.mjs";
import {weightInventoryPlan,weightInventoryMarkup,weightGridMarkup,workshopFractionPileGeometry} from "../src/fraction-weights.mjs";
import {WEIGHT_SHAPES} from "../src/weight-shapes.mjs";
import {rational,radd} from "../src/rational.mjs";
const patterns=[[],[1],[2],[3],[4],[3,2],[3,2,1],[4,3],[4,3,1],[4,3,2],[4,3,2,1]];
const plan=n=>Array.from({length:n},(_,i)=>workshopWeightPilePosition(i,n));
function groups(n){
  const rows=[];
  for(const position of plan(n))(rows[position.pile]??=[]).push(position);
  return rows;
}
test("all 1–48 free-play inventories retain one weight per slot and use complete tens",()=>{
  assert.equal(WORKSHOP_WEIGHT_PILE_SIZE,10);
  assert.equal(WEIGHT_PILE_SIZE,5);
  for(let n=1;n<=48;n++){
    const piles=groups(n);
    assert.equal(piles.length,Math.ceil(n/10));
    for(const [index,pile] of piles.entries()){
      const size=Math.min(10,n-index*10);
      const expected=patterns[size];
      assert.equal(pile.length,size);
      assert.deepEqual(pile.map(p=>p.slot),Array.from({length:size},(_,i)=>i+1));
      assert.ok(pile.every(p=>Object.isFrozen(p)&&p.pileSize===size&&p.base===expected[0]&&p.rows===expected.length));
      assert.deepEqual(expected.map((_,row)=>pile.filter(p=>p.row===row).length),expected);
      for(const [i,p] of pile.entries()){
        assert.ok(p.x>=0&&p.x<=p.base-1);
        if(p.row>0){
          const supporting=pile.filter(q=>q.row===p.row-1);
          assert.ok(supporting.some(q=>q.x===p.x-.5),n+" left support");
          assert.ok(supporting.some(q=>q.x===p.x+.5),n+" right support");
        }
        if(i)assert.equal(p.delta,p.x-pile[i-1].x);
        if(i===pile.length-1){
          assert.equal(p.tail,p.base-1-p.x);
          assert.equal(p.last,size);
          assert.equal(p.nextPile,index<piles.length-1);
        }else assert.equal(p.last,0);
      }
    }
  }
  assert.deepEqual(groups(22).map(g=>g.length),[10,10,2]);
  assert.deepEqual(groups(48).map(g=>g.length),[10,10,10,10,8]);
  for(const args of [[0,0],[1,1],[-1,10],[0,2.5]])assert.throws(()=>workshopWeightPilePosition(...args),RangeError);
});
test("legacy defaults and count threshold remain unchanged",()=>{
  for(let n=1;n<=48;n++){
    const expected=Array.from({length:Math.ceil(n/5)},(_,i)=>Math.min(5,n-i*5));
    assert.deepEqual(weightInventoryPlan(n).piles.map(p=>p.length),expected);
    assert.deepEqual(weightInventoryPlan(n,{layout:"five"}).piles.map(p=>p.length),expected);
    for(let i=0;i<n;i++)assert.equal(weightPilePosition(i,n).slot,i%5+1);
    assert.equal(Boolean(weightCountPlaque(n)),n>10);
  }
  const markup=weightInventoryMarkup(22);
  assert.doesNotMatch(markup,/data-stack-layout/);
  assert.equal((markup.match(/class="fw-pile"/g)||[]).length,5);
});
test("compact fraction piles preserve exact pieces, whole counts and cosmetic contours",()=>{
  for(const n of [5,9,10,11,19,20,22,30,40,48]){
    const p=weightInventoryPlan(n,{layout:"ten"});
    assert.equal(p.whole,n);
    assert.deepEqual(p.piles.map(g=>g.length),groups(n).map(g=>g.length));
    assert.equal(p.countPlaque,n>10?n:null);
    for(const g of p.piles)for(const shape of Object.keys(WEIGHT_SHAPES)){
      const geo=workshopFractionPileGeometry(g,shape),profile=WEIGHT_SHAPES[shape];
      const xs=profile.outer.map(p=>p[0]);
      const bodyWidth=(Math.max(...xs)-Math.min(...xs))*58/136;
      assert.ok(geo.pitch>bodyWidth&&geo.pitch<bodyWidth+2);
      assert.ok(geo.width>0&&geo.height>=44);
      assert.equal(geo.width,g[0].base*geo.pitch);
      assert.equal(geo.rise,profile.fractionRise-1);
    }
  }
  const value=rational(45,2),p=weightInventoryPlan(value,{layout:"ten"});
  assert.deepEqual(p.piles.map(g=>g.length),[10,10,2]);
  assert.deepEqual(p.pieces.reduce((v,piece)=>radd(v,piece.value),rational(p.whole)),value);
  const markup=weightInventoryMarkup(value,{layout:"ten",shape:"kettlebell"});
  assert.equal((markup.match(/class="fw-pile-weight"/g)||[]).length,22);
  assert.equal((markup.match(/class="fw-piece"/g)||[]).length,23);
  assert.equal((markup.match(/class="fw-count-plaque"/g)||[]).length,1);
  assert.match(markup,/22 whole weights/);
  assert.match(markup,/aria-label="45\/2 weights"/);
  assert.match(markup,/data-shape="kettlebell"/);
  assert.match(markup,/class="fw-label" aria-hidden="true">1\/2/);
  const grid=weightGridMarkup({whole:22,units:3,denominator:4},{layout:"ten"});
  assert.equal((grid.match(/class="fw-pile-weight"/g)||[]).length,22);
  assert.equal((grid.match(/class="fw-piece"/g)||[]).length,25);
  assert.match(grid,/is-separated/);
  assert.match(grid,/3\/4/);
});
