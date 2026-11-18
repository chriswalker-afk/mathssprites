import test from "node:test";
import assert from "node:assert/strict";
import {
  HAND_BEATS, HAND_BEATS_REDUCED, handMotionPlan
} from "../src/hand-timeline.mjs";

test("the hand always acts through seven ordered physical beats", () => {
  const plan = handMotionPlan({op:"remove",kind:"posOne",count:2});
  assert.deepEqual(plan.phases.map(x=>x.name),
    ["approach","reach","aim","grip","contact","lift","exit"]);
  assert.equal(plan.phases.filter(x=>x.applyChange).length,1);
  assert.equal(plan.phases.find(x=>x.applyChange).name,"contact");
  assert.ok(plan.phases.find(x=>x.name==="grip").delay >= 200);
  assert.ok(plan.phases.find(x=>x.name==="contact").delay >= 350);
});
test("adding and multiplying carry full contents into the room first", () => {
  for (const op of ["add","multiply"]) {
    const plan = handMotionPlan({op});
    assert.equal(plan.placing,true);
    assert.equal(plan.cargoOnApproach,true);
  }
});
test("removing and dividing pick up their cargo at contact", () => {
  for (const op of ["remove","divide"]) {
    const plan = handMotionPlan({op});
    assert.equal(plan.placing,false);
    assert.equal(plan.cargoOnApproach,false);
  }
});
test("reduced motion preserves the same order and contact event", () => {
  const normal = handMotionPlan({op:"divide"});
  const reduced = handMotionPlan({op:"divide"},true);
  assert.deepEqual(reduced.phases.map(x=>x.name),normal.phases.map(x=>x.name));
  assert.deepEqual(reduced.phases.map(x=>x.applyChange||false),
    normal.phases.map(x=>x.applyChange||false));
  assert.ok(reduced.phases.reduce((x,beat)=>x+beat.delay,0) <
    normal.phases.reduce((x,beat)=>x+beat.delay,0));
  assert.equal(HAND_BEATS.contact,450);
  assert.equal(HAND_BEATS_REDUCED.contact,380);
});
test("invalid hand operation cannot generate a physical animation", () => {
  assert.throws(()=>handMotionPlan({op:"teleport"}),TypeError);
  assert.throws(()=>handMotionPlan(null),TypeError);
});
