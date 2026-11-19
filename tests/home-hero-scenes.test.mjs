import test from "node:test";
import assert from "node:assert/strict";
import {
 HERO_SPRITE_MASS,HERO_SCENES,HERO_STEP_MS,HERO_LANDING_MS,
 HERO_HOLD_MS,HERO_CHANGE_MS,heroMass,heroAngle,emptyHeroCounts,heroAfterScene
} from "../src/home-hero-scenes.mjs";

test("home hero uses a single unknown mass for every mathematical scene",()=>{
 assert.equal(HERO_SPRITE_MASS,3);
 assert.deepEqual(HERO_SCENES.map(s=>s.id),[
   "mystery","add-equally","two-sprites","both-sides"
 ]);
 assert.equal(HERO_SCENES[1].continuePrevious,true);
 for(const i of [0,1,2,3]){
   const left=heroAfterScene(i).left;
   const right=heroAfterScene(i).right;
   assert.equal(heroMass(left),heroMass(right),HERO_SCENES[i].id);
 }
 const expected=[
  {left:{sprite:1,weight:0},right:{sprite:0,weight:3}},
  {left:{sprite:1,weight:2},right:{sprite:0,weight:5}},
  {left:{sprite:2,weight:0},right:{sprite:0,weight:6}},
  {left:{sprite:2,weight:1},right:{sprite:1,weight:4}}
 ];
 for(let i=0;i<expected.length;i++)
   assert.deepEqual(heroAfterScene(i),expected[i],HERO_SCENES[i].id);
 assert.deepEqual(emptyHeroCounts(),{
   left:{sprite:0,weight:0},right:{sprite:0,weight:0}
 });
 assert.throws(()=>heroAfterScene(4),RangeError);
});

test("individual additions change visual mass in the correct pan before rebalancing",()=>{
 for(const [index,scene] of HERO_SCENES.entries()){
   const previous=scene.continuePrevious?heroAfterScene(index-1):emptyHeroCounts();
   const masses=[];
   for(const step of scene.steps){
     assert.ok(["left","right"].includes(step.side));
     assert.ok(["sprite","weight"].includes(step.kind));
     previous[step.side][step.kind]++;
     const left=heroMass(previous.left),right=heroMass(previous.right);
     masses.push({left,right,angle:heroAngle(left,right)});
   }
   assert.ok(masses.some(m=>m.left!==m.right),scene.id+" should tilt at least once");
   assert.equal(masses.at(-1).angle,0,scene.id+" should finish level");
   assert.equal(heroMass(previous.left),heroMass(previous.right));
 }
 assert.ok(heroAngle(3,0)<0,"heavier left should lower the left");
 assert.ok(heroAngle(0,3)>0,"heavier right should lower the right");
 assert.equal(heroAngle(10,10),0);
 assert.equal(heroAngle(100,0),-9);
 assert.equal(heroAngle(0,100),9);
});

test("landing, beats, holds and transitions form a brief legible looping show",()=>{
 const totalBeats=HERO_SCENES.reduce((s,scene)=>s+scene.steps.length,0);
 assert.equal(totalBeats,24);
 assert.ok(HERO_LANDING_MS>100);
 assert.ok(HERO_LANDING_MS>HERO_STEP_MS,
   "Allow several objects to be airborne together for playful movement");
 assert.ok(HERO_HOLD_MS>=950);
 assert.ok(HERO_CHANGE_MS>=450);
 const gaps=HERO_SCENES.flatMap(scene=>scene.steps.map(step=>step.gapMs));
 assert.ok(gaps.every(gap=>gap>=190&&gap<=850));
 assert.ok(new Set(gaps).size>12,"Drops must not arrive in a metronomic pattern");
 assert.ok(HERO_SCENES.some(scene=>scene.steps.some(step=>Math.abs(step.drift)>=10)),
   "Some objects should enter off-axis");
 const estimate=gaps.reduce((sum,gap)=>sum+gap,0)+
   HERO_HOLD_MS*HERO_SCENES.length+HERO_CHANGE_MS*3+200+3*140;
 assert.ok(estimate>17000&&estimate<24000,"target a roughly 18–22s loop");
});
