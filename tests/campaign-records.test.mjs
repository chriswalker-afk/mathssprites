import test from "node:test";
import assert from "node:assert/strict";
import {createCampaignRegistry,CAMPAIGN_REGISTRY} from "../src/campaign-registry.mjs";
import {
  CAMPAIGN_SAVE_KEY,CAMPAIGN_RESUME_KEY,blankCampaignRecords,
  normalizeCampaignRecords,loadCampaignRecords,saveCampaignRecords,
  campaignStageRecord,withCampaignLastPlayed,withCampaignCompleted,
  campaignStars,campaignStarTotals,campaignOptimalMoves,
  loadCampaignResume,saveCampaignResume,stageResumeLevel
} from "../src/campaign-records.mjs";
import {PROGRESS_KEY,STAGE2_PROGRESS_KEY,STAGE3_PROGRESS_KEY} from "../src/progress.mjs";
import {STAR_RATINGS_KEY} from "../src/star-ratings.mjs";
import {RESUME_KEY} from "../src/resume.mjs";

const fake=(data={})=>{
  const map=new Map(Object.entries(data));
  return {map,getItem:key=>map.get(key)||null,setItem:(key,v)=>map.set(key,v)};
};
test("World 1 migration preserves all three completion stores, best stars and resume",()=>{
  const legacy={
    [PROGRESS_KEY]:JSON.stringify({completed:[1,2,8],lastPlayed:9}),
    [STAGE2_PROGRESS_KEY]:JSON.stringify({completed:[2,5],lastPlayed:7}),
    [STAGE3_PROGRESS_KEY]:JSON.stringify({completed:[1],lastPlayed:2}),
    [STAR_RATINGS_KEY]:JSON.stringify({guided:{"1":1,"2":2},
      independent:{"5":1},notebook:{"1":2}}),
    [RESUME_KEY]:JSON.stringify({stage:"independent",number:7})
  };
  const store=fake(legacy);
  const records=loadCampaignRecords(store);
  const guided=campaignStageRecord(records,"workshop","guided");
  assert.deepEqual(guided.completed,[
    CAMPAIGN_REGISTRY[0].stages[0].levels[0].id,
    CAMPAIGN_REGISTRY[0].stages[0].levels[1].id,
    CAMPAIGN_REGISTRY[0].stages[0].levels[7].id
  ]);
  assert.equal(guided.lastPlayed,CAMPAIGN_REGISTRY[0].stages[0].levels[8].id);
  assert.equal(campaignStars(records,"workshop","guided",guided.completed[0]),3);
  assert.equal(campaignStars(records,"workshop","guided",guided.completed[1]),2);
  assert.equal(campaignStageRecord(records,"workshop","independent").completed.length,2);
  assert.equal(campaignStageRecord(records,"workshop","notebook").completed.length,1);
  assert.deepEqual(loadCampaignResume(store),{
    worldId:"workshop",stageId:"independent",levelId:"independent-07"
  });
  saveCampaignRecords(records,store);
  for(const [key,value] of Object.entries(legacy))
    assert.equal(store.map.get(key),value,"legacy key "+key+" must never be destroyed");
  assert.equal(JSON.parse(store.map.get(CAMPAIGN_SAVE_KEY)).version,2);
  assert.deepEqual(loadCampaignRecords(store),records,"reloading migration must be idempotent");
});
test("previewing a stage and changing last-played never grants a completion or star",()=>{
  const store=fake();
  const start=loadCampaignRecords(store);
  const stage=CAMPAIGN_REGISTRY[0].stages[1];
  const after=withCampaignLastPlayed(start,"workshop","independent",stage.levels[6].id);
  assert.equal(stageResumeLevel(after,"workshop","independent").number,7);
  assert.deepEqual(campaignStageRecord(after,"workshop","independent").completed,[]);
  assert.equal(campaignStarTotals(after).earned,0);
  assert.equal(campaignStarTotals(after).completed,0);
  assert.equal(campaignStarTotals(after).count,204);
  assert.equal(campaignStarTotals(after).available,612);
  assert.equal(saveCampaignResume({worldId:"workshop",stageId:"independent",
    levelId:stage.levels[6].id},store).levelId,"independent-07");
  assert.equal(store.map.has(RESUME_KEY),false,
    "v2 resume should not rewrite legacy v1 by itself");
  assert.equal(loadCampaignResume(store).levelId,"independent-07");
});
test("stable ID progress and stars remain isolated when both worlds use stage guided, level 1",()=>{
  const base=CAMPAIGN_REGISTRY.find(w=>w.id==="workshop");
  const makeLevel=(id,n,chapterIndex)=>({
    id,number:n,title:id,chapterIndex,available:true,
    level:{id,left:{posX:1},right:{posOne:2},solution:2}
  });
  const registry=createCampaignRegistry([base,{
    id:"opposites",number:2,title:"Opposite Chambers",available:true,
    stages:[{id:"guided",method:"auto",title:"Guided Opposites",available:true,
      chapters:[{id:"zero-pairs",title:"Zero pairs"}],
      levels:[makeLevel("oppo-01",1,0),makeLevel("oppo-02",2,0)],
      optimalMoves:[2,3]}]
  }]);
  let data=blankCampaignRecords(registry);
  data=withCampaignCompleted(data,"opposites","guided","oppo-01",2,registry);
  assert.equal(campaignStageRecord(data,"opposites","guided",registry).completed.length,1);
  assert.equal(campaignStageRecord(data,"workshop","guided",registry).completed.length,0);
  assert.equal(campaignStars(data,"opposites","guided","oppo-01",registry),3);
  assert.equal(campaignStars(data,"workshop","guided","resident",registry),0);
  assert.equal(campaignStageRecord(data,"opposites","guided",registry).lastPlayed,"oppo-02");
  const store=fake();
  saveCampaignRecords(data,store,registry);
  assert.deepEqual(loadCampaignRecords(store,registry),data);
  assert.deepEqual(saveCampaignResume({worldId:"opposites",stageId:"guided",
    levelId:"oppo-02"},store,registry),{
    worldId:"opposites",stageId:"guided",levelId:"oppo-02"
  });
  assert.equal(loadCampaignResume(store,registry).worldId,"opposites");
  assert.equal(store.map.has(PROGRESS_KEY),false);
  assert.equal(store.map.has(STAR_RATINGS_KEY),false);
});
test("repeat completions retain fastest best, ignore impossible move counts and unlock nothing",()=>{
  const registry=CAMPAIGN_REGISTRY;
  let data=blankCampaignRecords(registry);
  data=withCampaignCompleted(data,"workshop","guided","resident",2);
  assert.equal(campaignStars(data,"workshop","guided","resident"),2);
  data=withCampaignCompleted(data,"workshop","guided","resident",1);
  assert.equal(campaignStars(data,"workshop","guided","resident"),3);
  data=withCampaignCompleted(data,"workshop","guided","resident",99);
  assert.equal(campaignStars(data,"workshop","guided","resident"),3);
  data=withCampaignCompleted(data,"workshop","guided","resident",0);
  assert.equal(campaignStars(data,"workshop","guided","resident"),3);
  assert.equal(campaignStageRecord(data,"workshop","guided").completed.length,1);
  assert.equal(campaignStageRecord(data,"workshop","guided").lastPlayed,
    registry[0].stages[0].levels[1].id);
  assert.equal(withCampaignCompleted(data,"fractions","guided","unknown",1).worlds.workshop.stages.guided.completed.length,1);
  assert.equal(campaignOptimalMoves("opposites","guided","made-up"),null);
});
test("blocked or corrupt browser storage falls back to a safe first playable stage",()=>{
  const storage={
    getItem(){throw new Error("Blocked")},
    setItem(){throw new Error("Blocked")}
  };
  const data=loadCampaignRecords(storage);
  assert.deepEqual(campaignStageRecord(data,"workshop","guided").completed,[]);
  assert.equal(loadCampaignResume(storage),null);
  assert.equal(stageResumeLevel(data,"workshop","guided").number,1);
  assert.equal(saveCampaignRecords(data,storage).version,2);
  assert.equal(saveCampaignResume({worldId:"fractions",stageId:"guided",
    levelId:"bad"},storage),null);
  const invalid=normalizeCampaignRecords({worlds:{workshop:{stages:{
    guided:{completed:["unknown","resident"],lastPlayed:"injected",
      bestMoves:{"unknown":1,"resident":-40}}
  }}}});
  assert.deepEqual(invalid.worlds.workshop.stages.guided.completed,["resident"]);
  assert.equal(invalid.worlds.workshop.stages.guided.bestMoves.resident,undefined);
});
