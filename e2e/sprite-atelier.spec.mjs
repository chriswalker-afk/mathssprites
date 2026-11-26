import {CAMPAIGN_REGISTRY} from "../src/campaign-registry.mjs";
import {blankCampaignRecords,campaignStarTotals} from "../src/campaign-records.mjs";
import {COSMETIC_REWARDS,findCosmeticReward} from "../src/cosmetic-catalog.mjs";
import {clickWithReferenceMove} from "./reference-move-helper.mjs";
import {test,expect} from "@playwright/test";
const saveKey="mathssprites.cosmetics.v1";
const reward=(page,id)=>page.locator('[data-reward-id="'+id+'"]');
const visibleRewards=page=>page.locator("#atelier-collection .atelier-reward:visible");
const open=page=>page.locator("#home-atelier").click();
const saves=page=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
const snapshot=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),saveKey);
async function legacyStars(page,count){
  await page.addInitScript(n=>{
    if(localStorage.getItem("atelier-qa-seeded"))return;
    localStorage.setItem("atelier-qa-seeded","1");
    localStorage.setItem("mathssprites.stars.v1",JSON.stringify({guided:Object.fromEntries(Array.from({length:n},(_,i)=>[String(i+1),i<4?1:2])),independent:{},notebook:{}}));
    localStorage.setItem("mathssprites.motion-preference.v1","reduced");
  },count);
}
test("the Atelier shows all rewards and allows a locked preview without writing any save @quick @smoke",async({page})=>{
  await page.goto("/");
  const before=await saves(page);
  await expect(page.locator("#home-atelier-stars")).toHaveText("0 / 720 ★");
  await open(page);
  await expect(page.locator("#site-atelier")).toBeVisible();
  await expect(page.locator(".site-nav-links [data-screen='atelier']")).toHaveAttribute("aria-current","page");
  await expect(page.locator("#atelier-heading")).toBeFocused();
  await expect(page.locator("#atelier-stars")).toHaveText("0 / 720 ★");
  await expect(page.locator("#atelier-next-name")).toHaveText("Curious eyes");
  await expect(page.locator("#atelier-next-copy")).toContainText("3 more");
  await expect(visibleRewards(page)).toHaveCount(29);
  await reward(page,"curious-eyes").click();
  await expect(page.locator("#atelier-preview")).toHaveAttribute("data-sprite-eyes","curious-eyes");
  await expect(page.locator("#atelier-black .sprite-eyes i").first()).toHaveCSS("height","14px");
  await expect(page.locator("#atelier-white .sprite-eyes i").first()).toHaveCSS("height","14px");
  await expect(page.locator("body")).toHaveAttribute("data-sprite-eyes","original");
  await expect(page.locator("#atelier-preview-label")).toHaveText("Trying on · not saved");
  await expect(page.locator("#atelier-equip")).toBeDisabled();
  await expect(page.locator("#atelier-detail-status")).toContainText("3 more stars");
  await page.locator("#atelier-filter").selectOption("headwear");
  await expect(visibleRewards(page)).toHaveCount(7);
  await reward(page,"knitted-beanie").click();
  await expect(page.locator("#atelier-black .sprite-wear-headwear")).toBeVisible();
  await expect(page.locator("#atelier-white .sprite-wear-headwear")).toBeVisible();
  await expect(page.locator("#atelier-equip")).toBeDisabled();
  await page.locator("#atelier-filter").selectOption("fur");
  await reward(page,"curled-fur").click();
  await expect(page.locator("#atelier-preview")).toHaveAttribute("data-sprite-fur","curled-fur");
  await expect(page.locator("#atelier-equip")).toBeDisabled();
  await page.locator("#atelier-owned-only").check();
  await expect(page.locator("#atelier-empty")).toBeVisible();
  await expect(visibleRewards(page)).toHaveCount(0);
  await page.locator("#atelier-back").click();
  await expect(page.locator("#site-home")).toBeVisible();
  expect(await saves(page)).toEqual(before);
});
test("previous stars unlock art, students can equip and combine variants, and saved choices survive reload",async({page})=>{
  // First four guided puzzles each have a one-move benchmark: 12 stars.
  await legacyStars(page,4);
  await page.goto("/");
  await open(page);
  await expect(page.locator("#atelier-stars")).toHaveText("12 / 720 ★");
  await expect(page.locator("#atelier-owned")).toHaveText("2 / 29 unlocked");
  const before=await saves(page);
  await reward(page,"extra-fluffy").click();
  await expect(page.locator("#atelier-equip")).toBeEnabled();
  await page.locator("#atelier-equip").click();
  await expect(reward(page,"extra-fluffy")).toHaveAttribute("data-status","equipped");
  await expect(page.locator("body")).toHaveAttribute("data-sprite-fur","extra-fluffy");
  await reward(page,"curious-eyes").click();
  await page.locator("#atelier-equip").click();
  await expect(page.locator("#atelier-equipped")).toContainText("Extra fluffy");
  await expect(page.locator("#atelier-equipped")).toContainText("Curious eyes");
  await expect(page.locator("#atelier-preview")).toHaveAttribute("data-sprite-fur","extra-fluffy");
  await expect(page.locator("#atelier-preview")).toHaveAttribute("data-sprite-eyes","curious-eyes");
  await page.locator("#atelier-owned-only").check();
  await expect(visibleRewards(page)).toHaveCount(2);
  await page.locator("#atelier-back").click();
  await expect(page.locator("#hero-left-items .sprite-eyes i").first()).toHaveCSS("height","14px");
  await page.reload();await open(page);
  await expect(page.locator("#atelier-equipped")).toContainText("Extra fluffy");
  await expect(page.locator("#atelier-equipped")).toContainText("Curious eyes");
  await expect(page.locator("#atelier-stars")).toHaveText("12 / 720 ★");
  await reward(page,"curious-eyes").click();
  await page.locator("#atelier-remove").click();
  await expect(page.locator("body")).toHaveAttribute("data-sprite-eyes","original");
  await expect(page.locator("body")).toHaveAttribute("data-sprite-fur","extra-fluffy");
  await page.locator("#atelier-restore").click();
  await expect(page.locator("#atelier-equipped")).toHaveText("Original appearance");
  const saved=await snapshot(page);
  expect(saved.unlockedRewards).toEqual(["curious-eyes","extra-fluffy"]);
  expect(Object.values(saved.equipped).every(v=>v===null)).toBe(true);
  const after=await saves(page);delete before[saveKey];delete after[saveKey];
  expect(after).toEqual(before);
});
test("late unlocked art can be equipped, and a different preview is discarded when leaving",async({page})=>{
  await page.addInitScript(key=>{
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:1,
      unlockedRewards:["curious-eyes","extra-fluffy","curled-fur"],equipped:{fur:"extra-fluffy"}}));
  },saveKey);
  await page.goto("/");await open(page);
  await reward(page,"curled-fur").click();
  await expect(reward(page,"curled-fur")).toHaveAttribute("data-status","available");
  await expect(page.locator("#atelier-equip")).toBeEnabled();
  await expect(page.locator("#atelier-preview")).toHaveAttribute("data-sprite-fur","curled-fur");
  await page.locator("#atelier-equip").click();
  await reward(page,"sleepy-eyes").click();
  await expect(page.locator("#atelier-preview")).toHaveAttribute("data-sprite-eyes","sleepy-eyes");
  await page.keyboard.press("Escape");
  await expect(page.locator("#site-home")).toBeVisible();
  await open(page);
  await expect(page.locator("#atelier-preview")).toHaveAttribute("data-sprite-eyes","original");
  await expect(page.locator("#atelier-preview")).toHaveAttribute("data-sprite-fur","curled-fur");
  expect((await snapshot(page)).equipped.eyes).toBeNull();
});
test("navigation returns to the originating board, and desktop and phone have reachable controls",async({page},testInfo)=>{
  await page.goto("/");
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="opposites"]').click();
  await page.locator('[data-map-stage="independent"]').click();
  await page.locator(".site-nav-links [data-screen='atelier']").click();
  await expect(page.locator("#atelier-back")).toHaveText("← Back to levels");
  await page.locator(".site-nav-links [data-screen='help']").click();
  await expect(page.locator("#help-return")).toContainText("Atelier");
  await page.locator("#help-return").click();
  await expect(page.locator("#site-atelier")).toBeVisible();
  await page.locator("#atelier-back").click();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-world","opposites");
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","independent");
  await page.locator(".site-nav-links [data-screen='home']").click();
  for(const [width,height] of [[1092,540],[1280,720],[375,812]]){
    await page.setViewportSize({width,height});
    await open(page);
    await expect(page.locator("#atelier-black .sprite-black")).toBeVisible();
    await expect(page.locator("#atelier-white .sprite-white")).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+2);
    if(width>=900)expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(height+3);
    await page.locator("#atelier-filter").selectOption("set");
    await reward(page,"grand-alchemist").click();
    await expect(page.locator("#atelier-equip")).toBeDisabled();
    if(width<900){
      await expect(page.locator("#atelier-detail-title")).toBeFocused();
      await page.locator("#atelier-browse").click();
      await expect(reward(page,"grand-alchemist")).toBeFocused();
    }
    await testInfo.attach("atelier-"+width+".png",{body:await page.screenshot({fullPage:true}),contentType:"image/png"});
    await page.locator("#atelier-back").click();
  }
});

