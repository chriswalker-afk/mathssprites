import {test,expect} from "@playwright/test";

const laptopViews=[
  {width:1024,height:720},{width:1280,height:720},{width:1366,height:768}
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
  expect(m.scrollHeight,"Whole document should fit one laptop screen").toBeLessThanOrEqual(m.height+3);
  expect(m.scrollWidth,"No sideways page overflow").toBeLessThanOrEqual(m.width+3);
}
async function openLevels(page,stage=1){
  await page.locator('.site-nav-links [data-screen="levels"]').click();
  await expect(page.locator("#site-levels")).toBeVisible();
  await expect(page.locator("#map-world-tabs button")).toHaveCount(4);
  await page.locator('[data-map-world="workshop"]').click();
  await page.locator('[data-map-stage="'+({1:"guided",2:"independent",3:"notebook"}[stage])+'"]').click();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage",
    {1:"guided",2:"independent",3:"notebook"}[stage]);
}
async function checkBothChapterEnds(page){
  await page.locator("#level-sections .chapter-group:last-child .level-tile:last-child").scrollIntoViewIfNeeded();
  await inView(page,"#level-sections .chapter-group:last-child .level-tile:last-child");
  await page.locator("#level-sections .chapter-group:first-child .level-tile:first-child").scrollIntoViewIfNeeded();
  await inView(page,"#level-sections .chapter-group:first-child .level-tile:first-child");
}
test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
});

for(const size of laptopViews){
  test("single-screen foyer, world/stage board and all 24 Guided levels at "+size.width+"x"+size.height+" @smoke",async({page})=>{
    test.setTimeout(60000);
    await page.setViewportSize(size);
    await page.goto("/");
    for(const selector of ["#home-play","#home-hero-art","#site-home .portal-features"])
      await inView(page,selector);
    await noDocumentScroll(page);
    await page.screenshot({path:"artifacts/pr59-home-"+size.width+"x"+size.height+".png"});

    await openLevels(page,1);
    await expect(page.locator('[data-map-world="opposites"]')).toBeEnabled();
    await expect(page.locator('[data-map-world="fractions"]')).toBeEnabled();
    await expect(page.locator('[data-map-world="squares"]')).toBeDisabled();
    await expect(page.locator("#map-stage-tabs button")).toHaveCount(3);
    await expect(page.locator(".level-tile")).toHaveCount(24);
    await expect(page.locator(".chapter-group")).toHaveCount(6);
    await checkBothChapterEnds(page);
    await noDocumentScroll(page);
    const columns=await page.locator("#level-sections").evaluate(el=>
      getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length);
    expect(columns).toBe(3);
    await page.screenshot({path:"artifacts/pr59-board-"+size.width+"x"+size.height+".png"});

    await page.locator('[data-map-stage="independent"]').click();
    await expect(page.locator(".level-tile")).toHaveCount(20);
    await page.locator('[data-map-stage="notebook"]').click();
    await expect(page.locator(".level-tile")).toHaveCount(16);
    await noDocumentScroll(page);
    await page.locator('#site-levels [data-screen="workshop"]').click();
    await expect(page.locator("#workshop-equation")).toBeVisible();
    await inView(page,"#workshop-create");
    await noDocumentScroll(page);
    await page.screenshot({path:"artifacts/pr59-workshop-"+size.width+"x"+size.height+".png"});
  });
}

test("the balance and progressively disclosed operation controls fit a laptop @quick @smoke",async({page})=>{
  await page.setViewportSize({width:1024,height:720});
  await page.goto("/");
  await page.locator("#home-play").click();
  await expect(page.locator("#game-shell")).toBeVisible();
  await inView(page,"#scene");
  await inView(page,".experiment-controls");
  await inView(page,"#do-both");
  await expect(page.locator("#object-picker")).toBeHidden();
  await expect(page.locator("#amount-control")).toBeHidden();
  await page.locator('[data-operation="remove"]').click();
  await expect(page.locator("#object-picker")).toBeVisible();
  await expect(page.locator("#amount-control")).toBeHidden();
  await page.locator('[data-kind="posOne"]').click();
  await expect(page.locator("#amount-control")).toBeVisible();
  await expect(page.locator("#amount-value")).toHaveText("—");
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
});

