import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});
async function notebook(page,id="two-step-09"){
  await page.goto("/?notebook="+encodeURIComponent(id));
  await expect(page.locator("#notebook-workspace")).toBeVisible();
  await expect(page.locator("#scene")).toBeHidden();
  await expect(page.locator(".experiment-controls")).toBeHidden();
  await expect(page.locator("#chapter-status")).toContainText("NO PROGRESS");
}
async function writeLine(page,text){
  await page.locator("#notebook-equation").fill(text);
  await page.locator("#notebook-check").click();
}
test("teacher notebook sandbox earns no campaign credit even after Stage 3 unlocks",async({page})=>{
  await page.locator('[data-screen="settings"]').first().click();
  await expect(page.locator("#site-notebook-option")).toBeHidden();
  await page.locator("#teacher-unlock").check();
  await expect(page.locator("#site-notebook-option")).toBeVisible();
  await page.locator("#site-notebook-preview").click();
  await expect(page.locator("#notebook-workspace")).toBeVisible();
  await expect(page.locator("#notebook-preview-warning")).toHaveCount(0); // warning is readable text, not an invented level card
  await expect(page.locator("#notebook-workspace")).toContainText("No levels or progress earned");
  await page.locator("#game-levels").click();
  await expect(page.locator("#site-settings")).toBeVisible();
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await expect(page.locator('[data-stage="notebook"] button')).toHaveCount(1);
  await expect(page.locator("#world1-workshop button")).toHaveCount(0);
});

test("wrong lines are rejected with specific feedback and do not mutate checked working",async({page})=>{
  await notebook(page);
  await expect(page.locator("#notebook-lines li")).toHaveCount(1);
  await expect(page.locator("#notebook-lines")).toContainText("2x + 3 = 11");
  await expect(page.locator("#notebook-replay")).toBeDisabled();
  await writeLine(page,"x=4");
  await expect(page.locator("#notebook-feedback")).toContainText("one possible whole-object operation");
  await expect(page.locator("#notebook-equation")).toHaveAttribute("aria-invalid","true");
  await expect(page.locator("#notebook-lines li")).toHaveCount(1);
  await writeLine(page,"x+1.5=4.5");
  await expect(page.locator("#notebook-feedback")).toContainText("whole");
  await writeLine(page,"2x+3=12");
  await expect(page.locator("#notebook-feedback")).toContainText("not balanced");
  await expect(page.locator("#notebook-replay")).toBeDisabled();
});

test("writing first, then the real sprite hands replay exactly the checked algebra",async({page})=>{
  test.setTimeout(80000);
  await notebook(page);
  await writeLine(page,"2x = 8");
  await expect(page.locator("#notebook-lines li")).toHaveCount(2);
  await expect(page.locator("#notebook-lines")).toContainText("− 3");
  await expect(page.locator("#scene")).toBeHidden();
  await writeLine(page,"x = 4");
  await expect(page.locator("#notebook-lines li")).toHaveCount(3);
  await expect(page.locator("#notebook-replay")).toBeEnabled();
  await expect(page.locator("#notebook-form")).toBeHidden();
  const before=await page.evaluate(()=>({
    stage1:localStorage.getItem("mathssprites.progress.v1"),
    stage2:localStorage.getItem("mathssprites.independent-progress.v1")
  }));
  await page.locator("#motion-toggle").click();
  await page.locator("#notebook-replay").click();
  await expect(page.locator("#scene")).toBeVisible();
  await expect(page.locator("#notebook-workspace")).toBeHidden();
  await expect(page.locator("#notebook-back-paper")).toBeVisible({timeout:45000});
  await expect(page.locator("#notebook-playback-message")).toContainText("checked algebra steps");
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(0);
  await expect(page.locator("#right-items .weight")).toHaveCount(4);
  await expect(page.locator("#replay-backdrop")).toBeHidden();
  await page.locator("#notebook-back-paper").click();
  await expect(page.locator("#scene")).toBeHidden();
  await expect(page.locator("#notebook-lines li")).toHaveCount(3);
  await expect(page.locator("#notebook-replay")).toBeEnabled();
  const after=await page.evaluate(()=>({
    stage1:localStorage.getItem("mathssprites.progress.v1"),
    stage2:localStorage.getItem("mathssprites.independent-progress.v1")
  }));
  expect(after).toEqual(before);
});

test("two distinct mathematically valid routes can be written and undone",async({page})=>{
  await notebook(page,"two-step-10");
  await expect(page.locator("#notebook-lines")).toContainText("3x + 6 = 18");
  await writeLine(page,"x + 2 = 6");
  await expect(page.locator("#notebook-lines")).toContainText("÷ 3");
  await page.locator("#notebook-undo").click();
  await expect(page.locator("#notebook-lines li")).toHaveCount(1);
  await writeLine(page,"3x = 12");
  await expect(page.locator("#notebook-lines")).toContainText("− 6");
  await writeLine(page,"x=4");
  await expect(page.locator("#notebook-replay")).toBeEnabled();
  await page.locator("#notebook-reset").click();
  await expect(page.locator("#notebook-lines li")).toHaveCount(1);
  await expect(page.locator("#notebook-replay")).toBeDisabled();
});

test("Stage 3 notebook is usable with keyboard and on narrow phone screens",async({page})=>{
  await page.setViewportSize({width:375,height:725});
  await notebook(page,"resident");
  await expect(page.locator("#notebook-equation")).toBeVisible();
  const el=await page.locator("#notebook-equation").boundingBox();
  expect(el).not.toBeNull();
  expect(el.x).toBeGreaterThanOrEqual(0);
  expect(el.x+el.width).toBeLessThanOrEqual(377);
  await page.locator("#notebook-equation").fill("x=3");
  await page.locator("#notebook-equation").press("Enter");
  await expect(page.locator("#notebook-replay")).toBeEnabled();
  await expect(page.locator("#notebook-workspace")).toContainText("Solution checked");
});

test("normal guided and independent campaigns remain unaffected by notebook prototype",async({page})=>{
  await page.locator("#home-play").click();
  await expect(page.locator("#scene")).toBeVisible();
  await expect(page.locator("#notebook-workspace")).toBeHidden();
  await expect(page.locator("#do-both")).toBeVisible();
  await expect(page.locator("#mode-select")).toBeHidden();
});
