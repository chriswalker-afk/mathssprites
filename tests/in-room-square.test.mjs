import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVELS, initialState, validInitialLevel, perform, undo,
  prepare, areaArrangement, previewRoomAction, isSolved, balanceDifference,
  equation, evaluate, room
} from "../src/engine.mjs";
import {
  inRoomBoxPlan, BOX_STAGES_SQUARE, BOX_STAGES_ROOT, areaMathLabel
} from "../src/area-layout.mjs";
import {handMotionPlan} from "../src/hand-timeline.mjs";

const sq={op:"square"},root={op:"sqrt"};
const apply=(state,action)=>{
  const attempt=perform(state,action);
  assert.equal(attempt.ok,true,attempt.reason);
  return attempt.state;
};

test("the linked example constructs all four regions of (2x+3)^2 exactly",()=>{
  const before=room({posX:2,posOne:3});
  const desc=areaArrangement(before,"square");
  assert.equal(desc.kind,"mixed");
  assert.deepEqual([desc.spriteSide,desc.weightSide,desc.side,desc.cells],[2,3,5,25]);
  assert.deepEqual([desc.x2,desc.x,desc.constant],[4,12,9]);
  const result=previewRoomAction(before,sq);
  assert.equal(result.ok,true,result.reason);
  assert.deepEqual([result.after.posX2,result.after.posX,result.after.posOne],[4,12,9]);
  assert.equal(evaluate(before,1),5);
  assert.equal(evaluate(result.after,1),25);
  for(const x of [0,1,2,3,6]){
    assert.equal(evaluate(result.after,x),evaluate(before,x)**2);
  }
  assert.equal(areaMathLabel(desc),"(2x + 3)² = 4x² + 12x + 9");
});

test("the in-room box has 4+6+6+9 interior pieces and NO double-counted edges",()=>{
  const plan=inRoomBoxPlan(areaArrangement({posX:2,posOne:3},"square"));
  assert.equal(plan.side,5);
  assert.equal(plan.cells.length,25);
  assert.deepEqual(plan.counts,{posX2:4,posX:12,posOne:9});
  assert.deepEqual(plan.regions,{
    quadratic:4,mixedTop:6,mixedBottom:6,units:9
  });
  assert.deepEqual(plan.tracks,[1.5,1.5,1,1,1]);
  assert.deepEqual(plan.horizontal.map(x=>x.type),
    ["sprite","sprite","weight","weight","weight"]);
  assert.deepEqual(plan.vertical.map(x=>x.type),
    plan.horizontal.map(x=>x.type));
  assert.equal(plan.horizontal.length+plan.vertical.length,10);
  // Rulers are dimension guides; the 25 interior cells are the only output.
  assert.equal(plan.cells.filter(x=>x.type==="square-sprite").length,4);
  assert.equal(plan.cells.filter(x=>x.type==="round-sprite").length,12);
  assert.equal(plan.cells.filter(x=>x.type==="weight").length,9);
  assert.equal(plan.cells.filter(x=>x.region==="mixed-top").length,6);
  assert.equal(plan.cells.filter(x=>x.region==="mixed-bottom").length,6);
  assert.ok(plan.cells.every(x=>x.row<5&&x.col<5));
});

test("square-root rebuilds the EXACT same box then retains one side",()=>{
  const input=room({posX2:4,posX:12,posOne:9});
  const area=areaArrangement(input,"sqrt");
  assert.equal(area.kind,"mixed");
  assert.deepEqual([area.spriteSide,area.weightSide],[2,3]);
  const diagram=inRoomBoxPlan(area);
  assert.deepEqual(diagram.counts,{posX2:4,posX:12,posOne:9});
  assert.equal(diagram.cells.length,25);
  const result=previewRoomAction(input,root);
  assert.equal(result.ok,true,result.reason);
  assert.deepEqual([result.after.posX2,result.after.posX,result.after.posOne],[0,2,3]);
  assert.equal(areaMathLabel(area),
    "√(4x² + 12x + 9) = 2x + 3 (nonnegative side)");
});

test("round-trip works for EVERY representable nonnegative a*x+b, not just examples",()=>{
  let cases=0;
  for(let a=0;a<=6;a++)for(let b=0;b<=6;b++){
    const n=a+b;if(n===0||n*n>48)continue;
    const before=room({posX:a,posOne:b});
    const made=previewRoomAction(before,sq);
    assert.equal(made.ok,true,"square "+a+"x+"+b);
    assert.deepEqual([
      made.after.posX2,made.after.posX,made.after.posOne
    ],[a*a,2*a*b,b*b]);
    const unmade=previewRoomAction(made.after,root);
    assert.equal(unmade.ok,true,"principal root "+a+"x+"+b);
    assert.deepEqual(unmade.after,before,"round-trip "+a+"x+"+b);
    cases++;
  }
  assert.ok(cases>=20);
});

