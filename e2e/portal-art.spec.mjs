import {test,expect} from "@playwright/test";

const laptopViews=[
  {width:1024,height:720},
  {width:1092,height:540}
];
async function noPageOverflow(page){
  const size=await page.evaluate(()=>({
    width:innerWidth,height:innerHeight,
    documentWidth:document.documentElement.scrollWidth,
    documentHeight:document.documentElement.scrollHeight
  }));
  expect(size.documentWidth,"No horizontal clipping").toBeLessThanOrEqual(size.width+3);
  expect(size.documentHeight,"All laptop controls stay in one viewport").toBeLessThanOrEqual(size.height+3);
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
test("the Laboratory Foyer keeps its living scale and adds three illustrated stage entrances @smoke",async({page})=>{
  await expect(page.locator("#home-title")).toHaveText("How much does the sprite weigh?");
  await expect(page.locator("#site-home .portal-kicker")).toContainText("LABORATORY FOYER");
  await expect(page.locator("#home-hero-art")).toHaveAttribute("data-playback","playing");
  await imagesLoaded(page,"#home-stage-shortcuts .portal-stage-medallion",3);
  const surface=await page.locator(".landing-hero").evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(surface).toContain("foyer-ambient.svg");
  await page.screenshot({path:"artifacts/pr33-laboratory-foyer-1280.png"});
});
test("the Hall of Doors contains four distinct locally loaded artworks, with future doors locked @smoke",async({page})=>{
  await page.locator('[data-screen="worlds"]').first().click();
  await expect(page.locator("#site-worlds .portal-kicker")).toContainText("HALL OF DOORS");
  await imagesLoaded(page,".hall-door-art",4);
  const sources=await page.locator(".hall-door-art").evaluateAll(images=>images.map(img=>
    new URL(img.currentSrc).pathname
  ));
  expect(new Set(sources).size).toBe(4);
  await expect(page.locator(".world-ready")).toHaveCount(1);
  await expect(page.locator(".world-planned")).toHaveCount(3);
  await expect(page.locator(".world-planned button")).toHaveCount(0);
  await page.screenshot({path:"artifacts/pr33-hall-of-doors-1280.png"});
  await page.getByRole("button",{name:"Explore stages"}).click();
  await imagesLoaded(page,"#world1-stage-cards .portal-stage-medallion",3);
  await expect(page.locator("#world1-workshop button")).toBeEnabled();
});
test("Experiment Board displays its engraved surface, all 48 levels and retains stage-specific artwork @smoke",async({page})=>{
  await page.locator("#home-choose-level").click();
  await expect(page.locator("#site-levels")).toBeVisible();
  const bg=await page.locator("#site-levels").evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(bg).toContain("board-etching.svg");
  await expect(page.locator(".level-tile")).toHaveCount(20);
  await expect(page.locator(".level-tile:disabled")).toHaveCount(0);
  await page.locator('[data-map-stage="independent"]').click();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","independent");
  await expect(page.locator(".level-tile")).toHaveCount(16);
  await page.locator('[data-map-stage="notebook"]').click();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","notebook");
  await expect(page.locator(".level-tile")).toHaveCount(12);
  await expect(page.locator('.map-world-button:disabled')).toHaveCount(3);
  await page.screenshot({path:"artifacts/pr33-experiment-board-1280.png"});
});
test("Inventor's Desk has its illustrated sketch and functional accessible equation editor @smoke",async({page})=>{
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Create your own equation"}).click();
  await expect(page.locator("#site-workshop .portal-kicker")).toContainText("INVENTOR");
  await imagesLoaded(page,".inventor-art img",1);
  await expect(page.locator("#workshop-equation")).toBeVisible();
  await page.getByRole("button",{name:"3x + 5 = 20"}).click();
  await expect(page.locator("#workshop-equation")).toHaveValue("3x + 5 = 20");
  await expect(page.locator("#workshop-create")).toBeEnabled();
  await page.screenshot({path:"artifacts/pr33-inventors-desk-1280.png"});
});
for(const size of laptopViews){
  test("PR33 illustrated menus fit "+size.width+"x"+size.height+" without clipping @smoke",async({page})=>{
    test.setTimeout(75000);
    await page.setViewportSize(size);
    await noPageOverflow(page);
    await expect(page.locator("#home-play")).toBeInViewport();
    await expect(page.locator("#home-stage-shortcuts")).toBeInViewport();
    await page.screenshot({path:"artifacts/pr33-foyer-"+size.width+"x"+size.height+".png"});
    await page.locator('[data-screen="worlds"]').first().click();
    await imagesLoaded(page,".hall-door-art",4);
    await expect(page.locator(".world-card:last-child")).toBeInViewport();
    await noPageOverflow(page);
    await page.screenshot({path:"artifacts/pr33-hall-"+size.width+"x"+size.height+".png"});
    await page.getByRole("button",{name:"Explore stages"}).click();
    await imagesLoaded(page,"#world1-stage-cards .portal-stage-medallion",3);
    await expect(page.locator("#world1-workshop")).toBeInViewport();
    await noPageOverflow(page);
    await page.screenshot({path:"artifacts/pr33-stages-"+size.width+"x"+size.height+".png"});
    await page.locator('[data-screen="home"]').first().click();
    await page.locator("#home-choose-level").click();
    await expect(page.locator('[data-level="20"]')).toBeInViewport();
    await expect(page.locator("#map-stage-tabs")).toBeInViewport();
    await noPageOverflow(page);
    await page.screenshot({path:"artifacts/pr33-board-"+size.width+"x"+size.height+".png"});
    await page.locator('[data-screen="worlds"]').first().click();
    await page.getByRole("button",{name:"Explore stages"}).click();
    await page.getByRole("button",{name:"Create your own equation"}).click();
    await expect(page.locator("#workshop-equation")).toBeInViewport();
    await expect(page.locator("#workshop-create")).toBeInViewport();
    await noPageOverflow(page);
    await page.screenshot({path:"artifacts/pr33-desk-"+size.width+"x"+size.height+".png"});
  });
}
test("phone keeps all decorative art non-interactive and form reachable",async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await expect(page.locator("#home-play")).toBeVisible();
  await imagesLoaded(page,"#home-stage-shortcuts .portal-stage-medallion",3);
  await page.locator('[data-screen="worlds"]').first().click();
  await imagesLoaded(page,".hall-door-art",4);
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Create your own equation"}).click();
  await imagesLoaded(page,".inventor-art img",1);
  await page.locator("#workshop-equation").fill("x + 3 = 8");
  await expect(page.locator("#workshop-equation")).toHaveValue("x + 3 = 8");
  const width=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(378);
  await page.screenshot({path:"artifacts/pr33-mobile-inventor.png"});
});
test("reduced motion hides animation but never hides the decorative chapter artwork",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.reload();
  await expect(page.locator("#hero-playback")).toBeHidden();
  await imagesLoaded(page,"#home-stage-shortcuts .portal-stage-medallion",3);
  await page.locator('[data-screen="worlds"]').first().click();
  await imagesLoaded(page,".hall-door-art",4);
  await expect(page.locator(".world-card")).toHaveCount(4);
});
