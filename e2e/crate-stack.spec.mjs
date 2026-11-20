import {clickWithReferenceMove} from "./reference-move-helper.mjs";
import {test,expect} from "@playwright/test";

async function openLevel19(page){
  await page.goto("/");
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="workshop"]').click();
  await page.locator('[data-map-stage="guided"]').click();
  await page.locator('[data-level="19"]').click();
  await expect(page.locator("#level-title")).toHaveText("Sealed Crates");
}
async function geometry(page){
  return page.evaluate(()=>{
    const r=s=>{const el=document.querySelector(s);if(!el)return null;
      const b=el.getBoundingClientRect();
      return {x:b.x,y:b.y,width:b.width,height:b.height,top:b.top,bottom:b.bottom,left:b.left,right:b.right};};
    return {viewport:{width:innerWidth,height:innerHeight},
      scrollWidth:document.documentElement.scrollWidth,
      top:r('#left-items .sealed-crate[data-crate-index="0"]'),
      bottom:r('#left-items .sealed-crate[data-crate-index="1"]'),
      sign:r("#left-items .crate-picture-sign"),
      count:r("#left-items .crate-stack-count"),
      chamber:r("#left-chamber .room-interior"),
      floor:r("#left-chamber .room-floor"),
      track:r("#left-items .floor-track")};
  });
}
test.beforeEach(async({page})=>page.emulateMedia({reducedMotion:"reduce"}));
test("concept layout: two sealed crates are vertically stacked with only one illustrated picture and linked count @smoke",async({page})=>{
  test.setTimeout(90000);
  await openLevel19(page);
  const crates=page.locator("#left-items .sealed-crate");
  await expect(crates).toHaveCount(2);
  await expect(page.locator("#left-items .crate-picture-sign")).toHaveCount(1);
  await expect(page.locator("#left-items .crate-stack-count")).toHaveText("2 crates");
  await expect(page.locator("#left-items .crate-sign-sprite")).toHaveCount(1);
  await expect(page.locator("#left-items .crate-sign-weight")).toHaveCount(3);
  await expect(page.locator("#left-items .crate-wood-face")).toHaveCount(2);
  await expect(page.locator("#left-items .crate-diagonal-brace")).toHaveCount(2);
  await expect(page.locator("#left-crate-contents")).toHaveCount(0);
  const m=await geometry(page);
  expect(Math.abs(m.top.x-m.bottom.x)).toBeLessThan(2);
  expect(m.top.bottom).toBeLessThanOrEqual(m.bottom.top+4);
  expect(m.count.right).toBeLessThanOrEqual(m.top.left+5);
  expect(m.sign.top).toBeGreaterThanOrEqual(m.bottom.top-3);
  expect(m.sign.bottom).toBeLessThanOrEqual(m.bottom.bottom+3);
  expect(m.scrollWidth).toBeLessThanOrEqual(m.viewport.width+3);
  await page.screenshot({path:"artifacts/pr40-stack-two-crates.png",fullPage:true});
});
test("divide-first keeps the picture sign and updates 2 crates to 1 crate @smoke",async({page})=>{
  test.setTimeout(95000);
  await openLevel19(page);
  await expect(page.locator('[data-operation="divide"]')).toHaveAttribute("aria-pressed","false");
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(1,{timeout:40000});
  await expect(page.locator("#left-items .crate-stack-count")).toHaveText("1 crate");
  await expect(page.locator("#left-items .crate-picture-sign")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(7);
  await page.screenshot({path:"artifacts/pr40-stack-one-crate.png",fullPage:true});
  await page.locator("#unpack-crates").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:30000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(3);
});
test("stack and label fit the room on desktop, laptop and phone @smoke",async({page})=>{
  test.setTimeout(95000);
  for(const size of [
    {width:1092,height:540,name:"short-laptop"},
    {width:1024,height:720,name:"laptop"},
    {width:1440,height:900,name:"desktop"},
    {width:1920,height:1080,name:"wide-monitor"},
    {width:375,height:812,name:"phone"}
  ]){
    await page.setViewportSize(size);
    await openLevel19(page);
    const m=await geometry(page);
    expect(m.scrollWidth).toBeLessThanOrEqual(size.width+3);
    expect(m.top.bottom).toBeLessThanOrEqual(m.bottom.top+4);
    expect(Math.abs(m.top.x-m.bottom.x)).toBeLessThan(3);
    expect(m.count.right).toBeLessThanOrEqual(m.top.left+6);
    expect(m.top.top).toBeGreaterThanOrEqual(m.chamber.top+4);
    expect(m.bottom.bottom).toBeLessThanOrEqual(m.chamber.bottom+3);
    await page.locator("#unpack-crates").scrollIntoViewIfNeeded();
    await expect(page.locator("#unpack-crates")).toBeInViewport();
    await page.screenshot({path:"artifacts/pr40-stack-"+size.name+".png",fullPage:true});
    await page.locator("#game-home").click();
  }
});
