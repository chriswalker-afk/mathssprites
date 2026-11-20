import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
});
async function board(page,stage="guided"){
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="opposites"]').click();
  if(stage!=="guided")await page.locator('[data-map-stage="'+stage+'"]').click();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-world","opposites");
}
test("World 2 has its own moonlit doorway, discovery stages and all 48 experiments @quick @smoke",async({page})=>{
  await page.locator('.site-nav-links [data-screen="worlds"]').click();
  await expect(page.locator(".world-ready")).toHaveCount(2);
  await expect(page.locator(".world-planned")).toHaveCount(2);
  await page.locator('[data-world-stages="opposites"]').click();
  await expect(page.locator("#site-stages")).toHaveAttribute("data-active-world","opposites");
  await expect(page.locator("#stages-world-kicker")).toContainText("WORLD 02");
  await expect(page.locator("#world1-workshop")).toBeHidden();
  await expect(page.locator(".stage-card")).toHaveCount(3);
  await expect(page.locator('.stage-card[data-stage="guided"]')).toContainText("0 of 20 complete");
  await expect(page.locator('.stage-card[data-stage="independent"]')).toContainText("0 of 16 complete");
  await expect(page.locator('.stage-card[data-stage="notebook"]')).toContainText("0 of 12 complete");
  await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
  await expect(page.locator(".level-tile")).toHaveCount(20);
  await expect(page.locator(".chapter-group")).toHaveCount(5);
  await expect(page.locator("#board-continue")).toHaveText("Play Level 1 →");
  await page.locator('[data-map-stage="independent"]').click();
  await expect(page.locator(".level-tile")).toHaveCount(16);
  await expect(page.locator(".chapter-group")).toHaveCount(4);
  await page.locator('[data-map-stage="notebook"]').click();
  await expect(page.locator(".level-tile")).toHaveCount(12);
  await expect(page.locator(".chapter-group")).toHaveCount(3);
  await expect(page.locator('[data-map-world="fractions"]')).toBeDisabled();
  await expect(page.locator('[data-map-world="squares"]')).toBeDisabled();
  await page.screenshot({path:"artifacts/pr36-opposites-board-1280.png",fullPage:true});
});
test("signed Guided level makes the balloon-weight zero pair, saves World 2 stars @smoke",async({page})=>{
  test.setTimeout(60000);
  await board(page);
  await page.locator("#board-continue").click();
  await expect(page.locator("#level-title")).toHaveText("One rising balloon");
  await expect(page.locator("#chapter-status")).toContainText("WORLD 2 · STAGE 1");
  await expect(page.locator("#left-items .balloon")).toHaveCount(1);
  await expect(page.locator('[data-kind="negOne"]')).toBeVisible();
  await expect(page.locator('[data-kind="negX"]')).toBeVisible();
  await expect(page.locator('[data-kind="posX2"]')).toBeHidden();
  await expect(page.locator('[data-operation="square"]')).toBeHidden();
  await expect(page.locator('#game-guide-restart')).toBeVisible();
  await expect(page.locator("#guide-message")).toContainText("Balloons");
  await page.locator("#guide-skip").click();
  await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:30000});
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(save.worlds.opposites.stages.guided.completed).toContain("op-g-01");
  expect(save.worlds.workshop.stages.guided.completed).toEqual([]);
  await page.screenshot({path:"artifacts/pr36-opposites-guided-zero-pair.png"});
});
test("signed Independent requires two separate matched room actions @smoke",async({page})=>{
  test.setTimeout(60000);
  await board(page,"independent");
  await page.locator('[data-level="1"]').click();
  await expect(page.locator("#chapter-status")).toContainText("WORLD 2 · STAGE 2");
  await expect(page.locator("#guide-message")).toContainText("negative unit");
  await page.locator("#guide-skip").click();
  await expect(page.locator("#do-both")).toBeHidden();
  await page.locator("#left-action").click();
  await expect(page.locator("#balance-caption")).toContainText("matching move");
  await expect(page.locator("#right-action")).toBeEnabled();
  await page.locator("#right-action").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:30000});
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(save.worlds.opposites.stages.independent.completed).toContain("op-i-01");
});
test("World 2 signed editor typesets +(−x), previews and replays real steps @smoke",async({page})=>{
  test.setTimeout(80000);
  await board(page,"notebook");
  await page.locator('[data-level="5"]').click();
  await expect(page.locator("#notebook-workspace")).toBeVisible();
  await expect(page.locator("#notebook-signed-operations")).toBeVisible();
  await expect(page.locator("#notebook-current-math")).toContainText("x");
  await page.locator("#notebook-operation").fill("+(−x)");
  await expect(page.locator("#notebook-apply")).toBeEnabled();
  await expect(page.locator("#notebook-result-math")).toContainText("x");
  await page.locator("#notebook-apply").click();
  await expect(page.locator("#notebook-lines li")).toHaveCount(2);
  await page.locator("#notebook-operation").fill("+(−3)");
  await expect(page.locator("#notebook-apply")).toBeEnabled();
  await page.locator("#notebook-apply").click();
  await expect(page.locator("#notebook-replay")).toBeEnabled();
  await page.locator("#notebook-replay").click();
  await expect(page.locator("#notebook-playback")).toBeVisible();
  await expect(page.locator("#notebook-next")).toBeVisible({timeout:60000});
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(save.worlds.opposites.stages.notebook.completed).toContain("op-a-05");
  expect(save.worlds.workshop.stages.notebook.completed).toEqual([]);
});
test("signed notebook can remove NEGATIVE units as −(−4) @smoke",async({page})=>{
  await board(page,"notebook");
  await page.locator('[data-level="8"]').click();
  await page.locator("#notebook-operation").fill("−(−4)");
  await expect(page.locator("#notebook-apply")).toBeEnabled();
  await expect(page.locator("#notebook-result-math")).toContainText("9");
  await page.locator("#notebook-apply").click();
  await expect(page.locator("#notebook-replay")).toBeEnabled();
});
test("World 2 reset retains its signed world, separate guide and physics @smoke",async({page})=>{
  await board(page);
  await page.locator('[data-level="2"]').click();
  await expect(page.locator("#chapter-status")).toContainText("WORLD 2 · STAGE 1");
  await expect(page.locator("#left-items .balloon")).toHaveCount(2);
  await page.locator("#reset").click();
  await expect(page.locator("#chapter-status")).toContainText("WORLD 2 · STAGE 1");
  await expect(page.locator("#left-items .balloon")).toHaveCount(2);
  await expect(page.locator('[data-kind="negOne"]')).toBeVisible();
  await page.locator("#game-home").click();
  await expect(page.locator('#home-stage-shortcuts[data-active-world="opposites"]')).toBeVisible();
  await expect(page.locator('[data-home-stage="guided"]')).toContainText("Level 2");
  await page.reload();
  await expect(page.locator("#home-play")).toContainText("Guided Opposites");
});
test("World 1 remains positive only after changing worlds @quick @smoke",async({page})=>{
  await board(page);
  await page.locator('[data-map-world="workshop"]').click();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-world","workshop");
  await page.locator('[data-level="1"]').click();
  await expect(page.locator("#chapter-status")).toContainText("WORLD 1");
  await expect(page.locator('[data-kind="negOne"]')).toBeHidden();
  await expect(page.locator('[data-kind="negX"]')).toBeHidden();
  await expect(page.locator('[data-operation="square"]')).toBeHidden();
});
test("World 2 menus and board fit small laptop and phone without sideways clipping @smoke",async({page})=>{
  test.setTimeout(55000);
  for(const size of [{width:1024,height:720},{width:1092,height:540},{width:375,height:812}]){
    await page.setViewportSize(size);
    await board(page);
    await expect(page.locator("#board-continue")).toBeVisible();
    await expect(page.locator('[data-level="20"]')).toBeVisible();
    const measures=await page.evaluate(()=>({
      scrollWidth:document.documentElement.scrollWidth,
      innerWidth:window.innerWidth,
      scrollHeight:document.documentElement.scrollHeight,
      innerHeight:window.innerHeight
    }));
    expect(measures.scrollWidth).toBeLessThanOrEqual(measures.innerWidth+3);
    if(size.width>=900){
      expect(measures.scrollHeight).toBeLessThanOrEqual(measures.innerHeight+3);
      await expect(page.locator('[data-level="20"]')).toBeInViewport();
    }
    await page.screenshot({path:"artifacts/pr36-opposites-board-"+size.width+"x"+size.height+".png",fullPage:true});
    await page.locator("#site-back").click();
  }
});
