import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {boardContinueLevel,spatialTileIndex} from "../src/navigation-journey.mjs";
import {CAMPAIGN_REGISTRY} from "../src/campaign-registry.mjs";

const world=CAMPAIGN_REGISTRY.find(w=>w.id==="workshop");
const guided=world.stages.find(stage=>stage.id==="guided");
const independent=world.stages.find(stage=>stage.id==="independent");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const site=readFileSync(new URL("../src/site.mjs",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/navigation-journey.css",import.meta.url),"utf8");

test("first-time learner can start the selected stage in one board click",()=>{
  assert.deepEqual(boardContinueLevel(guided,{completed:[],lastPlayed:null}),
    {id:guided.levels[0].id,number:1,action:"Play"});
  assert.deepEqual(boardContinueLevel(independent,{}),
    {id:independent.levels[0].id,number:1,action:"Play"});
});
test("returning learner resumes unfinished stage-specific last level",()=>{
  const slot=independent.levels[6];
  assert.deepEqual(boardContinueLevel(independent,
    {completed:[independent.levels[0].id],lastPlayed:slot.id}),
    {id:slot.id,number:7,action:"Continue"});
});
test("completed last played chooses earliest unfinished level; mastery replays",()=>{
  const finished=guided.levels.slice(0,7).map(x=>x.id);
  const last=guided.levels[6].id;
  assert.deepEqual(boardContinueLevel(guided,{completed:finished,lastPlayed:last}),
    {id:guided.levels[7].id,number:8,action:"Play"});
  const all=guided.levels.map(x=>x.id);
  assert.deepEqual(boardContinueLevel(guided,{completed:all,lastPlayed:last}),
    {id:last,number:7,action:"Replay"});
});
test("future worlds can use different level counts and availability",()=>{
  const stage={levels:[
    {id:"closed",number:1,available:false},
    {id:"new-02",number:2,available:true},
    {id:"new-11",number:11,available:true}
  ]};
  assert.deepEqual(boardContinueLevel(stage,{completed:[]}),
    {id:"new-02",number:2,action:"Play"});
  assert.deepEqual(boardContinueLevel(stage,{completed:["new-02"],lastPlayed:"closed"}),
    {id:"new-11",number:11,action:"Play"});
  assert.equal(boardContinueLevel({levels:[]},{}),null);
});
const tile=(x,y)=>({left:x,top:y,width:90,height:32});
test("arrow navigation follows the five-column desktop sheets",()=>{
  const grid=Array.from({length:20},(_,i)=>tile(Math.floor(i/4)*100,(i%4)*40));
  assert.equal(spatialTileIndex(grid,0,"ArrowRight"),4);
  assert.equal(spatialTileIndex(grid,4,"ArrowDown"),5);
  assert.equal(spatialTileIndex(grid,5,"ArrowLeft"),1);
  assert.equal(spatialTileIndex(grid,0,"ArrowUp"),0);
  assert.equal(spatialTileIndex(grid,19,"ArrowRight"),19);
  assert.equal(spatialTileIndex(grid,11,"Home"),0);
  assert.equal(spatialTileIndex(grid,11,"End"),19);
});
test("arrow navigation follows the phone's two-column tile layout",()=>{
  const grid=[tile(0,0),tile(100,0),tile(0,48),tile(100,48),tile(0,130)];
  assert.equal(spatialTileIndex(grid,0,"ArrowRight"),1);
  assert.equal(spatialTileIndex(grid,0,"ArrowDown"),2);
  assert.equal(spatialTileIndex(grid,3,"ArrowLeft"),2);
  assert.equal(spatialTileIndex(grid,2,"ArrowDown"),4);
  assert.equal(spatialTileIndex(grid,2,"Space"),2);
});
test("journey controls and accessible status exist with no extra menu screen",()=>{
  assert.match(html,/id="board-continue"/);
  assert.match(html,/id="board-selection-status".*role="status"/);
  assert.match(html,/id="map-stage-tabs".*aria-describedby="board-keyboard-note"/);
  assert.match(html,/id="help-return" data-support-return/);
  assert.match(html,/id="settings-return" data-support-return/);
  assert.match(html,/navigation-journey\.css\?v=35/);
  assert.match(site,/function focusBoardSelection/);
  assert.match(site,/spatialTileIndex\(/);
  assert.match(site,/currentScreen==="levels"/);
  assert.match(site,/function announceBoardSelection/);
  assert.match(css,/focus-visible/);
  assert.match(css,/@media\(max-width:600px\)/);
  assert.deepEqual(world.stages.map(s=>s.levels.length),[20,16,12]);
});
