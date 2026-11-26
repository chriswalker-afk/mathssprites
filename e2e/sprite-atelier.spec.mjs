import {CAMPAIGN_REGISTRY} from "../src/campaign-registry.mjs";
import {blankCampaignRecords,campaignStarTotals} from "../src/campaign-records.mjs";
import {COSMETIC_REWARDS,findCosmeticReward,originalAppearance} from "../src/cosmetic-catalog.mjs";
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
  await expect(page.locator("#atelier-owned")).toHaveText("4 / 57 unlocked");
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
  expect(saved.unlockedRewards).toEqual(["curious-eyes","polished-steel","extra-fluffy","dumbbell"]);
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
  await expect(page.locator("#atelier-owned")).toHaveText("56 / 57 unlocked");
  await page.locator("#atelier-filter").selectOption("set");
  await reward(page,full.id).click();
  await expect(page.locator("#atelier-equip")).toBeDisabled();
  await expect(page.locator("#atelier-detail-status")).toContainText("1 more star");
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
  await expect(page.locator("#atelier-owned")).toHaveText("57 / 57 unlocked");
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
  expect((await snapshot(page)).equipped).toEqual({...originalAppearance(),...full.loadout});
  await page.locator("#atelier-restore").click();
  await expect(page.locator("#atelier-equipped")).toHaveText("Original appearance");
  await expect(page.locator("#atelier-stars")).toHaveText("720 / 720 ★");
  expect((await snapshot(page)).unlockedRewards).toEqual(COSMETIC_REWARDS.map(r=>r.id));
});

test("the complete Atelier has three independent collections and no preview save writes @quick @smoke",async({page},testInfo)=>{
  await legacyStars(page,4);
  await page.goto("/");await open(page);
  const before=await saves(page);
  await expect(page.locator("#atelier-owned")).toHaveText("4 / 57 unlocked");
  const tab=key=>page.locator('[data-atelier-collection="'+key+'"]');
  await expect(tab("sprites")).toHaveAttribute("aria-pressed","true");
  await expect(visibleRewards(page)).toHaveCount(29);
  await tab("weights").click();
  await expect(tab("weights")).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("#atelier-preview")).toHaveAttribute("data-preview-type","weights");
  await expect(page.locator(".atelier-weight-stage .weight")).toBeVisible();
  await expect(visibleRewards(page)).toHaveCount(18);
  await page.locator("#atelier-filter").selectOption("weight-material");
  await expect(visibleRewards(page)).toHaveCount(7);
  await reward(page,"polished-steel").click();
  await expect(reward(page,"polished-steel")).toHaveAttribute("data-status","available");
  await expect(page.locator("#atelier-equip")).toBeEnabled();
  await expect(page.locator("#atelier-preview")).toHaveAttribute("data-weight-material","polished-steel");
  await page.locator("#atelier-filter").selectOption("weight-shape");
  await reward(page,"dumbbell").click();
  await expect(reward(page,"dumbbell")).toHaveAttribute("data-status","available");
  await expect(page.locator("#atelier-equip")).toBeEnabled();
  await expect(page.locator("#atelier-preview")).toHaveAttribute("data-weight-shape","dumbbell");
  await page.locator("#atelier-owned-only").check();
  await expect(visibleRewards(page)).toHaveCount(1);
  await tab("chambers").click();
  await expect(page.locator("#atelier-empty")).toBeVisible();
  await page.locator("#atelier-owned-only").uncheck();
  await expect(visibleRewards(page)).toHaveCount(10);
  await expect(page.locator("#atelier-collection [data-status$='coming']")).toHaveCount(0);
  await expect(page.locator(".atelier-chamber-stage")).toBeVisible();
  await reward(page,"clockmakers-workshop").click();
  await expect(page.locator("#atelier-preview")).toHaveAttribute("data-chamber-theme","clockmakers-workshop");
  await expect(reward(page,"clockmakers-workshop").locator(".atelier-chamber-thumbnail")).toBeVisible();
  await expect(page.locator("#atelier-equip")).toBeDisabled();
  await expect(page.locator("#atelier-detail-status")).toContainText("12 more stars");
  await tab("sprites").click();
  await expect(visibleRewards(page)).toHaveCount(29);
  await expect(page.locator("#atelier-preview-label")).toHaveText("Equipped appearance");
  expect(await saves(page)).toEqual(before);
  for(const [width,height] of [[1092,540],[375,812]]){
    await page.setViewportSize({width,height});
    for(const key of ["weights","chambers"]){
      await tab(key).click();
      await expect(page.locator("#atelier-preview")).toHaveAttribute("data-preview-type",key);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
      await testInfo.attach("atelier-"+key+"-"+width+".png",{body:await page.screenshot({fullPage:true}),contentType:"image/png"});
    }
  }
});

