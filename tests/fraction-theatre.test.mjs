import test from "node:test";
import assert from "node:assert/strict";
import {fractionCutPlan,CUTTABLE_KINDS} from "../src/fraction-theatre.mjs";
import {previewRoomAction,LEVELS,initialState,equation,balanceDifference,prepare} from "../src/engine.mjs";

const issue=(kind,count,factor)=>{
  const result=previewRoomAction({[kind]:count},{op:"divide",factor},"signed");
  assert.equal(result.ok,false);
  assert.equal(result.code,"fraction");
  return result;
};

test("the hand splits ONE actual round sprite into TWO matching physical halves",()=>{
  const f=issue("posX",1,2),p=fractionCutPlan(f);
  assert.equal(p.kind,"posX");
  assert.equal(p.sourceCount,1);
  assert.equal(p.sourceCount,p.factor*p.whole+p.remainder);
  assert.equal(p.sources.length,1);
  assert.equal(p.fragments.length,2);
  assert.deepEqual(p.fragments.map(v=>[v.start,v.end]),[[0,.5],[.5,1]]);
  assert.deepEqual(p.fragments.map(v=>v.basket),[0,1]);
  assert.deepEqual(p.eachBasket,{whole:0,numerator:1,denominator:2});
});

test("five weights shared into two groups cut ONLY the one leftover weight",()=>{
  const p=fractionCutPlan(issue("posOne",5,2));
  assert.equal(p.whole,2);
  assert.equal(p.remainder,1);
  assert.equal(p.sources.length,1);
  assert.equal(p.fragments.length,2);
  assert.deepEqual(p.eachBasket,{whole:2,numerator:1,denominator:2});
  assert.ok(p.fragments.every(v=>v.shareOfWhole===.5));
});

test("two actual square sprites into three groups produce SIX clipped pieces, not six sprites",()=>{
  const p=fractionCutPlan(issue("posX2",2,3));
  assert.equal(p.sources.length,2);
  assert.equal(p.fragments.length,6);
  assert.deepEqual(p.sources.map(s=>s.pieces.length),[3,3]);
  assert.deepEqual(p.fragments.map(v=>v.basket),[0,1,2,0,1,2]);
  assert.equal(p.eachBasket.numerator,2);
  assert.equal(p.eachBasket.denominator,3);
  assert.equal(p.fragments.filter(v=>v.basket===1).length,2);
});

test("every fraction-cut plan geometrically conserves all original material",()=>{
  let total=0;
  for(const kind of CUTTABLE_KINDS)
    for(let factor=2;factor<=5;factor++)
      for(let count=1;count<=12;count++){
        if(count%factor===0)continue;
        const p=fractionCutPlan(issue(kind,count,factor));
        assert.equal(p.sourceCount,p.factor*p.whole+p.remainder);
        assert.equal(p.fragments.length,p.remainder*p.factor);
        assert.equal(p.fragments.length<=20,true);
        for(const source of p.sources){
          assert.equal(source.pieces.length,p.factor);
          assert.equal(source.pieces[0].start,0);
          assert.equal(source.pieces.at(-1).end,1);
          for(let i=0;i<p.factor-1;i++)
            assert.equal(source.pieces[i].end,source.pieces[i+1].start);
          assert.ok(Math.abs(source.pieces.reduce((v,e)=>v+e.end-e.start,0)-1)<1e-10);
        }
        for(let basket=0;basket<factor;basket++){
          const pieces=p.fragments.filter(v=>v.basket===basket);
          assert.equal(pieces.length,p.remainder);
          assert.ok(Math.abs(p.whole+pieces.reduce((v,e)=>v+e.shareOfWhole,0)
            -count/factor)<1e-10);
        }
        total++;
      }
  assert.ok(total>120);
});

test("invalid, impossible and whole-item requests never produce fictional cut fragments",()=>{
  for(const source of [
    null,{code:"missing",kind:"posX",count:1,factor:2,whole:0,remainder:1},
    {code:"fraction",kind:"unknown",count:1,factor:2,whole:0,remainder:1},
    {code:"fraction",kind:"posX",count:1,factor:2,whole:0,remainder:0},
    {code:"fraction",kind:"posX",count:1,factor:2,whole:0,remainder:2},
    {code:"fraction",kind:"posX",count:3,factor:2,whole:0,remainder:1},
    {code:"fraction",kind:"posX",count:1,factor:6,whole:0,remainder:1}
  ])assert.throws(()=>fractionCutPlan(source),TypeError);
});

test("no fractional cut alters either room, solves a level or creates a history entry",()=>{
  const start=initialState(LEVELS[0]);
  const original=JSON.stringify(start);
  const failure=prepare(start,{op:"divide",factor:2});
  assert.equal(failure.ok,false);
  assert.equal(failure.code,"fraction");
  fractionCutPlan(failure);
  assert.equal(JSON.stringify(start),original);
  assert.equal(start.history.length,0);
  assert.equal(equation(start),"x + 2 = 5");
  assert.equal(balanceDifference(start),0);
});
