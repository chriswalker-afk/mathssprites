import test from "node:test";
import assert from "node:assert/strict";
import {
  RESUME_KEY,normalizeResume,loadResume,saveResume,
  resumeDestination,resumeLabel,RESUME_STAGE_NUMBERS
} from "../src/resume.mjs";

const completed=(n,last=n)=>({completed:Array.from({length:n},(_,i)=>i+1),lastPlayed:last});

test("home button destination is the LAST actually opened stage and level",()=>{
  const older=completed(2,3);
  const noStage2={completed:[],lastPlayed:1};
  assert.deepEqual(resumeDestination({stage:"notebook",number:7},older,noStage2),
    {stage:"notebook",number:7});
  assert.deepEqual(resumeDestination({stage:"independent",number:13},older),
    {stage:"independent",number:13});
  assert.deepEqual(resumeDestination({stage:"guided",number:20},older),
    {stage:"guided",number:20});
  assert.equal(resumeLabel({stage:"notebook",number:7},{played:true}),
    "Continue Stage 3 · Level 7 →");
  assert.equal(resumeLabel({stage:"independent",number:13},{played:true,completed:[13]}),
    "Replay Stage 2 · Level 13 →");
  assert.equal(resumeLabel({stage:"guided",number:1}),"Start Stage 1 · Level 1 →");
  assert.deepEqual(RESUME_STAGE_NUMBERS,{guided:1,independent:2,notebook:3});
});

test("legacy progress fallback stays valid without requiring completed prerequisite stages",()=>{
  assert.deepEqual(resumeDestination(null,{completed:[],lastPlayed:1}),
    {stage:"guided",number:1});
  assert.deepEqual(resumeDestination(null,completed(2,3)),
    {stage:"guided",number:3});
  assert.deepEqual(resumeDestination(null,completed(20,20),{completed:[],lastPlayed:1}),
    {stage:"independent",number:1});
  assert.deepEqual(resumeDestination(null,completed(1,2),{completed:[2],lastPlayed:3}),
    {stage:"independent",number:3});
  assert.deepEqual(resumeDestination(null,completed(20,20),completed(16,16),{}),
    {stage:"notebook",number:1});
  assert.deepEqual(resumeDestination(null,completed(1,2),{},completed(1,2)),
    {stage:"notebook",number:2});
});

test("invalid, corrupt, or unavailable last-played storage never prevents play",()=>{
  assert.equal(normalizeResume(null),null);
  assert.equal(normalizeResume({stage:"guided",number:0}),null);
  assert.equal(normalizeResume({stage:"guided",number:"1"}),null);
  assert.equal(normalizeResume({stage:"notebook",number:13}),null);
  assert.equal(normalizeResume({stage:"world4",number:2}),null);
  assert.equal(loadResume({getItem(){throw Error("access blocked")}}),null);
  assert.equal(saveResume({stage:"invalid",number:1}),null);
  const store=new Map([["mathssprites.progress.v1",JSON.stringify(completed(2,3))]]);
  const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
  assert.equal(loadResume(storage),null);
  assert.deepEqual(saveResume({stage:"independent",number:11},storage),
    {stage:"independent",number:11});
  assert.deepEqual(loadResume(storage),{stage:"independent",number:11});
  assert.equal(store.has(RESUME_KEY),true);
  assert.deepEqual(JSON.parse(store.get("mathssprites.progress.v1")),completed(2,3));
  assert.deepEqual(saveResume({stage:"guided",number:3},{setItem(){throw Error("blocked")}}),
    {stage:"guided",number:3});
});