test("all seven material swatches and exact fractional previews match; locked try-on never writes saves @quick @smoke",async({page},testInfo)=>{
  await legacyStars(page,4);await page.goto("/");await open(page);
  await page.locator('[data-atelier-collection="weights"]').click();
  await page.locator("#atelier-filter").selectOption("weight-material");
  const preview=page.locator("#atelier-preview"),whole=preview.locator(".atelier-weight-stage .weight"),fraction=preview.locator("#atelier-weight-fraction");
  const measure=el=>el.evaluate(el=>{const c=getComputedStyle(el);return {width:c.width,height:c.height,clip:c.clipPath,background:c.backgroundImage};});
  const baseline=await measure(whole),before=await saves(page),colors=[];
  const cuts=await fraction.locator(".fw-cut-edge").evaluateAll(els=>els.map(el=>el.getAttribute("points")));
  for(const id of ["polished-steel","copper","blue-enamel","gold","jade-enamel","cast-iron","violet-enamel"]){
    await reward(page,id).click();
    await expect(preview).toHaveAttribute("data-weight-material",id);
    await expect(reward(page,id).locator(".atelier-thumb .weight")).toBeVisible();
    const variant=await measure(whole);
    expect(variant.width).toBe(baseline.width);expect(variant.height).toBe(baseline.height);expect(variant.clip).toBe(baseline.clip);
    expect(variant.background).not.toBe(baseline.background);
    const light=await fraction.locator(".fw-material-light").evaluate(el=>getComputedStyle(el).stopColor);
    expect(variant.background).toContain(light);colors.push(light);
    expect(await fraction.locator(".fw-cut-edge").evaluateAll(els=>els.map(el=>el.getAttribute("points")))).toEqual(cuts);
    await expect(fraction.locator(".fw-label")).toHaveText("2/3");
    await expect(fraction.locator(".fw-piece")).toHaveCount(2);
    await expect(page.locator("body")).toHaveAttribute("data-weight-material","original");
    if(id!=="polished-steel")await expect(page.locator("#atelier-equip")).toBeDisabled();
    await testInfo.attach("weight-"+id+".png",{body:await preview.screenshot(),contentType:"image/png"});
  }
  expect(new Set(colors).size).toBe(7);expect(await saves(page)).toEqual(before);
  await reward(page,"polished-steel").click();await page.locator("#atelier-equip").click();
  await expect(page.locator("body")).toHaveAttribute("data-weight-material","polished-steel");
  await expect(page.locator("#atelier-equipped")).toContainText("Polished steel");
  await page.locator("#atelier-back").click();await page.reload();await open(page);
  await page.locator('[data-atelier-collection="weights"]').click();
  await expect(page.locator("#atelier-weight-finish")).toContainText("Polished steel");
  await page.locator("#atelier-restore").click();
  await expect(page.locator("body")).toHaveAttribute("data-weight-material","original");
  expect((await snapshot(page)).equipped["weight-material"]).toBeNull();
  expect((await snapshot(page)).unlockedRewards).toEqual(["curious-eyes","polished-steel","extra-fluffy","dumbbell"]);
});
