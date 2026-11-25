import {test,expect} from "@playwright/test";

const laptopViews=[{width:1024,height:720},{width:1092,height:540}];
async function noPageOverflow(page){
  const m=await page.evaluate(()=>({
    width:innerWidth,height:innerHeight,
    documentWidth:document.documentElement.scrollWidth,
    documentHeight:document.documentElement.scrollHeight
  }));
  expect(m.documentWidth,"No horizontal clipping").toBeLessThanOrEqual(m.width+3);
  expect(m.documentHeight,"Menus fit one laptop viewport").toBeLessThanOrEqual(m.height+3);
}
async function imagesLoaded(page,selector,count){
  await expect(page.locator(selector)).toHaveCount(count);
  await expect.poll(()=>page.locator(selector).evaluateAll(items=>
    items.filter(img=>img.complete && img.naturalWidth>0 && img.naturalHeight>0).length
  )).toBe(count);
}

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});

test("Laboratory Foyer keeps its animated scale and three loaded stage illustrations @smoke",async({page})=>{
  await expect(page.locator("#home-title")).toHaveText("How much does the sprite weigh?");
  await expect(page.locator("#site-home .portal-kicker")).toContainText("LABORATORY FOYER");
  await expect(page.locator("#home-hero-art")).toHaveAttribute("data-playback","playing");
  await imagesLoaded(page,"#home-stage-shortcuts .portal-stage-medallion",3);
  const surface=await page.locator(".landing-hero").evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(surface).toContain("foyer-ambient.svg");
  await page.screenshot({path:"artifacts/pr59-foyer-1280.png"});
});

test("the live world selector has four distinct emblems, with future worlds locked @smoke",async({page})=>{
  await page.locator("#home-choose-level").click();
  await expect(page.locator("#site-levels")).toBeVisible();
  await expect(page.locator("#map-world-tabs button")).toHaveCount(4);
  const symbols=await page.locator("#map-world-tabs button > span:first-child")
    .allTextContents();
  expect(new Set(symbols).size).toBe(4);
  await expect(page.locator('[data-map-world="workshop"]')).toBeEnabled();
  await expect(page.locator('[data-map-world="opposites"]')).toBeEnabled();
  await expect(page.locator('[data-map-world="fractions"]')).toBeEnabled();
  await expect(page.locator('[data-map-world="squares"]')).toBeDisabled();
  await expect(page.locator("#map-stage-tabs .map-stage-icon")).toHaveCount(3);
  await page.screenshot({path:"artifacts/pr59-world-tabs-1280.png"});
});

test("the engraved board shows all World 1 stage levels and active artwork @smoke",async({page})=>{
  await page.locator("#home-choose-level").click();
  const bg=await page.locator("#site-levels").evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(bg).toContain("board-etching.svg");
  await expect(page.locator(".level-tile")).toHaveCount(24);
  await expect(page.locator(".level-tile:disabled")).toHaveCount(0);
  await expect(page.locator(".chapter-illustration")).toHaveCount(6);
  await page.locator('[data-map-stage="independent"]').click();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","independent");
  await expect(page.locator(".level-tile")).toHaveCount(20);
  await page.locator('[data-map-stage="notebook"]').click();
  await expect(page.locator(".level-tile")).toHaveCount(16);
  await expect(page.locator(".map-world-button:disabled")).toHaveCount(2);
  await page.screenshot({path:"artifacts/pr59-board-1280.png"});
});

test("Inventor's Desk is illustrated, accessible and reachable from Home @smoke",async({page})=>{
  await page.locator('#site-home [data-screen="workshop"]').click();
  await expect(page.locator("#site-workshop .portal-kicker")).toContainText("INVENTOR");
  await imagesLoaded(page,".inventor-art img",1);
  await expect(page.locator("#workshop-equation")).toBeFocused();
  await page.getByRole("button",{name:"3x + 5 = 20"}).click();
  await expect(page.locator("#workshop-equation")).toHaveValue("3x + 5 = 20");
  await expect(page.locator("#workshop-create")).toBeEnabled();
  await page.screenshot({path:"artifacts/pr59-inventors-desk-1280.png"});
});

for(const size of laptopViews){
  test("active illustrated menus fit "+size.width+"x"+size.height+" without clipping @smoke",async({page})=>{
    test.setTimeout(75000);
    await page.setViewportSize(size);
    await noPageOverflow(page);
    await expect(page.locator("#home-play")).toBeInViewport();
    await expect(page.locator("#home-stage-shortcuts")).toBeInViewport();
    await page.locator("#home-choose-level").click();
    await expect(page.locator("#map-world-tabs button")).toHaveCount(4);
    await expect(page.locator("#map-stage-tabs")).toBeInViewport();
    await expect(page.locator(".level-tile")).toHaveCount(24);
    await page.locator('[data-level="24"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-level="24"]')).toBeInViewport();
    await noPageOverflow(page);
    await page.screenshot({path:"artifacts/pr59-illustrated-board-"+size.width+"x"+size.height+".png"});
    await page.locator('#site-levels [data-screen="workshop"]').click();
    await imagesLoaded(page,".inventor-art img",1);
    await expect(page.locator("#workshop-equation")).toBeInViewport();
    await expect(page.locator("#workshop-create")).toBeInViewport();
    await noPageOverflow(page);
    await page.screenshot({path:"artifacts/pr59-illustrated-workshop-"+size.width+"x"+size.height+".png"});
  });
}

test("phone keeps artwork non-interactive and the Workshop form reachable @smoke",async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await imagesLoaded(page,"#home-stage-shortcuts .portal-stage-medallion",3);
  await page.locator("#home-choose-level").click();
  await expect(page.locator("#map-world-tabs button")).toHaveCount(4);
  await page.locator('#site-levels [data-screen="workshop"]').click();
  await imagesLoaded(page,".inventor-art img",1);
  await page.locator("#workshop-equation").fill("x + 3 = 8");
  await expect(page.locator("#workshop-equation")).toHaveValue("x + 3 = 8");
  const width=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(378);
});

test("reduced motion keeps a static foyer scale beside an optional Play control @smoke",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.reload();
  await expect(page.locator("#home-hero-art")).toHaveAttribute("data-playback","reduced");
  await expect(page.locator("#hero-playback")).toBeVisible();
  await expect(page.locator("#hero-playback")).toHaveText("Play animation");
  await imagesLoaded(page,"#home-stage-shortcuts .portal-stage-medallion",3);
  await page.locator("#home-choose-level").click();
  await expect(page.locator("#map-world-tabs button")).toHaveCount(4);
});
