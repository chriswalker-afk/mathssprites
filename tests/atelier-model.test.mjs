import test from "node:test";
import assert from "node:assert/strict";
import {atelierCollection,atelierFilters,atelierPreview,atelierRewardState,rewardArtReady,equipAtelierReward} from "../src/atelier-model.mjs";
import {COSMETIC_REWARDS,cosmeticCollection,findCosmeticReward,originalAppearance} from "../src/cosmetic-catalog.mjs";
import {createCosmeticRewards,COSMETIC_SAVE_KEY} from "../src/cosmetic-rewards.mjs";
import {blankCampaignRecords} from "../src/campaign-records.mjs";
import {IMPLEMENTED_CHAMBER_THEMES} from "../src/chamber-themes.mjs";
const reward=id=>findCosmeticReward(id);
const snapshot=(earnedStars=0,unlockedRewards=[],equipped={})=>({earnedStars,unlockedRewards,equipped:{...originalAppearance(),...equipped}});
test("all 57 milestones remain visible and category/owned filtering uses actual entitlements",()=>{
  const saved=snapshot(9,["curious-eyes","extra-fluffy"]);
  assert.equal(atelierCollection(saved).length,57);
  assert.deepEqual(atelierCollection(saved,{filter:"eyes"}).map(r=>r.id),["curious-eyes","sleepy-eyes","mischievous-eyes","distinguished-eyebrows"]);
  assert.deepEqual(atelierCollection(saved,{ownedOnly:true}).map(r=>r.id),["curious-eyes","extra-fluffy"]);
  assert.equal(atelierCollection(saved,{filter:"headwear",ownedOnly:true}).length,0);
  assert.equal(atelierCollection(saved,{filter:"set"})[0].id,"grand-alchemist");
});
test("owned, locked and equipped states cover the complete collection; missing-art guard remains defensive",()=>{
  const saved=snapshot(30,["curious-eyes","extra-fluffy","little-bow-tie","sleepy-eyes","curled-fur"],{fur:"extra-fluffy"});
  assert.equal(atelierRewardState(saved,reward("extra-fluffy")).status,"equipped");
  assert.equal(atelierRewardState(saved,reward("curious-eyes")).canEquip,true);
  assert.equal(atelierRewardState(saved,reward("spiky-fur")).starsNeeded,60);
  assert.equal(atelierRewardState(saved,reward("spiky-fur")).status,"locked");
  assert.equal(atelierRewardState(saved,reward("little-bow-tie")).status,"available");
  assert.equal(atelierRewardState(saved,reward("little-bow-tie")).canEquip,true);
  assert.equal(atelierRewardState(saved,reward("curled-fur")).status,"available");
  assert.equal(atelierRewardState(saved,reward("curled-fur"),[]).status,"owned-coming");
  assert.equal(atelierRewardState(saved,reward("curled-fur"),[]).canEquip,false);
  assert.equal(atelierRewardState(saved,reward("knitted-beanie")).status,"locked");
  assert.equal(atelierRewardState(saved,reward("distinguished-eyebrows")).status,"locked");
  assert.equal(atelierRewardState(saved,reward("distinguished-eyebrows"),[]).status,"locked-coming");
  assert.ok(COSMETIC_REWARDS.filter(r=>cosmeticCollection(r)==="sprites").every(r=>rewardArtReady(r)));
  assert.equal(COSMETIC_REWARDS.filter(r=>rewardArtReady(r)).length,57);
  assert.equal(COSMETIC_REWARDS.filter(r=>cosmeticCollection(r)==="chambers").length,10);
  assert.equal(rewardArtReady(reward("grand-alchemist")),true);
  assert.equal(rewardArtReady(reward("grand-alchemist"),Object.values(reward("grand-alchemist").loadout)),true);
});
test("try-on merges only the selected slot into a copy, never equips or spends a star",()=>{
  const saved=snapshot(9,["curious-eyes","extra-fluffy"],{fur:"extra-fluffy"});
  const preview=atelierPreview(saved,"sleepy-eyes");
  assert.equal(preview.fur,"extra-fluffy");
  assert.equal(preview.eyes,"sleepy-eyes");
  assert.equal(saved.equipped.eyes,null);
  assert.deepEqual(atelierPreview(saved,"little-bow-tie"),{...saved.equipped,neckwear:"little-bow-tie"});
  assert.deepEqual(atelierPreview(saved,"curled-fur"),{...saved.equipped,fur:"curled-fur"});
  assert.deepEqual(atelierPreview(saved,"curled-fur",[]),saved.equipped);
  assert.deepEqual(atelierPreview(saved,"made-up"),saved.equipped);
  assert.equal(saved.earnedStars,9);
});
test("the UI equip guard uses real ownership and rejects unknown or locked items",()=>{
  const map=new Map([[COSMETIC_SAVE_KEY,JSON.stringify({version:1,unlockedRewards:["curious-eyes","extra-fluffy","little-bow-tie","knitted-beanie","brass-spectacles","curled-fur"],equipped:{}})]]);
  const store=createCosmeticRewards(blankCampaignRecords(),{storage:{getItem:key=>map.get(key),setItem:(key,v)=>map.set(key,v)}});
  const before=map.get(COSMETIC_SAVE_KEY);
  assert.equal(equipAtelierReward(store,"sleepy-eyes").code,"locked");
  assert.equal(equipAtelierReward(store,"grand-alchemist").code,"locked");
  assert.equal(equipAtelierReward(store,"unknown").code,"unknown-reward");
  assert.equal(map.get(COSMETIC_SAVE_KEY),before);
  assert.equal(equipAtelierReward(store,"curious-eyes").ok,true);
  assert.equal(equipAtelierReward(store,"extra-fluffy").ok,true);
  assert.equal(equipAtelierReward(store,"extra-fluffy").code,"already-equipped");
  assert.equal(store.getSnapshot().equipped.eyes,"curious-eyes");
  assert.equal(store.getSnapshot().equipped.fur,"extra-fluffy");
  for(const id of ["little-bow-tie","knitted-beanie","brass-spectacles"])assert.equal(equipAtelierReward(store,id).ok,true);
  assert.equal(store.getSnapshot().equipped.neckwear,"little-bow-tie");
  assert.equal(store.getSnapshot().equipped.headwear,"knitted-beanie");
  assert.equal(store.getSnapshot().equipped.eyewear,"brass-spectacles");
  assert.equal(store.getSnapshot().unlockedCount,6);
  assert.equal(store.getSnapshot().earnedStars,0);
});

