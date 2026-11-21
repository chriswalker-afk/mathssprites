import test from "node:test";
import assert from "node:assert/strict";
import {OPPOSITE_LEVELS,OPPOSITE_CONTENT_REVISIONS} from "../src/opposite-levels.mjs";
import {initialState,perform,isSolved,undo,equation,validInitialLevel} from "../src/engine.mjs";
import {curriculumForLevel} from "../src/curriculum.mjs";
import {
  blankCampaignRecords,normalizeCampaignRecords,withCampaignCompleted,
  campaignStageRecord,campaignStars,saveCampaignRecords,loadCampaignRecords
} from "../src/campaign-records.mjs";

const revised={
 guided:{
  5:["x = −x + 6",3,2],
  6:["2x + 1 = −x + 13",4,3],
  9:["x − 1 = −x + 5",3,3],
  10:["2x − 2 = −x + 10",4,3],
  18:["3x − 2 = x + 6",4,3]
 },
 independent:{
  5:["2x = −x + 9",3,2],
  6:["2x + 3 = 11",4,2],
  15:["4x − 3 = 2x + 9",6,3]
 },
 notebook:{
  5:["2x + 3 = x + 8",5,2],
  6:["3x − 1 = x + 9",5,3],
  8:["3x − 4 = x + 6",5,3]
 }
};
const actions=[];
for(const op of ["add","remove"])
  for(const kind of ["posX","negX","posOne","negOne"])
    for(let count=1;count<=12;count++)actions.push({op,kind,count});
for(const op of ["divide","multiply"])
  for(let factor=2;factor<=5;factor++)actions.push({op,factor});
function hasRouteShorterThan(level,minimum){
 const first=initialState(level),visited=new Set();
 let frontier=[first];
 for(let depth=1;depth<minimum;depth++){
  const next=[];
  for(const state of frontier)for(const action of actions){
   const r=perform(state,action,"auto");
   if(!r.ok)continue;
   if(isSolved(r.state))return {depth,action};
   const key=["left","right"].map(side=>["posX","negX","posOne","negOne"]
     .map(kind=>r.state[side][kind])).flat().join(",");
   if(!visited.has(key)){visited.add(key);next.push(r.state);}
  }
  frontier=next;
 }
 return null;
}

test("World 2 preserves all previous IDs while appending four new Guided puzzles",()=>{
 for(const [stage,slots] of Object.entries(OPPOSITE_LEVELS)){
  assert.equal(slots.length,{guided:24,independent:20,notebook:16}[stage]);
  assert.equal(new Set(slots.map(s=>s.id)).size,slots.length);
  for(const [i,slot] of slots.entries()){
   const id="op-"+{guided:"g",independent:"i",notebook:"a"}[stage]+
     "-"+String(i+1).padStart(2,"0");
   const expected=OPPOSITE_CONTENT_REVISIONS[stage].includes(i+1)?2:1;
   assert.equal(slot.id,id);
   assert.equal(slot.number,i+1);
   assert.equal(slot.chapterIndex,Math.floor(i/4));
   assert.equal(slot.level.contentRevision,expected,id);
   assert.equal(curriculumForLevel("opposites",stage,i+1).contentRevision,expected,id);
   assert.equal(validInitialLevel(slot.level),true,id);
   assert.equal(slot.level.suggested.length>25,true,id);
   assert.doesNotMatch(slot.level.suggested,/\b(?:add|remove|divide|multiply)\s+[0-9]+\b/i,
     id+" should not give away a numbered first operation");
  }
 }
});

test("all eleven revised levels match audited signed balances and intended steps",()=>{
 for(const [stage,rows] of Object.entries(revised))for(const [index,expected] of Object.entries(rows)){
  const slot=OPPOSITE_LEVELS[stage][Number(index)-1],level=slot.level;
  assert.equal(equation(initialState(level)),expected[0],slot.id);
  assert.equal(level.solution,expected[1],slot.id);
  assert.equal(level.referenceRoute.length,expected[2],slot.id);
  let state=initialState(level);
  for(const [i,action] of level.referenceRoute.entries()){
   const previous=state;
   const applied=perform(state,action,"auto");
   assert.equal(applied.ok,true,slot.id+": "+JSON.stringify(action));
   state=applied.state;
   assert.equal(isSolved(state),i===level.referenceRoute.length-1,slot.id);
   assert.deepEqual(undo(state),previous,slot.id+" undo "+i);
  }
 }
});

