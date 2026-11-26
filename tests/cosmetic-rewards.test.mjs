import test from "node:test";
import assert from "node:assert/strict";
import {
  COSMETIC_REWARDS,COSMETIC_ITEMS,COSMETIC_SLOTS,SPRITE_COSMETIC_SLOTS,cosmeticCollection,findCosmeticReward,findCosmeticItem,originalAppearance
} from "../src/cosmetic-catalog.mjs";
import {
  COSMETIC_SAVE_KEY,createCosmeticRewards,blankCosmeticProfile,normalizeCosmeticProfile,loadCosmeticProfile
} from "../src/cosmetic-rewards.mjs";
import {CAMPAIGN_REGISTRY} from "../src/campaign-registry.mjs";
import {
  CAMPAIGN_SAVE_KEY,blankCampaignRecords,loadCampaignRecords,campaignStarTotals,
  withCampaignCompleted,withCampaignLastPlayed
} from "../src/campaign-records.mjs";
import {STAR_RATINGS_KEY} from "../src/star-ratings.mjs";
import {PROGRESS_KEY} from "../src/progress.mjs";

function storage(seed={}){
  const map=new Map(Object.entries(seed)),writes=[];
  return {map,writes,getItem:key=>map.get(key)??null,setItem:(key,value)=>{writes.push(key);map.set(key,value)}};
}
// A synthetic save uses only current, available benchmarked levels and
// their current revisions. Never multiply a per-level score by replay count.
function recordsForStars(stars){
  const records=blankCampaignRecords();
  for(const world of CAMPAIGN_REGISTRY)for(const stage of world.stages){
    if(!world.available||!stage.available)continue;
    const record=records.worlds[world.id].stages[stage.id];
    for(const slot of stage.levels){
      const optimal=stage.optimalMoves[slot.id];
      if(!slot.available||!optimal||!stars)continue;
      const earned=Math.min(stars,3);
      record.completed.push(slot.id);record.bestMoves[slot.id]=optimal+3-earned;
      if(slot.level.contentRevision>1)record.completedRevisions[slot.id]=slot.level.contentRevision;
      stars-=earned;
    }
  }
  assert.equal(stars,0,"requested stars must exist");
  return records;
}
test("agreed 57 reward milestones, stable IDs, and final set are internally consistent",()=>{
  assert.deepEqual(COSMETIC_REWARDS.map(r=>r.stars),
    [3,6,9,12,18,24,30,36,45,54,60,66,72,81,90,105,120,135,150,165,180,195,210,225,240,255,270,285,300,315,330,345,360,375,390,405,420,435,450,465,480,495,510,525,540,555,570,585,600,615,630,645,660,675,690,705,720]);
  assert.equal(new Set(COSMETIC_REWARDS.map(r=>r.id)).size,57);
  assert.equal(new Set(COSMETIC_ITEMS.map(r=>r.id)).size,COSMETIC_ITEMS.length);
  for(const item of COSMETIC_ITEMS){
    assert.ok(COSMETIC_SLOTS.includes(item.slot));
    assert.ok(findCosmeticReward(item.unlockId));
    assert.ok(!["colour","color","sign","mass","shape","size"].includes(item.slot));
  }
  const finale=findCosmeticReward("grand-alchemist");
  assert.deepEqual(Object.keys(finale.loadout),SPRITE_COSMETIC_SLOTS);
  for(const [slot,id] of Object.entries(finale.loadout)){
    assert.equal(findCosmeticItem(id).slot,slot);
    assert.equal(findCosmeticItem(id).unlockId,finale.id);
  }
});
test("each threshold unlocks exactly on time, with useful next reward information",()=>{
  const store=storage(),rewards=createCosmeticRewards(blankCampaignRecords(),{storage:store});
  assert.equal(store.writes.length,0);
  assert.equal(rewards.getSnapshot().availableStars,720);
  assert.equal(rewards.getSnapshot().nextReward.id,"curious-eyes");
  assert.equal(rewards.getSnapshot().starsToNext,3);
  for(const [i,item] of COSMETIC_REWARDS.entries()){
    const before=rewards.syncCampaign(recordsForStars(item.stars-1));
    assert.equal(before.snapshot.unlockedCount,i,item.id);
    assert.equal(before.snapshot.starsToNext,1,item.id);
    assert.equal(before.snapshot.nextReward.id,item.id);
    const after=rewards.syncCampaign(recordsForStars(item.stars));
    assert.equal(after.snapshot.earnedStars,item.stars);
    assert.deepEqual(after.newlyUnlocked,[item.id]);
    assert.equal(after.snapshot.unlockedCount,i+1);
    assert.deepEqual(after.snapshot.equipped,originalAppearance(),"never auto-equip");
  }
  assert.equal(rewards.getSnapshot().nextReward,null);
  assert.equal(rewards.getSnapshot().starsToNext,0);
  assert.equal(rewards.getSnapshot().unlockedCount,57);
});
test("global star count uses all worlds and modes, not legacy ratings plus the same v2 records",()=>{
  const full=recordsForStars(720);
  assert.deepEqual(campaignStarTotals(full),{earned:720,available:720,completed:240,count:240});
  for(const world of CAMPAIGN_REGISTRY){
    assert.equal(campaignStarTotals(full,{worldId:world.id}).earned,180);
    for(const stage of world.stages)
      assert.equal(campaignStarTotals(full,{worldId:world.id,stageId:stage.id}).earned,3*stage.levels.length);
  }
  const store=storage({
    [CAMPAIGN_SAVE_KEY]:JSON.stringify(recordsForStars(9)),
    [STAR_RATINGS_KEY]:JSON.stringify({guided:{"1":1,"2":1,"3":1},independent:{},notebook:{}})
  });
  const original=store.map.get(CAMPAIGN_SAVE_KEY);
  const rewards=createCosmeticRewards(loadCampaignRecords(store),{storage:store});
  assert.equal(rewards.getSnapshot().earnedStars,9);
  assert.deepEqual(rewards.getSnapshot().unlockedRewards,["curious-eyes","polished-steel","extra-fluffy"]);
  assert.equal(store.map.get(CAMPAIGN_SAVE_KEY),original);
  assert.deepEqual(store.writes,[COSMETIC_SAVE_KEY]);
});
test("stars are not farmable; replay can improve best stars but browsing and invalid scores cannot grant rewards",()=>{
  const slot=CAMPAIGN_REGISTRY[0].stages[0].levels[0];
  const optimal=CAMPAIGN_REGISTRY[0].stages[0].optimalMoves[slot.id];
  let data=blankCampaignRecords();
  const store=storage(),rewards=createCosmeticRewards(data,{storage:store});
  data=withCampaignLastPlayed(data,"workshop","guided",slot.id);
  assert.equal(rewards.syncCampaign(data).changed,false);
  for(const [id,moves] of [[slot.id,0],["workshop-custom",optimal],[slot.id,optimal+1]]){
    data=withCampaignCompleted(data,"workshop","guided",id,moves);
    assert.deepEqual(rewards.syncCampaign(data).newlyUnlocked,[]);
  }
  assert.equal(rewards.getSnapshot().earnedStars,2);
  assert.equal(store.writes.length,0);
  data=withCampaignCompleted(data,"workshop","guided",slot.id,optimal);
  assert.deepEqual(rewards.syncCampaign(data).newlyUnlocked,["curious-eyes"]);
  for(const moves of [optimal,optimal+1,optimal+10]){
    data=withCampaignCompleted(data,"workshop","guided",slot.id,moves);
    assert.equal(rewards.syncCampaign(data).changed,false);
  }
  assert.equal(rewards.getSnapshot().earnedStars,3);
  assert.deepEqual(store.writes,[COSMETIC_SAVE_KEY]);
});
test("existing unrated legacy completions do not invent stars",()=>{
  const store=storage({[PROGRESS_KEY]:JSON.stringify({completed:[1,2,3],lastPlayed:4})});
  const rewards=createCosmeticRewards(loadCampaignRecords(store),{storage:store});
  assert.equal(rewards.getSnapshot().earnedStars,0);
  assert.equal(rewards.getSnapshot().unlockedCount,0);
  assert.equal(store.writes.length,0);
});
test("equipping requires a matching unlocked item, supports eyewear and neckwear together, and never spends stars",()=>{
  const store=storage(),campaign=recordsForStars(72);
  let rewards=createCosmeticRewards(campaign,{storage:store});
  assert.equal(rewards.equip("fur","spiky-fur").code,"locked");
  assert.equal(rewards.equip("eyes","little-bow-tie").code,"wrong-slot");
  assert.equal(rewards.equip("fur","not-an-item").code,"unknown-item");
  assert.equal(rewards.equip("color","extra-fluffy").code,"unknown-slot");
  assert.equal(rewards.equipSet("grand-alchemist").code,"locked");
  assert.equal(store.writes.length,1);
  for(const [slot,id] of [["fur","extra-fluffy"],["eyes","curious-eyes"],["eyewear","brass-spectacles"],["neckwear","little-bow-tie"]])
    assert.equal(rewards.equip(slot,id).ok,true);
  const selected=rewards.getSnapshot();
  assert.equal(selected.earnedStars,72);
  assert.equal(selected.unlockedCount,13);
  assert.equal(selected.equipped.eyewear,"brass-spectacles");
  assert.equal(selected.equipped.neckwear,"little-bow-tie");
  rewards=createCosmeticRewards(campaign,{storage:store});
  assert.deepEqual(rewards.getSnapshot(),selected);
  assert.equal(rewards.equip("eyewear",null).ok,true);
  assert.equal(rewards.getSnapshot().equipped.neckwear,"little-bow-tie");
  assert.deepEqual(rewards.restoreOriginal().snapshot.equipped,originalAppearance());
  assert.equal(rewards.getSnapshot().unlockedCount,13);
  assert.equal(rewards.getSnapshot().earnedStars,72);
  assert.ok(store.writes.every(key=>key===COSMETIC_SAVE_KEY));
});
test("already earned rewards and equipped appearance survive a later reduction in current campaign stars",()=>{
  const store=storage(),rewards=createCosmeticRewards(recordsForStars(90),{storage:store});
  rewards.equip("fur","spiky-fur");
  const changed=rewards.syncCampaign(recordsForStars(72));
  assert.deepEqual(changed.newlyUnlocked,[]);
  assert.equal(changed.snapshot.earnedStars,72);
  assert.equal(changed.snapshot.nextReward.stars,105);
  assert.equal(changed.snapshot.starsToNext,33);
  assert.equal(changed.snapshot.equipped.fur,"spiky-fur");
  const reloaded=createCosmeticRewards(recordsForStars(0),{storage:store});
  assert.equal(reloaded.isUnlocked("spiky-fur"),true);
  assert.equal(reloaded.getSnapshot().equipped.fur,"spiky-fur");
  assert.equal(reloaded.getSnapshot().earnedStars,0);
});
test("the Grand Alchemist is one milestone with a coordinated loadout; changing one component does not revoke it",()=>{
  const rewards=createCosmeticRewards(recordsForStars(719),{storage:storage()});
  assert.equal(rewards.isUnlocked("grand-alchemist-fur"),false);
  assert.equal(rewards.equip("fur","grand-alchemist-fur").code,"locked");
  assert.deepEqual(rewards.syncCampaign(recordsForStars(720)).newlyUnlocked,["grand-alchemist"]);
  assert.deepEqual(rewards.equipSet("grand-alchemist").snapshot.equipped,{...originalAppearance(),...findCosmeticReward("grand-alchemist").loadout});
  assert.equal(rewards.equip("headwear",null).ok,true);
  assert.equal(rewards.isUnlocked("grand-alchemist"),true);
  assert.equal(rewards.getSnapshot().rewardCount,57);
});
test("save validation ignores unknown, duplicate, locked and wrongly slotted data",()=>{
  const bad={version:1,unlockedRewards:["curious-eyes","curious-eyes","made-up"],
    equipped:{eyes:"sleepy-eyes",fur:"curious-eyes",color:"red",headwear:"grand-alchemist-headwear"}};
  assert.deepEqual(normalizeCosmeticProfile(bad),{...blankCosmeticProfile(),unlockedRewards:["curious-eyes"]});
  assert.deepEqual(normalizeCosmeticProfile({version:999,unlockedRewards:["grand-alchemist"]}),blankCosmeticProfile());
  const store=storage({[COSMETIC_SAVE_KEY]:"{invalid"});
  assert.deepEqual(loadCosmeticProfile(store),blankCosmeticProfile());
  assert.equal(createCosmeticRewards(recordsForStars(9),{storage:store}).getSnapshot().unlockedCount,3);
});
test("a blocked storage browser keeps session unlocks and selections usable; reads and listeners cannot break the campaign",()=>{
  const blocked={getItem(){throw Error("blocked")},setItem(){throw Error("blocked")}};
  const rewards=createCosmeticRewards(blankCampaignRecords(),{storage:blocked});
  const calls=[];
  const stop=rewards.subscribe(change=>calls.push(change.newlyUnlocked));
  rewards.subscribe(()=>{throw Error("a future celebration failed")});
  assert.deepEqual(rewards.syncCampaign(recordsForStars(18)).newlyUnlocked,["curious-eyes","polished-steel","extra-fluffy","dumbbell","little-bow-tie"]);
  assert.equal(rewards.equip("neckwear","little-bow-tie").ok,true);
  stop();
  rewards.syncCampaign(recordsForStars(30));
  assert.equal(calls.length,2);
  assert.equal(rewards.getSnapshot().equipped.neckwear,"little-bow-tie");
  assert.ok(Object.isFrozen(rewards.getSnapshot().equipped));
  assert.ok(Object.isFrozen(rewards.getSnapshot().unlockedRewards));
});
test("an older open tab cannot erase rewards or an appearance saved in another tab",()=>{
  const store=storage();
  const older=createCosmeticRewards(recordsForStars(3),{storage:store});
  const newer=createCosmeticRewards(recordsForStars(18),{storage:store});
  newer.equip("neckwear","little-bow-tie");
  older.syncCampaign(recordsForStars(3));
  assert.equal(older.isUnlocked("little-bow-tie"),true);
  assert.equal(older.getSnapshot().equipped.neckwear,"little-bow-tie");
  older.equip("eyes","curious-eyes");
  assert.equal(loadCosmeticProfile(store).equipped.neckwear,"little-bow-tie");
  assert.equal(loadCosmeticProfile(store).unlockedRewards.length,5);
});

