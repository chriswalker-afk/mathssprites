import {openCampaignBoard} from "./campaign-menu-helper.mjs";
import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
});
async function openStage(page,stage,level){
  await openCampaignBoard(page,"workshop",stage);
  await page.locator('[data-level="'+level+'"]').click();
  await expect(page.locator("#chapter-status")).toContainText("LEVEL "+String(level).padStart(2,"0"));
}
async function chooseDivide(page,factor){
  await page.locator('[data-operation="divide"]').click();
  await expect(page.locator("#amount-value")).toHaveText("—");
  await page.locator("#amount-up").click();
  for(let n=2;n<factor;n++)await page.locator("#amount-up").click();
  await expect(page.locator("#amount-value")).toHaveText(String(factor));
}
test("Independent groups begin neutral and open as ONE local, reversible rewrite @smoke",async({page})=>{
  test.setTimeout(70000);
  await openStage(page,"independent",19);
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(2);
  await expect(page.locator("#left-items .weight")).toHaveCount(2);
  await expect(page.locator("#right-items .weight")).toHaveCount(16);
  await expect(page.locator("#crate-controls")).toBeVisible();
  await expect(page.locator("#unpack-crates")).toBeEnabled();
  await expect(page.locator("[data-operation].selected")).toHaveCount(0);
  await expect(page.locator("#amount-value")).toHaveText("—");
  await expect(page.locator("#left-action")).toBeDisabled();
  await expect(page.locator("#right-action")).toBeDisabled();
  await page.locator("#unpack-crates").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:35000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(2);
  await expect(page.locator("#left-items .weight")).toHaveCount(8);
  await expect(page.locator("#right-items .weight")).toHaveCount(16);
  await expect(page.locator("#rooms-row")).toHaveAttribute("style",/rotate\(0deg\)/);
  await page.locator("#undo").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(2);
  await expect(page.locator("#left-items .weight")).toHaveCount(2);
  await expect(page.locator("#right-items .weight")).toHaveCount(16);
});
test("Mixed sealed and loose division has two real floor zones, never baskets around crates @smoke",async({page})=>{
  test.setTimeout(105000);
  await openStage(page,"independent",19);
  await chooseDivide(page,2);
  const move=page.locator("#left-action").click();
  await expect(page.locator("#left-items .mixed-crate-division-stage")).toBeVisible({timeout:8000});
  await expect(page.locator("#left-items .mixed-crate-division-stage > .crate-division-stage .sealed-crate")).toHaveCount(2);
  await expect(page.locator("#left-items .mixed-crate-division-stage > .division-stage .sealed-crate")).toHaveCount(0);
  await expect(page.locator("#left-items .mixed-crate-division-stage > .division-stage .weight")).toHaveCount(2);
  await move;
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(1,{timeout:32000});
  await expect(page.locator("#left-items .weight")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(16);
  await expect(page.locator("#right-action")).toContainText("Match");
  await page.locator("#right-action").click();
  await expect(page.locator("#right-items .weight")).toHaveCount(8,{timeout:35000});
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(1);
  await expect(page.locator("#right-items .group-basket .sealed-crate")).toHaveCount(0);
  await expect(page.locator("#rooms-row")).toHaveAttribute("style",/rotate\(0deg\)/);
});
test("Apprentice keeps the brackets on paper until student chooses Expand, then replays physical crates @smoke",async({page})=>{
  test.setTimeout(130000);
  await openStage(page,"notebook",13);
  await expect(page.locator("#notebook-workspace")).toBeVisible();
  await expect(page.locator("#scene")).toBeHidden();
  await expect(page.locator('[data-notebook-expand="left"]')).toBeVisible();
  await expect(page.locator('[data-notebook-expand="right"]')).toBeHidden();
  await expect(page.locator("#notebook-operation")).toHaveValue("");
  await expect(page.locator("#notebook-apply")).toBeDisabled();
  await expect(page.locator("#notebook-current-math math")).toContainText("(");
  await page.locator('[data-notebook-expand="left"]').click();
  await expect(page.locator("#notebook-operation")).toHaveValue("expand left");
  await expect(page.locator("#notebook-result-math")).toContainText("2");
  await page.locator("#notebook-apply").click();
  await expect(page.locator("#notebook-lines li")).toHaveCount(2);
  await expect(page.locator('[data-notebook-expand="left"]')).toBeHidden();
  await expect(page.locator("#notebook-current-math math")).not.toContainText("(");
  await page.locator("#notebook-operation").fill("−2");
  await page.locator("#notebook-apply").click();
  await page.locator("#notebook-operation").fill("÷2");
  await page.locator("#notebook-apply").click();
  await expect(page.locator("#notebook-replay")).toBeEnabled();
  await expect(page.locator("#scene")).toBeHidden();
  await page.locator("#motion-toggle").click();
  await page.locator("#notebook-replay").click();
  await expect(page.locator("#scene")).toBeVisible();
  await expect(page.locator("#notebook-next")).toBeVisible({timeout:90000});
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(save.worlds.workshop.stages.notebook.completed).toContain("apprentice-13");
});
