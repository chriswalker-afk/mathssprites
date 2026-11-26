import {clickWithReferenceMove} from "./reference-move-helper.mjs";
import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/?preview=baskets");
});
test("real baskets fall EMPTY, receive the original tokens, and are carried away individually @smoke",async({page})=>{
  test.setTimeout(65000);
  await page.evaluate(()=>localStorage.setItem("mathssprites.cosmetics.v1",JSON.stringify({version:1,unlockedRewards:["grand-alchemist"],equipped:Object.fromEntries(["fur","eyes","headwear","eyewear","neckwear","movement","effect"].map(slot=>[slot,"grand-alchemist-"+slot]))})));
  await page.reload();
  await expect(page.locator("#left-items .sprite-wear-headwear").first()).toBeVisible();
  await clickWithReferenceMove(page,"#do-both");
  const west=page.locator("#left-items .division-stage");
  const row=west.locator(".basket-row");
  await expect(west).toHaveAttribute("data-phase","dropping",{timeout:8000});
  await expect(row.locator(":scope > .group-basket")).toHaveCount(3);
  await expect(west.locator(".division-source .token")).toHaveCount(3);
  await expect(west.locator(".basket-contents .token")).toHaveCount(0);
  // Inspect the active CSS while the baskets are still falling.
  // A screenshot can consume the entire 530ms landing animation, leaving
  // animationName="none" even though the visible basket choreography worked.
  const landingAnimation=await row.locator(".group-basket[data-state='dropping']").first().evaluate(el=>
    getComputedStyle(el).animationName);
  expect(landingAnimation).toContain("division-wicker-drop");
  await page.screenshot({path:"artifacts/pr25-01-wicker-baskets-dropping.png"});

  await expect(west).toHaveAttribute("data-phase","ready",{timeout:10000});
  await expect(west.locator(".division-source .token")).toHaveCount(0);
  await expect(west.locator(".basket-contents .sprite-black")).toHaveCount(3);
  await expect(row.locator(".basket-contents .sprite-black")).toHaveCount(3);
  for(const slot of ["headwear","eyewear","neckwear"]){
    await expect(row.locator(".basket-contents .sprite-wear-"+slot)).toHaveCount(3);
    await expect(row.locator(".basket-contents .sprite-wear-"+slot).first()).toBeVisible();
  }
  await expect(row.locator(".basket-contents .sprite-motion").first()).toHaveCSS("animation-name","sprite-basket-bob");
  await expect(row.locator(".basket-contents .sprite-cosmetic-effect").first()).toHaveCSS("visibility","hidden");
  await expect(row.locator(".group-basket")).toHaveCount(3);
  expect(await row.locator(".basket-contents").evaluateAll(nodes=>nodes.map(n=>n.querySelectorAll(".token").length)))
    .toEqual([1,1,1]);
  await page.screenshot({path:"artifacts/pr25-02-three-equal-wicker-groups.png"});

  await expect(row.locator(".group-basket")).toHaveCount(2,{timeout:12000});
  await expect(page.locator("#hand-cargo > .basket-in-hand")).toHaveCount(1,{timeout:12000});
  await page.screenshot({path:"artifacts/pr25-03-hand-carrying-full-basket.png"});
  await expect(row.locator(".group-basket")).toHaveCount(1,{timeout:12000});
  await expect(west).toHaveAttribute("data-phase","remaining",{timeout:14000});
  await page.screenshot({path:"artifacts/pr25-04-one-basket-remains.png"});
  await expect(page.locator("#left-items .division-stage")).toHaveCount(0,{timeout:12000});
  await expect(page.locator("#left-items .floor-track > .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .division-stage")).toHaveCount(1,{timeout:12000});
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:32000});
  await expect(page.locator("#left-items .group-basket")).toHaveCount(0);
  await expect(page.locator("#right-items .group-basket")).toHaveCount(0);
});
test("five-basket division on a phone keeps every basket inside its moving chamber",async({page})=>{
  test.setTimeout(75000);
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>localStorage.setItem("mathssprites.cosmetics.v1",JSON.stringify({version:1,unlockedRewards:["copper"],equipped:{"weight-material":"copper"}})));
  await page.goto("/?preview=five-baskets");
  await clickWithReferenceMove(page,"#do-both");
  const west=page.locator("#left-items .division-stage");
  await expect(west).toHaveAttribute("data-phase","ready",{timeout:12000});
  await expect(west.locator(".group-basket")).toHaveCount(5);
  const measured=await page.locator("#left-items").evaluate(room=>{
    const bounds=room.getBoundingClientRect();
    return [...room.querySelectorAll(".basket-row > .group-basket")].map(el=>{
      const b=el.getBoundingClientRect();
      return {left:b.left,right:b.right,roomLeft:bounds.left,roomRight:bounds.right};
    });
  });
  for(const rect of measured){
    expect(rect.left).toBeGreaterThanOrEqual(rect.roomLeft-4);
    expect(rect.right).toBeLessThanOrEqual(rect.roomRight+4);
  }
  expect(await west.locator(".basket-contents").evaluateAll(nodes=>nodes.map(n=>({
    sprites:n.querySelectorAll(".sprite-black").length,
    weights:n.querySelectorAll(".weight").length
  })))).toEqual(Array.from({length:5},()=>({sprites:1,weights:2})));
  await expect(west.locator(".basket-contents .weight").first()).toHaveCSS("background-image",/rgb\(242, 185, 142\)/);
  await page.screenshot({path:"artifacts/pr25-five-baskets-phone.png"});
  await expect(page.locator("#left-items .floor-track > .sprite-black")).toHaveCount(1,{timeout:23000});
  await expect(page.locator("#left-items .floor-track > .weight")).toHaveCount(2);
});
test("reduced motion provides readable basket snapshots without flying animation",async({page})=>{
  test.setTimeout(45000);
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: reduced");
  await clickWithReferenceMove(page,"#do-both");
  const west=page.locator("#left-items .division-stage");
  await expect(west).toHaveAttribute("data-phase","ready",{timeout:10000});
  await expect(west.locator(".group-basket")).toHaveCount(3);
  await expect(west).toHaveAttribute("data-phase","remaining",{timeout:10000});
  await expect(west.locator(".group-basket")).toHaveCount(1);
  await expect(page.locator("#left-items .floor-track > .sprite-black")).toHaveCount(1,{timeout:12000});
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:18000});
});
test("manual division only commits its paired operation after separate room visits",async({page})=>{
  test.setTimeout(80000);
  await page.locator("#mode-select").selectOption("manual");
  await clickWithReferenceMove(page,"#left-action");
  await expect(page.locator("#left-items .floor-track > .sprite-black")).toHaveCount(1,{timeout:22000});
  await expect(page.locator("#right-items .floor-track > .weight")).toHaveCount(9);
  await expect(page.locator("#replay-backdrop")).toBeHidden();
  await expect(page.locator("#right-action")).toContainText("Match the move");
  await clickWithReferenceMove(page,"#right-action");
  await expect(page.locator("#right-items .floor-track > .weight")).toHaveCount(3,{timeout:22000});
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:16000});
});
