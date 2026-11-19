/**
 * PR32 — versioned, world-scoped campaign saves with non-destructive World 1
 * migration. Legacy keys stay in place for older clients, and World 1 writes
 * continue to mirror them. No level-number collisions across worlds/stages.
 */
import {
  CAMPAIGN_REGISTRY,findCampaignWorld,findCampaignStage,findCampaignLevel,
  firstCampaignLevel,nextCampaignLevel,isCampaignPlayable
} from "./campaign-registry.mjs";
import {
  loadProgress,loadStage2Progress,loadStage3Progress
} from "./progress.mjs";
import {loadRatings} from "./star-ratings.mjs";
import {loadResume} from "./resume.mjs";

export const CAMPAIGN_SAVE_KEY="mathssprites.campaign.v2";
export const CAMPAIGN_RESUME_KEY="mathssprites.resume.v2";
const memoryStorage=()=>{
  try{return globalThis.localStorage}catch{return null}
};
const read=(storage,key)=>{
  try{return JSON.parse((storage??memoryStorage())?.getItem(key)||"null")}catch{return null};
};
const write=(storage,key,value)=>{
  try{(storage??memoryStorage())?.setItem(key,JSON.stringify(value))}catch{}
};
const stageTemplate=stage=>({
  completed:[],lastPlayed:stage.levels[0]?.id??null,bestMoves:{}
});
export function blankCampaignRecords(registry=CAMPAIGN_REGISTRY){
  return {version:2,worlds:Object.fromEntries(registry.map(world=>[
    world.id,{stages:Object.fromEntries(world.stages.map(stage=>[stage.id,stageTemplate(stage)]))}
  ]))};
}
export function normalizeCampaignRecords(value,registry=CAMPAIGN_REGISTRY){
  const result=blankCampaignRecords(registry);
  for(const world of registry)for(const stage of world.stages){
    const source=value?.worlds?.[world.id]?.stages?.[stage.id]||{};
    const dest=result.worlds[world.id].stages[stage.id];
    const validIds=new Set(stage.levels.map(x=>x.id));
    const completed=new Set(Array.isArray(source.completed)?source.completed:[]);
    dest.completed=stage.levels.filter(s=>completed.has(s.id)).map(s=>s.id);
    dest.lastPlayed=validIds.has(source.lastPlayed)?source.lastPlayed:stage.levels[0]?.id??null;
    for(const slot of stage.levels){
      const best=source.bestMoves?.[slot.id];
      const optimal=stageOptimalMoves(stage,slot.id);
      if(Number.isInteger(best)&&best>=Math.max(1,optimal||1)&&best<=100000)
        dest.bestMoves[slot.id]=best;
    }
  }
  return result;
}
function stageOptimalMoves(stage,levelId){
  const index=stage.levels.findIndex(s=>s.id===levelId);
  const n=stage.optimalMoves[index];
  return Number.isInteger(n)&&n>=1?n:null;
}
/** Legacy numbers convert to immutable World 1 level IDs. No legacy key is
 * deleted or overwritten during migration, even on bad/blocked storage. */
