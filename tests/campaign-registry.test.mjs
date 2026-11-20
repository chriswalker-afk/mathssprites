import test from "node:test";
import assert from "node:assert/strict";
import {
  CAMPAIGN_REGISTRY,createCampaignRegistry,findCampaignWorld,findCampaignStage,
  findCampaignLevel,nextCampaignLevel,isCampaignPlayable,firstCampaignLevel,
  campaignLevelKey
} from "../src/campaign-registry.mjs";

const slot=(id,number,chapterIndex)=>({
  id,number,chapterIndex,title:"Puzzle "+number,available:true,
  level:{id,left:{posX:1},right:{posOne:3},solution:3}
});
export function extraWorldFixture(){
  const base=CAMPAIGN_REGISTRY.find(w=>w.id==="workshop");
  const second={
    id:"opposites",number:2,title:"The Opposite Chambers",theme:"moonlit",available:true,
    stages:[
      {id:"guided",method:"auto",title:"Signs",available:true,
        chapters:[{id:"zero-pairs",title:"Zero pairs"},{id:"opposite-sums",title:"Opposite sums"}],
        levels:[slot("opposite-01",1,0),slot("opposite-02",2,0),slot("opposite-03",3,1)],
        optimalMoves:[1,2,3]},
      {id:"expert",method:"notebook",title:"Signed Apprentice",available:true,
        chapters:[{id:"signed-algebra",title:"Signed algebra"}],
        levels:[slot("opposite-expert-01",1,0)],optimalMoves:[2]}
    ]
  };
  return createCampaignRegistry([base,second]);
}
test("production exposes four worlds, but only implemented levels are playable",()=>{
  assert.equal(CAMPAIGN_REGISTRY.length,4);
  assert.deepEqual(CAMPAIGN_REGISTRY.map(w=>w.available),[true,true,false,false]);
  assert.deepEqual(CAMPAIGN_REGISTRY[0].stages.map(s=>s.levels.length),[20,20,16]);
  assert.equal(findCampaignWorld("opposites").stages.length,3);
  assert.equal(isCampaignPlayable("opposites","guided",1),true);
  assert.equal(findCampaignLevel("workshop","guided",1).id,"resident");
  assert.equal(findCampaignLevel("workshop","independent",1).id,"independent-01");
  assert.equal(findCampaignLevel("workshop","notebook",1).id,"apprentice-01");
  assert.equal(firstCampaignLevel("workshop","guided").number,1);
  assert.equal(nextCampaignLevel("workshop","guided",20),null);
});
test("second-world fixture supports different stage counts, chapter sizes and repeated level numbers",()=>{
  const registry=extraWorldFixture();
  assert.equal(findCampaignStage("opposites","guided",registry).chapters.length,2);
  assert.equal(findCampaignStage("opposites","guided",registry).levels.length,3);
  assert.equal(findCampaignStage("opposites","expert",registry).levels.length,1);
  assert.equal(findCampaignLevel("opposites","guided",1,registry).id,"opposite-01");
  assert.equal(findCampaignLevel("opposites","expert",1,registry).id,"opposite-expert-01");
  assert.notEqual(campaignLevelKey("workshop","guided","resident"),
    campaignLevelKey("opposites","guided","opposite-01"));
  assert.equal(nextCampaignLevel("opposites","guided","opposite-02",registry).id,"opposite-03");
  assert.equal(isCampaignPlayable("opposites","expert",1,registry),true);
  assert.equal(isCampaignPlayable("opposites","guided",5,registry),false);
  assert.equal(isCampaignPlayable("opposites","notebook",1,registry),false);
});
test("invalid registry IDs, missing chapters and duplicate levels are refused",()=>{
  const registry=extraWorldFixture(),existing=registry[1];
  assert.throws(()=>createCampaignRegistry([existing,existing]),/duplicate\/invalid world/);
  assert.throws(()=>createCampaignRegistry([{...existing,id:"invalid world"}]),/duplicate\/invalid world/);
  assert.throws(()=>createCampaignRegistry([{
    ...existing,stages:[{...existing.stages[0],chapters:[]}]
  }]),/no chapters/);
  assert.throws(()=>createCampaignRegistry([{
    ...existing,stages:[{...existing.stages[0],levels:[
      existing.stages[0].levels[0],existing.stages[0].levels[0]
    ]}]
  }]),/duplicate\/invalid level/);
});

test("renaming a chapter and reordering levels do not change their durable IDs or star benchmarks",()=>{
  const world=CAMPAIGN_REGISTRY[0],guided=world.stages[0];
  const original=guided.levels[8];
  assert.equal(guided.chapters[0].id,"guided-chapter-01");
  assert.equal(guided.optimalMoves[original.id],2);
  const chapters=guided.chapters.map((c,i)=>i===0?{...c,title:"An improved chapter name"}:c);
  const levels=[original,...guided.levels.filter(s=>s.id!==original.id)];
  const rebuilt=createCampaignRegistry([{
    ...world,stages:[{...guided,chapters,levels},...world.stages.slice(1)]
  }]);
  const renamed=rebuilt[0].stages[0];
  assert.equal(renamed.chapters[0].id,"guided-chapter-01");
  assert.equal(renamed.chapters[0].title,"An improved chapter name");
  assert.equal(renamed.levels[0].id,original.id);
  assert.equal(renamed.optimalMoves[original.id],2);
  assert.equal(renamed.optimalMoves.resident,1);
  assert.equal(renamed.levels[0].chapterId,guided.chapters[2].id);
});
