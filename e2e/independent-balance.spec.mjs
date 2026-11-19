import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});
async function openStage2(page,{teacher=true,level=1}={}){
  if(teacher){
    await page.locator('[data-screen="settings"]').first().click();
    await page.locator("#teacher-unlock").check();
  }
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Choose Stage 2 levels"}).click();
  await page.locator('[data-level="'+level+'"]').click();
  await expect(page.locator("#chapter-status")).toContainText("STAGE 2");
}
test("Stage 2 and Stage 3 are selectable before Stage 1 is completed",async({page})=>{
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await expect(page.locator('[data-stage="independent"] button')).toHaveCount(1);
  await expect(page.locator('[data-stage="notebook"] button')).toHaveCount(1);
  const complete={completed:Array.from({length:20},(_,i)=>i+1),lastPlayed:20};
  await page.evaluate(v=>localStorage.setItem("mathssprites.progress.v1",JSON.stringify(v)),complete);
  await page.reload();
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await expect(page.locator('[data-stage="independent"] button')).toBeVisible();
  await expect(page.locator('[data-stage="notebook"] button')).toHaveCount(1);
  await expect(page.locator("#world1-workshop button")).toHaveCount(1);
  await page.getByRole("button",{name:"Choose Stage 2 levels"}).click();
  await expect(page.locator(".chapter-group")).toHaveCount(4);
  await expect(page.locator(".level-tile")).toHaveCount(16);
  await expect(page.locator('[data-level="1"]')).toBeEnabled();
  await expect(page.locator('[data-level="2"]')).toBeEnabled();
  await expect(page.locator('[data-level="16"]')).toBeEnabled();
});

test("the hand visits each chamber and shows a real temporary scale tilt",async({page})=>{
  test.setTimeout(65000);
  await openStage2(page);
  await expect(page.locator("#level-title")).toHaveText("Two hands, two rooms");
  await expect(page.locator("#campaign-hand-mode")).toContainText("Your Turn");
  await expect(page.locator("#mode-select")).toBeHidden();
  await expect(page.locator("#do-both")).toBeHidden();
  await expect(page.locator("#left-action")).toBeVisible();
  await expect(page.locator("#right-action")).toBeVisible();
  await expect(page.locator("#apprentice-guide")).toBeVisible();
  await page.locator("#guide-next").click();
  await page.locator("#guide-next").click();
  await page.locator("#guide-next").click();
  await expect(page.locator("#left-action")).toHaveClass(/coach-focus/);
  await page.locator("#motion-toggle").click(); // use short physical motion
  await page.locator("#left-action").click();
  await expect(page.locator("#balance-caption")).toHaveClass(/unbalanced/);
  await expect(page.locator("#balance-caption")).toContainText("waiting");
  await expect(page.locator("#right-action")).toContainText("Match the move here");
  await expect(page.locator("#guide-message")).toContainText("SAME removal");
  await expect(page.locator("#left-items .weight")).toHaveCount(0);
  await expect(page.locator("#right-items .weight")).toHaveCount(7);
  await page.locator("#right-action").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:28000});
  await expect(page.locator("#replay-level-stamp")).toContainText("STAGE 2");
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("x = 5");
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.independent-progress.v1")));
  expect(stored.completed).toContain(1);
  expect(stored.lastPlayed).toBe(2);
  await page.locator("#next-level").click();
  await expect(page.locator("#level-title")).toHaveText("A matching handful");
  await expect(page.locator("#apprentice-guide")).toBeHidden();
});

test("the student may begin in the east; one-sided Undo cancels an unmatched move",async({page})=>{
  test.setTimeout(50000);
  await openStage2(page);
  await page.locator("#motion-toggle").click();
  await page.locator("#right-action").click();
  await expect(page.locator("#balance-caption")).toHaveClass(/unbalanced/);
  await expect(page.locator("#left-action")).toContainText("Match the move here");
  await expect(page.locator("#guide-message")).toContainText("other chamber");
  await page.locator("#undo").click();
  await expect(page.locator("#balance-caption")).not.toHaveClass(/unbalanced/);
  await expect(page.locator("#right-items .weight")).toHaveCount(7);
  await expect(page.locator("#left-items .weight")).toHaveCount(2);
  await expect(page.locator("#left-action")).toContainText("Use hand here");
  await expect(page.locator("#undo")).toBeDisabled();
});