export function legacyCampaignRecords(storage,registry=CAMPAIGN_REGISTRY){
  const result=blankCampaignRecords(registry);
  const oldProgress={
    guided:loadProgress(storage),
    independent:loadStage2Progress(storage),
    notebook:loadStage3Progress(storage)
  };
  const ratings=loadRatings(storage);
  for(const stageId of ["guided","independent","notebook"]){
    const stage=findCampaignStage("workshop",stageId,registry);
    if(!stage)continue;
    const dest=result.worlds.workshop.stages[stageId],prior=oldProgress[stageId];
    dest.completed=stage.levels.filter(s=>prior.completed.includes(s.number)).map(s=>s.id);
    dest.lastPlayed=stage.levels.find(s=>s.number===prior.lastPlayed)?.id||
      stage.levels[0]?.id||null;
    for(const slot of stage.levels){
      const moves=ratings[stageId]?.[slot.number];
      if(Number.isInteger(moves)&&moves>=Math.max(1,stageOptimalMoves(stage,slot.id)||1))
        dest.bestMoves[slot.id]=moves;
    }
  }
  return result;
}
export function loadCampaignRecords(storage,registry=CAMPAIGN_REGISTRY){
  const saved=read(storage,CAMPAIGN_SAVE_KEY);
  const result=normalizeCampaignRecords(saved,registry);
  const legacy=legacyCampaignRecords(storage,registry);
  for(const world of registry)for(const stage of world.stages){
    const dest=result.worlds[world.id].stages[stage.id];
    const prior=legacy.worlds[world.id]?.stages?.[stage.id];
    if(!prior)continue;
    const done=new Set([...dest.completed,...prior.completed]);
    dest.completed=stage.levels.filter(s=>done.has(s.id)).map(s=>s.id);
    if(!saved?.worlds?.[world.id]?.stages?.[stage.id])dest.lastPlayed=prior.lastPlayed;
    for(const [id,moves] of Object.entries(prior.bestMoves)){
      dest.bestMoves[id]=dest.bestMoves[id]===undefined
        ?moves:Math.min(dest.bestMoves[id],moves);
    }
  }
  return result;
}
export function saveCampaignRecords(value,storage,registry=CAMPAIGN_REGISTRY){
  const clean=normalizeCampaignRecords(value,registry);
  write(storage,CAMPAIGN_SAVE_KEY,clean);
  return clean;
}
export function campaignStageRecord(value,worldId,stageId,registry=CAMPAIGN_REGISTRY){
  return normalizeCampaignRecords(value,registry).worlds?.[worldId]?.stages?.[stageId]||null;
}
export function withCampaignLastPlayed(value,worldId,stageId,levelId,registry=CAMPAIGN_REGISTRY){
  if(!isCampaignPlayable(worldId,stageId,levelId,registry))return normalizeCampaignRecords(value,registry);
  const data=normalizeCampaignRecords(value,registry);
  data.worlds[worldId].stages[stageId].lastPlayed=levelId;
  return data;
}
export function withCampaignCompleted(value,worldId,stageId,levelId,moves,registry=CAMPAIGN_REGISTRY){
  if(!isCampaignPlayable(worldId,stageId,levelId,registry))return normalizeCampaignRecords(value,registry);
  const data=normalizeCampaignRecords(value,registry);
  const stage=findCampaignStage(worldId,stageId,registry);
  const entry=data.worlds[worldId].stages[stageId];
  const done=new Set([...entry.completed,levelId]);
  entry.completed=stage.levels.filter(slot=>done.has(slot.id)).map(slot=>slot.id);
  const next=nextCampaignLevel(worldId,stageId,levelId,registry);
  entry.lastPlayed=next?.id||levelId;
  const optimal=stageOptimalMoves(stage,levelId);
  if(Number.isInteger(moves)&&moves>=Math.max(1,optimal||1)&&moves<=100000)
    entry.bestMoves[levelId]=entry.bestMoves[levelId]===undefined?moves:
      Math.min(entry.bestMoves[levelId],moves);
  return data;
}
export function campaignOptimalMoves(worldId,stageId,levelId,registry=CAMPAIGN_REGISTRY){
  const stage=findCampaignStage(worldId,stageId,registry);
  return stage?stageOptimalMoves(stage,levelId):null;
}
export function campaignStars(value,worldId,stageId,levelId,registry=CAMPAIGN_REGISTRY){
  const best=campaignStageRecord(value,worldId,stageId,registry)?.bestMoves[levelId];
  const optimal=campaignOptimalMoves(worldId,stageId,levelId,registry);
  if(!Number.isInteger(best)||!optimal||best<optimal)return 0;
  return best===optimal?3:best===optimal+1?2:1;
}
export function campaignStarTotals(value,{worldId=null,stageId=null}={},registry=CAMPAIGN_REGISTRY){
  let earned=0,available=0,completed=0,count=0;
  for(const world of registry){
    if(worldId&&world.id!==worldId)continue;
    for(const stage of world.stages){
      if(stageId&&stage.id!==stageId)continue;
      if(!world.available||!stage.available)continue;
      const record=campaignStageRecord(value,world.id,stage.id,registry);
      for(const slot of stage.levels){
        if(!slot.available)continue;
        count++;
        if(record?.completed.includes(slot.id))completed++;
        if(campaignOptimalMoves(world.id,stage.id,slot.id,registry)!==null){
          available+=3;earned+=campaignStars(value,world.id,stage.id,slot.id,registry);
        }
      }
    }
  }
  return {earned,available,completed,count};
}
export function normalizeCampaignResume(value,registry=CAMPAIGN_REGISTRY){
  if(!value||typeof value!=="object"||Array.isArray(value))return null;
  const {worldId,stageId,levelId}=value;
  if(!isCampaignPlayable(worldId,stageId,levelId,registry))return null;
  return {worldId,stageId,levelId};
}
export function loadCampaignResume(storage,registry=CAMPAIGN_REGISTRY){
  const stored=normalizeCampaignResume(read(storage,CAMPAIGN_RESUME_KEY),registry);
  if(stored)return stored;
  const old=loadResume(storage);
  const slot=old&&findCampaignLevel("workshop",old.stage,old.number,registry);
  return slot?normalizeCampaignResume({
    worldId:"workshop",stageId:old.stage,levelId:slot.id
  },registry):null;
}
export function saveCampaignResume(value,storage,registry=CAMPAIGN_REGISTRY){
  const clean=normalizeCampaignResume(value,registry);
  if(clean)write(storage,CAMPAIGN_RESUME_KEY,clean);
  return clean;
}
export function stageResumeLevel(value,worldId,stageId,registry=CAMPAIGN_REGISTRY){
  const stage=findCampaignStage(worldId,stageId,registry);
  if(!stage||!findCampaignWorld(worldId,registry)?.available)return null;
  const record=campaignStageRecord(value,worldId,stageId,registry);
  return findCampaignLevel(worldId,stageId,record?.lastPlayed,registry)||
    firstCampaignLevel(worldId,stageId,registry);
}
