import {openCampaignBoard} from "../e2e/campaign-menu-helper.mjs";
/** Verify the currently published cosmetic release, not a localhost build
 * or a diagnostic's stale response. No real learner data is accessed. */
import {chromium,expect} from "@playwright/test";
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {setTimeout as pause} from "node:timers/promises";
import {COSMETIC_REWARDS,findCosmeticReward,originalAppearance,cosmeticCollection} from "../src/cosmetic-catalog.mjs";
import {rewardArtReady} from "../src/atelier-model.mjs";
import {IMPLEMENTED_CHAMBER_THEMES} from "../src/chamber-themes.mjs";
import {CAMPAIGN_REGISTRY} from "../src/campaign-registry.mjs";
import {blankCampaignRecords,campaignStarTotals} from "../src/campaign-records.mjs";
import {clickWithReferenceMove} from "../e2e/reference-move-helper.mjs";
const url=process.env.SPRITES_RELEASE_URL||"https://balance.mrwalkermaths.com/";
const revision=process.env.GITHUB_SHA||"manual";
const result={url,revision,checks:[],errors:[]};
const note=message=>{result.checks.push(message);console.log(message);};
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const files=[...IMPLEMENTED_CHAMBER_THEMES.map(id=>"assets/chambers/"+id+".svg"),"src/chamber-themes.mjs","src/chamber-themes.css","index.html","src/site.mjs","src/campaign-path.css","src/navigation-journey.mjs","src/laboratory-cosmetics.mjs","src/weight-materials.css","src/weight-effects.css","src/weight-shapes.css","src/weight-shapes.mjs","src/fraction-weights.mjs","src/fraction-choreography.mjs","src/cosmetic-catalog.mjs","src/cosmetic-rewards.mjs","src/atelier-model.mjs",
  "src/sprite-atelier.mjs","src/sprite-atelier.css","src/sprite-cosmetics.mjs","src/sprite-cosmetics.css",
  "src/sprite-wearables.css","src/sprite-effects.css","src/reward-celebration.mjs","src/reward-celebration.css",
  "src/fraction-campaign.mjs","src/fraction-sprites.mjs","src/fraction-balance.mjs","src/square-sprites.mjs",
  "sprite-cosmetic-preview.html","src/sprite-cosmetic-preview.mjs"];
