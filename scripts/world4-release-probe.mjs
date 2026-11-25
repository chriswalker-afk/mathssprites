/** Same real-browser release journeys run on localhost in CI and on the
 * public site after deployment. Only new browser contexts are used; no
 * existing learner's records are modified. */
import {expect} from "@playwright/test";
import {mkdirSync} from "node:fs";
import {CAMPAIGN_REGISTRY} from "../src/campaign-registry.mjs";
const localSaves=p=>p.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
export async function probeWorld4(page,url,{screenshots=false,log=()=>{}}={}){
  const errors=[];const onError=e=>errors.push(String(e));page.on("pageerror",onError);
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.addInitScript(()=>localStorage.setItem("mathssprites.motion-preference.v1","reduced"));
  const shot=async name=>{
    if(!screenshots)return;
    mkdirSync("artifacts",{recursive:true});await page.screenshot({path:"artifacts/world4-release-"+name+".png",fullPage:true});
  };
  try{
    const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
    expect(response?.ok()).toBe(true);
    await page.locator("#home-choose-level").click();
    let count=0;const ids=new Set();
    for(const world of CAMPAIGN_REGISTRY){
      await page.locator('[data-map-world="'+world.id+'"]').click();
      for(const stage of world.stages){
        await page.locator('[data-map-stage="'+stage.id+'"]').click();
        await expect(page.locator("#site-levels")).toHaveAttribute("data-active-world",world.id);
        await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage",stage.id);
        await expect(page.locator(".level-tile")).toHaveCount(stage.count);
        await expect(page.locator(".level-tile:disabled")).toHaveCount(0);
        await expect(page.locator("#level-progress")).toContainText("0 / "+stage.count*3+" stars");
        const actual=await page.locator(".level-tile").evaluateAll(a=>a.map(el=>el.dataset.levelId));
        expect(actual).toEqual(stage.levels.map(s=>s.id));
        for(const id of actual){expect(ids.has(id)).toBe(false);ids.add(id);}
        count+=actual.length;
        log(world.id+"/"+stage.id+": "+actual.length+" selectable levels");
        if(world.id==="squares")await shot(stage.id+"-board");
      }
    }
    expect(count).toBe(240);expect(ids.size).toBe(240);
    const before=await localSaves(page);
    // Board entry defaults to the Square Laboratory and preserves free-play
    // status across all three controllers, without credit or resume writes.
    await page.locator('#site-levels [data-screen="workshop"]').click();
    await expect(page.locator("#workshop-quantity-mode")).toHaveValue("squares");
    async function build(text,mode,goal="isolate"){
      await page.locator("#workshop-square-goal").selectOption(goal);
      await page.locator("#workshop-equation").fill(text);
      await page.locator("#workshop-hand-mode").selectOption(mode);
      await page.locator("#workshop-create").click();
      await expect(page.locator("#game-shell")).toBeVisible();
      await expect(page.locator("#chapter-status")).toContainText("NO CAMPAIGN PROGRESS");
    }
    async function finishComic(expected,draft){
      await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:25000});
      await page.locator("#replay-skip").click();
      await expect(page.locator("#pencil-lines")).toContainText(expected);
      await expect(page.locator("#replay-star-summary")).toBeHidden();
      await page.locator("#next-level").click();
      await expect(page.locator("#site-workshop")).toBeVisible();
      await expect(page.locator("#workshop-equation")).toHaveValue(draft);
      expect(await localSaves(page)).toEqual(before);
    }
    await build("x²=25","auto");
    await page.locator('.operation-picker [data-operation="sqrt"]').click();
    await page.locator("#do-both").click();
    await finishComic("x = 5","x²=25");
    log("Guided custom principal root and comic; no campaign writes");
    await page.setViewportSize({width:390,height:844});
    await build("x²=9","manual");
    await page.locator('.operation-picker [data-operation="sqrt"]').click();
    await page.locator("#right-action").click();
    await expect(page.locator("#reset")).toBeEnabled({timeout:25000});
    await expect(page.locator("#right-items .weight")).toHaveCount(3);
    await expect(page.locator("#left-items .sprite-square")).toHaveCount(1);
    await expect(page.locator("#left-action")).toBeDisabled();
    await shot("phone-manual-pending");
    await page.locator('.operation-picker [data-operation="sqrt"]').click();
    await page.locator("#left-action").click();
    await finishComic("x = 3","x²=9");
    log("Independent phone root with fresh matching selection; no campaign writes");
    await build("x+1=4","notebook","area");
    await expect(page.locator("#notebook-workspace")).toBeVisible();
    await expect(page.locator("#scene")).toBeHidden();
    await page.locator('[data-notebook-area-operation="square"]').click();
    await expect(page.locator("#notebook-result-math")).toHaveAttribute("aria-label","x² + 2x + 1 = 16");
    await page.locator("#notebook-apply").click();
    await expect(page.locator("#notebook-replay")).toBeEnabled();
    expect(await localSaves(page)).toEqual(before);
    await shot("phone-paper");
    await page.locator("#notebook-replay").click();
    await expect(page.locator("#notebook-next")).toBeVisible({timeout:35000});
    await expect(page.locator("#left-items .sprite-square")).toHaveCount(1);
    await expect(page.locator("#left-items .sprite-black")).toHaveCount(2);
    await expect(page.locator("#left-items .weight")).toHaveCount(1);
    await expect(page.locator("#right-items .weight")).toHaveCount(16);
    await expect(page.locator("#notebook-playback-message")).toContainText("no stars awarded");
    await shot("phone-paper-replayed");
    await page.locator("#notebook-next").click();
    await expect(page.locator("#workshop-square-goal")).toHaveValue("area");
    await expect(page.locator("#workshop-hand-mode")).toHaveValue("notebook");
    await expect(page.locator("#workshop-equation")).toHaveValue("x+1=4");
    expect(await localSaves(page)).toEqual(before);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    log("Apprentice phone whole-expression square and exact replay; draft and records preserved");
    expect(errors).toEqual([]);
    log("No uncaught page errors");
  }finally{page.off("pageerror",onError);}
}
