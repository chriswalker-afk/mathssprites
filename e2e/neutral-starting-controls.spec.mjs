import {test,expect} from "@playwright/test";

/** PR45 student-facing contract: no hidden answer in the selected controls. */
async function expectNeutral(page){
  for(const selector of ["[data-operation].selected","[data-kind].selected"])
    await expect(page.locator(selector)).toHaveCount(0);
  for(const selector of ["[data-operation][aria-pressed=true]","[data-kind][aria-pressed=true]"])
    await expect(page.locator(selector)).toHaveCount(0);
  await expect(page.locator("#amount-value")).toHaveText("—");
  await expect(page.locator("#object-picker")).toBeVisible();
  await expect(page.locator("#amount-control")).toBeVisible();
  await expect(page.locator("#amount-up")).toBeDisabled();
  await expect(page.locator("#do-both")).toBeDisabled();
}
test.beforeEach(async({page})=>{
  await page.goto("/");
});
test("new Guided level, reset and revisiting never reveal the authored move @quick",async({page})=>{
  await page.locator("#home-play").click();
  await expectNeutral(page);
  await page.locator('[data-operation="remove"]').click();
  await expect(page.locator("#object-picker")).toBeVisible();
  await expect(page.locator("#amount-control")).toBeVisible();
  await expect(page.locator("#amount-up")).toBeDisabled();
  await page.locator('[data-kind="posOne"]').click();
  await expect(page.locator("#amount-value")).toHaveText("—");
  await expect(page.locator("#do-both")).toBeDisabled();
  await page.locator("#amount-up").click();
  await expect(page.locator("#amount-value")).toHaveText("1");
  await page.locator("#amount-up").click();
  await expect(page.locator("#amount-value")).toHaveText("2");
  await expect(page.locator("#do-both")).toBeEnabled();
  await page.locator("#reset").click();
  await expectNeutral(page);
  await page.locator("#game-levels").click();
  await page.locator('[data-level="3"]').click();
  await expectNeutral(page);
  await page.reload();
  await page.locator("#home-play").click();
  await expectNeutral(page);
});
test("division is not preselected and requires student-selected group count",async({page})=>{
  await page.locator("#home-choose-level").click();
  await page.locator('[data-level="6"]').click();
  await expectNeutral(page);
  await page.locator('[data-operation="divide"]').click();
  await expect(page.locator("#amount-value")).toHaveText("—");
  await expect(page.locator("#do-both")).toBeDisabled();
  await page.locator("#amount-up").click();
  await expect(page.locator("#amount-value")).toHaveText("2");
  await expect(page.locator("#do-both")).toBeEnabled();
});
test("Independent and Opposite Chambers do not highlight solution choices",async({page})=>{
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-stage="independent"]').click();
  await page.locator('[data-level="1"]').click();
  await expectNeutral(page);
  await expect(page.locator("#left-action")).toBeDisabled();
  await expect(page.locator("#right-action")).toBeDisabled();
  await page.locator('[data-operation="remove"]').click();
  await page.locator('[data-kind="posOne"]').click();
  await page.locator("#amount-up").click();
  await expect(page.locator("#left-action")).toBeEnabled();
  await page.locator("#game-levels").click();
  await page.locator('[data-map-world="opposites"]').click();
  await page.locator('[data-map-stage="guided"]').click();
  await page.locator('[data-level="1"]').click();
  await expectNeutral(page);
  await expect(page.locator('[data-kind="negOne"]')).toBeVisible();
  await expect(page.locator("[data-operation].selected")).toHaveCount(0);
});
test("sealed crates do not suggest Divide or Open as the first move",async({page})=>{
  await page.locator("#home-choose-level").click();
  await page.locator('[data-level="19"]').click();
  await expectNeutral(page);
  await expect(page.locator("#crate-controls")).toBeVisible();
  await expect(page.locator("#unpack-crates")).toBeEnabled();
  await expect(page.locator('[data-operation="divide"]')).toHaveAttribute("aria-pressed","false");
});