test("the engine refuses false perfect-square roots and other unsupported shapes",()=>{
  for(const source of [
    {posX2:1,posX:3,posOne:4},// cross coefficient ought to be 4
    {posX2:4,posX:10,posOne:9},// cross coefficient ought to be 12
    {posX2:2,posX:4,posOne:4},// x² coefficient not a square
    {posX2:1,posX:4,posOne:5},// unit corner not a square
    {posX:2,posOne:3},// just a length, not an area
    {negX:1,posX2:1,posOne:1},
    {negOne:1,posOne:4}
  ]){
    const result=previewRoomAction(source,root);
    assert.equal(result.ok,false,JSON.stringify(source));
    assert.equal(result.code,"unsupported-area");
  }
  assert.equal(previewRoomAction({posX2:1},sq).ok,false,
    "squaring x² needs x⁴, not an x² output");
});

test("too-large boxes give the reversible overflow effect, not a silently clipped grid",()=>{
  const source=room({posX:4,posOne:3});
  const failure=previewRoomAction(source,sq);
  assert.equal(failure.ok,false);
  assert.equal(failure.code,"overflow");
  assert.equal(failure.total,49);
  assert.equal(failure.capacity,48);
  assert.deepEqual(source,room({posX:4,posOne:3}));
  assert.throws(()=>inRoomBoxPlan({side:7,cells:49}),TypeError);
});

test("the two new levels keep their intended goals and require full equal operations",()=>{
  assert.equal(LEVELS.length,10);
  const drawing=LEVELS[8],unbuilding=LEVELS[9];
  assert.equal(drawing.id,"mixed-area");
  assert.equal(unbuilding.id,"mixed-root");
  for(const lv of [drawing,unbuilding])assert.equal(validInitialLevel(lv),true);
  const start=initialState(drawing);
  assert.equal(equation(start),"2x + 3 = 5");
  assert.equal(isSolved(start),false);
  const done=apply(start,sq);
  assert.equal(equation(done),"4x² + 12x + 9 = 25");
  assert.equal(isSolved(done),true);
  assert.equal(balanceDifference(done),0);
  assert.equal(equation(undo(done)),"2x + 3 = 5");

  let state=initialState(unbuilding);
  assert.equal(equation(state),"4x² + 12x + 9 = 25");
  state=apply(state,root);
  assert.equal(equation(state),"2x + 3 = 5");
  assert.equal(isSolved(state),false);
  state=apply(state,{op:"remove",kind:"posOne",count:3});
  assert.equal(equation(state),"2x = 2");
  state=apply(state,{op:"divide",factor:2});
  assert.equal(equation(state),"x = 1");
  assert.equal(isSolved(state),true);
  assert.equal(state.history.length,3);
});

test("in-room staging follows the cited six-stage build and reverse unbuild",()=>{
  const a=areaArrangement({posX:2,posOne:3},"square");
  const b=areaArrangement({posX2:4,posX:12,posOne:9},"sqrt");
  const s=handMotionPlan(sq,false,a);
  const r=handMotionPlan(root,false,b);
  assert.deepEqual(s.phases.slice(3,-4).map(x=>x.name),BOX_STAGES_SQUARE);
  assert.deepEqual(r.phases.slice(3,-4).map(x=>x.name),BOX_STAGES_ROOT);
  assert.equal(s.phases.filter(x=>x.applyChange).length,1);
  assert.equal(r.phases.filter(x=>x.applyChange).length,1);
  assert.equal(s.phases.find(x=>x.applyChange).name,"contact");
  assert.equal(r.phases.find(x=>x.applyChange).name,"contact");
  const reduced=handMotionPlan(sq,true,a);
  assert.deepEqual(reduced.phases.map(x=>x.name),s.phases.map(x=>x.name));
  assert.ok(reduced.phases.reduce((x,p)=>x+p.delay,0)<
    s.phases.reduce((x,p)=>x+p.delay,0));
});

test("empty/one-region squares still use the same in-room construction system",()=>{
  const pureWeights=inRoomBoxPlan(areaArrangement({posOne:6},"square"));
  assert.deepEqual(pureWeights.counts,{posX2:0,posX:0,posOne:36});
  const pureSprites=inRoomBoxPlan(areaArrangement({posX:3},"square"));
  assert.deepEqual(pureSprites.counts,{posX2:9,posX:0,posOne:0});
  const simpleRoot=inRoomBoxPlan(areaArrangement({posX2:4},"sqrt"));
  assert.deepEqual(simpleRoot.counts,{posX2:4,posX:0,posOne:0});
  assert.deepEqual(handMotionPlan(sq,false,areaArrangement({posOne:3},"square"))
    .phases.map(x=>x.name).filter(x=>BOX_STAGES_SQUARE.includes(x)),
    ["frame","edge","column","units"]);
});
