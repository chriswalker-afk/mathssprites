import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
});

test("starting weights and balloons can be attached only in their own chamber; Undo restores them @quick @smoke",async({page})=>{
  test.setTimeout(60000);
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="opposites"]').click();
  await page.locator('[data-level="18"]').click();
  await expect(page.locator("#level-title")).toHaveText("Removing the negative");
  const right=page.locator("#right-items");
  await expect(right.locator(".token.weight")).toHaveCount(8);
  await expect(right.locator(".token.balloon")).toHaveCount(2);
  await expect(page.locator("#left-pair-actions")).toBeHidden();
  const attach=page.locator('#right-pair-actions [data-pair-type="constants"]');
  await expect(attach).toBeVisible();
  await expect(attach).toContainText("Attach 2 weights to balloons");
  await expect(page.locator('[data-pair-side="right"][data-pair-type="sprites"]')).toBeHidden();
  await expect(page.locator("[data-operation].selected")).toHaveCount(0);
  await attach.click();
  await expect(right.locator(".token.weight")).toHaveCount(6,{timeout:20000});
  await expect(right.locator(".token.balloon")).toHaveCount(0);
  await expect(page.locator("#right-pair-actions")).toBeHidden();
  await expect(page.locator("#balance-caption")).not.toContainText("unbalanced");
  await expect(page.locator("#undo")).toBeEnabled();
  await page.locator("#undo").click();
  await expect(right.locator(".token.weight")).toHaveCount(8);
  await expect(right.locator(".token.balloon")).toHaveCount(2);
  await expect(attach).toBeVisible();
  await expect(page.locator("#do-both")).toBeDisabled();
});

test("independent-stage starting balloon pairs do not create a manual pending move @smoke",async({page})=>{
  test.setTimeout(60000);
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="opposites"]').click();
  await page.locator('[data-map-stage="independent"]').click();
  await page.locator('[data-level="6"]').click();
  await expect(page.locator("#left-action")).toBeDisabled();
  const right=page.locator("#right-items");
  await expect(right.locator(".token.weight")).toHaveCount(13);
  await expect(right.locator(".token.balloon")).toHaveCount(2);
  await page.locator('[data-pair-side="right"][data-pair-type="constants"]').click();
  await expect(right.locator(".token.weight")).toHaveCount(11,{timeout:20000});
  await expect(right.locator(".token.balloon")).toHaveCount(0);
  await expect(page.locator("#balance-caption")).not.toContainText("matching move");
  await expect(page.locator("#left-action")).toBeDisabled();
});
