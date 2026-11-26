import test from "node:test";
import assert from "node:assert/strict";
import {createRewardCelebrationQueue,rewardApplyState} from "../src/reward-celebration.mjs";
import {createCosmeticRewards,COSMETIC_SAVE_KEY} from "../src/cosmetic-rewards.mjs";
import {blankCampaignRecords} from "../src/campaign-records.mjs";
import {findCosmeticReward,originalAppearance} from "../src/cosmetic-catalog.mjs";
import {equipAtelierReward} from "../src/atelier-model.mjs";
test("new unlocks wait in a queue until review and are announced in milestone order only once",()=>{
  const queue=createRewardCelebrationQueue();
  assert.equal(queue.size,0);
  assert.equal(queue.enqueue(["extra-fluffy","curious-eyes","unknown"]),2);
  assert.equal(queue.enqueue(["curious-eyes"]),2);
  assert.deepEqual(queue.take().map(r=>r.id),["curious-eyes","extra-fluffy"]);
  assert.equal(queue.size,0);
  assert.deepEqual(queue.take(),[]);
  assert.equal(queue.enqueue(["curious-eyes","little-bow-tie"]),1);
  assert.deepEqual(queue.take().map(r=>r.id),["little-bow-tie"]);
  assert.deepEqual(queue.take(),[]);
});
test("startup, no new entitlements and repeat completion have no queued announcement",()=>{
  const queue=createRewardCelebrationQueue();
  queue.enqueue([]);queue.enqueue(undefined);
  assert.deepEqual(queue.take(),[]);
  queue.enqueue(["springy-bounce"]);
  assert.equal(queue.take()[0].stars,60);
  queue.enqueue(["springy-bounce"]);
  assert.deepEqual(queue.take(),[]);
});

test("new weight and chamber milestones use the same ordered one-time celebration queue",()=>{
  const queue=createRewardCelebrationQueue();
  assert.equal(queue.enqueue(["clockmakers-workshop","polished-steel","dumbbell"]),3);
  assert.deepEqual(queue.take().map(r=>r.id),["polished-steel","dumbbell","clockmakers-workshop"]);
  assert.equal(queue.enqueue(["dumbbell"]),0);
});

test("unlock actions use the real Atelier entitlement and equipped state for every collection",()=>{
  const ids=["curious-eyes","extra-fluffy","polished-steel","dumbbell","clockmakers-workshop","grand-alchemist"];
  const data=new Map([[COSMETIC_SAVE_KEY,JSON.stringify({version:1,unlockedRewards:ids,equipped:{fur:"extra-fluffy"}})]]);
  const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  const records=blankCampaignRecords();
  const store=createCosmeticRewards(records,{storage});
  const queue=createRewardCelebrationQueue();
  queue.enqueue(ids.filter(id=>id!=="extra-fluffy"));
  const rewards=queue.take();
  assert.equal(rewards.length,5);
  for(const reward of rewards){
    const before=store.getSnapshot();
    assert.deepEqual(rewardApplyState(store,reward),{canApply:true,label:"Apply cosmetic now"});
    const result=equipAtelierReward(store,reward.id);
    assert.ok(result.ok);
    assert.deepEqual(result.newlyUnlocked,[]);
    assert.deepEqual(rewardApplyState(store,reward),{canApply:false,label:"Applied ✓"});
    assert.equal(result.snapshot.earnedStars,before.earnedStars);
    assert.deepEqual(result.snapshot.unlockedRewards,before.unlockedRewards);
    const expected=reward.slot?{...before.equipped,[reward.slot]:reward.id}:{...before.equipped,...reward.loadout};
    assert.deepEqual(result.snapshot.equipped,expected);
  }
  assert.deepEqual(store.getSnapshot().equipped,createCosmeticRewards(records,{storage}).getSnapshot().equipped);
  assert.equal(rewardApplyState(store,findCosmeticReward("sleepy-eyes")).label,"Locked");
  assert.equal(rewardApplyState(store,findCosmeticReward("sleepy-eyes")).canApply,false);
  const missing={id:"future-art",slot:"fur"};
  assert.deepEqual(rewardApplyState({getSnapshot:()=>({unlockedRewards:["future-art"],equipped:originalAppearance(),earnedStars:0})},missing),
    {canApply:false,label:"Art coming soon"});
});
test("an applied reward is no longer actionable until its slot is changed",()=>{
  const reward=findCosmeticReward("curious-eyes");
  let equipped={eyes:"curious-eyes"};
  const store={getSnapshot:()=>({unlockedRewards:["curious-eyes","sleepy-eyes"],equipped,earnedStars:30})};
  assert.equal(rewardApplyState(store,reward).canApply,false);
  equipped={eyes:"sleepy-eyes"};
  assert.equal(rewardApplyState(store,reward).canApply,true);
});
