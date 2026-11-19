import {test,expect} from "@playwright/test";

const laptopViews=[
  {width:1024,height:720},
  {width:1280,height:720},
  {width:1366,height:768}
];
async function inView(page,selector,{horizontal=true}={}){
  const box=await page.locator(selector).boundingBox();
  expect(box,selector+" must be rendered").not.toBeNull();
  const size=page.viewportSize();
  expect(box.y,selector+" top").toBeGreaterThanOrEqual(-2);
  expect(box.y+box.height,selector+" bottom").toBeLessThanOrEqual(size.height+2);
  if(horizontal){
    expect(box.x,selector+" left").toBeGreaterThanOrEqual(-2);
    expect(box.x+box.width,selector+" right").toBeLessThanOrEqual(size.width+2);
  }
}
async function noDocumentScroll(page){
  const m=await page.evaluate(()=>({
    scrollHeight:document.documentElement.scrollHeight,
    scrollWidth:document.documentElement.scrollWidth,
    height:innerHeight,width:innerWidth
  }));
  expect(m.scrollHeight, "Whole document should fit one screen").toBeLessThanOrEqual(m.height+3);
  expect(m.scrollWidth, "No sideways page overflow").toBeLessThanOrEqual(m.width+3);
}
async function openWorld(page){
  await page.locator('[data-screen="worlds"]').first().click();
  await expect(page.locator("#site-worlds")).toBeVisible();
}
async function openStages(page){
  await openWorld(page);
  await page.getByRole("button",{name:"Explore stages"}).click();
  await expect(page.locator("#site-stages")).toBeVisible();
}
async function openLevels(page,stage=1){
  await openStages(page);
  await page.getByRole("button",{name:"Choose Stage "+stage+" levels"}).click();
  await expect(page.locator("#site-levels")).toBeVisible();
}

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
});

for(const size of laptopViews){
  test("single-screen menus and full 20-level selection at "+size.width+"×"+size.height+" @smoke",async({page})=>{
    test.setTimeout(60000);
    await page.setViewportSize(size);
    await page.goto("/");
    await inView(page,"#home-play");
    await inView(page,"#home-hero-art");
    await inView(page,"#site-home .portal-features");
    await noDocumentScroll(page);
    await page.screenshot({path:"artifacts/pr27-home-"+size.width+"x"+size.height+".png"});

    await openWorld(page);
    await expect(page.locator(".world-card")).toHaveCount(4);
    await inView(page,"#world-cards .world-card:last-child");
    await noDocumentScroll(page);
    await page.screenshot({path:"artifacts/pr27-worlds-"+size.width+"x"+size.height+".png"});

    await page.getByRole("button",{name:"Explore stages"}).click();
    await expect(page.locator(".stage-card")).toHaveCount(3);
    await inView(page,"#world1-workshop");
    await noDocumentScroll(page);
    await page.screenshot({path:"artifacts/pr27-stages-"+size.width+"x"+size.height+".png"});

    await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
    await expect(page.locator(".level-tile")).toHaveCount(20);
    await expect(page.locator(".chapter-group")).toHaveCount(5);
    await inView(page,"#level-sections .chapter-group:last-child .level-tile:last-child");
    await inView(page,"#level-sections .chapter-group:first-child .level-tile:first-child");
    await noDocumentScroll(page);
    const columns=await page.locator("#level-sections").evaluate(el=>
      getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length);
    expect(columns).toBe(5);
    await page.screenshot({path:"artifacts/pr27-levels-"+size.width+"x"+size.height+".png"});
  });
}

test("the balance and every essential control remain visible together on a laptop @smoke",async({page})=>{
  await page.setViewportSize({width:1024,height:720});
  await page.goto("/");
  await page.locator("#home-play").click();
  await expect(page.locator("#game-shell")).toBeVisible();
  await inView(page,"#scene");
  await inView(page,".experiment-controls");
  await inView(page,"#do-both");
  await inView(page,"#amount-up");
  await inView(page,".scale-base");
  await noDocumentScroll(page);
  const relation=await page.evaluate(()=>{
    const scene=document.getElementById("scene").getBoundingClientRect();
    const tools=document.querySelector(".experiment-controls").getBoundingClientRect();
    return {sceneRight:scene.right,toolsLeft:tools.left,sceneBottom:scene.bottom,toolsBottom:tools.bottom};
  });
  expect(relation.sceneRight).toBeLessThanOrEqual(relation.toolsLeft);
  expect(Math.abs(relation.sceneBottom-relation.toolsBottom)).toBeLessThanOrEqual(3);
  await page.screenshot({path:"artifacts/pr27-game-1024x720.png"});
});

test("notebook writing stays in the viewport with its line entry available @smoke",async({page})=>{
  await page.setViewportSize({width:1024,height:720});
  await page.goto("/");
  await openLevels(page,3);
  await page.locator('[data-level="1"]').click();
  await expect(page.locator("#notebook-workspace")).toBeVisible();
  await expect(page.locator("#scene")).toBeHidden();
  await inView(page,".notebook-paper");
  await inView(page,"#notebook-equation");
  await inView(page,"#notebook-check");
  await inView(page,"#notebook-replay");
  await noDocumentScroll(page);
  await page.screenshot({path:"artifacts/pr27-notebook-1024x720.png"});
});

