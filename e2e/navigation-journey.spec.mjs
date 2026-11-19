import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
});

test("new player starts at Level 1 in one click and can return to the same experiment @smoke",async({page})=>{
  await expect(page.locator("#home-play")).toContainText("Start Stage 1");
  await page.locator("#home-choose-level").click();
  await expect(page.locator("#board-continue")).toHaveText("Play Level 1 →");
  await expect(page.locator(".level-tile")).toHaveCount(20);
  await page.locator("#board-continue").click();
  await expect(page.locator("#level-title")).toHaveText("One little resident");
  await page.locator("#game-levels").click();
  await expect(page.locator("#board-continue")).toHaveText("Continue Level 1 →");
  await page.locator("#board-continue").click();
  await expect(page.locator("#level-title")).toHaveText("One little resident");
  await page.locator("#game-home").click();
  await expect(page.locator("#site-home")).toBeVisible();
});
test("returning Stage 3 student gets a single board action without changing progress @smoke",async({page})=>{
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-stage="notebook"]').click();
  await expect(page.locator("#board-continue")).toHaveText("Play Level 1 →");
  await page.locator('[data-level="6"]').click();
  await expect(page.locator("#notebook-workspace")).toBeVisible();
  await page.locator("#game-levels").click();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","notebook");
  await expect(page.locator("#board-continue")).toHaveText("Continue Level 6 →");
  await page.locator("#board-continue").click();
  await expect(page.locator("#notebook-workspace")).toBeVisible();
  await page.locator("#game-home").click();
  const store=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.resume.v2")));
  expect(store).toEqual({worldId:"workshop",stageId:"notebook",levelId:"apprentice-06"});
  await page.reload();
  await expect(page.locator("#home-play")).toContainText("Continue Stage 3 · Level 6");
});
test("keyboard can change stages without losing focus, announce selection @smoke",async({page})=>{
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-stage="guided"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-map-stage="independent"]')).toHaveAttribute("aria-pressed","true");
  await expect(page.locator('[data-map-stage="independent"]')).toBeFocused();
  await expect(page.locator("#board-selection-status")).toContainText("Independent Balance");
  await expect(page.locator(".level-tile")).toHaveCount(16);
  await page.keyboard.press("End");
  await expect(page.locator('[data-map-stage="notebook"]')).toBeFocused();
  await expect(page.locator('[data-map-stage="notebook"]')).toHaveAttribute("aria-pressed","true");
  await expect(page.locator(".level-tile")).toHaveCount(12);
  await page.keyboard.press("Home");
  await expect(page.locator('[data-map-stage="guided"]')).toBeFocused();
  await expect(page.locator(".level-tile")).toHaveCount(20);
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator('[data-map-stage="guided"]')).toBeFocused();
  // Only implemented worlds may be selected, even with arrow keys.
  await page.locator('[data-map-world="workshop"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-map-world="workshop"]')).toBeFocused();
  await expect(page.locator('[data-map-world="opposites"]')).toBeDisabled();
});
test("desktop arrow keys follow the visual chapter columns, and Enter launches @smoke",async({page})=>{
  await page.setViewportSize({width:1024,height:720});
  await page.locator("#home-choose-level").click();
  await page.locator('[data-level="1"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-level="5"]')).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('[data-level="6"]')).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.locator('[data-level="1"]')).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.locator('[data-level="20"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#level-title")).toHaveText("The master experiment");
});
test("Help and Settings return to the actual prior screen, not always Home @smoke",async({page})=>{
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-stage="independent"]').click();
  await page.locator('.site-nav-links [data-screen="help"]').click();
  await expect(page.locator("#help-return")).toHaveText("← Back to levels");
  await page.locator("#help-return").click();
  await expect(page.locator("#site-levels")).toBeVisible();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","independent");
  await page.locator('.site-nav-links [data-screen="settings"]').click();
  await expect(page.locator("#settings-return")).toHaveText("← Back to levels");
  await page.locator("#site-guided-help").focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("#site-levels")).toBeVisible();
  await expect(page.locator("#board-continue")).toBeVisible();
});
test("Escape closes open guidance before navigating and never steals input editing @smoke",async({page})=>{
  await page.locator('.site-nav-links [data-screen="help"]').click();
  await page.locator("#help-stages summary").click();
  await expect(page.locator("#help-stages")).toHaveAttribute("open","");
  await page.keyboard.press("Escape");
  await expect(page.locator("#site-help")).toBeVisible();
  await expect(page.locator("#help-stages")).not.toHaveAttribute("open","");
  await page.keyboard.press("Escape");
  await expect(page.locator("#site-home")).toBeVisible();
  await page.locator('.site-nav-links [data-screen="worlds"]').click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Create your own equation"}).click();
  await page.locator("#workshop-equation").fill("3x + 5 = 20");
  await page.locator("#workshop-equation").press("Escape");
  await expect(page.locator("#site-workshop")).toBeVisible();
  await expect(page.locator("#workshop-equation")).toHaveValue("3x + 5 = 20");
  await page.locator('.site-nav-links [data-screen="help"]').click();
  await expect(page.locator("#help-return")).toHaveText("← Back to workshop");
  await page.locator("#help-return").click();
  await expect(page.locator("#workshop-equation")).toBeFocused();
});
test("phone levels and contextual return are accessible without horizontal overflow @smoke",async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await page.locator("#home-choose-level").click();
  const cta=await page.locator("#board-continue").boundingBox();
  expect(cta.height).toBeGreaterThanOrEqual(44);
  await page.locator('[data-level="1"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-level="2"]')).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('[data-level="4"]')).toBeFocused();
  await page.locator('.site-nav-links [data-screen="settings"]').click();
  await expect(page.locator("#settings-return")).toContainText("levels");
  await page.screenshot({path:"artifacts/pr35-phone-settings-375x812.png",fullPage:true});
  await page.locator("#settings-return").click();
  for(const sel of ["#site-levels","#board-continue","#map-stage-tabs"]){
    await expect(page.locator(sel)).toBeVisible();
  }
  const width=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(378);
  await page.screenshot({path:"artifacts/pr35-phone-board-375x812.png",fullPage:true});
});
for(const size of [{width:1024,height:720},{width:1092,height:540}]){
  test("continuation action fits without document scroll at "+size.width+"x"+size.height+" @smoke",async({page})=>{
    await page.setViewportSize(size);
    await page.locator("#home-choose-level").click();
    await expect(page.locator("#board-continue")).toBeInViewport();
    await expect(page.locator('[data-level="20"]')).toBeInViewport();
    await page.locator('[data-map-stage="notebook"]').click();
    await expect(page.locator("#board-continue")).toBeInViewport();
    const measure=await page.evaluate(()=>({
      width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,
      viewportWidth:innerWidth,viewportHeight:innerHeight
    }));
    expect(measure.width).toBeLessThanOrEqual(measure.viewportWidth+3);
    expect(measure.height).toBeLessThanOrEqual(measure.viewportHeight+3);
    await page.screenshot({path:"artifacts/pr35-board-"+size.width+"x"+size.height+".png",fullPage:true});
  });
}