test("motion and effects are independently previewable and equipable without changing stars",()=>{
  const saved=snapshot(240,["springy-bounce","stardust-footsteps"],{fur:"extra-fluffy",movement:"springy-bounce"});
  assert.equal(atelierRewardState(saved,reward("springy-bounce")).status,"equipped");
  assert.equal(atelierRewardState(saved,reward("magical-levitation")).status,"locked");
  assert.equal(atelierRewardState(saved,reward("stardust-footsteps")).canEquip,true);
  assert.equal(atelierPreview(saved,"magical-levitation").movement,"magical-levitation");
  assert.equal(atelierPreview(saved,"stardust-footsteps").movement,"springy-bounce");
  const map=new Map([[COSMETIC_SAVE_KEY,JSON.stringify({version:1,unlockedRewards:saved.unlockedRewards,equipped:{}})]]);
  const store=createCosmeticRewards(blankCampaignRecords(),{storage:{getItem:key=>map.get(key),setItem:(key,v)=>map.set(key,v)}});
  assert.equal(equipAtelierReward(store,"springy-bounce").ok,true);
  assert.equal(equipAtelierReward(store,"stardust-footsteps").ok,true);
  assert.equal(equipAtelierReward(store,"magical-levitation").code,"locked");
  assert.equal(store.getSnapshot().equipped.movement,"springy-bounce");
  assert.equal(store.getSnapshot().equipped.effect,"stardust-footsteps");
  assert.equal(store.getSnapshot().earnedStars,0);
});

test("the 720-star reward is one unlock and equips a coordinated seven-component outfit",()=>{
  const set=reward("grand-alchemist");
  const locked=snapshot(719,COSMETIC_REWARDS.slice(0,-1).map(r=>r.id));
  assert.equal(atelierRewardState(locked,set).canEquip,false);
  assert.equal(atelierRewardState(locked,set).starsNeeded,1);
  assert.deepEqual(atelierPreview(locked,set.id),{...originalAppearance(),...set.loadout});
  assert.deepEqual(locked.equipped,originalAppearance());
  const map=new Map([[COSMETIC_SAVE_KEY,JSON.stringify({version:1,unlockedRewards:COSMETIC_REWARDS.map(r=>r.id),equipped:{}})]]);
  const storage={getItem:key=>map.get(key),setItem:(key,v)=>map.set(key,v)};
  let store=createCosmeticRewards(blankCampaignRecords(),{storage});
  assert.equal(equipAtelierReward(store,set.id).ok,true);
  assert.deepEqual(store.getSnapshot().equipped,{...originalAppearance(),...set.loadout});
  assert.equal(store.getSnapshot().unlockedCount,57);
  assert.equal(atelierRewardState(store.getSnapshot(),set).status,"equipped");
  assert.equal(equipAtelierReward(store,"curled-fur").ok,true);
  assert.equal(store.getSnapshot().equipped.headwear,set.loadout.headwear);
  assert.equal(atelierRewardState(store.getSnapshot(),set).canEquip,true);
  store=createCosmeticRewards(blankCampaignRecords(),{storage});
  assert.equal(store.getSnapshot().equipped.fur,"curled-fur");
  assert.equal(equipAtelierReward(store,set.id).ok,true);
  assert.deepEqual(store.restoreOriginal().snapshot.equipped,originalAppearance());
  assert.equal(store.getSnapshot().unlockedCount,57);
});

