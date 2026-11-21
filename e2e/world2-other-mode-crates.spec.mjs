import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
});
async function open(page,stage,level){
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="opposites"]').click();
  await page.locator('[data-map-stage="'+stage+'"]').click();
  await page.locator('[data-level="'+level+'"]').click();
  await expect(page.locator("#chapter-status"))
    .toContainText("LEVEL "+String(level).padStart(2,"0"));
}
test("World 2 Independent 17 keeps the hand visits paired but opens the one remaining signed crate locally @smoke",async({page})=>{
  test.setTimeout(130000);
  await open(page,"independent",17);
  await expect(page.locator("#level-title")).toHaveText("The careful unsealing");
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(2);
  await expect(page.locator("#left-items .crate-bay-balloon")).toHaveCount(2);
  await expect(page.locator("#left-items .weight")).toHaveCount(2);
  await expect(page.locator("#object-picker")).toBeHidden();
  await page.locator('[data-operation="divide"]').click();
  await page.locator("#amount-up").click();
  await expect(page.locator("#amount-value")).toHaveText("2");
  await page.locator("#left-action").click();
  await expect(page.locator("#right-action")).toBeEnabled({timeout:32000});
  await expect(page.locator("#unpack-crates")).toBeDisabled();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(8);
  await page.locator("#right-action").click();
  await expect(page.locator("#right-items .weight")).toHaveCount(4,{timeout:32000});
  await expect(page.locator("#rooms-row")).toHaveAttribute("style",/rotate\(0deg\)/);
  await expect(page.locator("#unpack-crates")).toBeEnabled();
  await page.locator("#unpack-crates").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:50000});
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:35000});
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(save.worlds.opposites.stages.independent.completed).toContain("op-i-17");
  expect(save.worlds.opposites.stages.independent.bestMoves["op-i-17"]).toBe(2);
});

test("World 2 Independent 19 opens the EASTERN signed crates without altering the west @smoke",async({page})=>{
  test.setTimeout(105000);
  await page.setViewportSize({width:375,height:812});
  await open(page,"independent",19);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(3);
  await expect(page.locator("#right-items .sealed-crate")).toHaveCount(2);
  await expect(page.locator("#right-items .crate-bay-balloon")).toHaveCount(2);
  await expect(page.locator("#left-pair-actions")).toBeHidden();
  await page.locator("#unpack-crates").scrollIntoViewIfNeeded();
  await expect(page.locator("#unpack-crates")).toHaveAttribute("data-crate-side","right");
  await page.locator("#unpack-crates").click();
  await expect(page.locator("#right-items .sealed-crate")).toHaveCount(0,{timeout:55000});
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(2);
  await expect(page.locator("#right-items .balloon")).toHaveCount(2);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(3);
  await page.locator("#undo").click();
  await expect(page.locator("#right-items .sealed-crate")).toHaveCount(2);
  await expect(page.locator("#right-items .balloon")).toHaveCount(0);
  const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(378);
});

test("World 2 signed Apprentice 14 keeps 2x−x inside the brackets until the student expands @smoke",async({page})=>{
  test.setTimeout(135000);
  await open(page,"notebook",14);
  await expect(page.locator("#notebook-workspace")).toBeVisible();
  await expect(page.locator("#scene")).toBeHidden();
  await expect(page.locator('[data-notebook-expand="left"]')).toBeVisible();
  await expect(page.locator("#notebook-current-math math")).toContainText("2x−x+1");
  await expect(page.locator("#notebook-operation")).toHaveValue("");
  await page.locator("#notebook-operation").fill("÷3");
  await expect(page.locator("#notebook-result-math")).toContainText("6");
  await page.locator("#notebook-apply").click();
  await expect(page.locator("#notebook-lines li")).toHaveCount(2);
  await page.locator('[data-notebook-expand="left"]').click();
  await expect(page.locator("#notebook-apply")).toHaveText("Expand selected expression →");
  await page.locator("#notebook-apply").click();
  await expect(page.locator('[data-notebook-expand="left"]')).toBeHidden();
  await expect(page.locator("#notebook-current-math math")).not.toContainText("(");
  await page.locator("#notebook-operation").fill("−1");
  await page.locator("#notebook-apply").click();
  await expect(page.locator("#notebook-replay")).toBeEnabled();
  await expect(page.locator("#scene")).toBeHidden();
  await page.locator("#notebook-replay").click();
  await expect(page.locator("#notebook-next")).toBeVisible({timeout:95000});
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(save.worlds.opposites.stages.notebook.completed).toContain("op-a-14");
});

test("World 2 Apprentice 15 offers a RIGHT expression expansion; new stages keep four-level chapter blocks @quick",async({page})=>{
  await page.setViewportSize({width:1092,height:540});
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="opposites"]').click();
  await page.locator('[data-map-stage="independent"]').click();
  await expect(page.locator(".chapter-group")).toHaveCount(5);
  await expect(page.locator(".level-tile")).toHaveCount(20);
  await page.locator('[data-map-stage="notebook"]').click();
  await expect(page.locator(".chapter-group")).toHaveCount(4);
  await expect(page.locator(".level-tile")).toHaveCount(16);
  await page.locator('[data-level="15"]').click();
  await expect(page.locator('[data-notebook-expand="right"]')).toBeVisible();
  await expect(page.locator('[data-notebook-expand="left"]')).toBeHidden();
  await page.locator('[data-notebook-expand="right"]').click();
  await expect(page.locator("#notebook-operation")).toHaveValue("expand right");
  await expect(page.locator("#notebook-apply")).toBeEnabled();
});
