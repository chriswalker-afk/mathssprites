import {openCampaignBoard,chooseCampaignStage,chooseCampaignWorld} from "./campaign-menu-helper.mjs";
import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});
test("a new learner explicitly chooses world and method before any level @quick @smoke",async({page})=>{
  await expect(page.locator("#home-play")).toBeHidden();
  const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  await page.locator("#home-choose-level").click();
  await expect(page.locator("#site-worlds")).toBeVisible();
  await expect(page.locator("#site-stages")).toBeHidden();
  await expect(page.locator("#site-levels")).toBeHidden();
  await expect(page.locator("#world-cards [data-world-stages]")).toHaveCount(4);
  await page.locator('[data-world-stages="workshop"]').click();
  await expect(page.locator("#site-stages")).toBeVisible();
  await expect(page.locator("#site-levels")).toBeHidden();
  await expect(page.locator("#world1-stage-cards [data-stage-open]")).toHaveCount(3);
  await expect(page.locator('[data-stage="guided"] .stage-tag')).toHaveText("Recommended start");
  await page.locator('[data-stage-open="guided"]').click();
  await expect(page.locator("#site-levels")).toBeVisible();
  await expect(page.locator(".level-tile")).toHaveCount(24);
  await expect(page.locator(".level-tile:disabled")).toHaveCount(0);
  expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))).toEqual(before);
  await page.locator('[data-level="18"]').click();
  await expect(page.locator("#selected-level-title")).toHaveText("The other way round");
  await expect(page.locator("#game-shell")).toBeHidden();
  expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))).toEqual(before);
  await page.locator("#board-continue").click();
  await expect(page.locator("#level-title")).toHaveText("The other way round");
  await page.locator("#game-levels").click();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","guided");
  await expect(page.locator('[data-level="18"]')).toBeEnabled();
});
test("all twelve world/method pairs open the correct board without writing progress @quick @smoke",async({page})=>{
  test.setTimeout(60000);
  const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  for(const world of ["workshop","opposites","fractions","squares"]){
    for(const [stage,count] of [["guided",24],["independent",20],["notebook",16]]){
      await page.locator('.site-nav-links [data-screen="worlds"]').click();
      await page.locator('[data-world-stages="'+world+'"]').click();
      await expect(page.locator("#site-stages")).toBeVisible();
      await expect(page.locator("#site-levels")).toBeHidden();
      await expect(page.locator("#site-stages")).toHaveAttribute("data-active-world",world);
      await page.locator('[data-stage-open="'+stage+'"]').click();
      await expect(page.locator("#site-levels")).toBeVisible();
      await expect(page.locator("#site-levels")).toHaveAttribute("data-active-world",world);
      await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage",stage);
      await expect(page.locator(".level-tile")).toHaveCount(count);
      await expect(page.locator(".level-tile:disabled")).toHaveCount(0);
      await expect(page.locator("#board-continue")).toBeDisabled();
      await page.locator("[data-level='1']").click();
      await expect(page.locator("#selected-level-title")).not.toBeEmpty();
      await expect(page.locator("#game-shell")).toBeHidden();
    }
  }
  expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))).toEqual(before);
});
test("returning learner resumes the actual world and method even after browsing other worlds @smoke",async({page})=>{
  await openCampaignBoard(page,"workshop","independent");
  await page.locator('[data-level="7"]').click();
  await page.locator("#board-continue").click();
  await expect(page.locator("#level-title")).toHaveText("Four-room rhythm");
  await page.locator("#game-home").click();
  await expect(page.locator("#home-play")).toHaveText("Continue: Balance · Independent · Level 7 →");
  const resume=await page.evaluate(()=>localStorage.getItem("mathssprites.resume.v2"));
  await openCampaignBoard(page,"squares","guided");
  await page.locator('.site-nav-links [data-screen="home"]').click();
  expect(await page.evaluate(()=>localStorage.getItem("mathssprites.resume.v2"))).toBe(resume);
  await page.reload();
  await expect(page.locator("#home-play")).toHaveText("Continue: Balance · Independent · Level 7 →");
  await page.locator("#home-play").click();
  await expect(page.locator("#level-title")).toHaveText("Four-room rhythm");
});
test("legacy progress and best stars migrate, remain on map, and legacy keys stay intact",async({page})=>{
  const saved={
    progress:JSON.stringify({completed:[1,2],lastPlayed:3}),
    stars:JSON.stringify({guided:{"1":1,"2":2},independent:{},notebook:{}}),
    resume:JSON.stringify({stage:"guided",number:3})
  };
  await page.evaluate(({progress,stars,resume})=>{
    localStorage.setItem("mathssprites.progress.v1",progress);
    localStorage.setItem("mathssprites.stars.v1",stars);
    localStorage.setItem("mathssprites.resume.v1",resume);
  },saved);
  await page.reload();
  await openCampaignBoard(page);
  await expect(page.locator('[data-level="1"] .tile-stars')).toHaveText("★★★");
  await expect(page.locator('[data-level="2"] .tile-stars')).toHaveText("★★☆");
  await expect(page.locator('[data-level="3"]')).toBeEnabled();
  await expect(page.locator("#level-progress")).toContainText("5 / 72 stars earned");
  await page.locator('[data-level="3"]').click();
  await page.locator("#board-continue").click();
  const v2=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(v2.worlds.workshop.stages.guided.completed).toEqual(["resident","clearing-02"]);
  expect(v2.worlds.workshop.stages.guided.bestMoves.resident).toBe(1);
  expect(await page.evaluate(()=>localStorage.getItem("mathssprites.stars.v1"))).toBe(saved.stars);
  expect(await page.evaluate(()=>localStorage.getItem("mathssprites.progress.v1"))).toBe(saved.progress);
});
test("single-screen level board stays reachable at 1024×720 and 1092×540 @smoke",async({page})=>{
  test.setTimeout(55000);
  for(const size of [{width:1024,height:720},{width:1092,height:540}]){
    await page.setViewportSize(size);
    await openCampaignBoard(page);
    await expect(page.locator(".campaign-path")).toBeVisible();
    // Six Guided chapters need internal chapter scrolling, not 24
    // unreadably short tiles in one fixed-height viewport.
    await page.locator('[data-level="20"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-level="20"]')).toBeInViewport();
    await expect(page.locator("#site-back")).toBeInViewport();
    const scroll=await page.evaluate(()=>({
      height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,
      viewportHeight:innerHeight,viewportWidth:innerWidth
    }));
    expect(scroll.height).toBeLessThanOrEqual(scroll.viewportHeight+3);
    expect(scroll.width).toBeLessThanOrEqual(scroll.viewportWidth+3);
    await page.screenshot({path:"artifacts/pr32-experiment-board-"+size.width+"x"+size.height+".png"});
    await page.locator("#site-back").click();
  }
});