test("expanded v1 migration keeps old entitlements and appearance, backfills earned milestones silently",()=>{
  const legacy={version:1,unlockedRewards:["curious-eyes","extra-fluffy","little-bow-tie"],
    equipped:{eyes:"curious-eyes",fur:"extra-fluffy",neckwear:"little-bow-tie"}};
  const seed=storage({[COSMETIC_SAVE_KEY]:JSON.stringify(legacy)});
  const records=recordsForStars(36),store=createCosmeticRewards(records,{storage:seed});
  assert.equal(store.getSnapshot().earnedStars,36);
  assert.deepEqual(store.getSnapshot().unlockedRewards,COSMETIC_REWARDS.filter(r=>r.stars<=36).map(r=>r.id));
  assert.deepEqual(store.getSnapshot().equipped,{...originalAppearance(),...legacy.equipped});
  assert.deepEqual(store.syncCampaign(records).newlyUnlocked,[]);
  assert.equal(seed.writes.length,1);
  const restored=createCosmeticRewards(records,{storage:seed});
  assert.deepEqual(restored.getSnapshot(),store.getSnapshot());
});
test("weight and chamber slots are independent; finale equips only sprites and collection reset preserves the other collections",()=>{
  const store=createCosmeticRewards(recordsForStars(720),{storage:storage()});
  for(const [slot,id] of [["weight-shape","dumbbell"],["weight-material","copper"],["weight-effect","soft-glow"],["chamber-theme","clockmakers-workshop"]])
    assert.equal(store.equip(slot,id).ok,true);
  assert.equal(store.equip("fur","dumbbell").code,"wrong-slot");
  const lab={...store.getSnapshot().equipped};
  const finale=store.equipSet("grand-alchemist").snapshot;
  assert.deepEqual(finale.equipped,{...lab,...findCosmeticReward("grand-alchemist").loadout});
  const after=store.restoreOriginal("weights").snapshot;
  assert.equal(after.equipped["weight-material"],null);
  assert.equal(after.equipped["weight-shape"],null);
  assert.equal(after.equipped["weight-effect"],null);
  assert.equal(after.equipped["chamber-theme"],"clockmakers-workshop");
  assert.equal(after.equipped.fur,"grand-alchemist-fur");
  assert.equal(store.restoreOriginal("sprites").snapshot.equipped["chamber-theme"],"clockmakers-workshop");
  assert.equal(store.restoreOriginal("unknown").code,"unknown-collection");
  assert.equal(store.getSnapshot().unlockedCount,57);
  assert.equal(store.getSnapshot().earnedStars,720);
  assert.deepEqual(store.restoreOriginal().snapshot.equipped,originalAppearance());
  for(const [group,count] of [["sprites",29],["weights",18],["chambers",10]])
    assert.equal(COSMETIC_REWARDS.filter(r=>cosmeticCollection(r)===group).length,count);
});

