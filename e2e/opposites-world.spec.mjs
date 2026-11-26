import {assertGrounded} from "./scene-grounding-helper.mjs";
import {playCampaignLevel} from "./campaign-menu-helper.mjs";
import {openCampaignBoard,chooseCampaignWorld,chooseCampaignStage} from "./campaign-menu-helper.mjs";
import {clickWithReferenceMove} from "./reference-move-helper.mjs";
import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
});
async function board(page,stage="guided"){
  await openCampaignBoard(page,"opposites");
  if(stage!=="guided")await chooseCampaignStage(page,stage);
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-world","opposites");
}
test("World 2 shows the extended independent and notebook stages alongside six Guided chapters on the unified board @quick @smoke",async({page})=>{
  await board(page);
  await expect(page.locator("#site-levels")).toBeVisible();
  await expect(page.locator('[data-world-stages="opposites"]')).toBeEnabled();
  await expect(page.locator(".level-tile")).toHaveCount(24);
  await expect(page.locator(".chapter-group")).toHaveCount(6);
  await expect(page.locator('[data-level="21"]')).toHaveAttribute("aria-label",/A weight for a balloon/);
  await expect(page.locator('[data-level="24"]')).toHaveAttribute("aria-label",/The sealed negatives/);
  await expect(page.locator("#board-continue")).toBeDisabled();
  await chooseCampaignStage(page,"independent");
  await expect(page.locator(".level-tile")).toHaveCount(20);
  await expect(page.locator(".chapter-group")).toHaveCount(5);
  await chooseCampaignStage(page,"notebook");
  await expect(page.locator(".level-tile")).toHaveCount(16);
  await expect(page.locator(".chapter-group")).toHaveCount(4);
  await expect(page.locator('[data-world-stages="fractions"]')).toBeEnabled();
  await expect(page.locator('[data-world-stages="squares"]')).toBeEnabled();
  await page.screenshot({path:"artifacts/pr57-opposites-board-1280.png",fullPage:true});
});
test("signed Guided level makes the balloon-weight zero pair, saves World 2 stars @smoke",async({page})=>{
  test.setTimeout(60000);
  await board(page);
  await page.locator('[data-level="1"]').click();
  await page.locator("#board-continue").click();
  await expect(page.locator("#level-title")).toHaveText("One rising balloon");
  await expect(page.locator("#chapter-status")).toContainText("WORLD 2 · STAGE 1");
  await expect(page.locator("#left-items .balloon")).toHaveCount(1);
  // PR54: signed kinds appear only AFTER choosing an operation.
  await expect(page.locator("#object-picker")).toBeHidden();
  await page.locator('[data-operation="add"]').click();
  await expect(page.locator('[data-kind="negOne"]')).toBeVisible();
  await expect(page.locator('[data-kind="negX"]')).toBeVisible();
  await expect(page.locator('[data-kind="posX2"]')).toBeHidden();
  await expect(page.locator('[data-operation="square"]')).toBeHidden();
  await expect(page.locator('#game-guide-restart')).toBeVisible();
  await expect(page.locator("#guide-message")).toContainText("Balloons");
  await page.locator("#guide-skip").click();
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:30000});
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(save.worlds.opposites.stages.guided.completed).toContain("op-g-01");
  expect(save.worlds.workshop.stages.guided.completed).toEqual([]);
  await page.screenshot({path:"artifacts/pr36-opposites-guided-zero-pair.png"});
});
test("signed Independent requires two separate matched room actions @smoke",async({page})=>{
  test.setTimeout(60000);
  await board(page,"independent");
  await playCampaignLevel(page,page.locator('[data-level="1"]'));
  await expect(page.locator("#chapter-status")).toContainText("WORLD 2 · STAGE 2");
  await expect(page.locator("#guide-message")).toContainText("negative unit");
  await page.locator("#guide-skip").click();
  await expect(page.locator("#do-both")).toBeHidden();
  await clickWithReferenceMove(page,"#left-action");
  await expect(page.locator("#balance-caption")).toContainText("matching move");
  await expect(page.locator("#right-action")).toBeEnabled();
  await clickWithReferenceMove(page,"#right-action");
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:30000});
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(save.worlds.opposites.stages.independent.completed).toContain("op-i-01");
});
test("World 2 signed editor typesets +(−x), previews and replays real steps @smoke",async({page})=>{
  test.setTimeout(80000);
  await board(page,"notebook");
  await playCampaignLevel(page,page.locator('[data-level="5"]'));
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
  // PR102: replay has less scene height than an ordinary experiment.
  const replayViewport=page.viewportSize();
  await page.setViewportSize({width:1092,height:540});
  await assertGrounded(page.locator("#scene"));
  await page.setViewportSize(replayViewport);
  await assertGrounded(page.locator("#scene"));
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(save.worlds.opposites.stages.notebook.completed).toContain("op-a-05");
  expect(save.worlds.workshop.stages.notebook.completed).toEqual([]);
});
test("signed notebook subtracts NEGATIVE units, then completes a multistep solution @smoke",async({page})=>{
  await board(page,"notebook");
  await playCampaignLevel(page,page.locator('[data-level="8"]'));
  await page.locator("#notebook-operation").fill("−(−4)");
  await expect(page.locator("#notebook-apply")).toBeEnabled();
  await page.locator("#notebook-apply").click();
  await expect(page.locator("#notebook-replay")).toBeDisabled();
  await page.locator("#notebook-operation").fill("+(−x)");
  await page.locator("#notebook-apply").click();
  await expect(page.locator("#notebook-replay")).toBeDisabled();
  await page.locator("#notebook-operation").fill("÷2");
  await page.locator("#notebook-apply").click();
  await expect(page.locator("#notebook-replay")).toBeEnabled();
});
test("World 2 reset retains its signed world, separate guide and physics @smoke",async({page})=>{
  await board(page);
  await playCampaignLevel(page,page.locator('[data-level="2"]'));
  await expect(page.locator("#chapter-status")).toContainText("WORLD 2 · STAGE 1");
  await expect(page.locator("#left-items .balloon")).toHaveCount(2);
  await page.locator("#reset").click();
  await expect(page.locator("#chapter-status")).toContainText("WORLD 2 · STAGE 1");
  await expect(page.locator("#left-items .balloon")).toHaveCount(2);
  await page.locator('[data-operation="add"]').click();
  await expect(page.locator('[data-kind="negOne"]')).toBeVisible();
  await page.locator("#game-home").click();
  await expect(page.locator("#home-play")).toContainText("Continue: Opposites · Guided · Level 2");
  await page.reload();
  await expect(page.locator("#home-play")).toContainText("Opposites · Guided");
});
test("World 1 remains positive only after changing worlds @quick @smoke",async({page})=>{
  await board(page);
  await chooseCampaignWorld(page,"workshop");
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-world","workshop");
  await playCampaignLevel(page,page.locator('[data-level="1"]'));
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
    await expect(page.locator('[data-level="24"]')).toBeVisible();
    const measures=await page.evaluate(()=>({
      scrollWidth:document.documentElement.scrollWidth,
      innerWidth:window.innerWidth,
      scrollHeight:document.documentElement.scrollHeight,
      innerHeight:window.innerHeight
    }));
    expect(measures.scrollWidth).toBeLessThanOrEqual(measures.innerWidth+3);
    if(size.width>=900){
      expect(measures.scrollHeight).toBeLessThanOrEqual(measures.innerHeight+3);
      await page.locator('[data-level="24"]').scrollIntoViewIfNeeded();
      await expect(page.locator('[data-level="24"]')).toBeInViewport();
    }
    await page.screenshot({path:"artifacts/pr36-opposites-board-"+size.width+"x"+size.height+".png",fullPage:true});
    await page.locator("#site-back").click();
  }
});