test("three complete collections filter separately and locked art cannot be equipped",()=>{
  const saved=snapshot(24,["curious-eyes","polished-steel","extra-fluffy","dumbbell","little-bow-tie","clockmakers-workshop"],{fur:"extra-fluffy"});
  for(const [collection,count] of [["sprites",29],["weights",18],["chambers",10]])assert.equal(atelierCollection(saved,{collection}).length,count);
  assert.deepEqual(atelierFilters("weights").map(f=>f.id),["all","weight-shape","weight-material","weight-effect"]);
  assert.deepEqual(atelierFilters("chambers").map(f=>f.id),["all","chamber-theme"]);
  assert.deepEqual(atelierCollection(saved,{collection:"weights",ownedOnly:true}).map(r=>r.id),["polished-steel","dumbbell"]);
  assert.equal(atelierCollection(saved,{collection:"weights",filter:"weight-material"}).length,7);
  assert.equal(atelierRewardState(saved,reward("polished-steel")).status,"available");
  assert.equal(atelierRewardState(saved,reward("dumbbell")).status,"available");
  assert.equal(atelierRewardState(saved,reward("copper")).status,"locked");
  assert.ok(COSMETIC_REWARDS.filter(r=>r.slot==="weight-material").every(r=>rewardArtReady(r)));
  assert.deepEqual(atelierPreview(saved,"dumbbell"),{...saved.equipped,"weight-shape":"dumbbell"});
  const map=new Map([[COSMETIC_SAVE_KEY,JSON.stringify({version:1,unlockedRewards:saved.unlockedRewards,equipped:saved.equipped})]]);
  const store=createCosmeticRewards(blankCampaignRecords(),{storage:{getItem:key=>map.get(key),setItem:(key,v)=>map.set(key,v)}});
  const before=map.get(COSMETIC_SAVE_KEY);
  assert.ok(COSMETIC_REWARDS.filter(r=>r.slot==="weight-shape").every(r=>rewardArtReady(r)));
  assert.equal(equipAtelierReward(store,"kettlebell").code,"locked");
  assert.equal(atelierRewardState(saved,reward("clockmakers-workshop")).status,"available");
  assert.equal(equipAtelierReward(store,"scholars-library").code,"locked");
  assert.equal(equipAtelierReward(store,"copper").code,"locked");
  assert.equal(map.get(COSMETIC_SAVE_KEY),before);
  assert.deepEqual(atelierPreview(saved,"copper"),{...saved.equipped,"weight-material":"copper"});
  assert.equal(equipAtelierReward(store,"polished-steel").ok,true);
  assert.equal(store.getSnapshot().equipped["weight-material"],"polished-steel");
  assert.equal(equipAtelierReward(store,"dumbbell").ok,true);
  assert.equal(store.getSnapshot().equipped["weight-shape"],"dumbbell");
  assert.equal(store.getSnapshot().equipped["weight-material"],"polished-steel");
  assert.equal(store.getSnapshot().equipped.fur,"extra-fluffy");
  assert.equal(equipAtelierReward(store,"clockmakers-workshop").ok,true);
  assert.equal(store.getSnapshot().equipped["chamber-theme"],"clockmakers-workshop");
});

