import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
});
async function openGuided(page,n){
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="opposites"]').click();
  await page.locator('[data-map-stage="guided"]').click();
  await page.locator('[data-level="'+n+'"]').click();
}
async function divideBy(page,n){
  await page.locator('[data-operation="divide"]').click();
  for(let i=1;i<n;i++)await page.locator("#amount-up").click();
  await expect(page.locator("#amount-value")).toHaveText(String(n));
}
async function removeWeights(page,n){
  await page.locator('[data-operation="remove"]').click();
  await page.locator('[data-kind="posOne"]').click();
  for(let i=0;i<n;i++)await page.locator("#amount-up").click();
  await expect(page.locator("#amount-value")).toHaveText(String(n));
}

test("World 2 Guided 22 starts with black/white pairs, then real sealed groups reveal x + 2 @smoke",async({page})=>{
  test.setTimeout(115000);
  await openGuided(page,22);
  await expect(page.locator("#level-title")).toHaveText("The pale passenger");
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(3);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .sprite-white")).toHaveCount(1);
  await expect(page.locator("#object-picker")).toBeHidden();
  const pair=page.locator('[data-pair-side="left"][data-pair-type="sprites"]');
  await expect(pair).toBeVisible();
  await pair.click();
  await expect(page.locator("#left-items .sprite-white")).toHaveCount(0,{timeout:25000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(0);
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(3);
  await page.locator("#undo").click();
  await expect(page.locator("#left-items .sprite-white")).toHaveCount(1);
  await divideBy(page,3);
  await page.locator("#do-both").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(1,{timeout:30000});
  await expect(page.locator("#right-items .weight")).toHaveCount(7);
  await page.locator("#unpack-crates").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:40000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(2);
  await removeWeights(page,2);
  await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:35000});
  await expect(page.locator("#replay-star-summary")).toContainText("3 stars");
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(save.worlds.opposites.stages.guided.completed).toContain("op-g-22");
  expect(save.worlds.opposites.stages.guided.bestMoves["op-g-22"]).toBe(3);
});

test("World 2 Guided 24 releases actual balloons from crates, cancels three pairs, and Undo reseals @smoke",async({page})=>{
  test.setTimeout(105000);
  await page.setViewportSize({width:375,height:812});
  await openGuided(page,24);
  await expect(page.locator("#level-title")).toHaveText("The sealed negatives");
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(2);
  await expect(page.locator("#left-items .crate-bay-balloon")).toHaveCount(4);
  await expect(page.locator("#left-items .balloon")).toHaveCount(0);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(3);
  await page.locator("#unpack-crates").scrollIntoViewIfNeeded();
  await page.locator("#unpack-crates").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:55000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(3);
  await expect(page.locator("#left-items .balloon")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(0);
  await expect(page.locator("#right-items .weight")).toHaveCount(14);
  const width=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(378);
  await page.screenshot({path:"artifacts/pr57-world2-negative-crates-opened-phone.png",fullPage:true});
  await page.locator("#undo").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(2);
  await expect(page.locator("#left-items .crate-bay-balloon")).toHaveCount(4);
  await expect(page.locator("#left-items .balloon")).toHaveCount(0);
  await expect(page.locator("#left-items .weight")).toHaveCount(3);
});

test("six signed Guided chapters fit the short-laptop level board without hiding the new chapter @quick",async({page})=>{
  await page.setViewportSize({width:1092,height:540});
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="opposites"]').click();
  await expect(page.locator(".chapter-group")).toHaveCount(6);
  await expect(page.locator(".level-tile")).toHaveCount(24);
  await page.locator('[data-level="24"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-level="24"]')).toBeInViewport();
  const size=await page.evaluate(()=>({
    width:document.documentElement.scrollWidth,
    height:document.documentElement.scrollHeight
  }));
  expect(size.width).toBeLessThanOrEqual(1095);
  expect(size.height).toBeLessThanOrEqual(543);
});