test("home CTA resumes the actual last opened stage, not whichever stage is completed @smoke",async({page})=>{
  await page.goto("/");
  await openLevels(page,2);
  await page.locator('[data-level="7"]').click();
  await expect(page.locator("#chapter-status")).toContainText("STAGE 2");
  await page.locator("#game-home").click();
  await expect(page.locator("#home-play")).toContainText("Continue Stage 2 · Level 7");
  await page.reload();
  await expect(page.locator("#home-play")).toContainText("Continue Stage 2 · Level 7");
  await page.locator("#home-play").click();
  await expect(page.locator("#chapter-status")).toContainText("STAGE 2");
  await expect(page.locator("#level-title")).toHaveText("Four-room rhythm");
  await page.locator("#game-home").click();

  await openLevels(page,3);
  await page.locator('[data-level="6"]').click();
  await expect(page.locator("#notebook-workspace")).toBeVisible();
  await page.locator("#game-home").click();
  await expect(page.locator("#home-play")).toContainText("Continue Stage 3 · Level 6");
  await page.locator("#home-play").click();
  await expect(page.locator("#notebook-workspace")).toBeVisible();
});

test("narrow mobile screens still scroll normally without horizontal clipping",async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await page.goto("/");
  await expect(page.locator("#home-play")).toBeVisible();
  const status=await page.evaluate(()=>({
    scrollHeight:document.documentElement.scrollHeight,
    scrollWidth:document.documentElement.scrollWidth,
    height:innerHeight,width:innerWidth
  }));
  expect(status.scrollHeight).toBeGreaterThan(status.height);
  expect(status.scrollWidth).toBeLessThanOrEqual(status.width+3);
  await page.locator("#home-play").click();
  await expect(page.locator("#scene")).toBeVisible();
  await expect(page.locator("#do-both")).toBeVisible();
  const gameWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(gameWidth).toBeLessThanOrEqual(378);
});


const scaledLaptopViews=[
  {width:1092,height:540}, // 1366x768 with ~125% scaling + browser chrome
  {width:1024,height:600},
  {width:900,height:560},
  {width:1280,height:525}
];
for(const size of scaledLaptopViews){
  test("scaled-laptop single-screen layouts at "+size.width+"x"+size.height+" @smoke",async({page})=>{
    test.setTimeout(60000);
    await page.setViewportSize(size);
    await page.goto("/");
    expect(await page.evaluate(()=>
      matchMedia("(min-width:900px) and (min-height:500px)").matches
    )).toBe(true);
    await noDocumentScroll(page);
    await inView(page,"#home-play");
    await inView(page,"#home-hero-art");
    await inView(page,"#site-home .portal-features");
    await page.screenshot({path:"artifacts/pr28-home-"+size.width+"x"+size.height+".png"});

    await openWorld(page);
    await inView(page,"#world-cards .world-card:last-child");
    await noDocumentScroll(page);
    await page.screenshot({path:"artifacts/pr28-worlds-"+size.width+"x"+size.height+".png"});

    await page.getByRole("button",{name:"Explore stages"}).click();
    await inView(page,"#world1-workshop");
    await expect(page.locator(".stage-card")).toHaveCount(3);
    await noDocumentScroll(page);
    await page.screenshot({path:"artifacts/pr28-stages-"+size.width+"x"+size.height+".png"});

    await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
    await expect(page.locator(".level-tile")).toHaveCount(20);
    await expect(page.locator(".level-tile:disabled")).toHaveCount(0);
    await inView(page,"#level-sections .chapter-group:last-child .level-tile:last-child");
    await inView(page,"#level-sections .chapter-group:first-child .level-tile:first-child");
    await noDocumentScroll(page);
    const columnCount=await page.locator("#level-sections").evaluate(el=>
      getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length);
    expect(columnCount).toBe(5);
    await page.screenshot({path:"artifacts/pr28-levels-"+size.width+"x"+size.height+".png"});

    await page.locator('[data-level="1"]').click();
    await inView(page,"#scene");
    await inView(page,".scale-base");
    await inView(page,"#do-both");
    await inView(page,"#amount-up");
    await noDocumentScroll(page);
    // A button can have a viewport-bound rectangle while still being clipped
    // by a scroll container; it must actually be hit-testable on screen.
    const actionVisible=await page.locator("#do-both").evaluate(btn=>{
      const rect=btn.getBoundingClientRect();
      const hit=document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2);
      return !!hit&&(hit===btn||btn.contains(hit));
    });
    expect(actionVisible,"The main hand action must not be clipped").toBe(true);
    const scene=await page.locator("#scene").boundingBox();
    const tools=await page.locator(".experiment-controls").boundingBox();
    expect(scene.x+scene.width).toBeLessThanOrEqual(tools.x+2);
    await page.screenshot({path:"artifacts/pr28-game-"+size.width+"x"+size.height+".png"});
  });
}

test("very short or mobile viewports preserve scrolling, not clipped controls @smoke",async({page})=>{
  await page.setViewportSize({width:1092,height:460});
  await page.goto("/");
  // Layout must NOT force a hidden fixed-height shell at inaccessible heights.
  expect(await page.locator("#site-shell").evaluate(el=>getComputedStyle(el).overflowY))
    .not.toBe("hidden");
  await page.locator("#home-play").click();
  await expect(page.locator("#do-both")).toBeVisible();
  await page.locator("#do-both").scrollIntoViewIfNeeded();
  await inView(page,"#do-both");
});
