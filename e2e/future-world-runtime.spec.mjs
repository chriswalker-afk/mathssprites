import {test,expect} from "@playwright/test";

/** Test-only future world fixture. Nothing here adds public puzzle access. */
const signedLevel={
  id:"test-opposite-01",title:"A zero pair",chapter:"01 · Zero pairs",
  prompt:"Signed numbers may use balloons and white sprites.",
  left:{posX:1,negOne:1},right:{posOne:2},solution:3,
  quantityMode:"signed",lockPositive:false,
  allowedOperations:["add","remove","divide","multiply"],
  startingOperation:"remove",startingKind:"negOne",startingAmount:1
};
async function fakeCampaignLaunch(page,{level=signedLevel,stage="guided",
  method="auto",stageNumber=1}={}){
  await page.goto("/");
  await page.evaluate(({level,stage,method,stageNumber})=>{
    document.getElementById("site-shell").hidden=true;
    document.getElementById("game-shell").hidden=false;
    window.dispatchEvent(new CustomEvent("mathssprites:launch",{
      detail:{
        worldId:"opposites",stage,number:1,method,
        worldNumber:2,stageNumber,stageLength:3,
        chapterIndex:0,chapterTitle:"Zero pairs",
        chapterLevels:[{id:level.id,title:level.title,number:1}],
        level,legacyIndex:0
      }
    }));
  },{level,stage,method,stageNumber});
}
test("future-world launch respects signed engine mode and world-aware chapter info @smoke",async({page})=>{
  await fakeCampaignLaunch(page);
  await expect(page.locator("#scene")).toBeVisible();
  await expect(page.locator("#quantity-mode")).toHaveValue("signed");
  await expect(page.locator("#chapter-status")).toContainText("WORLD 2 · STAGE 1 · LEVEL 01 / 3");
  await expect(page.locator("#chapter")).toContainText("Zero pairs");
  await expect(page.locator("#object-picker")).toBeHidden();
  await page.locator('[data-operation="remove"]').click();
  await expect(page.locator('[data-kind="negOne"]')).toBeVisible();
  await expect(page.locator("#left-items .balloon")).toHaveCount(1);
  await expect(page.locator(".progress-dot")).toHaveCount(1);
  await expect(page.locator("#apprentice-guide")).toBeHidden();
  await page.screenshot({path:"artifacts/pr32-future-world-signed-fixture.png"});
});
test("future world may use different stage IDs with existing manual hand control",async({page})=>{
  await fakeCampaignLaunch(page,{stage:"signed-independent",method:"manual",stageNumber:4});
  await expect(page.locator("#campaign-hand-title")).toHaveText("Your Turn");
  await expect(page.locator("#chapter-status")).toContainText("WORLD 2 · STAGE 4");
  await expect(page.locator("#left-action")).toBeVisible();
  await expect(page.locator("#do-both")).toBeHidden();
  await expect(page.locator("#quantity-mode")).toHaveValue("signed");
});
test("future world may reuse notebook mode with an arbitrary stage ID",async({page})=>{
  const level={id:"test-future-paper",title:"Paper experiment",
    chapter:"01 · Equations",prompt:"Try subtracting three weights.",
    left:{posX:1,posOne:3},right:{posOne:8},solution:5,
    quantityMode:"positive",lockPositive:true,
    allowedOperations:["add","remove","multiply","divide"]};
  await page.goto("/");
  await page.evaluate(level=>{
    document.getElementById("site-shell").hidden=true;
    document.getElementById("game-shell").hidden=false;
    window.dispatchEvent(new CustomEvent("mathssprites:notebook-campaign",{
      detail:{worldId:"opposites",stage:"paper-experiments",method:"notebook",
        number:1,worldNumber:2,stageNumber:3,stageLength:1,
        chapterIndex:0,chapterTitle:"Equations",
        chapterLevels:[{id:level.id,title:level.title,number:1}],level}
    }));
  },level);
  await expect(page.locator("#notebook-workspace")).toBeVisible();
  await expect(page.locator("#chapter-status")).toContainText("WORLD 2 · STAGE 3 · LEVEL 01 / 1");
  await expect(page.locator("#notebook-operation")).toBeVisible();
});