test("wearables can be tried on, combined, changed and removed in the Atelier without spending stars",async({page})=>{
  await page.addInitScript(key=>{
    if(!localStorage.getItem(key)){
      localStorage.setItem(key,JSON.stringify({version:1,
        unlockedRewards:["curious-eyes","extra-fluffy","little-bow-tie","knitted-beanie","brass-spectacles","explorer-hat","striped-scarf"],
        equipped:{eyes:"curious-eyes"}}));
      localStorage.setItem("mathssprites.motion-preference.v1","reduced");
    }
  },saveKey);
  await page.goto("/");await open(page);
  const before=await saves(page);
  for(const [slot,id] of [["headwear","knitted-beanie"],["eyewear","brass-spectacles"],["neckwear","little-bow-tie"]]){
    await page.locator("#atelier-filter").selectOption(slot);
    await reward(page,id).click();
    await expect(page.locator("#atelier-preview")).toHaveAttribute("data-sprite-"+slot,id);
    await expect(page.locator("#atelier-equip")).toBeEnabled();
    await page.locator("#atelier-equip").click();
    await expect(page.locator("body")).toHaveAttribute("data-sprite-"+slot,id);
  }
  for(const side of ["black","white"])for(const slot of ["headwear","eyewear","neckwear"])
    await expect(page.locator("#atelier-"+side+" .sprite-wear-"+slot)).toBeVisible();
  await page.locator("#atelier-filter").selectOption("headwear");
  await reward(page,"explorer-hat").click();
  await page.locator("#atelier-equip").click();
  await expect(page.locator("body")).toHaveAttribute("data-sprite-headwear","explorer-hat");
  await expect(page.locator("body")).toHaveAttribute("data-sprite-eyewear","brass-spectacles");
  await page.locator("#atelier-back").click();
  await page.reload();
  await expect(page.locator("#hero-left-items .sprite-wear-headwear").first()).toBeVisible();
  await open(page);
  await page.locator("#atelier-filter").selectOption("neckwear");
  await reward(page,"little-bow-tie").click();
  await page.locator("#atelier-remove").click();
  await expect(page.locator("body")).toHaveAttribute("data-sprite-neckwear","original");
  await expect(page.locator("body")).toHaveAttribute("data-sprite-headwear","explorer-hat");
  const after=await saves(page);delete before[saveKey];delete after[saveKey];expect(after).toEqual(before);
});

