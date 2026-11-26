import {openCampaignBoard,launchHomeOrFirst} from "./campaign-menu-helper.mjs";
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
async function draft(page,operation){
  await page.locator("#notebook-operation").fill(operation);
}
async function apply(page,operation){
  await draft(page,operation);
  await expect(page.locator("#notebook-apply")).toBeEnabled();
  await page.locator("#notebook-apply").click();
}

test("teacher notebook sandbox earns no campaign credit after stages are opened",async({page})=>{
  await page.locator('[data-screen="settings"]').first().click();
  await expect(page.locator("#site-notebook-option")).toBeHidden();
  await page.locator("#teacher-unlock").check();
  await expect(page.locator("#site-notebook-option")).toBeVisible();
  await page.locator("#site-notebook-preview").click();
  await expect(page.locator("#notebook-workspace")).toBeVisible();
  await expect(page.locator("#notebook-preview-warning")).toHaveCount(0);
  await expect(page.locator("#notebook-workspace")).toContainText("No levels or progress earned");
  await page.locator("#game-levels").click();
  await expect(page.locator("#site-settings")).toBeVisible();
  await openCampaignBoard(page);
  await expect(page.locator('[data-stage-open="notebook"]')).toBeEnabled();
  await expect(page.locator('#site-levels [data-screen="workshop"]')).toBeVisible();
  await expect(page.locator("#world1-progress-number")).toHaveText("0 of 24 complete");
});

test("invalid or impossible operations are previewed but never alter checked working",async({page})=>{
  await notebook(page);
  await expect(page.locator("#notebook-lines li")).toHaveCount(1);
  await expect(page.locator("#notebook-lines")).toContainText("2x + 3 = 11");
  await expect(page.locator("#notebook-replay")).toBeDisabled();
  await draft(page,"x=4");
  await expect(page.locator("#notebook-result-math")).toContainText("Use one operation");
  await expect(page.locator("#notebook-operation")).toHaveAttribute("aria-invalid","true");
  await expect(page.locator("#notebook-apply")).toBeDisabled();
  await draft(page,"÷3");
  await expect(page.locator("#notebook-result-math")).toContainText("part of a sprite");
  await draft(page,"−4");
  await expect(page.locator("#notebook-result-math")).toContainText("can't take away");
  await expect(page.locator("#notebook-lines li")).toHaveCount(1);
  await expect(page.locator("#notebook-replay")).toBeDisabled();
});

test("the editor calculates operations, then the real hand replays exactly those steps @smoke",async({page})=>{
  test.setTimeout(80000);
  await notebook(page);
  await draft(page,"−3");
  await expect(page.locator("#notebook-result-math")).toHaveAttribute("aria-label","2x = 8");
  await expect(page.locator("#notebook-current-math")).toHaveAttribute("aria-label","2x + 3 = 11");
  await page.locator("#notebook-apply").click();
  await expect(page.locator("#notebook-lines li")).toHaveCount(2);
  await expect(page.locator("#notebook-lines")).toContainText("− 3");
  await expect(page.locator("#scene")).toBeHidden();
  await draft(page,"÷2");
  await expect(page.locator("#notebook-result-math")).toHaveAttribute("aria-label","x = 4");
  await page.locator("#notebook-apply").click();
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

test("two distinct valid routes can be selected, previewed and undone",async({page})=>{
  await notebook(page,"two-step-10");
  await expect(page.locator("#notebook-lines")).toContainText("3x + 6 = 18");
  await apply(page,"÷3");
  await expect(page.locator("#notebook-lines")).toContainText("÷ 3");
  await page.locator("#notebook-undo").click();
  await expect(page.locator("#notebook-lines li")).toHaveCount(1);
  await apply(page,"−6");
  await expect(page.locator("#notebook-lines")).toContainText("− 6");
  await apply(page,"÷3");
  await expect(page.locator("#notebook-replay")).toBeEnabled();
  await page.locator("#notebook-reset").click();
  await expect(page.locator("#notebook-lines li")).toHaveCount(1);
  await expect(page.locator("#notebook-replay")).toBeDisabled();
});

test("maths keypad, keyboard entry and phone sizing all work",async({page})=>{
  await page.setViewportSize({width:375,height:725});
  await notebook(page,"resident");
  await expect(page.locator("#notebook-operation")).toBeVisible();
  await expect(page.locator(".notebook-maths-keypad button:visible")).toHaveCount(12);
  const el=await page.locator("#notebook-operation").boundingBox();
  expect(el.x).toBeGreaterThanOrEqual(0);
  expect(el.x+el.width).toBeLessThanOrEqual(377);
  await page.locator('[data-notebook-symbol="−"]').click();
  await page.locator('[data-notebook-key="2"]').click();
  await expect(page.locator("#notebook-operation")).toHaveValue("−2");
  await expect(page.locator("#notebook-result-math")).toHaveAttribute("aria-label","x = 3");
  await page.locator("#notebook-operation").press("Enter");
  await expect(page.locator("#notebook-replay")).toBeEnabled();
  await expect(page.locator("#notebook-workspace")).toContainText("Solution checked");
});

test("normal guided and independent campaigns remain unaffected by the notebook editor",async({page})=>{
  await launchHomeOrFirst(page);
  await expect(page.locator("#scene")).toBeVisible();
  await expect(page.locator("#notebook-workspace")).toBeHidden();
  await expect(page.locator("#do-both")).toBeVisible();
  await expect(page.locator("#mode-select")).toBeHidden();
});
