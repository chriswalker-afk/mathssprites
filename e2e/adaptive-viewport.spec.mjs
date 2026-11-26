import {openCampaignBoard,chooseCampaignWorld,chooseCampaignStage,launchHomeOrFirst} from "./campaign-menu-helper.mjs";
import {clickWithReferenceMove} from "./reference-move-helper.mjs";
import {test,expect} from "@playwright/test";

/**
 * PR37 adaptive viewport regressions.
 * Exercise ASPECT RATIOS, not only absolute widths. On tall/wide screens
 * content should be composed and stage hardware connected; on short/zoomed
 * screens controls must remain reachable without horizontal scrolling.
 *
 * These screenshots are review artifacts, not snapshot baselines.
 */
test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});
const dimensions=[
 {width:2048,height:1252,name:"large-tall-2048"},
 {width:1920,height:1080,name:"wide-1920"},
 {width:1200,height:1252,name:"tall-window-1200"},
 {width:1440,height:900,name:"desktop-1440"},
 {width:1120,height:900,name:"tall-laptop-1120"},
 {width:1024,height:900,name:"tall-narrow-1024"},
 {width:1366,height:768,name:"classic-laptop"},
 {width:1092,height:540,name:"scaled-laptop"}
];
async function measure(page){
 return page.evaluate(()=>{
   const b=id=>{
     const el=document.querySelector(id);
     if(!el||el.hidden)return null;
     const r=el.getBoundingClientRect();
     return {x:r.x,y:r.y,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
   };
   const row=document.querySelector(".rooms-row");
   const pivotY=row?Number.parseFloat(getComputedStyle(row).transformOrigin.split(" ")[1]):null;
   return {w:innerWidth,h:innerHeight,pivotY,
     scrollW:document.documentElement.scrollWidth,
     scrollH:document.documentElement.scrollHeight,
     nav:b(".site-nav"),hero:b("#site-home .landing-hero"),
     title:b("#site-home .landing-copy h1"),
     actions:b("#site-home .landing-actions"),
     animation:b("#site-home .hero-illustration"),
     shortcuts:b("#site-home .landing-actions"),
     chapter:b(".app-shell .chapter-strip"),
     board:b(".app-shell .game-board"),
     scene:b("#scene"),rail:b(".experiment-controls"),
     rooms:b(".rooms-row"),room:b("#left-chamber .room-interior"),
     pan:b("#left-chamber .scale-pan"),
     beam:b(".scale-beam"),base:b(".scale-base"),
     bench:b(".workbench"),
     sections:b("#level-sections"),
     finalTile:b("#level-sections .chapter-group:last-child .level-tile:last-child")};
 });
}
function withinScreen(m){
 expect(m.scrollW,JSON.stringify(m)).toBeLessThanOrEqual(m.w+3);
}
test("home fills available space proportionately without stretching the hero into a void @smoke",async({page})=>{
  test.setTimeout(80000);
  for(const size of dimensions){
    await page.setViewportSize({width:size.width,height:size.height});
    const m=await measure(page);
    withinScreen(m);
    expect(m.hero.height).toBeGreaterThan(290);
    expect(m.hero.bottom).toBeLessThanOrEqual(m.h+2);
    expect(m.shortcuts.bottom).toBeLessThanOrEqual(m.h+3);
    expect(m.title.top).toBeGreaterThan(m.hero.top-2);
    expect(m.actions.bottom).toBeLessThan(m.hero.bottom+3);
    expect(m.animation.bottom).toBeLessThan(m.hero.bottom+5);
    if(size.height>=790){
      expect(m.hero.height).toBeLessThanOrEqual(853);
      expect(m.hero.height/m.h).toBeLessThan(.87);
      expect(m.hero.height/m.h).toBeGreaterThan(.43);
    }
    await page.screenshot({path:"artifacts/pr37-home-"+size.name+".png",fullPage:true});
  }
});
test("real room/pan/beam/pedestal remain connected while tall gameplay uses larger screens @smoke",async({page})=>{
  test.setTimeout(100000);
  await launchHomeOrFirst(page);
  if(await page.locator("#guide-skip").isVisible())await page.locator("#guide-skip").click();
  await expect(page.locator("#scene")).toBeVisible();
  for(const size of dimensions){
    await page.setViewportSize({width:size.width,height:size.height});
    const m=await measure(page);
    withinScreen(m);
    expect(m.scene.bottom).toBeLessThanOrEqual(m.h+3);
    expect(m.board.bottom).toBeLessThanOrEqual(m.h+3);
    // The chapter title and stage are one composition, not two components
    // separated by a large auto margin on a tall display.
    expect(m.board.top-m.chapter.bottom).toBeLessThan(32);
    expect(m.rail.bottom).toBeLessThanOrEqual(m.h+3);
    expect(m.scene.height).toBeGreaterThan(300);
    // Every scene is still mathematically connected, with no floating
    // detached pans or scale base; taller rooms move with the hardware.
    expect(m.pan.bottom-m.beam.top).toBeGreaterThan(-9);
    expect(m.pan.bottom-m.beam.top).toBeLessThan(90);
    if(size.width>=1100&&size.height>=790){
      expect(m.scene.height).toBeGreaterThan(675);
      expect(Math.abs(m.bench.top-m.base.bottom)).toBeLessThan(38);
      expect(m.room.height).toBeGreaterThan(350);
      // The row rotates around the same brass pivot as the beam — no
      // detached scale when a manual action temporarily unbalances it.
      expect(Math.abs((m.beam.top-m.rooms.top)-m.pivotY)).toBeLessThan(12);
    }
    if(size.width<1100&&size.height>=790){
      expect(m.scene.height).toBeLessThanOrEqual(620);
      expect(m.board.top).toBeGreaterThan(85);
    }
    await page.screenshot({path:"artifacts/pr37-game-"+size.name+".png",fullPage:true});
  }
});
test("world and stage tabs, scrollable chapters and signed notebook use the screen without clipping @smoke",async({page})=>{
  test.setTimeout(85000);
  for(const size of [
    {width:1920,height:1080,name:"wide"},
    {width:1440,height:900,name:"desktop"},
    {width:1024,height:720,name:"laptop"}
  ]){
    await page.setViewportSize(size);
    await openCampaignBoard(page);
    await expect(page.locator("#site-levels")).toBeVisible();
    await expect(page.locator("#world-cards [data-world-stages]")).toHaveCount(4);
    await expect(page.locator('[data-world-stages="fractions"]')).toBeEnabled();
    await expect(page.locator('[data-world-stages="squares"]')).toBeEnabled();
    withinScreen(await measure(page));
    await page.screenshot({path:"artifacts/pr59-world-tabs-"+size.name+".png"});
    await chooseCampaignWorld(page,"opposites");
    await chooseCampaignStage(page,"guided");
    await expect(page.locator("#site-levels")).toHaveAttribute("data-active-world","opposites");
    await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","guided");
    await expect(page.locator(".chapter-group")).toHaveCount(6);
    await expect(page.locator(".level-tile")).toHaveCount(24);
    await page.locator('[data-level="24"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-level="24"]')).toBeInViewport();
    const m=await measure(page);
    withinScreen(m);
    expect(m.finalTile.bottom).toBeLessThanOrEqual(m.sections.bottom+3);
    await page.screenshot({path:"artifacts/pr59-board-"+size.name+".png"});
    await chooseCampaignStage(page,"notebook");
    await expect(page.locator(".chapter-group")).toHaveCount(4);
    await expect(page.locator(".level-tile")).toHaveCount(16);
    await page.locator('[data-level="1"]').click();
    await expect(page.locator("#notebook-workspace")).toBeVisible();
    await expect(page.locator("#notebook-apply")).toBeVisible();
    withinScreen(await measure(page));
    await page.screenshot({path:"artifacts/pr59-notebook-"+size.name+".png"});
    await page.locator("#game-home").click();
  }
});
test("signed zero-pair hand actions still commit in both tall desktop hand modes @smoke",async({page})=>{
  test.setTimeout(105000);
  await page.setViewportSize({width:2048,height:1252});
  await openCampaignBoard(page,"opposites");
  await page.locator('[data-level="1"]').click();
  if(await page.locator("#guide-skip").isVisible())await page.locator("#guide-skip").click();
  await expect(page.locator("#left-items .balloon")).toHaveCount(1);
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#left-items .balloon")).toHaveCount(0,{timeout:35000});
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:35000});
  await page.locator("#replay-close").click();
  await page.locator("#game-home").click();

  await page.setViewportSize({width:1200,height:1252});
  await openCampaignBoard(page,"opposites","independent");
  await page.locator('[data-level="1"]').click();
  if(await page.locator("#guide-skip").isVisible())await page.locator("#guide-skip").click();
  await expect(page.locator("#left-items .balloon")).toHaveCount(2);
  await clickWithReferenceMove(page,"#left-action");
  await expect(page.locator("#balance-caption")).toContainText("matching move");
  await page.screenshot({path:"artifacts/pr37-independent-pending-tall.png",fullPage:true});
  await clickWithReferenceMove(page,"#right-action");
  await expect(page.locator("#left-items .balloon")).toHaveCount(0,{timeout:35000});
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:35000});
});
test("phone and portrait tablet keep natural scrolling and reachable controls @smoke",async({page})=>{
  test.setTimeout(55000);
  for(const size of [
    {width:375,height:812,name:"phone-375"},
    {width:390,height:844,name:"phone-390"},
    {width:768,height:1024,name:"portrait-tablet"}
  ]){
    await page.setViewportSize(size);
    withinScreen(await measure(page));
    await expect(page.locator("#home-choose-level")).toBeVisible();
    await launchHomeOrFirst(page);
    if(await page.locator("#guide-skip").isVisible())
      await page.locator("#guide-skip").click();
    await expect(page.locator("#do-both")).toBeAttached();
    withinScreen(await measure(page));
    await page.locator("#do-both").scrollIntoViewIfNeeded();
    await expect(page.locator("#do-both")).toBeInViewport();
    await page.screenshot({path:"artifacts/pr37-mobile-"+size.name+".png",fullPage:true});
    await page.locator("#game-home").click();
  }
});