test("motion and effect rewards combine with wearables and respect reduced motion",async({page})=>{
  await page.addInitScript(key=>{
    if(!localStorage.getItem(key)){
      localStorage.setItem(key,JSON.stringify({version:1,unlockedRewards:["springy-bounce","stardust-footsteps","knitted-beanie"],equipped:{headwear:"knitted-beanie"}}));
      localStorage.setItem("mathssprites.motion-preference.v1","reduced");
    }
  },saveKey);
  await page.goto("/");await open(page);
  const before=await saves(page);
  for(const [slot,id] of [["movement","springy-bounce"],["effect","stardust-footsteps"]]){
    await page.locator("#atelier-filter").selectOption(slot);
    await reward(page,id).click();
    await expect(page.locator("#atelier-preview")).toHaveAttribute("data-sprite-"+slot,id);
    await expect(page.locator("#atelier-equip")).toBeEnabled();
    await page.locator("#atelier-equip").click();
    await expect(page.locator("body")).toHaveAttribute("data-sprite-"+slot,id);
  }
  for(const side of ["black","white"]){
    await expect(page.locator("#atelier-"+side+" .sprite-motion")).toHaveCSS("animation-name","none");
    await expect(page.locator("#atelier-"+side+" .sprite-cosmetic-effect")).toBeVisible();
    await expect(page.locator("#atelier-"+side+" .sprite-cosmetic-effect")).toHaveCSS("animation-name","none");
    await expect(page.locator("#atelier-"+side+" .sprite-wear-headwear")).toBeVisible();
  }
  await page.locator("#atelier-back").click();await page.reload();await open(page);
  await expect(page.locator("#atelier-equipped")).toContainText("Springy bounce");
  await expect(page.locator("#atelier-equipped")).toContainText("Stardust footsteps");
  const after=await saves(page);delete before[saveKey];delete after[saveKey];expect(after).toEqual(before);
});

