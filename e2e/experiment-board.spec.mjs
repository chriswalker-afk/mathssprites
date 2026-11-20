import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});
test("new student enters any guided level in two clicks, not four @quick @smoke",async({page})=>{
  await expect(page.locator("#home-stage-shortcuts .home-stage-quick")).toHaveCount(3);
  await page.getByRole("button",{name:"Choose a level"}).click();
  await expect(page.locator("#site-levels")).toBeVisible();
  await expect(page.locator(".map-world-button")).toHaveCount(4);
  await expect(page.locator(".map-stage-button")).toHaveCount(3);
  await expect(page.locator(".level-tile")).toHaveCount(20);
  await expect(page.locator(".level-tile:disabled")).toHaveCount(0);
  await expect(page.locator('[data-map-world="opposites"]')).toBeEnabled();
  await expect(page.locator('[data-map-world="fractions"]')).toBeDisabled();
  await expect(page.locator('[data-map-world="squares"]')).toBeDisabled();
  await page.locator('[data-level="18"]').click();
  await expect(page.locator("#level-title")).toHaveText("The other way round");
  await page.locator("#game-levels").click();
  await expect(page.locator("#site-levels")).toBeVisible();
  await expect(page.locator('[data-level="18"]')).toBeEnabled();
  await expect(page.locator('[data-map-stage="guided"]')).toHaveAttribute("aria-pressed","true");
});
test("switch between all three learning modes without leaving Experiment Board @quick @smoke",async({page})=>{
  await page.getByRole("button",{name:"Choose a level"}).click();
  await page.locator('[data-map-stage="independent"]').click();
  await expect(page.locator('[data-map-stage="independent"]')).toHaveAttribute("aria-pressed","true");
  await expect(page.locator(".level-tile")).toHaveCount(16);
  await expect(page.locator(".chapter-group")).toHaveCount(4);
  await expect(page.locator("#levels-stage-title")).toHaveText("Independent Balance");
  await page.locator('[data-map-stage="notebook"]').click();
  await expect(page.locator(".level-tile")).toHaveCount(12);
  await expect(page.locator(".chapter-group")).toHaveCount(3);
  await page.locator('[data-level="6"]').click();
  await expect(page.locator("#notebook-workspace")).toBeVisible();
  await page.locator("#game-levels").click();
  await expect(page.locator('[data-map-stage="notebook"]')).toHaveAttribute("aria-pressed","true");
  await expect(page.locator('[data-level="6"]')).toBeEnabled();
  await page.locator("#site-back").click();
  await expect(page.locator("#site-home")).toBeVisible();
  await expect(page.locator("#home-play")).toContainText("Continue Stage 3 · Level 6");
});
test("one-click Home shortcuts remember last level IN EACH stage @smoke",async({page})=>{
  await page.getByRole("button",{name:"Choose a level"}).click();
  await page.locator('[data-map-stage="independent"]').click();
  await page.locator('[data-level="7"]').click();
  await expect(page.locator("#level-title")).toHaveText("Four-room rhythm");
  await page.locator("#game-home").click();
  await expect(page.locator('[data-home-stage="independent"]')).toContainText("Level 7");
  await page.locator('[data-home-stage="guided"]').click();
  await expect(page.locator("#level-title")).toHaveText("One little resident");
  await page.locator("#game-home").click();
  await page.locator('[data-home-stage="independent"]').click();
  await expect(page.locator("#level-title")).toHaveText("Four-room rhythm");
  const v2=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(v2.worlds.workshop.stages.independent.lastPlayed).toBe("independent-07");
  expect(v2.worlds.workshop.stages.guided.lastPlayed).toBe("resident");
  const resume=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.resume.v2")));
  expect(resume).toEqual({worldId:"workshop",stageId:"independent",levelId:"independent-07"});
  await page.reload();
  await expect(page.locator("#home-play")).toContainText("Continue Stage 2 · Level 7");
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
  await page.getByRole("button",{name:"Choose a level"}).click();
  await expect(page.locator('[data-level="1"] .tile-stars')).toHaveText("★★★");
  await expect(page.locator('[data-level="2"] .tile-stars')).toHaveText("★★☆");
  await expect(page.locator('[data-level="3"]')).toBeEnabled();
  await expect(page.locator("#level-progress")).toContainText("5 / 60 stars earned");
  await page.locator('[data-level="3"]').click();
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
    await page.getByRole("button",{name:"Choose a level"}).click();
    await expect(page.locator("#map-stage-tabs")).toBeVisible();
    await expect(page.locator("#map-world-tabs")).toBeVisible();
    await expect(page.locator('[data-level="20"]')).toBeInViewport();
    await expect(page.locator('[data-map-stage="notebook"]')).toBeInViewport();
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
