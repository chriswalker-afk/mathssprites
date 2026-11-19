import {test,expect} from "@playwright/test";

async function frameMetrics(page){
  return page.evaluate(()=>{
    const rect=id=>{
      const r=document.getElementById(id).getBoundingClientRect();
      return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,width:r.width};
    };
    const root=document.documentElement;
    const scene=document.getElementById("scene");
    const chambers=[...scene.querySelectorAll(".chamber")].map(node=>{
      const interior=node.querySelector(".room-interior");
      const r=interior.getBoundingClientRect();
      const c=node.getBoundingClientRect();
      const pan=node.querySelector(".scale-pan").getBoundingClientRect();
      return {paddingTop:parseFloat(getComputedStyle(node).paddingTop),
        roomTop:r.top,panTop:pan.top,chamberTop:c.top};
    });
    return {
      topbar:document.querySelector(".app-shell .topbar").getBoundingClientRect().height,
      levelBar:document.querySelector(".app-shell .chapter-strip").getBoundingClientRect().height,
      viewport:{w:innerWidth,h:innerHeight},
      document:{w:root.scrollWidth,h:root.scrollHeight},
      gameHome:rect("game-brand-home"),scene:rect("scene"),
      base:document.querySelector(".scale-base").getBoundingClientRect().toJSON(),
      chambers,
      topStrip:getComputedStyle(scene,"::before").content,
      caption:getComputedStyle(document.getElementById("balance-caption")).clipPath
    };
  });
}

for(const size of [
  {width:1024,height:720},
  {width:1092,height:540}
]){
  test("compact title bar and uncluttered scale at "+size.width+"x"+size.height+" @smoke",async({page})=>{
    await page.setViewportSize(size);
    await page.goto("/");
    await page.locator("#home-play").click();
    if(await page.locator("#apprentice-guide").isVisible())
      await page.locator("#guide-skip").click();
    const icon=page.locator("#game-brand-home");
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute("aria-label","Return to Maths Sprites home");
    await expect(icon.locator(".sprite-black")).toHaveCount(1);
    await expect(icon.locator(".sprite-body")).toHaveCount(1);
    await expect(icon.locator(".sprite-eyes i")).toHaveCount(2);
    await expect(icon.locator(".sprite-feet")).toHaveCount(1);
    await expect(icon.locator(".sprite-motion")).toHaveCount(1);
    await expect(page.locator("#game-shell .brand-mark")).toHaveCount(0);
    const motionName=await icon.locator(".sprite-motion").evaluate(el=>
      getComputedStyle(el).animationName);
    expect(motionName).toContain("sprite-hop");

    await expect(page.locator(".scene-heading,.room-roof,.roof-line")).toHaveCount(0);
    await expect(page.locator("#balance-caption")).toBeEmpty();
    await expect(page.locator("#scene")).toBeVisible();
    const m=await frameMetrics(page);
    expect(m.topbar,"compact top bar").toBeLessThanOrEqual(52);
    expect(m.levelBar,"compact level rail").toBeLessThanOrEqual(48);
    expect(m.document.h,"no document scrollbar").toBeLessThanOrEqual(size.height+3);
    expect(m.document.w,"no sideways scrollbar").toBeLessThanOrEqual(size.width+3);
    expect(m.topStrip).toBe("none");
    expect(m.caption).toContain("inset");
    for(const chamber of m.chambers){
      expect(chamber.roomTop-chamber.chamberTop).toBeCloseTo(chamber.paddingTop,0);
      expect(chamber.panTop).toBeGreaterThan(chamber.roomTop);
    }
    expect(m.base.top).toBeGreaterThan(m.chambers[0].roomTop);
    expect(m.base.bottom).toBeLessThanOrEqual(size.height+2);
    await page.screenshot({path:"artifacts/pr30-scene-"+size.width+"x"+size.height+".png"});

    // The mascot is a REAL Home button, sharing the same route as ⌂ Home.
    await icon.click();
    await expect(page.locator("#site-home")).toBeVisible();
    await expect(page.locator("#game-shell")).toBeHidden();
    await expect(page.locator(".site-brand .brand-sprite-frame .sprite-body")).toHaveCount(1);
  });
}

test("mascot Home button is keyboard-accessible and respects reduced motion",async({page})=>{
  await page.goto("/?preview=resident");
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: reduced");
  expect(await page.locator("#game-brand-home .sprite-motion").evaluate(el=>
    getComputedStyle(el).animationName)).toBe("none");
  const button=page.locator("#game-brand-home");
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#site-home")).toBeVisible();
});

test("mobile retains full-size touch navigation and readable scene without a roof",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/?preview=resident");
  await expect(page.locator("#game-brand-home")).toBeVisible();
  await expect(page.locator("#scene")).toBeVisible();
  await expect(page.locator("#do-both")).toBeVisible();
  await expect(page.locator(".room-roof,.scene-heading")).toHaveCount(0);
  const size=await page.locator("#game-brand-home").boundingBox();
  expect(size.width).toBeGreaterThanOrEqual(40);
  expect(size.height).toBeGreaterThanOrEqual(40);
  const width=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(393);
  await page.screenshot({path:"artifacts/pr30-scene-mobile-390x844.png"});
  await page.locator("#game-brand-home").click();
  await expect(page.locator("#site-home")).toBeVisible();
});
