import test from "node:test";
import assert from "node:assert/strict";
import {SQUARE_LEVEL_PLAN,squareLevelForPlay} from "../src/square-level-plan.mjs";
import {SQUARE_KINDS} from "../src/square-rules.mjs";
import {squareInspectionPolicy,guidedInspectionSide,inspectionSideStep,squareInspectionPlan,inspectionDescription} from "../src/square-inspection.mjs";
import {squareRootTrialPlan,squareArrangementForSide} from "../src/square-root-construction.mjs";
import {LEVELS,initialState,perform,undo,isSolved} from "../src/engine.mjs";
const find=id=>SQUARE_LEVEL_PLAN.find(l=>l.id===id);
const mode=stage=>stage==="independent"?"manual":"auto";
test("inspection is explicitly reserved for later guided and independent chapters, never Apprentice or older experiments",()=>{
  const stages={guided:0,independent:0,notebook:0};
  for(const f of SQUARE_LEVEL_PLAN){
    const l=squareLevelForPlay(f),policy=squareInspectionPolicy(l,{mode:mode(f.stage)});
    if(policy)stages[f.stage]++;
    assert.equal(policy,f.stage==="guided"&&f.number>=17?"guided":
      f.stage==="independent"&&f.number>=13?"independent":null);
    assert.equal(squareInspectionPolicy(l,{mode:mode(f.stage),notebook:true}),null);
    assert.equal(squareInspectionPolicy(l,{mode:f.stage==="independent"?"auto":"manual"}),null);
    assert.equal(Object.hasOwn(l,"reference"),false);
  }
  assert.deepEqual(stages,{guided:8,independent:8,notebook:0});
  for(const l of LEVELS)assert.equal(squareInspectionPolicy(l),null);
});
test("guided fit uses only the quadratic corner and matching cross terms, not the hidden answer or constant corner",()=>{
  for(const n of [0,1,3,4,5,10])
    assert.deepEqual(guidedInspectionSide({posX2:1,posX:4,posOne:n}),{a:1,b:2});
  assert.deepEqual(guidedInspectionSide({posX2:4,posX:8,posOne:3}),{a:2,b:2});
  assert.deepEqual(guidedInspectionSide({posX2:1,posX:8,posOne:0}),{a:1,b:4});
  assert.deepEqual(guidedInspectionSide({posX2:4}),{a:2,b:0});
  for(const r of [{posX2:2,posX:4},{posX2:1,posX:3},{posX2:1,posX:12},{posX:4,posOne:4},{posOne:25},{posX2:1,negX:1}])
    assert.equal(guidedInspectionSide(r),null);
});
test("manual side starts neutral, cannot exceed six segments, and never chooses its own candidate",()=>{
  let side={a:0,b:0};
  assert.equal(squareInspectionPlan({posX2:1,posX:4},side),null);
  for(let i=0;i<10;i++)side=inspectionSideStep(side,"a",1);
  assert.deepEqual(side,{a:6,b:0});
  assert.deepEqual(inspectionSideStep(side,"b",1),side);
  side=inspectionSideStep(side,"a",-1);
  side=inspectionSideStep(side,"b",1);
  assert.deepEqual(side,{a:5,b:1});
  assert.deepEqual(inspectionSideStep({a:0,b:0},"b",-1),{a:0,b:0});
  assert.throws(()=>inspectionSideStep({a:0,b:0},"a",2));
  assert.throws(()=>inspectionSideStep({a:5,b:5},"b",1));
  for(const r of [{posX2:1,negOne:1},{posX2:1,crates:{count:1}},{posOne:49},{posOne:1.5}])
    assert.equal(squareInspectionPlan(r,{a:1,b:1}),null);
  assert.equal(squareInspectionPlan({posOne:1},{a:6,b:1}),null);
});
test("every chosen frame accounts for every original object; only the learner's candidate determines gaps",()=>{
  for(const f of SQUARE_LEVEL_PLAN)for(const source of [f.left,f.right]){
    const before=JSON.stringify(source);
    for(let a=0;a<=6;a++)for(let b=0;b<=6-a;b++){
      if(a+b===0)continue;
      const plan=squareInspectionPlan(source,{a,b});
      assert.ok(plan,f.id);
      assert.equal(plan.cells.length,(a+b)**2);
      assert.deepEqual(plan.counts,{posX2:a*a,posX:2*a*b,posOne:b*b});
      for(const k of SQUARE_KINDS){
        const actual=plan.cells.filter(c=>c.present&&c.kind===k).map(c=>c.sourceIndex)
          .concat(plan.leftovers.filter(c=>c.kind===k).map(c=>c.sourceIndex)).sort((x,y)=>x-y);
        assert.deepEqual(actual,Array.from({length:source[k]},(_,i)=>i),f.id+" "+k);
        assert.equal(plan.missing[k],Math.max(0,plan.counts[k]-source[k]));
        assert.equal(plan.excess[k],Math.max(0,source[k]-plan.counts[k]));
      }
    }
    assert.equal(JSON.stringify(source),before);
  }
});
test("inspection and the refusal diagnostic reuse the same exact allocation, even for already complete areas",()=>{
  const r={posX2:1,posX:4,posOne:3},p=squareInspectionPlan(r,{a:1,b:2});
  assert.deepEqual(p,squareRootTrialPlan(r));
  assert.deepEqual(p,squareArrangementForSide(r,1,2));
  assert.equal(p.missing.posOne,1);
  const complete=squareInspectionPlan({posX2:1,posX:4,posOne:4},{a:1,b:2});
  assert.equal(squareRootTrialPlan({posX2:1,posX:4,posOne:4}),null);
  assert.equal(complete.cells.filter(c=>c.present).length,9);
  assert.equal(complete.leftovers.length,0);
  assert.match(inspectionDescription(p),/Empty slots: 1 weight/);
  assert.match(inspectionDescription(p),/guides, not additional objects/);
  assert.doesNotMatch(inspectionDescription(p),/add 1|solution|x =/i);
});
test("opening or changing a candidate does not commit a move; only the actual bilateral addition completes the corner",()=>{
  const fixture=find("square-g-18"),start=initialState(squareLevelForPlay(fixture));
  const original=JSON.stringify(start);
  const plan=squareInspectionPlan(start.left,guidedInspectionSide(start.left));
  assert.equal(plan.missing.posOne,4);
  assert.equal(squareInspectionPlan(start.left,{a:1,b:1}).excess.posX,2);
  assert.equal(JSON.stringify(start),original);
  assert.equal(start.history.length,0);
  const added=perform(start,{op:"add",kind:"posOne",count:4},"auto");
  assert.equal(added.ok,true);assert.equal(added.state.history.length,1);
  const complete=squareInspectionPlan(added.state.left,guidedInspectionSide(added.state.left));
  assert.equal(complete.cells.filter(c=>c.present).length,9);
  assert.equal(added.state.right.posOne,25);
  const rooted=perform(added.state,{op:"sqrt"},"auto");
  assert.equal(rooted.ok,true);assert.equal(rooted.state.left.posX,1);
  assert.equal(rooted.state.left.posOne,2);
  const solved=perform(rooted.state,{op:"remove",kind:"posOne",count:2},"auto");
  assert.equal(solved.ok,true);assert.equal(isSolved(solved.state),true);
  assert.deepEqual(undo(undo(undo(solved.state))),start);
});