function finalStarFixture(){
  const records=blankCampaignRecords();
  for(const world of CAMPAIGN_REGISTRY)for(const stage of world.stages){
    const record=records.worlds[world.id].stages[stage.id];
    for(const slot of stage.levels){
      const optimal=stage.optimalMoves[slot.id];
      if(!world.available||!stage.available||!slot.available||!optimal)continue;
      record.completed.push(slot.id);
      record.bestMoves[slot.id]=optimal+(world.id==="workshop"&&stage.id==="guided"&&slot.number===1?1:0);
      if(slot.level.contentRevision>1)record.completedRevisions[slot.id]=slot.level.contentRevision;
    }
  }
  expect(campaignStarTotals(records).earned).toBe(719);
  return records;
}
test("719 to 720: actual final star unlocks the full outfit after replay, with save and mix-and-match @smoke",async({page},testInfo)=>{
  test.setTimeout(90000);
  await page.addInitScript(records=>{
    if(localStorage.getItem("mathssprites.campaign.v2")===null)
      localStorage.setItem("mathssprites.campaign.v2",JSON.stringify(records));
    localStorage.setItem("mathssprites.motion-preference.v1","reduced");
  },finalStarFixture());
  await page.goto("/");await open(page);
  const full=findCosmeticReward("grand-alchemist"),slots=Object.keys(full.loadout);
  await expect(page.locator("#atelier-stars")).toHaveText("719 / 720 ★");
  await expect(page.locator("#atelier-owned")).toHaveText("28 / 29 unlocked");
  await page.locator("#atelier-filter").selectOption("set");
  await reward(page,full.id).click();
  await expect(page.locator("#atelier-equip")).toBeDisabled();
  await expect(page.locator("#atelier-detail-status")).toContainText("1 more stars");
  for(const slot of slots)await expect(page.locator("#atelier-preview")).toHaveAttribute("data-sprite-"+slot,full.loadout[slot]);
  await expect(page.locator("body")).toHaveAttribute("data-sprite-headwear","original");
  await expect(page.locator("#reward-celebration")).toBeHidden();
  await page.locator("#atelier-back").click();
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="workshop"]').click();
  await page.locator('[data-map-stage="guided"]').click();
  await page.locator('[data-level="1"]').click();
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:25000});
  await expect(page.locator("#reward-celebration")).toBeHidden();
  await page.locator("#replay-skip").click();
  await expect(page.locator("#reward-celebration-names")).toContainText("The Grand Alchemist");
  await expect(page.locator("#reward-celebration")).toBeVisible();
  await page.locator("#replay-close").click();await page.locator("#game-levels").click();
  await page.locator(".site-nav-links [data-screen='atelier']").click();
  await expect(page.locator("#atelier-stars")).toHaveText("720 / 720 ★");
  await expect(page.locator("#atelier-owned")).toHaveText("29 / 29 unlocked");
  await expect(page.locator("#atelier-next-name")).toHaveText("Collection complete");
  await expect(page.locator("#atelier-next-copy")).toHaveText("All rewards unlocked");
  await page.locator("#atelier-filter").selectOption("set");
  await reward(page,full.id).click();
  await expect(page.locator("#atelier-equip")).toHaveText("Equip full set");
  await page.locator("#atelier-equip").click();
  await expect(page.locator("#atelier-equipped")).toContainText("The Grand Alchemist");
  for(const slot of slots)await expect(page.locator("body")).toHaveAttribute("data-sprite-"+slot,full.loadout[slot]);
  for(const side of ["black","white"]){
    for(const slot of ["headwear","eyewear","neckwear"])
      await expect(page.locator("#atelier-"+side+" .sprite-wear-"+slot)).toBeVisible();
    await expect(page.locator("#atelier-"+side+" .sprite-cosmetic-effect")).toBeVisible();
  }
  await testInfo.attach("grand-alchemist-atelier.png",{body:await page.screenshot({fullPage:true}),contentType:"image/png"});
  await page.reload();await open(page);
  await expect(page.locator("#atelier-equipped")).toContainText("The Grand Alchemist");
  await expect(page.locator("#reward-celebration")).toBeHidden();
  await page.locator("#atelier-filter").selectOption("fur");
  await reward(page,"silky-fur").click();await page.locator("#atelier-equip").click();
  await expect(page.locator("body")).toHaveAttribute("data-sprite-fur","silky-fur");
  await expect(page.locator("body")).toHaveAttribute("data-sprite-headwear","grand-alchemist-headwear");
  await page.locator("#atelier-filter").selectOption("set");
  await reward(page,full.id).click();await page.locator("#atelier-equip").click();
  expect((await snapshot(page)).equipped).toEqual(full.loadout);
  await page.locator("#atelier-restore").click();
  await expect(page.locator("#atelier-equipped")).toHaveText("Original appearance");
  await expect(page.locator("#atelier-stars")).toHaveText("720 / 720 ★");
  expect((await snapshot(page)).unlockedRewards).toEqual(COSMETIC_REWARDS.map(r=>r.id));
});
