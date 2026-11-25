import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});

async function masterFirstTwo(page){
  await page.evaluate(()=>{
    localStorage.setItem("mathssprites.progress.v1",JSON.stringify({
      completed:Array.from({length:20},(_,i)=>i+1),lastPlayed:20
    }));
    localStorage.setItem("mathssprites.independent-progress.v1",JSON.stringify({
      completed:Array.from({length:20},(_,i)=>i+1),lastPlayed:20
    }));
  });
  await page.reload();
}
async function openStage3(page,{teacher=false,level=1}={}){
  if(teacher){
    await page.locator('[data-screen="settings"]').first().click();
    await page.locator("#teacher-unlock").check();
  }else{
    await masterFirstTwo(page);
  }
  await page.locator('.site-nav-links [data-screen="levels"]').click();
  await page.locator('[data-map-stage="notebook"]').click();
  await page.locator('[data-level="'+level+'"]').click();
  await expect(page.locator("#notebook-workspace")).toBeVisible();
  await expect(page.locator("#scene")).toBeHidden();
}
async function applyOperation(page,expression){
  await page.locator("#notebook-operation").fill(expression);
  await page.locator("#notebook-operation").press("Enter");
}

test("Stage 3 and all sixteen notebook levels are open without prior mastery",async({page})=>{
  await page.locator('.site-nav-links [data-screen="levels"]').click();
  await expect(page.locator('[data-map-stage="notebook"]')).toHaveCount(1);
  await masterFirstTwo(page);
  await expect(page.locator("#home-play")).toContainText("Continue Stage 3 · Level 1");
  await page.locator('.site-nav-links [data-screen="levels"]').click();
  await expect(page.locator('[data-map-stage="notebook"]')).toHaveCount(1);
  await page.locator('[data-map-stage="notebook"]').click();
  await expect(page.locator(".chapter-group")).toHaveCount(4);
  await expect(page.locator(".level-tile")).toHaveCount(16);
  await expect(page.locator('[data-level="1"]')).toBeEnabled();
  await expect(page.locator('[data-level="2"]')).toBeEnabled();
  await expect(page.locator('[data-level="12"]')).toBeEnabled();
  await expect(page.locator('#site-levels [data-screen="workshop"]')).toBeAttached();
});

test("backwards fading shows a different worked example, then first/last cues, then none",async({page})=>{
  await openStage3(page,{teacher:true,level:1});
  await expect(page.locator("#notebook-stage-kicker")).toContainText("LEVEL 01");
  await expect(page.locator("#notebook-scaffold")).toBeVisible();
  await expect(page.locator("#notebook-scaffold")).toContainText("different example");
  await expect(page.locator("#notebook-lines")).toContainText("x + 3 = 8");
  await expect(page.locator("#scene")).toBeHidden();
  await page.locator("#game-levels").click();
  await page.locator('[data-level="2"]').click();
  await expect(page.locator("#notebook-scaffold")).toContainText("Your first move");
  await page.locator("#game-levels").click();
  await page.locator('[data-level="3"]').click();
  await expect(page.locator("#notebook-scaffold")).toContainText("Plan the final step");
  await page.locator("#game-levels").click();
  await page.locator('[data-level="4"]').click();
  await expect(page.locator("#notebook-scaffold")).toBeHidden();
  await page.locator("#notebook-hint").click();
  await expect(page.locator("#notebook-hint-message")).toBeVisible();
  await expect(page.locator("#notebook-hint-message")).not.toContainText("x = 5");
  await page.locator("#game-levels").click();
  await page.locator('[data-level="9"]').click();
  await expect(page.locator("#notebook-scaffold")).toBeHidden();
  await expect(page.locator("#notebook-hint-message")).toBeHidden();
});