test("read-only cross-tab refresh updates appearance and permanent entitlements without duplicate unlocks or writes",()=>{
  const seed=storage();
  const one=createCosmeticRewards(recordsForStars(720),{storage:seed});
  const two=createCosmeticRewards(recordsForStars(3),{storage:seed});
  const changes=[];
  two.subscribe(change=>changes.push(change));
  one.equip("weight-shape","kettlebell");
  one.equip("chamber-theme","astral-sanctuary");
  const writes=seed.writes.length;
  const update=two.refreshAppearance();
  assert.equal(update.changed,true);
  assert.equal(update.snapshot.equipped["weight-shape"],"kettlebell");
  assert.equal(update.snapshot.equipped["chamber-theme"],"astral-sanctuary");
  assert.equal(update.snapshot.earnedStars,3);
  assert.equal(update.snapshot.unlockedCount,57);
  assert.deepEqual(update.newlyUnlocked,[]);
  assert.equal(two.refreshAppearance().changed,false);
  assert.equal(changes.length,1);
  assert.equal(seed.writes.length,writes);
  one.restoreOriginal("chambers");
  two.refreshAppearance();
  assert.equal(two.getSnapshot().equipped["chamber-theme"],null);
  assert.equal(two.getSnapshot().equipped["weight-shape"],"kettlebell");
});
test("read-only refresh tolerates malformed remote profiles and keeps session-only choices",()=>{
  const seed=storage();
  const rewards=createCosmeticRewards(recordsForStars(24),{storage:seed});
  rewards.equip("chamber-theme","clockmakers-workshop");
  seed.map.set(COSMETIC_SAVE_KEY,"{bad");
  const before=rewards.getSnapshot();
  assert.equal(rewards.refreshAppearance().changed,false);
  assert.deepEqual(rewards.getSnapshot(),before);
  const blocked={getItem:()=>null,setItem(){throw Error("blocked")}};
  const session=createCosmeticRewards(recordsForStars(24),{storage:blocked});
  session.equip("chamber-theme","clockmakers-workshop");
  session.refreshAppearance();
  assert.equal(session.getSnapshot().equipped["chamber-theme"],"clockmakers-workshop");
});
