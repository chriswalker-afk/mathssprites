import test from "node:test";
import assert from "node:assert/strict";
import {areaArrangement,previewRoomAction,evaluate,initialState,perform,undo,isSolved,LEVELS} from "../src/engine.mjs";
import {squareRootPlan,squareRootTrialPlan,squareRootTrialMessage} from "../src/square-root-construction.mjs";
import {squareConstructionMarkup} from "../src/square-construction.mjs";
import {handMotionPlan} from "../src/hand-timeline.mjs";
const kinds=["posX2","posX","posOne"],root={op:"sqrt"};
test("every supported nonempty complete square recovers exactly one nonnegative side",()=>{
  let cases=0;
  for(let a=0;a<=6;a++)for(let b=0;b<=6;b++){
    const n=a+b;if(!n||n*n>48)continue;
    const source={posX2:a*a,posX:2*a*b,posOne:b*b},area=areaArrangement(source,"sqrt");
    const plan=squareRootPlan(area),result=previewRoomAction(source,root,"positive");
    assert.equal(result.ok,true);
    assert.equal(plan.cells.length,n*n);
    assert.deepEqual(plan.counts,source);
    assert.deepEqual(plan.output,{posX2:0,posX:a,posOne:b});
    for(const k of kinds){
      assert.equal(plan.output[k],result.after[k]);
      assert.deepEqual(plan.cells.filter(c=>c.kind===k).map(c=>c.outputIndex),Array.from({length:source[k]},(_,i)=>i));
    }
    assert.equal(plan.edges.length,n);
    assert.deepEqual(plan.edges.filter(e=>e.kind==="posX").map(e=>e.inputIndex),Array.from({length:a},(_,i)=>i));
    assert.deepEqual(plan.edges.filter(e=>e.kind==="posOne").map(e=>e.inputIndex),Array.from({length:b},(_,i)=>i));
    const markup=squareConstructionMarkup(plan);
    assert.equal((markup.match(/data-cell-index="/g)||[]).length,n*n);
    assert.equal((markup.match(/data-non-counting="true"/g)||[]).length,2*n+2);
    assert.doesNotMatch(markup,/box-footnote|<math/);
    for(const reduced of [true,false]){
      const beats=handMotionPlan(root,reduced,area).phases;
      assert.deepEqual(beats.slice(3,-4).map(x=>x.name),plan.stages);
      assert.equal(beats.filter(b=>b.applyChange).length,1);
      assert.equal(beats.find(b=>b.applyChange).name,"contact");
    }
    for(const x of [0,1,2,6])assert.equal(evaluate(result.after,x)**2,evaluate(source,x));
    assert.equal(squareRootTrialPlan(source),null);
    cases++;
  }
  assert.equal(cases,27);
  assert.equal(squareRootTrialPlan({posOne:0}),null);
});
test("failed root trials distinguish missing corners, uneven cross regions and leftovers",()=>{
  const corner=squareRootTrialPlan({posX2:1,posX:4,posOne:3});
  assert.deepEqual([corner.spriteSide,corner.weightSide],[1,2]);
  assert.deepEqual(corner.missing,{posX2:0,posX:0,posOne:1});
  assert.equal(corner.leftovers.length,0);
  const missingMixed=squareRootTrialPlan({posX2:1,posX:3,posOne:4});
  assert.deepEqual(missingMixed.missing,{posX2:0,posX:1,posOne:0});
  assert.equal(missingMixed.cells.filter(c=>c.present&&c.region==="mixed-top").length,2);
  assert.equal(missingMixed.cells.filter(c=>c.present&&c.region==="mixed-bottom").length,1);
  const extra=squareRootTrialPlan({posOne:12});
  assert.equal(extra.side,3);assert.equal(extra.leftovers.length,3);
  const incomplete=squareRootTrialPlan({posOne:15});
  assert.equal(incomplete.side,4);assert.equal(incomplete.missing.posOne,1);
  const noUnits=squareRootTrialPlan({posX2:1,posX:4});
  assert.equal(noUnits.weightSide,2);assert.equal(noUnits.missing.posOne,4);
  const message=squareRootTrialMessage(corner);
  assert.match(message,/missing 1 weight/);
  assert.match(message,/complete square of whole objects/);
  assert.match(message,/undo/);
  assert.match(squareRootTrialMessage(extra),/3 weights left over/);
  assert.equal(squareRootTrialPlan({posX2:1,negOne:1}),null);
  assert.equal(squareRootTrialPlan({posOne:49}),null);
  assert.equal(squareRootTrialPlan({posOne:1.5}),null);
  assert.equal(squareRootTrialPlan({posX:1,crates:{count:1}}),null);
});
test("all bounded positive inventories either root exactly or account for every original object in a trial",()=>{
  let refused=0,legal=0;
  for(let A=0;A<=48;A++)for(let C=0;C<=48-A;C++)for(let B=0;B<=48-A-C;B++){
    const source={posX2:A,posX:C,posOne:B};
    const result=previewRoomAction(source,root,"positive");
    const trial=squareRootTrialPlan(source);
    if(result.ok){assert.equal(trial,null);legal++;continue;}
    assert.ok(trial,JSON.stringify(source));refused++;
    assert.ok(trial.cells.length<=36);assert.ok(trial.side<=6);
    assert.equal(trial.cells.length,trial.side**2);
    assert.ok(kinds.some(k=>trial.missing[k]||trial.excess[k]));
    for(const k of kinds){
      const actual=trial.cells.filter(c=>c.kind===k&&c.present).map(c=>c.sourceIndex)
        .concat(trial.leftovers.filter(c=>c.kind===k).map(c=>c.sourceIndex)).sort((a,b)=>a-b);
      assert.deepEqual(actual,Array.from({length:source[k]},(_,i)=>i),JSON.stringify(source));
      assert.equal(trial.cells.filter(c=>c.kind===k&&!c.present).length,trial.missing[k]);
      assert.equal(trial.leftovers.filter(c=>c.kind===k).length,trial.excess[k]);
    }
  }
  assert.equal(legal,28);assert.equal(legal+refused,20825);
});
test("actual root engine remains atomic and both manual orders recover the same side",()=>{
  const initial=initialState(LEVELS.find(l=>l.id==="mixed-root")),auto=perform(initial,root,"auto");
  assert.equal(auto.ok,true);assert.equal(auto.state.history.length,1);
  assert.equal(auto.state.left.posX,2);assert.equal(auto.state.left.posOne,3);
  assert.equal(auto.state.right.posOne,5);assert.equal(isSolved(auto.state),false);
  for(const side of ["left","right"]){
    const visit=perform(initial,root,"manual",side);
    assert.equal(visit.ok,true);assert.equal(visit.committed,false);
    assert.equal(visit.state.history.length,0);assert.deepEqual(undo(visit.state),initial);
    const match=perform(visit.state,root,"manual",side==="left"?"right":"left");
    assert.equal(match.ok,true);assert.equal(match.committed,true);
    assert.deepEqual(match.state.left,auto.state.left);
    assert.deepEqual(match.state.right,auto.state.right);
    assert.deepEqual(undo(match.state),initial);
  }
  const invalid=perform(initial,{op:"remove",kind:"posOne",count:1});
  assert.equal(invalid.ok,true);
  const previous=JSON.stringify(invalid.state);
  assert.equal(perform(invalid.state,root).ok,false);
  assert.equal(JSON.stringify(invalid.state),previous);
  assert.deepEqual(undo(invalid.state),initial);
});