test("notebook writing stays in the viewport with its line entry available @smoke",async({page})=>{
  await page.setViewportSize({width:1024,height:720});
  await page.goto("/");
  await openLevels(page,3);
  await page.locator('[data-level="1"]').click();
  await expect(page.locator("#notebook-workspace")).toBeVisible();
  await expect(page.locator("#scene")).toBeHidden();
  for(const selector of [".notebook-paper","#notebook-operation","#notebook-apply","#notebook-replay"])
    await inView(page,selector);
  await noDocumentScroll(page);
});

test("home CTA resumes the last opened stage, not whichever was completed @smoke",async({page})=>{
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

test("narrow mobile screens still scroll naturally without horizontal clipping",async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await page.goto("/");
  await expect(page.locator("#home-play")).toBeVisible();
  const status=await page.evaluate(()=>({
    scrollHeight:document.documentElement.scrollHeight,
    scrollWidth:document.documentElement.scrollWidth,height:innerHeight,width:innerWidth
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
  {width:1092,height:540},{width:1024,height:600},
  {width:900,height:560},{width:1280,height:525}
];
for(const size of scaledLaptopViews){
  test("scaled-laptop board and operation controls at "+size.width+"x"+size.height+" @smoke",async({page})=>{
    test.setTimeout(60000);
    await page.setViewportSize(size);
    await page.goto("/");
    expect(await page.evaluate(()=>
      matchMedia("(min-width:900px) and (min-height:500px)").matches
    )).toBe(true);
    await noDocumentScroll(page);
    for(const selector of ["#home-play","#home-hero-art","#site-home .portal-features"])
      await inView(page,selector);

    await openLevels(page,1);
    await expect(page.locator(".level-tile")).toHaveCount(24);
    await expect(page.locator(".level-tile:disabled")).toHaveCount(0);
    await checkBothChapterEnds(page);
    await noDocumentScroll(page);
    const columns=await page.locator("#level-sections").evaluate(el=>
      getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length);
    expect(columns).toBe(3);
    await page.screenshot({path:"artifacts/pr59-compact-board-"+size.width+"x"+size.height+".png"});

    await page.locator('[data-level="1"]').click();
    for(const selector of ["#scene",".scale-base","#do-both"])
      await inView(page,selector);
    await expect(page.locator("#amount-control")).toBeHidden();
    await page.locator('[data-operation="remove"]').click();
    await page.locator('[data-kind="posOne"]').click();
    await expect(page.locator("#amount-control")).toBeVisible();
    await inView(page,"#amount-up");
    await noDocumentScroll(page);
    const actionVisible=await page.locator("#do-both").evaluate(btn=>{
      const rect=btn.getBoundingClientRect();
      const hit=document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2);
      return !!hit&&(hit===btn||btn.contains(hit));
    });
    expect(actionVisible,"The hand button must remain hit-testable").toBe(true);
    const scene=await page.locator("#scene").boundingBox();
    const tools=await page.locator(".experiment-controls").boundingBox();
    expect(scene.x+scene.width).toBeLessThanOrEqual(tools.x+2);
    await page.screenshot({path:"artifacts/pr59-compact-game-"+size.width+"x"+size.height+".png"});
  });
}

test("very short viewports preserve scrollable, reachable controls @smoke",async({page})=>{
  await page.setViewportSize({width:1092,height:460});
  await page.goto("/");
  expect(await page.locator("#site-shell").evaluate(el=>getComputedStyle(el).overflowY))
    .not.toBe("hidden");
  await page.locator("#home-play").click();
  await expect(page.locator("#do-both")).toBeVisible();
  await page.locator("#do-both").scrollIntoViewIfNeeded();
  await inView(page,"#do-both");
});