test("no revised signed challenge hides a one-operation escape",()=>{
 for(const [stage,rows] of Object.entries(revised))for(const number of Object.keys(rows)){
  const slot=OPPOSITE_LEVELS[stage][Number(number)-1];
  assert.equal(hasRouteShorterThan(slot.level,2),null,
    slot.id+" is meant to require more than one genuine action");
 }
});
test("late revised strategy questions cannot be finished in only two moves",()=>{
 for(const [stage,numbers] of [["guided",[6,9,10,18]],
   ["independent",[15]],["notebook",[6,8]]]){
  for(const number of numbers){
   const level=OPPOSITE_LEVELS[stage][number-1].level;
   assert.equal(hasRouteShorterThan(level,3),null,
     level.id+" route accidentally has a shorter two-step escape");
  }
 }
});

test("new signed visual representations are actually present at chapter entry",()=>{
 const hasWhite=slot=>slot.level.left.negX+slot.level.right.negX>0;
 const hasBalloon=slot=>slot.level.left.negOne+slot.level.right.negOne>0;
 for(const n of [5,6,9,10])
  assert.equal(hasWhite(OPPOSITE_LEVELS.guided[n-1]),true,
    "Guided "+n+" needs an actual pale sprite");
 assert.equal(hasBalloon(OPPOSITE_LEVELS.guided[8]),true);
 assert.equal(hasWhite(OPPOSITE_LEVELS.independent[4]),true);
 assert.equal(hasBalloon(OPPOSITE_LEVELS.independent[5]),true);
 for(const n of [5,6,8])
  assert.equal(hasBalloon(OPPOSITE_LEVELS.notebook[n-1]),true,
    "Notebook "+n+" should genuinely contain a signed constant");
 assert.equal(OPPOSITE_LEVELS.notebook[7].level.right.negOne,4,
   "subtract-a-negative must be physically possible on both sides");
});

test("old World 2 achievements survive as history, without granting revised mastery or stars",()=>{
 const prior=blankCampaignRecords();
 const guided=prior.worlds.opposites.stages.guided;
 guided.completed=["op-g-01","op-g-05","op-g-06","op-g-18"];
 guided.bestMoves={"op-g-01":1,"op-g-05":2,"op-g-06":2,"op-g-18":1};
 guided.lastPlayed="op-g-18";
 const independent=prior.worlds.opposites.stages.independent;
 independent.completed=["op-i-01","op-i-05"];
 independent.bestMoves={"op-i-01":1,"op-i-05":2};
 // Emulate an authentic pre-PR49 save without any per-level revision stamps.
 delete guided.completedRevisions;delete independent.completedRevisions;
 const current=normalizeCampaignRecords(prior);
 const g=campaignStageRecord(current,"opposites","guided");
 const i=campaignStageRecord(current,"opposites","independent");
 assert.deepEqual(g.completed,["op-g-01"]);
 assert.deepEqual(i.completed,["op-i-01"]);
 assert.equal(g.lastPlayed,"op-g-18");
 assert.deepEqual(g.historical["op-g-05"],{revision:1,bestMoves:2});
 assert.deepEqual(g.historical["op-g-06"],{revision:1,bestMoves:2});
 assert.deepEqual(g.historical["op-g-18"],{revision:1,bestMoves:1});
 assert.deepEqual(i.historical["op-i-05"],{revision:1,bestMoves:2});
 assert.equal(g.bestMoves["op-g-05"],undefined);
 assert.equal(campaignStars(current,"opposites","guided","op-g-05"),0);
 let replayed=withCampaignCompleted(current,"opposites","guided","op-g-05",2);
 const latest=campaignStageRecord(replayed,"opposites","guided");
 assert.equal(latest.completed.includes("op-g-05"),true);
 assert.equal(latest.completedRevisions["op-g-05"],2);
 assert.deepEqual(latest.historical["op-g-05"],{revision:1,bestMoves:2});
 assert.equal(campaignStars(replayed,"opposites","guided","op-g-05"),3);
 const storageMap=new Map();
 const storage={
  getItem:key=>storageMap.get(key)||null,
  setItem:(key,val)=>storageMap.set(key,val)
 };
 const saved=saveCampaignRecords(replayed,storage);
 assert.deepEqual(loadCampaignRecords(storage),saved,
   "revision stamps and archived results survive reload and normalization");
 assert.equal(loadCampaignRecords(storage).worlds.opposites.stages.guided
   .historical["op-g-18"].bestMoves,1);
});
