import {test,expect} from "@playwright/test";
test("Atelier, Help and Settings preserve the chosen world or method screen @quick @smoke",async({page})=>{
  await page.goto("/");
  await page.locator("#home-choose-level").click();
  await page.locator('.site-nav-links [data-screen="atelier"]').click();
  await expect(page.locator("#atelier-back")).toHaveText("← Back to worlds");
  await page.locator("#atelier-back").click();
  await expect(page.locator("#site-worlds")).toBeVisible();
  await page.locator('[data-world-stages="fractions"]').click();
  await page.locator('.site-nav-links [data-screen="help"]').click();
  await page.locator("#help-return").click();
  await expect(page.locator("#site-stages")).toHaveAttribute("data-active-world","fractions");
  await page.locator('.site-nav-links [data-screen="settings"]').click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#site-stages")).toBeVisible();
  await expect(page.locator("#site-levels")).toBeHidden();
  await page.locator('[data-stage-open="independent"]').click();
  await page.locator('.site-nav-links [data-screen="atelier"]').click();
  await page.locator("#atelier-back").click();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-world","fractions");
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","independent");
  await page.locator("#site-back").click();
  await page.locator("#stages-back").click();
  await page.locator('[data-world-stages="squares"]').click();
  await expect(page.locator("#site-stages")).toHaveAttribute("data-active-world","squares");
  await expect(page.locator("#site-levels")).toBeHidden();
});
for(const size of [{width:1092,height:540},{width:375,height:812}]){
  test("world and method choices stay reachable at "+size.width+"x"+size.height+" @smoke",async({page},info)=>{
    await page.setViewportSize(size);
    await page.goto("/");
    await page.locator("#home-choose-level").click();
    for(const button of await page.locator("[data-world-stages]").all()){
      await button.scrollIntoViewIfNeeded();await expect(button).toBeInViewport();
    }
    await info.attach("world-menu.png",{body:await page.screenshot(),contentType:"image/png"});
    await page.locator('[data-world-stages="squares"]').click();
    for(const button of await page.locator("[data-stage-open]").all()){
      await button.scrollIntoViewIfNeeded();await expect(button).toBeInViewport();
    }
    await info.attach("method-menu.png",{body:await page.screenshot(),contentType:"image/png"});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3)).toBe(true);
    await page.locator('[data-stage-open="notebook"]').click();
    await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","notebook");
  });
}
