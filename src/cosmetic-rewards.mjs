/**
 * PR84: local, presentation-only reward entitlements and equipped appearance.
 * The existing campaign record is the sole source of earned stars; no
 * incremental balance, spending, invented legacy ratings, or gameplay writes.
 * The saved unlock IDs survive revised level benchmarks and future releases.
 */
import {CAMPAIGN_REGISTRY} from "./campaign-registry.mjs";
import {campaignStarTotals} from "./campaign-records.mjs?v=84";
import {
  COSMETIC_REWARDS,COSMETIC_SLOTS,COSMETIC_COLLECTIONS,findCosmeticReward,findCosmeticItem,originalAppearance
} from "./cosmetic-catalog.mjs?v=91";

export const COSMETIC_SAVE_KEY="mathssprites.cosmetics.v1";
const version=1;
const defaultStorage=()=>{try{return globalThis.localStorage??null}catch{return null}};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function blankCosmeticProfile(){
  return {version,unlockedRewards:[],equipped:originalAppearance()};
}
export function normalizeCosmeticProfile(value){
  const clean=blankCosmeticProfile();
  if(value?.version!==version)return clean;
  const saved=new Set(Array.isArray(value.unlockedRewards)?value.unlockedRewards:[]);
  // Catalogue order makes writes deterministic and ignores unknown IDs.
  clean.unlockedRewards=COSMETIC_REWARDS.filter(r=>saved.has(r.id)).map(r=>r.id);
  const unlocked=new Set(clean.unlockedRewards);
  for(const slot of COSMETIC_SLOTS){
    const item=findCosmeticItem(value.equipped?.[slot]);
    if(item?.slot===slot&&unlocked.has(item.unlockId))clean.equipped[slot]=item.id;
  }
  return clean;
}
function readSaved(storage){
  try{
    const value=JSON.parse(storage?.getItem(COSMETIC_SAVE_KEY)||"null");
    return value?.version===version?normalizeCosmeticProfile(value):null;
  }catch{return null}
}
export function loadCosmeticProfile(storage=defaultStorage()){
  return readSaved(storage)||blankCosmeticProfile();
}
/**
 * A store shared by the site, later the Atelier, and future presentation
 * layers. Initial migration unlocks existing entitlements silently. Every
 * later change returns a snapshot and newly unlocked reward IDs; subscribers
 * can celebrate after the mathematical replay without interrupting it.
 */
export function createCosmeticRewards(initialCampaign,{
  storage=defaultStorage(),registry=CAMPAIGN_REGISTRY
}={}){
  let profile=loadCosmeticProfile(storage);
  let totals={earned:0,available:0};
  let dirty=false;
  const listeners=new Set();
  function getSnapshot(){
    const unlockedRewards=Object.freeze([...profile.unlockedRewards]);
    const nextReward=COSMETIC_REWARDS.find(r=>!unlockedRewards.includes(r.id))||null;
    return Object.freeze({
      earnedStars:totals.earned,availableStars:totals.available,
      unlockedRewards,unlockedCount:unlockedRewards.length,
      rewardCount:COSMETIC_REWARDS.length,nextReward,
      starsToNext:nextReward?Math.max(0,nextReward.stars-totals.earned):0,
      equipped:Object.freeze({...profile.equipped})
    });
  }
  function refreshSaved(){
    const saved=readSaved(storage);
    if(saved){
      // Never overwrite unlocks from another tab with an older in-memory
      // collection. A failed local write still keeps the current selection.
      profile=normalizeCosmeticProfile({
        version,unlockedRewards:[...profile.unlockedRewards,...saved.unlockedRewards],
        equipped:dirty?profile.equipped:saved.equipped
      });
    }
    return saved;
  }
  function persist(saved){
    // Fresh/zero-star students, browsing and free play do not create a save.
    if(!saved&&!profile.unlockedRewards.length)return;
    if(equal(profile,saved)){dirty=false;return;}
    try{
      if(!storage){dirty=true;return;}
      storage.setItem(COSMETIC_SAVE_KEY,JSON.stringify(profile));dirty=false;
    }catch{dirty=true;}
  }
  function publish(before,newlyUnlocked=[]){
    const snapshot=getSnapshot();
    const changed=!equal(before,snapshot);
    const result=Object.freeze({ok:true,changed,snapshot,
      newlyUnlocked:Object.freeze([...newlyUnlocked])});
    if(changed)for(const listener of listeners){
      // A presentation subscriber must not be able to interrupt a solved
      // level's progress, even if a later Atelier or celebration fails.
      try{listener(result)}catch{}
    }
    return result;
  }
  function syncCampaign(campaign){
    const before=getSnapshot(),saved=refreshSaved();
    totals=campaignStarTotals(campaign,{},registry);
    const known=new Set(profile.unlockedRewards);
    const newlyUnlocked=COSMETIC_REWARDS.filter(r=>r.stars<=totals.earned&&!known.has(r.id)).map(r=>r.id);
    profile=normalizeCosmeticProfile({...profile,unlockedRewards:[...known,...newlyUnlocked]});
    persist(saved);
    return publish(before,newlyUnlocked);
  }
  function isUnlocked(id){
    const reward=findCosmeticReward(id);
    const item=findCosmeticItem(id);
    return !!(reward||item)&&profile.unlockedRewards.includes(reward?.id??item.unlockId);
  }
  const reject=code=>Object.freeze({ok:false,changed:false,code,
    snapshot:getSnapshot(),newlyUnlocked:Object.freeze([])});
  function equip(slot,id){
    const before=getSnapshot(),saved=refreshSaved();
    if(!COSMETIC_SLOTS.includes(slot))return reject("unknown-slot");
    if(id!==null){
      const item=findCosmeticItem(id);
      if(!item)return reject("unknown-item");
      if(item.slot!==slot)return reject("wrong-slot");
      if(!isUnlocked(id))return reject("locked");
    }
    profile=normalizeCosmeticProfile({...profile,equipped:{...profile.equipped,[slot]:id}});
    persist(saved);
    return publish(before);
  }
  function equipSet(id){
    const before=getSnapshot(),saved=refreshSaved();
    const reward=findCosmeticReward(id);
    if(reward?.category!=="set")return reject("unknown-set");
    if(!isUnlocked(id))return reject("locked");
    profile=normalizeCosmeticProfile({...profile,equipped:{...profile.equipped,...reward.loadout}});
    persist(saved);
    return publish(before);
  }
  function restoreOriginal(collection=null){
    const before=getSnapshot(),saved=refreshSaved();
    if(collection!==null&&!Object.hasOwn(COSMETIC_COLLECTIONS,collection))return reject("unknown-collection");
    const slots=collection===null?COSMETIC_SLOTS:COSMETIC_COLLECTIONS[collection];
    profile=normalizeCosmeticProfile({...profile,equipped:{
      ...profile.equipped,...Object.fromEntries(slots.map(slot=>[slot,null]))
    }});
    persist(saved);
    return publish(before);
  }
  function subscribe(listener){
    if(typeof listener!=="function")throw new TypeError("A cosmetic listener must be a function");
    listeners.add(listener);
    return ()=>listeners.delete(listener);
  }
  // No subscribers exist at startup: returning students get all earned
  // rewards without a backlog of celebrations or changes to their appearance.
  syncCampaign(initialCampaign);
  return Object.freeze({getSnapshot,syncCampaign,isUnlocked,equip,equipSet,restoreOriginal,subscribe});
}