test("a different second operation is demonstrated and then both rooms are restored",async({page})=>{
  test.setTimeout(65000);
  await openStage2(page,{level:2});
  await page.locator("#motion-toggle").click();
  await page.locator("#left-action").click();
  await expect(page.locator("#left-items .weight")).toHaveCount(0);
  await page.locator("#amount-down").click(); // second room receives THREE instead of FOUR
  await page.locator("#right-action").click();
  await expect(page.locator("#speech")).toBeVisible({timeout:20000});
  await expect(page.locator("#scene")).not.toHaveClass(/scene-failed-balance/,{timeout:20000});
  await expect(page.locator("#left-items .weight")).toHaveCount(4);
  await expect(page.locator("#right-items .weight")).toHaveCount(10);
  await expect(page.locator("#left-action")).toContainText("Use hand here");
  await expect(page.locator("#undo")).toBeDisabled();
});

test("Stage 2 has its own saved progress and cannot switch into Guided Mirror",async({page})=>{
  await openStage2(page,{level:3});
  await page.locator("#mode-select").evaluate(el=>{
    el.value="auto";
    el.dispatchEvent(new Event("change",{bubbles:true}));
  });
  await expect(page.locator("#mode-select")).toHaveValue("manual");
  await expect(page.locator("#do-both")).toBeHidden();
  await expect(page.locator("#campaign-hand-mode")).toContainText("Your Turn");
  const stage1=await page.evaluate(()=>localStorage.getItem("mathssprites.progress.v1"));
  await page.locator("#game-levels").click();
  await expect(page.locator("#levels-stage-title")).toHaveText("Independent Balance");
  await expect(page.locator("#level-sections .level-tile")).toHaveCount(16);
  await expect(page.locator("#world1-progress-bar")).toHaveJSProperty("max",16);
  expect(await page.evaluate(()=>localStorage.getItem("mathssprites.progress.v1"))).toBe(stage1);
});

test("Stage 2 has its own replayable coach and chapter-opening cues",async({page})=>{
  await openStage2(page);
  await expect(page.locator("#apprentice-guide")).toBeVisible();
  await page.locator("#guide-skip").click();
  await expect(page.locator("#apprentice-guide")).toBeHidden();
  await page.locator("#game-guide-restart").click();
  await expect(page.locator("#apprentice-guide")).toBeVisible();
  await page.locator("#game-home").click();
  await page.locator('[data-screen="settings"]').first().click();
  await expect(page.locator("#site-replay-independent")).toBeVisible();
  await page.locator("#site-replay-independent").click();
  await expect(page.locator("#chapter-status")).toContainText("STAGE 2");
  await expect(page.locator("#apprentice-guide")).toBeVisible();
});

test("Stage 2 chapter handovers and independent final mastery stay separate from Stage 1",async({page})=>{
  await page.evaluate(()=>{
    localStorage.setItem("mathssprites.progress.v1",JSON.stringify({
      completed:Array.from({length:20},(_,i)=>i+1),lastPlayed:20}));
    localStorage.setItem("mathssprites.independent-progress.v1",JSON.stringify({
      completed:Array.from({length:16},(_,i)=>i+1),lastPlayed:16}));
  });
  await page.reload();
  await expect(page.locator("#home-play")).toContainText("Begin Stage 3");
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await expect(page.locator('[data-stage="independent"]')).toContainText("Stage mastered");
  await expect(page.locator('[data-stage="notebook"] button')).toHaveCount(1);
  await page.getByRole("button",{name:"Choose Stage 2 levels"}).click();
  await expect(page.locator("#world1-finale")).toContainText("Independent Balance mastered");
  await expect(page.locator("#world1-progress-bar")).toHaveJSProperty("value",16);
  await expect(page.locator(".chapter-complete")).toHaveCount(4);
  await expect(page.locator(".level-tile.status-complete")).toHaveCount(16);
  await page.locator('[data-level="13"]').click();
  await expect(page.locator("#chapter-briefing")).toContainText("Dark sprites appear in both rooms");
  await expect(page.locator("#chapter-status")).toContainText("LEVEL 13 / 16");
  await expect(page.locator('[data-operation="square"]')).toBeHidden();
  await expect(page.locator('[data-kind="negX"]')).toBeHidden();
});

test("Stage 2 manual buttons stay touchable on narrow phone screens",async({page})=>{
  test.setTimeout(50000);
  await page.setViewportSize({width:375,height:725});
  await openStage2(page);
  await expect(page.locator("#left-action")).toBeVisible();
  await expect(page.locator("#right-action")).toBeVisible();
  for(const selector of ["#left-action","#right-action"]){
    const b=await page.locator(selector).boundingBox();
    expect(b).not.toBeNull();
    expect(b.width).toBeGreaterThan(62);
    expect(b.x).toBeGreaterThanOrEqual(-1);
    expect(b.x+b.width).toBeLessThanOrEqual(377);
  }
  await page.locator("#motion-toggle").click();
  await page.locator("#left-action").click();
  await expect(page.locator("#right-action")).toContainText("Match the move here");
});
