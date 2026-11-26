import {test,expect} from "@playwright/test";
const worlds="#site-worlds",methods="#site-stages";
const demos=screen=>screen+" .menu-demo";
const motion=screen=>screen+" [data-menu-demo-toggle]";
async function chooseWorlds(page){
  await page.locator("#home-choose-level").click();
  await expect(page.locator(worlds)).toBeVisible();
}
async function animationNames(page,selector){
  return page.locator(selector).evaluate(el=>el.getAnimations({subtree:true}).map(a=>a.animationName));
}
async function seek(page,selector,time){
  await page.locator(selector).evaluate((el,ms)=>{
    for(const a of el.getAnimations({subtree:true})){a.pause();a.currentTime=ms;}
  },time);
}
async function opacity(page,selector){
  return page.locator(selector).evaluate(el=>Number(getComputedStyle(el).opacity));
}
test("world previews animate, can pause, and never alter campaign records @quick @smoke",async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
  const saved=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  await chooseWorlds(page);
  await expect(page.locator(demos(worlds))).toHaveCount(4);
  await expect(page.locator(worlds)).toHaveAttribute("data-demo-motion","playing");
  const names=await animationNames(page,worlds);
  for(const name of ["md-remove-early","md-zero-rise","md-whole-split","md-square-row-three"])expect(names).toContain(name);
  await page.locator(motion(worlds)).click();
  await expect(page.locator(worlds)).toHaveAttribute("data-demo-motion","paused");
  await expect(page.locator(motion(worlds))).toHaveText("Play previews");
  const fractions=worlds+' [data-menu-demo="fractions"]';
  await seek(page,fractions,4000);
  expect(await opacity(page,fractions+" .md-whole")).toBeLessThan(.1);
  expect(await opacity(page,fractions+" .md-half-left")).toBeGreaterThan(.9);
  expect(await opacity(page,fractions+" .md-half-right")).toBeGreaterThan(.9);
  const square=worlds+' [data-menu-demo="squares"]';
  await seek(page,square,4000);
  expect(await opacity(page,square+" .md-square-result")).toBeGreaterThan(.9);
  const opposite=worlds+' [data-menu-demo="opposites"]';
  await seek(page,opposite,5500);
  expect(await opacity(page,opposite+" .md-zero-pair")).toBeLessThan(.1);
  await page.locator('[data-world-stages="fractions"]').click();
  await expect(page.locator(worlds)).toHaveAttribute("data-demo-motion","inactive");
  await expect(page.locator(methods)).toHaveAttribute("data-demo-motion","paused");
  await expect(page.locator(demos(methods))).toHaveCount(3);
  expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))).toEqual(saved);
});
test("the methods tell different stories with the same equation @quick @smoke",async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
  await chooseWorlds(page);
  await page.locator('[data-world-stages="workshop"]').click();
  await page.locator(motion(methods)).click();
  const guided=methods+' [data-menu-demo="guided"]';
  const independent=methods+' [data-menu-demo="independent"]';
  const notebook=methods+' [data-menu-demo="notebook"]';
  await seek(page,guided,3500);
  expect(await opacity(page,guided+" .md-remove-left")).toBeLessThan(.1);
  expect(await opacity(page,guided+" .md-remove-right")).toBeLessThan(.1);
  await seek(page,independent,3500);
  expect(await opacity(page,independent+" .md-remove-left")).toBeLessThan(.1);
  expect(await opacity(page,independent+" .md-remove-right")).toBeGreaterThan(.9);
  expect(await page.locator(independent+" .md-beam").evaluate(el=>getComputedStyle(el).transform)).not.toBe("matrix(1, 0, 0, 1, 0, 0)");
  await seek(page,notebook,2800);
  expect(await opacity(page,notebook+" .md-paper-result")).toBeGreaterThan(.9);
  expect(await opacity(page,notebook+" .md-remove-left")).toBeGreaterThan(.9);
  await seek(page,notebook,5500);
  expect(await opacity(page,notebook+" .md-remove-left")).toBeLessThan(.1);
  expect(await opacity(page,notebook+" .md-remove-right")).toBeLessThan(.1);
  await page.locator('[data-stage-open="guided"]').click();
  await expect(page.locator("#site-levels")).toBeVisible();
  await expect(page.locator("#board-continue")).toBeDisabled();
  await expect(page.locator(methods)).toHaveAttribute("data-demo-motion","inactive");
});
test("system reduced motion defaults to still previews, with explicit opt in @quick @smoke",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
  await chooseWorlds(page);
  await expect(page.locator(worlds)).toHaveAttribute("data-demo-motion","reduced");
  expect(await animationNames(page,worlds)).toEqual([]);
  await expect(page.locator(motion(worlds))).toHaveText("Play previews");
  await page.locator(motion(worlds)).click();
  await expect(page.locator(worlds)).toHaveAttribute("data-demo-motion","playing");
  expect((await animationNames(page,worlds)).length).toBeGreaterThan(0);
  await page.locator(motion(worlds)).click();
  await expect(page.locator(worlds)).toHaveAttribute("data-demo-motion","paused");
  await page.locator('[data-world-stages="squares"]').click();
  await page.locator('.site-nav-links [data-screen="settings"]').click();
  // The game setting takes precedence over the local preview opt-in.
  await page.locator("#site-motion").click();
  await page.locator("#settings-return").click();
  await expect(page.locator(methods)).toHaveAttribute("data-demo-motion","reduced");
  expect(await animationNames(page,methods)).toEqual([]);
});
for(const size of [{width:1092,height:540},{width:375,height:812},{width:1920,height:1080}]){
  test("animated previews and menu actions remain reachable at "+size.width+"x"+size.height+" @smoke",async({page},info)=>{
    await page.setViewportSize(size);
    await page.emulateMedia({reducedMotion:"reduce"});
    await page.goto("/");
    await chooseWorlds(page);
    for(const image of await page.locator(demos(worlds)).all()){
      await image.scrollIntoViewIfNeeded();
      const b=await image.boundingBox();
      expect(b.width).toBeGreaterThan(70);expect(b.height).toBeGreaterThan(45);
    }
    for(const button of await page.locator("[data-world-stages]").all()){
      await button.scrollIntoViewIfNeeded();await expect(button).toBeInViewport();
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3)).toBe(true);
    await info.attach("world-previews.png",{body:await page.screenshot(),contentType:"image/png"});
    await page.locator('[data-world-stages="squares"]').click();
    for(const image of await page.locator(demos(methods)).all()){
      await image.scrollIntoViewIfNeeded();
      const b=await image.boundingBox();
      expect(b.width).toBeGreaterThan(80);expect(b.height).toBeGreaterThan(60);
    }
    for(const button of await page.locator("[data-stage-open]").all()){
      await button.scrollIntoViewIfNeeded();await expect(button).toBeInViewport();
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3)).toBe(true);
    await info.attach("method-previews.png",{body:await page.screenshot(),contentType:"image/png"});
    await page.locator('[data-stage-open="notebook"]').click();
    await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","notebook");
  });
}
