/**
 * PR32 — world/stage/chapter/level registry.
 *
 * Navigation is defined by data, not by hardcoded World 1 stage numbers or
 * fixed 4-level chapter sizes. A planned world does not become playable until
 * both its campaign definitions AND engine-compatible levels are provided.
 */
import {WORLDS,WORLD1_LEVELS,WORLD1_CHAPTERS,WORLD1_OPERATIONS} from "./worlds.mjs";
import {WORLD1_STAGES} from "./stages.mjs";
import {INDEPENDENT_LEVELS,INDEPENDENT_CHAPTERS} from "./independent-levels.mjs";
import {APPRENTICE_LEVELS,APPRENTICE_CHAPTERS} from "./apprentice-levels.mjs";
import {OPTIMAL_MOVES} from "./star-ratings.mjs";
import {OPPOSITE_CHAPTERS,OPPOSITE_LEVELS,OPPOSITE_STAGE_ORDER,OPPOSITE_OPERATIONS,OPPOSITE_KINDS} from "./opposite-levels.mjs";

const stableId=/^[a-z][a-z0-9-]*$/;
const assert=(v,msg)=>{if(!v)throw new Error("Campaign registry: "+msg);};

/** Can be used by a test fixture for a second world before it is published. */
export function createCampaignRegistry(definitions){
  assert(Array.isArray(definitions)&&definitions.length>0,"expected at least one world");
  const worldIds=new Set();
  const worlds=definitions.map((raw,wi)=>{
    assert(raw&&stableId.test(raw.id)&&!worldIds.has(raw.id),"duplicate/invalid world ID");
    worldIds.add(raw.id);
    assert(typeof raw.title==="string"&&raw.title.length>0,"world title missing");
    const stages=raw.stages??[];
    assert(Array.isArray(stages),"world stages must be an array");
    const stageIds=new Set();
    const normalStages=stages.map((stage,si)=>{
      assert(stableId.test(stage.id)&&!stageIds.has(stage.id),"duplicate/invalid stage ID in "+raw.id);
      stageIds.add(stage.id);
      assert(["auto","manual","notebook"].includes(stage.method),"unknown hand/editor mode in "+raw.id+"/"+stage.id);
      assert(typeof stage.title==="string"&&stage.title.length>0,"stage title missing");
      assert(Array.isArray(stage.chapters)&&stage.chapters.length>0,"stage has no chapters");
      assert(Array.isArray(stage.levels)&&stage.levels.length>0,"stage has no levels");
      const chapters=stage.chapters.map((chapter,ci)=>{
        const id=chapter.id;
        assert(typeof id==="string"&&stableId.test(id),
          "each chapter must have a permanent stable ID");
        assert(typeof chapter.title==="string"&&chapter.title.length>0,"chapter title missing");
        return Object.freeze({...chapter,id,index:ci});
      });
      assert(new Set(chapters.map(x=>x.id)).size===chapters.length,"duplicate chapters in "+stage.id);
      const ids=new Set(),numbers=new Set();
      const levels=stage.levels.map((slot,i)=>{
        assert(slot&&stableId.test(slot.id)&&!ids.has(slot.id),"duplicate/invalid level ID in "+stage.id);
        ids.add(slot.id);
        assert(Number.isInteger(slot.number)&&slot.number>=1&&!numbers.has(slot.number),
          "duplicate/invalid level number in "+stage.id);
        numbers.add(slot.number);
        assert(Number.isInteger(slot.chapterIndex)&&chapters[slot.chapterIndex],
          "level has no matching chapter in "+stage.id);
        assert(slot.level&&typeof slot.level==="object","level missing game definition in "+stage.id);
        return Object.freeze({...slot,available:slot.available!==false,
          worldId:raw.id,stageId:stage.id,
          chapterId:chapters[slot.chapterIndex].id});
      });
      // Indexing star benchmarks by stable ID makes them survive a reordered
      // curriculum. Historical World 1 arrays are converted on first load.
      const benchmarks=stage.optimalMoves||{};
      const byLevel=Object.fromEntries(levels.flatMap((slot,i)=>{
        const optimal=Array.isArray(benchmarks)?benchmarks[i]:benchmarks[slot.id];
        return Number.isInteger(optimal)&&optimal>=1?[[slot.id,optimal]]:[];
      }));
      return Object.freeze({...stage,number:stage.number??si+1,
        count:levels.length,chapters:Object.freeze(chapters),levels:Object.freeze(levels),
        optimalMoves:Object.freeze(byLevel),available:stage.available!==false});
    });
    return Object.freeze({...raw,number:raw.number??wi+1,
      available:raw.available!==false&&normalStages.some(s=>s.available),
      stages:Object.freeze(normalStages)});
  });
  return Object.freeze(worlds);
}
const WORLD1_CAMPAIGN_STAGES=WORLD1_STAGES.map((stage)=>{
  const configs={
    guided:{
      levels:WORLD1_LEVELS,chapters:WORLD1_CHAPTERS,emblems:["−","÷","→","⇄","✦"],
      intro:"Choose the operation. The hand mirrors it in both rooms.",
      finale:"All guided experiments complete. Try controlling each room in Independent Balance."},
    independent:{
      levels:INDEPENDENT_LEVELS,chapters:INDEPENDENT_CHAPTERS,emblems:["↔","÷","→","✦"],
      intro:"Balance the rooms yourself: match each move on the other side.",
      finale:"You've balanced both rooms. Try recording each operation in Algebra Apprentice."},
    notebook:{
      levels:APPRENTICE_LEVELS,chapters:APPRENTICE_CHAPTERS,emblems:["✎","≡","✦"],
      intro:"Choose each algebra operation. The editor calculates the equation; sprites replay your work.",
      finale:"All apprentice notebooks complete. Make your own equation in the Workshop."}
  };
  const config=configs[stage.id];
  return {...stage,...config,
    chapters:config.chapters.map((chapter,i)=>({
      ...chapter,id:stage.id+"-chapter-"+String(i+1).padStart(2,"0")
    })),
    optimalMoves:OPTIMAL_MOVES[stage.id],
    capabilities:{quantityMode:"positive",allowedOperations:WORLD1_OPERATIONS,
      handMode:stage.method}};
});
const OPPOSITE_STAGE_DATA={
  guided:{title:"Guided Opposites",tagline:"Watch opposites make zero.",
    intro:"Choose a signed move. The hand mirrors it in both chambers.",
    finale:"You can explain both kinds of zero pair. Take the hand yourself in Independent Opposites.",
    icon:"◯",emblems:["🎈","◯","±","⇄","✦"],method:"auto"},
  independent:{title:"Independent Opposites",tagline:"Match every signed move.",
    intro:"Change one chamber, then restore the balance in the other.",
    finale:"Both chambers are yours to control. Now write every move in the signed notebook.",
    icon:"⇄",emblems:["⚖","◯","÷","✦"],method:"manual"},
  notebook:{title:"Signed Algebra Apprentice",tagline:"Write with negative terms.",
    intro:"Choose signed operations in the maths editor. Sprites replay your verified work.",
    finale:"You have completed the signed algebra notebooks.",
    icon:"✎",emblems:["✎","±","✦"],method:"notebook"}
};
const WORLD2_CAMPAIGN_STAGES=OPPOSITE_STAGE_ORDER.map((id,index)=>{
  const stage=OPPOSITE_STAGE_DATA[id];
  const levels=OPPOSITE_LEVELS[id];
  return {...stage,id,number:index+1,available:true,
    chapters:OPPOSITE_CHAPTERS[id],levels,
    optimalMoves:Object.fromEntries(levels.map(slot=>
      [slot.id,slot.level.referenceRoute.length])),
    capabilities:{quantityMode:"signed",allowedOperations:OPPOSITE_OPERATIONS,
      allowedKinds:OPPOSITE_KINDS,handMode:stage.method}};
});
export const CAMPAIGN_REGISTRY=createCampaignRegistry(WORLDS.map(world=>({
  ...world,icon:{workshop:"⚖",opposites:"±",fractions:"½",squares:"□"}[world.id],
  stages:world.id==="workshop"?WORLD1_CAMPAIGN_STAGES:
    world.id==="opposites"?WORLD2_CAMPAIGN_STAGES:[]
})));
export function findCampaignWorld(worldId,registry=CAMPAIGN_REGISTRY){
  return registry.find(w=>w.id===worldId)||null;
}
export function findCampaignStage(worldId,stageId,registry=CAMPAIGN_REGISTRY){
  return findCampaignWorld(worldId,registry)?.stages.find(s=>s.id===stageId)||null;
}
export function findCampaignLevel(worldId,stageId,levelIdOrNumber,registry=CAMPAIGN_REGISTRY){
  return findCampaignStage(worldId,stageId,registry)?.levels.find(
    x=>typeof levelIdOrNumber==="string"?x.id===levelIdOrNumber:x.number===levelIdOrNumber
  )||null;
}
export function isCampaignPlayable(worldId,stageId,levelIdOrNumber,registry=CAMPAIGN_REGISTRY){
  const world=findCampaignWorld(worldId,registry);
  const stage=findCampaignStage(worldId,stageId,registry);
  const slot=findCampaignLevel(worldId,stageId,levelIdOrNumber,registry);
  return !!(world?.available&&stage?.available&&slot?.available);
}
export function nextCampaignLevel(worldId,stageId,levelIdOrNumber,registry=CAMPAIGN_REGISTRY){
  const stage=findCampaignStage(worldId,stageId,registry);
  if(!stage)return null;
  const i=stage.levels.findIndex(s=>s.id===levelIdOrNumber||s.number===levelIdOrNumber);
  return i<0?null:stage.levels.slice(i+1).find(slot=>
    isCampaignPlayable(worldId,stageId,slot.id,registry))||null;
}
export function firstCampaignLevel(worldId,stageId,registry=CAMPAIGN_REGISTRY){
  const stage=findCampaignStage(worldId,stageId,registry);
  return stage?.levels.find(s=>isCampaignPlayable(worldId,stageId,s.id,registry))||null;
}
export function campaignLevelKey(worldId,stageId,levelId){
  return [worldId,stageId,levelId].join("/");
}
