import { test, expect } from "@playwright/test";

test.beforeEach(async ({page}) => {
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/?preview=resident");
});

async function observeHand(page) {
  await page.evaluate(() => {
    const el = document.querySelector("#hand");
    window.__handPhases = [el.dataset.phase];
    new MutationObserver(() => {
      window.__handPhases.push(el.dataset.phase);
    }).observe(el,{attributes:true,attributeFilter:["data-phase"]});
  });
}

test("illustrated hand contains separate articulated thumb, four digits, palm and cuff", async ({page}) => {
  const svg = page.locator("#hand svg.hand-art");
  await expect(svg).toBeAttached();
  await expect(svg.locator(".hand-digit")).toHaveCount(5);
  await expect(svg.locator(".digit-thumb")).toHaveCount(1);
  await expect(svg.locator(".hand-palm")).toHaveCount(1);
  await expect(svg.locator(".hand-sleeve-detail")).toHaveCount(1);
  const gradients=await svg.locator("linearGradient,radialGradient").count();
  expect(gradients).toBeGreaterThanOrEqual(4);
  const details=await svg.locator("path,ellipse,circle").count();
  expect(details).toBeGreaterThan(20);
});

test("remove animates open hand, closing fingers, pickup and lift BEFORE changing the next room",async ({page})=>{
  await observeHand(page);
  const finger=page.locator("#hand .digit-index");
  const openTransform=await finger.evaluate(el=>getComputedStyle(el).transform);
  await page.locator("#do-both").click();
  await expect(page.locator("#hand")).toHaveAttribute("data-phase","grip");
  await page.waitForTimeout(110);
  const gripTransform=await finger.evaluate(el=>getComputedStyle(el).transform);
  expect(gripTransform).not.toBe(openTransform);

  await expect(page.locator("#left-items .weight")).toHaveCount(0);
  const contact=await page.evaluate(()=>({
    handDown:document.querySelector("#hand").classList.contains("reaching"),
    carrying:!document.querySelector("#hand-cargo").hidden,
    rightCount:document.querySelectorAll("#right-items .weight").length,
    replayHidden:document.querySelector("#replay-backdrop").hidden
  }));
  expect(contact).toMatchObject({handDown:true,carrying:true,rightCount:5,replayHidden:true});
  await page.screenshot({path:"artifacts/illustrated-hand-grasp-desktop.png"});
  await expect(page.locator("#right-items .weight")).toHaveCount(3);
  await expect(page.locator("#replay-backdrop")).toBeVisible();
  const phases=await page.evaluate(()=>window.__handPhases);
  expect(phases.filter(x=>x==="grip").length).toBe(2);
  expect(phases).toContain("lift");
  expect(phases).toContain("exit");
});

test("add enters holding a weight, visibly releases it and withdraws empty",async ({page})=>{
  await observeHand(page);
  await page.locator('[data-operation="add"]').click();
  await page.locator("#do-both").click();
  await expect(page.locator("#hand")).toHaveAttribute("data-phase","carry");
  await expect(page.locator("#hand-cargo")).toBeVisible();
  await expect(page.locator("#left-items .weight")).toHaveCount(4);
  await expect(page.locator("#hand")).toHaveAttribute("data-phase","release");
  await expect(page.locator("#hand-cargo")).toBeHidden();
  await page.screenshot({path:"artifacts/illustrated-hand-release-desktop.png"});
  await expect(page.locator("#right-items .weight")).toHaveCount(7);
  await expect(page.locator("#hand")).toHaveAttribute("data-phase","rest");
  const phases=await page.evaluate(()=>window.__handPhases);
  expect(phases).toContain("release");
  expect(phases).toContain("exit");
  await expect(page.locator("#replay-backdrop")).toBeHidden();
});

test("a grouping operation shows the baskets first and then removes a complete group",async ({page})=>{
  await page.locator("#level-select").selectOption("1");
  await page.locator("#do-both").click();
  await expect(page.locator("#left-items .group-basket")).toHaveCount(3);
  await expect(page.locator("#right-items .group-basket")).toHaveCount(3);
  await page.screenshot({path:"artifacts/illustrated-hand-baskets-before.png"});
  await expect(page.locator("#left-items .group-basket")).toHaveCount(0);
  await expect(page.locator("#hand-cargo .held-basket")).toBeVisible();
  await expect(page.locator("#right-items .group-basket")).toHaveCount(3);
  await expect(page.locator("#replay-backdrop")).toBeVisible();
});

test("new hand remains legible and reaches into the room on mobile",async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.reload();
  await page.locator("#do-both").click();
  await expect(page.locator("#left-items .weight")).toHaveCount(0);
  const overlap=await page.evaluate(()=>{
    const art=document.querySelector("#hand svg").getBoundingClientRect();
    const room=document.querySelector("#left-items").getBoundingClientRect();
    return Math.max(0,Math.min(art.bottom,room.bottom)-Math.max(art.top,room.top));
  });
  expect(overlap).toBeGreaterThan(25);
  await page.screenshot({path:"artifacts/illustrated-hand-mobile.png"});
});
