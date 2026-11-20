import {test,expect} from "@playwright/test";

test.beforeEach(async ({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});
async function openFirst(page) {
  await page.locator("#home-play").click();
  await expect(page.locator("#level-title")).toHaveText("One little resident");
}

test("Level 1 gives four sequential cues pointing at the real controls", async({page})=>{
  await openFirst(page);
  await expect(page.locator("#apprentice-guide")).toBeVisible();
  await expect(page.locator("#guide-progress")).toHaveText("1 of 4");
  await expect(page.locator("#scene")).toHaveClass(/coach-focus/);
  await page.locator("#guide-next").click();
  await expect(page.locator("#guide-progress")).toHaveText("2 of 4");
  await expect(page.locator('[data-operation="remove"]')).toHaveClass(/coach-focus/);
  await page.locator("#guide-next").click();
  await expect(page.locator("#amount-control")).toHaveClass(/coach-focus/);
  await page.locator("#guide-next").click();
  await expect(page.locator("#guide-progress")).toHaveText("4 of 4");
  await expect(page.locator("#do-both")).toHaveClass(/coach-focus/);
  await expect(page.locator("#guide-next")).toBeHidden();
  await page.locator("#guide-skip").click();
  await expect(page.locator("#apprentice-guide")).toBeHidden();
  await page.reload();
  await page.locator("#home-play").click();
  await expect(page.locator("#apprentice-guide")).toBeHidden();
});

test("Stage 1 tutorial follows Guided Mirror and can restart the first lesson", async({page})=>{
  await openFirst(page);
  for(let n=0;n<3;n++)await page.locator("#guide-next").click();
  await expect(page.locator("#do-both")).toHaveClass(/coach-focus/);
  await expect(page.locator("#guide-message")).toContainText("both rooms");
  await expect(page.locator("#mode-select")).toBeHidden();
  await expect(page.locator("#campaign-hand-mode")).toContainText("Guided Mirror");
  await expect(page.locator("#left-action")).toBeHidden();
  await page.locator("#guide-skip").click();
  await expect(page.locator("#apprentice-guide")).toBeHidden();
  await page.locator("#game-guide-restart").click();
  await expect(page.locator("#level-title")).toHaveText("One little resident");
  await expect(page.locator("#apprentice-guide")).toBeVisible();
  await expect(page.locator("#guide-progress")).toHaveText("1 of 4");
});

test("settings can turn guidance off, then explicitly replay it", async({page})=>{
  await page.locator('[data-screen="settings"]').first().click();
  await page.locator("#site-guided-help").uncheck();
  await page.locator('[data-screen="home"]').first().click();
  await openFirst(page);
  await expect(page.locator("#apprentice-guide")).toBeHidden();
  await page.locator("#game-home").click();
  await page.locator('[data-screen="settings"]').first().click();
  await expect(page.locator("#site-guided-help")).not.toBeChecked();
  await page.locator("#site-replay-intro").click();
  await expect(page.locator("#apprentice-guide")).toBeVisible();
  await expect(page.locator("#guide-progress")).toHaveText("1 of 4");
});

test("solving the first level celebrates physical balance then reveals earned next-step controls", async({page})=>{
  test.setTimeout(60000);
  await openFirst(page);
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#level-clear")).toBeHidden();
  await page.locator("#do-both").click();
  await expect(page.locator("#level-clear")).toBeVisible({timeout:20000});
  await expect(page.locator("#level-clear-title")).toHaveText("Balance restored!");
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
  await expect(page.locator("#replay-level-stamp")).toContainText("FIRST DISCOVERY");
  await page.locator("#replay-skip").click();
  await expect(page.locator("#replay-end-note")).toContainText("Level 1 solved");
  await expect(page.locator("#next-level")).toBeEnabled();
  await page.locator("#next-level").click();
  await expect(page.locator("#level-title")).toHaveText("Three weights in the way");
  await expect(page.locator("#apprentice-guide")).toBeHidden();
});

test("completing every workshop level reveals the mastery banner and themed chapters",async({page})=>{
  const data=JSON.stringify({completed:Array.from({length:20},(_,i)=>i+1),lastPlayed:20});
  await page.evaluate(value=>localStorage.setItem("mathssprites.progress.v1",value),data);
  await page.reload();
  await page.locator('[data-screen="worlds"]').first().click();
  await expect(page.locator('[data-world-art="workshop"] .world-progress')).toContainText("20 / 48 complete");
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
  await expect(page.locator("#world1-finale")).toBeVisible();
  await expect(page.locator("#world1-progress-bar")).toHaveJSProperty("value",20);
  await expect(page.locator(".chapter-complete")).toHaveCount(5);
  await expect(page.locator(".chapter-illustration")).toHaveCount(5);
  await expect(page.locator(".level-tile.status-complete")).toHaveCount(20);
  await expect(page.locator(".level-tile.level-next")).toHaveCount(0);
});

test("phone menus and replay keep touch actions in view",async({page})=>{
  test.setTimeout(60000);
  await page.setViewportSize({width:375,height:725});
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
  await expect(page.locator(".chapter-illustration").first()).toBeVisible();
  await expect(page.locator(".level-tile")).toHaveCount(20);
  await page.locator('[data-level="1"]').click();
  await expect(page.locator("#game-home")).toBeVisible();
  await expect(page.locator("#game-levels")).toBeVisible();
  await expect(page.locator("#game-guide-restart")).toBeVisible();
  await page.locator("#motion-toggle").click();
  await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:25000});
  await expect(page.locator("#replay-skip")).toBeVisible();
  const bounds=await page.locator("#replay-skip").boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x+bounds.width).toBeLessThanOrEqual(377);
  await page.locator("#replay-skip").click();
  await expect(page.locator("#next-level")).toBeEnabled();
});

test("chapter-opening levels show new ideas without exposing the hidden equation",async({page})=>{
  await page.locator('[data-screen="settings"]').first().click();
  await page.locator("#teacher-unlock").check();
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
  for (const [number,skill,theme] of [
    [5,"Equal baskets","2"],
    [9,"Two-step experiments","3"],
    [13,"Across the hall","4"],
    [17,"Master of the balance","5"]
  ]) {
    await page.locator('[data-level="'+number+'"]').click();
    await expect(page.locator("#chapter-briefing")).toBeVisible();
    await expect(page.locator("#chapter-briefing")).toContainText(skill);
    await expect(page.locator("#chapter-status")).toContainText("LEVEL "+String(number).padStart(2,"0"));
    await expect(page.locator("body")).toHaveAttribute("data-workshop-chapter",theme);
    await page.locator("#game-levels").click();
  }
  await expect(page.locator("#chapter-briefing")).toBeHidden();
});
