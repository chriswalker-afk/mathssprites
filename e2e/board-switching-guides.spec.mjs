import {test,expect} from "@playwright/test";
import {openCampaignBoard,playCampaignLevel} from "./campaign-menu-helper.mjs";
const board=p=>p.locator("#site-levels"),world=p=>p.locator("#board-world"),method=p=>p.locator("#board-method");
const saved=p=>p.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>/campaign|resume|progress|rating|cosmetic/.test(key))));
const settings=p=>p.locator('.site-nav-links [data-screen="settings"]');
const guide=p=>p.locator(".route-guide");
async function start(p){
  await p.emulateMedia({reducedMotion:"reduce"});
  await p.addInitScript(()=>localStorage.setItem("mathssprites.motion-preference.v1","reduced"));
  await p.goto("/");
}
async function openLevel(p,n){await playCampaignLevel(p,p.locator('[data-level="'+n+'"]'));}
test("quick selectors update every route without launching, saving or keeping a stale selection @quick @smoke",async({page})=>{
  await start(page);
  await page.locator("#home-choose-level").click();
  await expect(page.locator("#site-worlds")).toBeVisible();
  await expect(board(page)).toBeHidden();
  await page.locator('[data-world-stages="workshop"]').click();
  await expect(page.locator("#site-stages")).toBeVisible();
  await page.locator('[data-stage-open="guided"]').click();
  const before=await saved(page);
  for(const id of ["workshop","opposites","fractions","squares"]){
    await world(page).selectOption(id);
    await expect(board(page)).toHaveAttribute("data-active-world",id);
    for(const [stage,count] of [["guided",24],["independent",20],["notebook",16]]){
      await method(page).selectOption(stage);
      await expect(board(page)).toHaveAttribute("data-active-stage",stage);
      await expect(page.locator(".level-tile")).toHaveCount(count);
      await expect(page.locator("#board-continue")).toBeDisabled();
      await page.locator('[data-level="2"]').click();
      await expect(page.locator("#board-continue")).toBeEnabled();
      await expect(page.locator("#game-shell")).toBeHidden();
      await expect(page.locator("#fraction-game-host")).toHaveCount(0);
      expect(await saved(page)).toEqual(before);
    }
    // Switches to the next world preserve the explicitly chosen method.
    if(id!=="squares"){
      const next={workshop:"opposites",opposites:"fractions",fractions:"squares"}[id];
      await world(page).selectOption(next);
      await expect(method(page)).toHaveValue("notebook");
      await expect(page.locator("#board-continue")).toBeDisabled();
    }
  }
  await world(page).selectOption("workshop");await method(page).selectOption("guided");
  await expect(page.locator("#selected-level-content")).toBeHidden();
  await openLevel(page,8);
  await expect(page.locator("#level-title")).toHaveText("Five crowded baskets");
  await page.locator("#game-levels").click();
  await expect(world(page)).toHaveValue("workshop");
  await expect(method(page)).toHaveValue("guided");
  await expect(page.locator('[data-level="8"]')).toHaveAttribute("aria-pressed","true");
});
test("turning guidance off and back on re-arms the existing interactive introduction @quick @smoke",async({page})=>{
  await start(page);await openCampaignBoard(page);await openLevel(page,1);
  await expect(page.locator("#apprentice-guide")).toBeVisible();
  await page.locator("#guide-skip").click();
  await page.locator("#game-levels").click();
  await openLevel(page,1);await expect(page.locator("#apprentice-guide")).toBeHidden();
  await page.locator("#game-levels").click();await settings(page).click();
  const prior=await saved(page);
  await page.locator("#site-guided-help").uncheck();
  await page.locator("#site-guided-help").check();
  await expect(page.locator("#site-guide-status")).toContainText("next visit");
  expect(await saved(page)).toEqual(prior);
  await page.locator("#settings-return").click();
  await openLevel(page,1);
  await expect(page.locator("#apprentice-guide")).toBeVisible();
  await expect(page.locator("#guide-progress")).toHaveText("1 of 4");
});
test("a first visit to a later level offers help, dismissal persists, and reset restores it @quick @smoke",async({page})=>{
  await start(page);await openCampaignBoard(page);await openLevel(page,8);
  await expect(guide(page)).toHaveAttribute("data-route-guide","workshop/guided");
  await expect(guide(page).locator(".route-guide-content")).toBeVisible();
  await guide(page).locator('[data-guide-action="next"]').click();
  await expect(guide(page).locator(".route-guide-step")).toHaveText("2 of 3");
  await guide(page).locator('[data-guide-action="skip"]').click();
  await expect(guide(page).locator(".route-guide-content")).toBeHidden();
  await page.locator("#game-levels").click();
  await openLevel(page,8);await expect(guide(page).locator(".route-guide-content")).toBeHidden();
  await page.locator("#game-levels").click();await settings(page).click();
  await expect(page.locator("#site-guided-help")).toBeChecked();
  await page.locator("#site-reset-guides").click();
  await page.locator("#settings-return").click();await openLevel(page,8);
  await expect(guide(page).locator(".route-guide-content")).toBeVisible();
  await expect(guide(page).locator(".route-guide-step")).toHaveText("1 of 3");
});
for(const [id,stage] of [["fractions","guided"],["fractions","independent"],["fractions","notebook"],["squares","guided"],["squares","independent"],["squares","notebook"],["workshop","notebook"],["opposites","notebook"]]){
  test(id+" "+stage+" has independent first-visit guidance @smoke",async({page})=>{
    await start(page);await openCampaignBoard(page,id,stage);await openLevel(page,1);
    await expect(guide(page)).toHaveAttribute("data-route-guide",id+"/"+stage);
    await expect(guide(page).locator(".route-guide-content")).toBeVisible();
    await expect(guide(page).locator(".route-guide-step")).toHaveText("1 of 3");
    await guide(page).locator('[data-guide-action="next"]').click();
    await guide(page).locator('[data-guide-action="next"]').click();
    await expect(guide(page).locator('[data-guide-action="next"]')).toHaveText("Done");
    await guide(page).locator('[data-guide-action="next"]').click();
    await expect(guide(page).locator(".route-guide-content")).toBeHidden();
    await guide(page).locator(".route-guide-reopen").click();
    await expect(guide(page).locator(".route-guide-step")).toHaveText("1 of 3");
    await guide(page).locator('[data-guide-action="skip"]').click();
    await expect(guide(page).locator(".route-guide-content")).toBeHidden();
  });
}
test("disabled guide stays closed on a previously unvisited route but can be opened manually @smoke",async({page})=>{
  await start(page);await settings(page).click();await page.locator("#site-guided-help").uncheck();
  await openCampaignBoard(page,"fractions","guided");await openLevel(page,1);
  await expect(guide(page).locator(".route-guide-content")).toBeHidden();
  await guide(page).locator(".route-guide-reopen").click();
  await expect(guide(page).locator(".route-guide-content")).toBeVisible();
});
for(const size of [{width:1092,height:540},{width:1366,height:768},{width:390,height:844}]){
  test("board switches and play remain accessible at "+size.width+"x"+size.height+" @smoke",async({page},info)=>{
    await start(page);await page.setViewportSize(size);await openCampaignBoard(page);
    await expect(world(page)).toBeInViewport();await expect(method(page)).toBeInViewport();
    await world(page).selectOption("fractions");await method(page).selectOption("notebook");
    await page.locator('[data-level="16"]').click();
    await expect(page.locator("#board-continue")).toBeInViewport();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3)).toBe(true);
    await info.attach("board-switchers.png",{body:await page.screenshot(),contentType:"image/png"});
  });
}