test("solved paper alone earns NO progress; successful hands earn credit and advance",async({page})=>{
  test.setTimeout(80000);
  await openStage3(page);
  const before=await page.evaluate(()=>({
    first:localStorage.getItem("mathssprites.progress.v1"),
    second:localStorage.getItem("mathssprites.independent-progress.v1")
  }));
  await applyOperation(page,"−3");
  await expect(page.locator("#notebook-replay")).toBeEnabled();
  await expect(page.locator("#scene")).toBeHidden();
  const pending=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.apprentice-progress.v1")));
  expect(pending.completed).toEqual([]);
  await page.locator("#motion-toggle").click();
  await page.locator("#notebook-replay").click();
  await expect(page.locator("#scene")).toBeVisible();
  await expect(page.locator("#notebook-next")).toBeVisible({timeout:35000});
  await expect(page.locator("#notebook-playback-message")).toContainText("checked algebra step");
  const earned=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.apprentice-progress.v1")));
  expect(earned.completed).toEqual([1]);
  expect(earned.lastPlayed).toBe(2);
  const after=await page.evaluate(()=>({
    first:localStorage.getItem("mathssprites.progress.v1"),
    second:localStorage.getItem("mathssprites.independent-progress.v1")
  }));
  expect(after).toEqual(before);
  await page.locator("#notebook-next").click();
  await expect(page.locator("#level-title")).toHaveText("One equal group");
  await expect(page.locator("#notebook-workspace")).toBeVisible();
  await expect(page.locator("#scene")).toBeHidden();
  await expect(page.locator("#notebook-lines")).toContainText("2x = 12");
  await expect(page.locator('#site-levels [data-screen="workshop"]')).toBeAttached();
});

test("wrong or skipped steps leave campaign progress untouched, and one-step hints do not solve it",async({page})=>{
  await openStage3(page,{teacher:true,level:3});
  await applyOperation(page,"÷3");
  await expect(page.locator("#notebook-feedback")).toContainText("part of a sprite");
  await expect(page.locator("#notebook-lines li")).toHaveCount(1);
  await expect(page.locator("#notebook-replay")).toBeDisabled();
  await applyOperation(page,"−4");
  await expect(page.locator("#notebook-lines li")).toHaveCount(2);
  await applyOperation(page,"÷2");
  await expect(page.locator("#notebook-replay")).toBeEnabled();
  const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.apprentice-progress.v1")));
  expect(progress.completed).toEqual([]);
  await page.locator("#game-levels").click();
  await expect(page.locator("#levels-stage-title")).toHaveText("Algebra Apprentice");
  await expect(page.locator('[data-level="4"]')).toBeEnabled();
});

test("a fully mastered Stage 3 shows its own 16/16 banner and completion route",async({page})=>{
  await masterFirstTwo(page);
  await page.evaluate(()=>localStorage.setItem("mathssprites.apprentice-progress.v1",
    JSON.stringify({completed:Array.from({length:16},(_,i)=>i+1),lastPlayed:16})));
  await page.reload();
  await expect(page.locator("#home-play")).toContainText("Replay Stage 3 · Level 16");
  await page.locator('.site-nav-links [data-screen="levels"]').click();
  await page.locator('[data-map-stage="notebook"]').click();
  await expect(page.locator("#world1-progress-number")).toHaveText("16 of 16 complete");
  await page.locator('[data-map-stage="notebook"]').click();
  await expect(page.locator("#world1-finale")).toContainText("Algebra Apprentice mastered");
  await expect(page.locator("#world1-progress-bar")).toHaveJSProperty("max",16);
  await expect(page.locator("#world1-progress-bar")).toHaveJSProperty("value",16);
  await expect(page.locator(".chapter-complete")).toHaveCount(4);
  await expect(page.locator(".level-tile.status-complete")).toHaveCount(16);
});

test("Stage 3 remains usable on a phone, with keyboard entry and no squared controls",async({page})=>{
  await page.setViewportSize({width:375,height:725});
  await openStage3(page,{teacher:true,level:2});
  await expect(page.locator("#notebook-operation")).toBeVisible();
  const box=await page.locator("#notebook-operation").boundingBox();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x+box.width).toBeLessThanOrEqual(377);
  await applyOperation(page,"÷2");
  await expect(page.locator("#notebook-replay")).toBeEnabled();
  await expect(page.locator("#scene")).toBeHidden();
  await expect(page.locator('[data-operation="square"]')).toBeHidden();
  await expect(page.locator('[data-operation="sqrt"]')).toBeHidden();
  await expect(page.locator('[data-kind="negX"]')).toBeHidden();
});
