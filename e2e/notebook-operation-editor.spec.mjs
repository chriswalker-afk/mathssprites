import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});
async function openApprentice(page,level=1){
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Choose Stage 3 levels"}).click();
  await page.locator('[data-level="'+level+'"]').click();
  await expect(page.locator("#notebook-workspace")).toBeVisible();
}
test("students choose −3 and the maths editor calculates the equation without asking for the answer @smoke",async({page})=>{
  await page.setViewportSize({width:1024,height:720});
  await openApprentice(page,1);
  await expect(page.locator("#notebook-lines li")).toHaveCount(1);
  await expect(page.locator("#notebook-current-math math")).toHaveCount(1);
  await expect(page.locator("#notebook-operation")).toBeEmpty();
  await expect(page.locator("#notebook-apply")).toBeDisabled();
  await page.locator('[data-notebook-symbol="−"]').click();
  await page.locator('[data-notebook-key="3"]').click();
  await expect(page.locator("#notebook-operation")).toHaveValue("−3");
  await expect(page.locator('[data-notebook-symbol="−"]')).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("#notebook-operation-typeset math")).toHaveCount(1);
  await expect(page.locator("#notebook-current-math")).toHaveAttribute("aria-label","x + 3 = 8");
  await expect(page.locator("#notebook-result-math")).toHaveAttribute("aria-label","x = 5");
  await expect(page.locator("#notebook-result-math math")).toHaveCount(1);
  await expect(page.locator("#notebook-apply-label")).toHaveText("− 3 on both sides");
  await expect(page.locator("#notebook-apply")).toBeEnabled();
  // Merely previewing an operation does NOT consume a move/star.
  expect(await page.evaluate(()=>localStorage.getItem("mathssprites.apprentice-progress.v1"))).toBeNull();
  await page.screenshot({path:"artifacts/pr31-maths-operation-preview-desktop.png"});
  await page.locator("#notebook-apply").click();
  await expect(page.locator("#notebook-lines li")).toHaveCount(2);
  await expect(page.locator("#notebook-lines li").nth(1).locator("math")).toHaveCount(1);
  await expect(page.locator("#notebook-lines")).toContainText("x = 5");
  await expect(page.locator("#notebook-replay")).toBeEnabled();
  await expect(page.locator("#notebook-form")).toBeHidden();
  await page.screenshot({path:"artifacts/pr31-maths-operation-solved-desktop.png"});
});

test("illegal ÷, wrong-answer input and invalid removal do not change the notebook @smoke",async({page})=>{
  await openApprentice(page,3); // 2x + 4 = 12
  await page.locator("#notebook-operation").fill("x=4");
  await expect(page.locator("#notebook-result-math")).toContainText("Use one operation");
  await expect(page.locator("#notebook-apply")).toBeDisabled();
  await page.locator("#notebook-operation").fill("÷3");
  await expect(page.locator("#notebook-result-math")).toContainText("part of a sprite");
  await expect(page.locator("#notebook-apply")).toBeDisabled();
  await page.locator("#notebook-operation").fill("−5");
  await expect(page.locator("#notebook-result-math")).toContainText("can't take away");
  await expect(page.locator("#notebook-lines li")).toHaveCount(1);
  await expect(page.locator("#notebook-replay")).toBeDisabled();
  await page.locator("#notebook-operation").fill("−4");
  await expect(page.locator("#notebook-result-math")).toHaveAttribute("aria-label","2x = 8");
  await page.locator("#notebook-apply").click();
  await expect(page.locator("#notebook-lines li")).toHaveCount(2);
  await page.locator("#notebook-operation").fill("÷2");
  await expect(page.locator("#notebook-result-math")).toHaveAttribute("aria-label","x = 4");
});

test("typing −x in the maths editor works for equations with sprites on both sides",async({page})=>{
  await openApprentice(page,9);
  await expect(page.locator("#notebook-current-math")).toHaveAttribute("aria-label","2x + 3 = x + 8");
  await page.locator('[data-notebook-symbol="−"]').click();
  await page.locator('[data-notebook-key="x"]').click();
  await expect(page.locator("#notebook-operation")).toHaveValue("−x");
  await expect(page.locator("#notebook-result-math")).toHaveAttribute("aria-label","x + 3 = 8");
  await page.locator("#notebook-apply").click();
  await expect(page.locator("#notebook-lines li")).toHaveCount(2);
  await expect(page.locator("#notebook-current-math")).toHaveAttribute("aria-label","x + 3 = 8");
});

test("math editor on a short laptop and phone preserves usable keypad and apply button @smoke",async({page})=>{
  for(const size of [{width:1092,height:540},{width:375,height:725}]){
    await page.setViewportSize(size);
    await openApprentice(page,2); // 2x = 12
    await page.locator("#notebook-operation").fill("÷2");
    await expect(page.locator("#notebook-result-math")).toHaveAttribute("aria-label","x = 6");
    await expect(page.locator("#notebook-apply")).toBeEnabled();
    const bounds=await page.locator("#notebook-apply").boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds.x).toBeGreaterThanOrEqual(-1);
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(size.width+2);
    await page.locator("#notebook-apply").scrollIntoViewIfNeeded();
    await expect(page.locator("#notebook-apply")).toBeInViewport();
    await page.screenshot({path:"artifacts/pr31-maths-editor-"+size.width+"x"+size.height+".png"});
    await page.locator("#notebook-apply").click();
    await expect(page.locator("#notebook-replay")).toBeEnabled();
    await page.goto("/");
  }
});
