import {playCampaignLevel} from "./campaign-menu-helper.mjs";
import {openCampaignBoard,chooseCampaignWorld,chooseCampaignStage,launchHomeOrFirst} from "./campaign-menu-helper.mjs";
import {test,expect} from "@playwright/test";

/** PR45 student-facing contract: no hidden answer in the selected controls. */
async function expectNeutral(page){
  for(const selector of ["[data-operation].selected","[data-kind].selected"])
    await expect(page.locator(selector)).toHaveCount(0);
  for(const selector of ["[data-operation][aria-pressed=true]","[data-kind][aria-pressed=true]"])
    await expect(page.locator(selector)).toHaveCount(0);
  await expect(page.locator("#amount-value")).toHaveText("—");
  // First choose an operation. Neither object nor amount is offered yet.
  await expect(page.locator("#object-picker")).toBeHidden();
  await expect(page.locator("#amount-control")).toBeHidden();
  await expect(page.locator("#amount-up")).toBeDisabled();
  await expect(page.locator("#do-both")).toBeDisabled();
}
test.beforeEach(async({page})=>{
  await page.goto("/");
});
test("new Guided level, reset and revisiting never reveal the authored move @quick",async({page})=>{
  await launchHomeOrFirst(page);
  await expectNeutral(page);
  await page.locator('[data-operation="remove"]').click();
  await expect(page.locator("#object-picker")).toBeVisible();
  await expect(page.locator("#amount-control")).toBeHidden();
  await expect(page.locator("#amount-up")).toBeDisabled();
  await page.locator('[data-kind="posOne"]').click();
  await expect(page.locator("#amount-control")).toBeVisible();
  await expect(page.locator("#amount-label")).toHaveText("3 · How many?");
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
  await playCampaignLevel(page,page.locator('[data-level="3"]'));
  await expectNeutral(page);
  await page.reload();
  await launchHomeOrFirst(page);
  await expectNeutral(page);
});
test("division is not preselected and requires student-selected group count",async({page})=>{
  await openCampaignBoard(page);
  await playCampaignLevel(page,page.locator('[data-level="6"]'));
  await expectNeutral(page);
  await page.locator('[data-operation="divide"]').click();
  await expect(page.locator("#object-picker")).toBeHidden();
  await expect(page.locator("#amount-control")).toBeVisible();
  await expect(page.locator("#amount-label")).toHaveText("2 · How many groups?");
  await expect(page.locator("#amount-value")).toHaveText("—");
  await expect(page.locator("#do-both")).toBeDisabled();
  await page.locator("#amount-up").click();
  await expect(page.locator("#amount-value")).toHaveText("2");
  await expect(page.locator("#do-both")).toBeEnabled();
  await page.locator('[data-operation="multiply"]').click();
  await expect(page.locator("#object-picker")).toBeHidden();
  await expect(page.locator("#amount-label")).toHaveText("2 · How many groups?");
  await expect(page.locator("#amount-value")).toHaveText("—");
  await page.locator("#amount-up").click();
  await expect(page.locator("#amount-value")).toHaveText("2");
});
test("Independent and Opposite Chambers do not highlight solution choices",async({page})=>{
  await openCampaignBoard(page,"workshop","independent");
  await playCampaignLevel(page,page.locator('[data-level="1"]'));
  await expectNeutral(page);
  await expect(page.locator("#left-action")).toBeDisabled();
  await expect(page.locator("#right-action")).toBeDisabled();
  await page.locator('[data-operation="remove"]').click();
  await page.locator('[data-kind="posOne"]').click();
  await page.locator("#amount-up").click();
  await expect(page.locator("#left-action")).toBeEnabled();
  await page.locator("#game-levels").click();
  await chooseCampaignWorld(page,"opposites");
  await chooseCampaignStage(page,"guided");
  await playCampaignLevel(page,page.locator('[data-level="1"]'));
  await expectNeutral(page);
  await expect(page.locator('[data-kind="negOne"]')).toBeHidden();
  await expect(page.locator("#object-picker")).toBeHidden();
  await page.locator('[data-operation="add"]').click();
  await expect(page.locator('[data-kind="negOne"]')).toBeVisible();
  await expect(page.locator("[data-operation].selected")).toHaveCount(1);
});
test("sealed crates do not suggest Divide or Open as the first move",async({page})=>{
  await openCampaignBoard(page);
  await playCampaignLevel(page,page.locator('[data-level="19"]'));
  await expectNeutral(page);
  await expect(page.locator("#crate-controls")).toBeVisible();
  await expect(page.locator("#unpack-crates")).toBeEnabled();
  await expect(page.locator('[data-operation="divide"]')).toHaveAttribute("aria-pressed","false");
});
