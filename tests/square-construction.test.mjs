import test from "node:test";
import assert from "node:assert/strict";
import {areaArrangement,previewRoomAction,initialState,perform,undo,isSolved,LEVELS,evaluate} from "../src/engine.mjs";
import {squareConstructionPlan,squareConstructionMarkup,squareOverflowPlan,squareOverflowMarkup} from "../src/square-construction.mjs";
import {handMotionPlan} from "../src/hand-timeline.mjs";
const sq={op:"square"};
test("every supported nonempty side makes exactly one ordered destination per output token",()=>{
  let cases=0;
  for(let a=0;a<=6;a++)for(let b=0;b<=6;b++){
    const n=a+b;if(n===0||n*n>48)continue;
    const source={posX:a,posOne:b},area=areaArrangement(source,"square");
    const p=squareConstructionPlan(area),result=previewRoomAction(source,sq,"positive");
    assert.equal(result.ok,true);
    assert.equal(p.cells.length,n*n);
    assert.equal(p.edges.length,n);
    assert.deepEqual(p.counts,{posX2:a*a,posX:2*a*b,posOne:b*b});
    assert.deepEqual(p.regions,{quadratic:a*a,mixedTop:a*b,mixedBottom:a*b,units:b*b});
    for(const k of ["posX2","posX","posOne"]){
      assert.equal(p.counts[k],result.after[k]);
      assert.deepEqual(p.cells.filter(c=>c.kind===k).map(c=>c.outputIndex),Array.from({length:p.counts[k]},(_,i)=>i));
    }
    assert.deepEqual(p.edges.filter(e=>e.kind==="posX").map(e=>e.inputIndex),Array.from({length:a},(_,i)=>i));
    assert.deepEqual(p.edges.filter(e=>e.kind==="posOne").map(e=>e.inputIndex),Array.from({length:b},(_,i)=>i));
    const html=squareConstructionMarkup(p);
    assert.equal((html.match(/data-cell-index="/g)||[]).length,n*n);
    assert.equal((html.match(/data-segment="/g)||[]).length,2*n);
    assert.equal((html.match(/data-non-counting="true"/g)||[]).length,2*n+2);
    assert.equal((html.match(/class="square-frame-wall/g)||[]).length,4);
    assert.doesNotMatch(html,/box-footnote|square-symbol|<math/);
    for(const reduced of [false,true]){
      const beats=handMotionPlan(sq,reduced,area).phases;
      assert.deepEqual(beats.slice(3,-4).map(b=>b.name),p.stages);
      assert.equal(beats.filter(b=>b.applyChange).length,1);
      assert.equal(beats.find(b=>b.applyChange).name,"contact");
    }
    for(const x of [0,1,2,6])assert.equal(evaluate(result.after,x),evaluate(source,x)**2);
    cases++;
  }
  assert.equal(cases,27);
});
test("the mixed regions are distinct consecutive construction stages with equal counts",()=>{
  const area=areaArrangement({posX:2,posOne:3},"square"),p=squareConstructionPlan(area);
  assert.deepEqual(p.stages,["frame","edge","column","quadratic","mixed-top","mixed-bottom","units"]);
  assert.equal(p.cells.filter(c=>c.region==="mixed-top").length,6);
  assert.equal(p.cells.filter(c=>c.region==="mixed-bottom").length,6);
  assert.equal(p.cells.filter(c=>c.stage==="mixed").length,12);
  assert.throws(()=>squareConstructionPlan(areaArrangement({posX2:4,posX:12,posOne:9},"sqrt")));
  assert.throws(()=>squareConstructionPlan({op:"square",side:7,cells:49}));
});
test("the exact 7x7 refusal shows 48 trial slots plus one excess weight; large trials stay bounded",()=>{
  for(const source of [{posOne:7},{posX:2,posOne:5},{posX:7},{posX:48}]){
    const failure=previewRoomAction(source,sq,"positive"),p=squareOverflowPlan(source,failure);
    const n=(source.posX||0)+(source.posOne||0);
    assert.equal(failure.code,"overflow");
    assert.equal(p.total,n*n);assert.equal(p.excess,n*n-48);
    assert.equal(p.cells.length,48);
    assert.equal(p.spill.length,Math.min(12,p.excess));
    if(n===7)assert.equal(p.spill.length,1);
    const html=squareOverflowMarkup(p);
    assert.equal((html.match(/class="square-overflow-cell"/g)||[]).length,48);
    assert.equal((html.match(/class="square-overflow-prop"/g)||[]).length,p.spill.length);
    assert.doesNotMatch(html,/class="token /);
  }
  assert.equal(squareOverflowPlan({posX:6},{code:"overflow",total:36,capacity:48}),null);
  assert.equal(squareOverflowPlan({posX:7},{code:"overflow",total:50,capacity:48}),null);
  assert.equal(squareOverflowPlan({posX:7,posX2:1},{code:"overflow",total:49,capacity:48}),null);
  assert.equal(squareOverflowMarkup(null),"");
});
test("construction and illustrative refusal leave the bilateral engine transaction contract intact",()=>{
  const initial=initialState(LEVELS.find(l=>l.id==="mixed-area"));
  const first=perform(initial,sq,"manual","left");
  assert.equal(first.ok,true);assert.equal(first.committed,false);
  assert.equal(first.state.history.length,0);assert.equal(isSolved(first.state),false);
  assert.deepEqual(undo(first.state),initial);
  const second=perform(first.state,sq,"manual","right");
  assert.equal(second.ok,true);assert.equal(second.committed,true);
  assert.equal(second.state.history.length,1);assert.equal(isSolved(second.state),true);
  const expanded=perform(initial,{op:"add",kind:"posOne",count:2},"auto");
  assert.equal(expanded.ok,true);
  const before=JSON.stringify(expanded.state);
  const failed=perform(expanded.state,sq,"auto");
  assert.equal(failed.ok,false);assert.equal(failed.code,"overflow");
  assert.equal(JSON.stringify(expanded.state),before);
  assert.deepEqual(undo(expanded.state),initial);
});