test("five weight effects are independent try-ons",()=>{
  const saved=snapshot(81,["soft-glow","dumbbell","copper","clockmakers-workshop"],{"weight-shape":"dumbbell","weight-material":"copper"});
  assert.equal(atelierCollection(saved,{collection:"weights",filter:"weight-effect"}).length,5);
  for(const r of COSMETIC_REWARDS.filter(r=>r.slot==="weight-effect")){
    assert.equal(rewardArtReady(r),true);
    assert.deepEqual(atelierPreview(saved,r.id),{...saved.equipped,"weight-effect":r.id});
    assert.equal(atelierRewardState(saved,r).canEquip,r.id==="soft-glow");
  }
  const map=new Map([[COSMETIC_SAVE_KEY,JSON.stringify({version:1,unlockedRewards:saved.unlockedRewards,equipped:saved.equipped})]]);
  const store=createCosmeticRewards(blankCampaignRecords(),{storage:{getItem:key=>map.get(key),setItem:(key,v)=>map.set(key,v)}});
  const before=map.get(COSMETIC_SAVE_KEY);
  assert.equal(equipAtelierReward(store,"golden-halo").code,"locked");
  assert.equal(map.get(COSMETIC_SAVE_KEY),before);
  assert.equal(equipAtelierReward(store,"soft-glow").ok,true);
  assert.deepEqual(store.getSnapshot().equipped,{...saved.equipped,"weight-effect":"soft-glow"});
  assert.equal(store.equip("weight-effect",null).ok,true);
  assert.deepEqual(store.getSnapshot().equipped,saved.equipped);
});

test("all ten chamber artworks are ready, earned high-tier rewards become usable, and restore is independent",()=>{
  const equipped={fur:"extra-fluffy","weight-shape":"dumbbell","weight-material":"copper","weight-effect":"soft-glow"};
  const owned=["clockmakers-workshop","frostbound-vault","extra-fluffy","dumbbell","copper","soft-glow"];
  const saved=snapshot(24,owned,equipped);
  for(const id of IMPLEMENTED_CHAMBER_THEMES){
    assert.equal(rewardArtReady(reward(id)),true);
    assert.deepEqual(atelierPreview(saved,id),{...saved.equipped,"chamber-theme":id});
    assert.equal(atelierRewardState(saved,reward(id)).canEquip,owned.includes(id));
  }
  assert.equal(atelierRewardState(saved,reward("frostbound-vault")).status,"available");
  assert.equal(atelierRewardState(saved,reward("astral-sanctuary")).status,"locked");
  assert.deepEqual(atelierPreview(saved,"frostbound-vault"),{...saved.equipped,"chamber-theme":"frostbound-vault"});
  // The defensive fallback remains covered without marking real art pending.
  assert.equal(atelierRewardState(saved,reward("frostbound-vault"),[]).status,"owned-coming");
  assert.deepEqual(atelierPreview(saved,"frostbound-vault",[]),saved.equipped);
  const map=new Map([[COSMETIC_SAVE_KEY,JSON.stringify({version:1,unlockedRewards:owned,equipped})]]);
  const storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
  let store=createCosmeticRewards(blankCampaignRecords(),{storage});
  const before=map.get(COSMETIC_SAVE_KEY);
  assert.equal(equipAtelierReward(store,"astral-sanctuary").code,"locked");
  assert.equal(map.get(COSMETIC_SAVE_KEY),before);
  assert.equal(equipAtelierReward(store,"clockmakers-workshop").ok,true);
  assert.equal(equipAtelierReward(store,"frostbound-vault").ok,true);
  store=createCosmeticRewards(blankCampaignRecords(),{storage});
  assert.deepEqual(store.getSnapshot().equipped,{...saved.equipped,"chamber-theme":"frostbound-vault"});
  assert.deepEqual(store.restoreOriginal("chambers").snapshot.equipped,saved.equipped);
  assert.deepEqual(new Set(store.getSnapshot().unlockedRewards),new Set(owned));
});

test("every reward can be equipped from a complete profile without a coming-soon state",()=>{
  const owned=COSMETIC_REWARDS.map(r=>r.id);
  const map=new Map([[COSMETIC_SAVE_KEY,JSON.stringify({version:1,unlockedRewards:owned,equipped:{}})]]);
  const storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
  const store=createCosmeticRewards(blankCampaignRecords(),{storage});
  for(const r of COSMETIC_REWARDS){
    const before=store.getSnapshot();
    assert.equal(atelierRewardState(before,r).status,"available",r.id);
    const result=equipAtelierReward(store,r.id);
    assert.equal(result.ok,true,r.id);
    assert.equal(atelierRewardState(store.getSnapshot(),r).status,"equipped",r.id);
    assert.deepEqual(store.getSnapshot().equipped,atelierPreview(before,r.id),r.id);
    assert.deepEqual(store.getSnapshot().unlockedRewards,owned);
  }
  assert.deepEqual(store.restoreOriginal().snapshot.equipped,originalAppearance());
  assert.deepEqual(store.getSnapshot().unlockedRewards,owned);
});
