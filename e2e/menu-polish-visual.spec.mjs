import {test,expect} from "@playwright/test";
import {mkdirSync} from "node:fs";

mkdirSync("artifacts",{recursive:true});

for(const size of [
  {width:1024,height:720},
  {width:1092,height:540},
  {width:375,height:812}
]){
  test("PR34 menu visual reference "+size.width+"x"+size.height+" @smoke",async({page})=>{
    await page.emulateMedia({reducedMotion:"reduce"});
    await page.setViewportSize(size);
    await page.goto("/");
    const name=size.width+"x"+size.height;
    await expect(page.locator("#home-title")).toBeVisible();
    await page.screenshot({path:"artifacts/pr34-"+name+"-foyer.png",fullPage:true});

    await page.locator('.site-nav-links [data-screen="levels"]').click();
    await expect(page.locator("#map-world-tabs button")).toHaveCount(4);
    await expect(page.locator(".level-tile")).toHaveCount(24);
    await page.screenshot({path:"artifacts/pr59-"+name+"-worlds-and-levels.png",fullPage:true});

    await page.locator('.site-nav-links [data-screen="home"]').click();
    await page.locator("#home-choose-level").click();
    await expect(page.locator(".level-tile")).toHaveCount(24);
    await page.screenshot({path:"artifacts/pr34-"+name+"-board.png",fullPage:true});

    await page.locator('.site-nav-links [data-screen="levels"]').click();
    await page.locator('#site-levels [data-screen="workshop"]').click();
    await expect(page.locator("#workshop-equation")).toBeFocused();
    await page.screenshot({path:"artifacts/pr34-"+name+"-desk.png",fullPage:true});

    await page.locator('.site-nav-links [data-screen="help"]').click();
    await page.screenshot({path:"artifacts/pr34-"+name+"-help.png",fullPage:true});

    await page.locator('.site-nav-links [data-screen="settings"]').click();
    await page.screenshot({path:"artifacts/pr34-"+name+"-settings.png",fullPage:true});
  });
}