const expected=new Map(files.map(f=>[f,read(f)]));
const saves=p=>p.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
const outfit=findCosmeticReward("grand-alchemist").loadout;
const slotKeys=Object.keys(outfit);
const profileKey="mathssprites.cosmetics.v1";
const shot=async(p,name)=>p.screenshot({path:"artifacts/cosmetic-release-"+name+".png",fullPage:true});
const reward=(p,id)=>p.locator('[data-reward-id="'+id+'"]');
const revisionMatch=read("src/fraction-campaign.mjs").match(/FRACTION_PRESENTATION_REVISION="([^"]+)"/);
if(!revisionMatch)throw Error("Could not determine fraction presentation revision");
function fixture(){
  const records=blankCampaignRecords();
  for(const world of CAMPAIGN_REGISTRY)for(const stage of world.stages)for(const slot of stage.levels){
    const optimum=stage.optimalMoves[slot.id];
    if(!world.available||!stage.available||!slot.available||!optimum)continue;
    const r=records.worlds[world.id].stages[stage.id];
    r.completed.push(slot.id);
    r.bestMoves[slot.id]=optimum+(world.id==="workshop"&&stage.id==="guided"&&slot.number===1?1:0);
    if(slot.level.contentRevision>1)r.completedRevisions[slot.id]=slot.level.contentRevision;
  }
  if(campaignStarTotals(records).earned!==719)throw Error("Expected 719-star test fixture");
  return records;
}
mkdirSync("artifacts",{recursive:true});
let browser;
try{
  const deadline=Date.now()+(process.argv.includes("--wait")?180000:0);
  let missing;
  do{
    missing=(await Promise.all(files.map(async f=>{
      try{
        const target=new URL(f,url);target.searchParams.set("release",revision+"-"+Date.now());
        const res=await fetch(target,{cache:"no-store",signal:AbortSignal.timeout(10000)});
        return res.ok&&(await res.text())===expected.get(f)?null:f;
      }catch{return f;}
    }))).filter(Boolean);
    if(!missing.length||Date.now()>=deadline)break;
    console.log("Waiting for published release bytes: "+missing.join(", "));
    await pause(5000);
  }while(Date.now()<deadline);
  if(missing.length)throw Error("Published files differ from checkout: "+missing.join(", "));
  note("All "+files.length+" cosmetic/renderer entrypoint assets match checkout");
  browser=await chromium.launch({channel:"chrome",headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:"reduce"});
  const page=await context.newPage();
  page.on("pageerror",error=>result.errors.push(String(error)));
  // Also validate the exact versioned dependencies actually requested by
  // this browser, not just individually cache-busted diagnostics.
  const responses=[],requested=new Set();
  page.on("requestfailed",req=>{
    if(new URL(req.url()).origin===new URL(url).origin&&req.failure()?.errorText!=="net::ERR_ABORTED")result.errors.push("Request failed: "+req.url()+" "+req.failure()?.errorText);
  });
  page.on("response",res=>{
    const u=new URL(res.url());
    if(u.origin!==new URL(url).origin)return;
    const basePath=new URL(url).pathname;
    const f=u.pathname.startsWith(basePath)?u.pathname.slice(basePath.length):u.pathname.slice(1);
    if(expected.has(f)&&res.status()>=400)result.errors.push("Asset response "+res.status()+": "+f+u.search);
    if(expected.has(f)&&res.status()===200){requested.add(f);responses.push(res.text().then(body=>{
      if(body!==expected.get(f))result.errors.push("Browser loaded stale asset: "+f+u.search);
    }).catch(error=>result.errors.push("Could not inspect "+f+": "+error)));}
  });
  await context.addInitScript(records=>{
    if(localStorage.getItem("mathssprites.campaign.v2")===null)localStorage.setItem("mathssprites.campaign.v2",JSON.stringify(records));
    localStorage.setItem("mathssprites.motion-preference.v1","reduced");
  },fixture());
  await page.goto(url,{waitUntil:"domcontentloaded"});
  await page.locator("#home-atelier").click();
  await expect(page.locator("#atelier-stars")).toHaveText("719 / 720 ★");
  await expect(page.locator("#atelier-owned")).toHaveText("56 / 57 unlocked");
  await expect(page.locator("#atelier-collection .atelier-reward")).toHaveCount(57);
  expect(COSMETIC_REWARDS.every(r=>rewardArtReady(r))).toBe(true);
  await expect(page.locator("#atelier-collection [data-status$='coming']")).toHaveCount(0);
  const before=await saves(page);
  await page.locator("#atelier-filter").selectOption("set");
  await reward(page,"grand-alchemist").click();
  await expect(page.locator("#atelier-equip")).toBeDisabled();
  for(const slot of slotKeys)await expect(page.locator("#atelier-preview")).toHaveAttribute("data-sprite-"+slot,outfit[slot]);
  expect(await saves(page)).toEqual(before);
  await shot(page,"locked-preview");
  note("Live 57-reward Atelier; locked 720-star outfit can be tried on without writes");
  await page.locator("#atelier-back").click();
  await openCampaignBoard(page,"workshop","guided");
  await page.locator('[data-level="1"]').click();
  if(await page.locator("#selected-level-details").isVisible())await page.locator("#board-continue").click();
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#replay-star-summary")).toContainText("3 stars",{timeout:25000});
  await expect(page.locator("#reward-celebration")).toBeHidden();
  await page.locator("#replay-skip").click();
  await expect(page.locator("#reward-celebration-names")).toContainText("The Grand Alchemist");
  await expect(page.locator("#reward-celebration")).toBeVisible();
  await shot(page,"final-star");
  await page.locator("#replay-close").click();await page.locator("#game-levels").click();
  await page.locator(".site-nav-links [data-screen='atelier']").click();
  await expect(page.locator("#atelier-stars")).toHaveText("720 / 720 ★");
  await expect(page.locator("#atelier-owned")).toHaveText("57 / 57 unlocked");
  await page.locator("#atelier-filter").selectOption("set");
  await reward(page,"grand-alchemist").click();
  await page.locator("#atelier-equip").click();
  expect(JSON.parse((await saves(page))[profileKey]).equipped).toEqual({...originalAppearance(),...outfit});
  await shot(page,"complete-desktop");
  await page.locator('[data-atelier-collection="weights"]').click();
  await reward(page,"blue-enamel").click();
  await expect(page.locator("#atelier-preview")).toHaveAttribute("data-weight-material","blue-enamel");
  await page.locator("#atelier-equip").click();
  await expect(page.locator("body")).toHaveAttribute("data-weight-material","blue-enamel");
  await shot(page,"blue-enamel");
  await reward(page,"dumbbell").click();
  await expect(page.locator("#atelier-preview")).toHaveAttribute("data-weight-shape","dumbbell");
  await page.locator("#atelier-equip").click();
  await expect(page.locator("body")).toHaveAttribute("data-weight-shape","dumbbell");
  await shot(page,"blue-dumbbell");
  await reward(page,"golden-halo").click();
  await expect(page.locator("#atelier-preview")).toHaveAttribute("data-weight-effect","golden-halo");
  await page.locator("#atelier-equip").click();
  await expect(page.locator("body")).toHaveAttribute("data-weight-effect","golden-halo");
  await expect(page.locator("#atelier-weight-fraction .fw-weight-effect").first()).toHaveCSS("animation-name","none");
  await shot(page,"blue-dumbbell-golden-halo");
  await page.locator('[data-atelier-collection="chambers"]').click();
  const beforeThemes=await saves(page);
  for(const id of IMPLEMENTED_CHAMBER_THEMES){
    await reward(page,id).click();
    await expect(page.locator("#atelier-preview")).toHaveAttribute("data-chamber-theme",id);
    const mini=page.locator(".atelier-mini-room").first();
    await expect(mini).toHaveCSS("background-image",new RegExp(id+"\\.svg"));
    const loaded=await mini.evaluate(async el=>{
      const match=getComputedStyle(el).backgroundImage.match(/url\("([^"]+)"\)/);
      if(!match)return false;
      const img=new Image();img.src=match[1];
      try{await img.decode();return img.naturalWidth===480&&img.naturalHeight===320;}catch{return false;}
    });
    expect(loaded).toBe(true);
  }
  expect(await saves(page)).toEqual(beforeThemes);
  await reward(page,"astral-sanctuary").click();
  await expect(page.locator("#atelier-preview")).toHaveAttribute("data-chamber-theme","astral-sanctuary");
  await expect(page.locator(".atelier-mini-room").first()).toHaveCSS("background-image",/astral-sanctuary\.svg/);
  await page.locator("#atelier-equip").click();
  await expect(page.locator("body")).toHaveAttribute("data-chamber-theme","astral-sanctuary");
  await shot(page,"astral-sanctuary-gallery");
  await page.reload();await page.locator("#home-atelier").click();
  await expect(page.locator("#atelier-equipped")).toContainText("The Grand Alchemist");
  await expect(page.locator("#reward-celebration")).toBeHidden();
  await page.setViewportSize({width:375,height:812});
  await expect(page.locator("#atelier-black .sprite-wear-headwear")).toBeVisible();
  await expect(page.locator("#atelier-white .sprite-wear-headwear")).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await shot(page,"complete-phone");
  note("All 57 artworks ready; all ten chamber images decode; real final star, replay-gated celebration, equipment persistence, desktop and phone");
  await page.setViewportSize({width:1280,height:720});
  const saved=await saves(page);
  const custom=async(equation,world)=>{
    const target=new URL(url);target.searchParams.set("workshop",equation);
    target.searchParams.set("workshopWorld",world);target.searchParams.set("workshopMode","auto");
    await page.goto(target.href,{waitUntil:"domcontentloaded"});await page.locator("#workshop-create").click();
  };
  await custom("3x-2x+3-5=6","signed");
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(3);
  await expect(page.locator("#left-chamber .room-interior")).toHaveCSS("background-image",/astral-sanctuary\.svg/);
  await expect(page.locator("#right-chamber .room-interior")).toHaveCSS("background-image",/astral-sanctuary\.svg/);
  await expect(page.locator("#left-items .sprite-white")).toHaveCount(2);
  await expect(page.locator("#left-items .sprite-white .sprite-wear-headwear").first()).toBeVisible();
  await shot(page,"signed");
  await page.locator('[data-pair-side="left"][data-pair-type="sprites"]').click();
  await expect(page.locator("#left-items .sprite-white")).toHaveCount(0,{timeout:20000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await custom("x+2/3=4+2/3","fractions");
  const host=page.locator("#fraction-game-host"),lab=host.locator("#fraction-lab");
  await expect(host).toHaveAttribute("data-presentation-revision",revisionMatch[1]);
  await expect(host).toHaveAttribute("data-styles","ready");
  await expect(lab).toHaveAttribute("data-weight-material","blue-enamel");
  await expect(lab).toHaveAttribute("data-weight-shape","dumbbell");
  await expect(lab).toHaveAttribute("data-weight-effect","golden-halo");
  await expect(lab).toHaveAttribute("data-chamber-theme","astral-sanctuary");
  await expect(lab.locator("#left-chamber .room-interior")).toHaveCSS("background-image",/astral-sanctuary\.svg/);
  await expect(lab.locator("#right-chamber .room-interior")).toHaveCSS("background-image",/astral-sanctuary\.svg/);
  await expect(lab.locator("#left-items .fw-weight-effect")).toHaveCount(2);
  await expect(lab.locator("#left-items .fw-weight-effect").first()).toHaveCSS("display","inline");
  await expect(lab.locator("#left-items .fw-weight-effect").first()).toHaveCSS("animation-name","none");
  await expect(lab.locator("#left-items .fw-effect-rim").first()).toHaveCSS("stroke","rgb(255, 233, 163)");
  await expect(lab.locator("#left-items .fw-assembly[data-shape='dumbbell']")).toHaveCount(1);
  await expect(lab.locator("#left-items .fw-material-light")).toHaveCSS("stop-color","rgb(169, 217, 244)");
  await expect(lab.locator("#left-items .fs-whole-actor")).toHaveCount(1);
  for(const slot of slotKeys)await expect(lab).toHaveAttribute("data-sprite-"+slot,outfit[slot]);
  await expect(lab.locator("#left-items .fs-whole-actor .sprite-wear-headwear")).toBeVisible();
  await expect(lab.locator("#left-items .fw-label")).toHaveText("2/3");
  await shot(page,"fraction-desktop");
  await custom("48x=48","fractions");
  for(const size of [{width:1280,height:720},{width:360,height:640}]){
    await page.setViewportSize(size);
    await expect(lab.locator("#left-items .fs-whole-actor")).toHaveCount(48);
    await expect(lab.locator("#left-items .fs-piece")).toHaveCount(0);
    await expect(lab.locator("#right-items .fw-pile-weight")).toHaveCount(48);
    await expect(lab.locator("#left-items .fb-room-floor")).toHaveAttribute("data-wrap","true");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await shot(page,"crowded-"+size.width);
  }
  expect(await saves(page)).toEqual(saved);
  await page.setViewportSize({width:1280,height:720});
  await custom("x²=25","squares");
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(1);
  await expect(page.locator("#left-items .sprite-square .sprite-wear-headwear")).toBeVisible();
  await expect(page.locator("#left-items .sprite-square .sprite-body")).toHaveCSS("border-top-left-radius","7px");
  await shot(page,"square");
  expect(await saves(page)).toEqual(saved);
  note("Full outfit in signed cancellation, exact fractions, 48-object crowded rooms and square workshop; no free-play credit");
  await page.goto(url,{waitUntil:"domcontentloaded"});await page.locator("#home-atelier").click();
  await page.locator("#atelier-restore").click();
  await expect(page.locator("#atelier-equipped")).toHaveText("Original appearance");
  await expect(page.locator("#atelier-stars")).toHaveText("720 / 720 ★");
  await page.locator('[data-atelier-collection="weights"]').click();
  await page.locator("#atelier-restore").click();
  await expect(page.locator("body")).toHaveAttribute("data-weight-material","original");
  await expect(page.locator("body")).toHaveAttribute("data-weight-shape","original");
  await expect(page.locator("body")).toHaveAttribute("data-weight-effect","original");
  await expect(page.locator("body")).toHaveAttribute("data-chamber-theme","astral-sanctuary");
  await page.locator('[data-atelier-collection="chambers"]').click();
  await page.locator("#atelier-restore").click();
  await expect(page.locator("body")).toHaveAttribute("data-chamber-theme","original");
  const restored=JSON.parse((await saves(page))[profileKey]);
  expect(restored.unlockedRewards).toEqual(COSMETIC_REWARDS.map(r=>r.id));
  expect(Object.values(restored.equipped).every(v=>v===null)).toBe(true);
  await Promise.all(responses);
  for(const f of ["src/site.mjs","src/cosmetic-rewards.mjs","src/laboratory-cosmetics.mjs","src/chamber-themes.css","src/fraction-campaign.mjs","src/fraction-weights.mjs",...IMPLEMENTED_CHAMBER_THEMES.map(id=>"assets/chambers/"+id+".svg")])expect(requested.has(f),"Browser actually loaded "+f).toBe(true);
  expect(result.errors).toEqual([]);
  note("Restore preserves stars and entitlements; versioned browser assets match and no uncaught errors");
  await context.close();
}catch(error){result.errors.push(String(error));process.exitCode=1;}
finally{
  if(browser)await browser.close();
  console.log(JSON.stringify(result,null,2));
  writeFileSync("artifacts/live-cosmetic-release.json",JSON.stringify(result,null,2));
}