test("signed Apprentice accepts subtract 8 with opposite addition replay and no premature credit @smoke",async({page})=>{
  test.setTimeout(90000);
  await page.setViewportSize({width:1266,height:531});
  await board(page,"notebook");
  await playCampaignLevel(page,page.locator('[data-level="5"]'));
  const input=page.locator("#notebook-operation"),apply=page.locator("#notebook-apply");
  const rows=page.locator("#notebook-lines li"),result=page.locator("#notebook-result-math");
  const guide=page.locator('#notebook-workspace [data-guide-action="skip"]');
  if(await guide.isVisible())await guide.click();
  await input.fill("−8");
  await expect(apply).toBeEnabled();
  await expect(input).toHaveAttribute("aria-invalid","false");
  await expect(page.locator("#notebook-inline-message")).toContainText("additive inverse");
  await expect(page.locator("#notebook-inline-message")).toContainText("preserves equality");
  await expect(page.locator("#notebook-inline-message")).not.toContainText(/balloon|sprite|chamber/i);
  await expect(result).toHaveAttribute("aria-label","2x − 5 = x");
  await expect(rows).toHaveCount(1);
  await apply.click();
  await expect(rows).toHaveCount(2);
  await expect(rows.last()).toContainText("− 8 on both sides");
  await expect(rows.last().locator(".notebook-line-equation")).toHaveAttribute("aria-label","2x − 5 = x");
  await page.locator("#notebook-undo").click();
  await expect(rows).toHaveCount(1);
  for(const [operation,next] of [["−8","2x − 5 = x"],["−x","x − 5 = 0"],["+5","x = 5"]]){
    await input.fill(operation);await expect(apply).toBeEnabled();
    await expect(result).toHaveAttribute("aria-label",next);await apply.click();
  }
  await expect(rows).toHaveCount(4);
  await expect(page.locator("#notebook-replay")).toBeEnabled();
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(before.worlds.opposites.stages.notebook.completed).not.toContain("op-a-05");
  await page.locator("#notebook-replay").click();
  await expect(page.locator("#notebook-next")).toBeVisible({timeout:60000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(0);
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(after.worlds.opposites.stages.notebook.bestMoves["op-a-05"]).toBe(3);
});
