import {openCampaignBoard,chooseCampaignStage,chooseCampaignWorld} from "./campaign-menu-helper.mjs";
import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});

test("the foyer offers one campaign entry for a fresh learner @quick @smoke",async({page})=>{
  await expect(page.getByRole("heading",{name:"How much does the sprite weigh?"})).toBeVisible();
  await expect(page.locator("#home-play")).toBeHidden();
  await expect(page.locator("#home-choose-level")).toHaveText("Choose a world →");
  await page.locator("#home-choose-level").click();
  await expect(page.locator("#site-worlds")).toBeVisible();
});
test("the selected world's method cards explain how to learn and show progress @quick @smoke",async({page})=>{
  await page.locator('.site-nav-links [data-screen="worlds"]').click();
  await expect(page.locator("#world-cards [data-world-stages]")).toHaveCount(4);
  await page.locator('[data-world-stages="opposites"]').click();
  await expect(page.locator("#site-stages")).toBeVisible();
  await expect(page.locator('[data-stage="guided"]')).toContainText("mirrors");
  await expect(page.locator('[data-stage="independent"]')).toContainText("balance");
  await expect(page.locator('[data-stage="notebook"]')).toContainText("editor");
  await page.locator('[data-stage-open="notebook"]').click();
  await expect(page.locator("#world1-progress-number")).toHaveText("0 of 16 complete");
  await page.locator("#site-back").click();
  await expect(page.locator("#site-stages")).toHaveAttribute("data-active-world","opposites");
  await page.locator('[data-stage-open="guided"]').click();
  await expect(page.locator("#world1-progress-number")).toHaveText("0 of 24 complete");
});
test("the guide is short first, with full stage explanations on demand @smoke",async({page})=>{
  await page.locator('.site-nav-links [data-screen="help"]').click();
  await expect(page.locator("#site-help h2")).toBeFocused();
  await expect(page.locator('.site-nav-links [data-screen="help"]')).toHaveAttribute("aria-current","page");
  await expect(page.locator(".guide-steps li")).toHaveCount(3);
  await expect(page.locator("#help-stages")).not.toHaveAttribute("open","");
  await page.locator("#help-stages summary").click();
  await expect(page.locator("#help-stages")).toHaveAttribute("open","");
  await expect(page.locator("#help-stages")).toContainText("Algebra Apprentice");
  await page.locator("#help-experiments summary").click();
  await expect(page.locator("#help-experiments")).toContainText("undoes the attempt");
  await page.getByRole("button",{name:"Choose your first world"}).click();
  await expect(page.locator("#site-worlds")).toBeVisible();
  await expect(page.locator("#world-cards [data-world-stages]")).toHaveCount(4);
});

test("settings are scannable, keyboard-operable, and motion state is announced @smoke",async({page})=>{
  await page.locator('.site-nav-links [data-screen="settings"]').click();
  await expect(page.locator("#site-settings h2")).toBeFocused();
  await expect(page.locator("#site-guided-help")).toBeChecked();
  await expect(page.locator("#teacher-unlock")).not.toBeChecked();
  await expect(page.locator("#site-replay-intro")).toBeVisible();
  await expect(page.locator("#site-replay-independent")).toBeVisible();
  await expect(page.locator("#site-motion")).toHaveAttribute("aria-pressed","false");
  await page.locator("#site-motion").click();
  await expect(page.locator("#site-motion")).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("#site-motion")).toHaveText("Turn animations on");
  await page.locator("#site-guided-help").uncheck();
  await expect(page.locator("#site-guided-help")).not.toBeChecked();
  await page.locator("#site-motion").click();
  await expect(page.locator("#site-motion")).toHaveAttribute("aria-pressed","false");
});

test("Inventor's Desk opens directly from Home and the Experiment Board @quick @smoke",async({page})=>{
  await page.locator('#site-home [data-screen="workshop"]').click();
  await expect(page.locator("#workshop-equation")).toBeFocused();
  await expect(page.locator("#workshop-rules, .workshop-rules")).toHaveCount(1);
  await page.locator(".workshop-rules summary").click();
  await expect(page.locator(".workshop-rules")).toHaveAttribute("open","");
  await page.locator('[data-workshop-example="3x + 5 = 20"]').click();
  await expect(page.locator("#workshop-equation")).toHaveValue("3x + 5 = 20");
  await expect(page.locator("#workshop-feedback")).toContainText("Example ready");
  await expect(page.locator("#workshop-feedback")).not.toHaveAttribute("data-status","error");
  await page.locator("#workshop-back").click();
  await expect(page.locator("#site-home")).toBeVisible();
  await openCampaignBoard(page);
  await page.locator('#site-levels [data-screen="workshop"]').click();
  await expect(page.locator("#workshop-equation")).toBeFocused();
  await page.locator("#workshop-back").click();
  await expect(page.locator("#site-levels")).toBeVisible();
});

test("Experiment Board retains 24/20/16 World 1 levels and optional star help @smoke",async({page})=>{
  await openCampaignBoard(page);
  await expect(page.locator(".level-tile")).toHaveCount(24);
  await expect(page.locator("#level-progress")).toContainText("0 / 72 stars earned");
  await page.locator("#level-star-legend summary").click();
  await expect(page.locator("#level-star-legend")).toHaveAttribute("open","");
  await expect(page.locator("#level-star-legend")).toContainText("shortest route");
  await chooseCampaignStage(page,"independent");
  await expect(page.locator(".level-tile")).toHaveCount(20);
  await chooseCampaignStage(page,"notebook");
  await expect(page.locator(".level-tile")).toHaveCount(16);
  await expect(page.locator("#level-progress")).toContainText("0 / 48 stars earned");
});

for(const size of [{width:1024,height:720},{width:1092,height:540}]){
  test("the active menus fit laptop "+size.width+"x"+size.height+" @smoke",async({page})=>{
    await page.setViewportSize(size);
    for(const screen of ["worlds","help","settings"]){
      await page.locator('.site-nav-links [data-screen="'+screen+'"]').click();
      await expect(page.locator("#site-"+screen)).toBeVisible();
      const scroll=await page.evaluate(()=>({
        width:document.documentElement.scrollWidth,
        height:document.documentElement.scrollHeight,
        windowWidth:innerWidth,windowHeight:innerHeight
      }));
      expect(scroll.width).toBeLessThanOrEqual(scroll.windowWidth+3);
      expect(scroll.height).toBeLessThanOrEqual(scroll.windowHeight+3);
    }
  });
}

test("phone menus and Equation Workshop remain usable without sideways clipping @quick @smoke",async({page})=>{
  await page.setViewportSize({width:375,height:812});
  for(const screen of ["worlds","help","settings"]){
    await page.locator('.site-nav-links [data-screen="'+screen+'"]').click();
    await expect(page.locator("#site-"+screen)).toBeVisible();
    const width=await page.evaluate(()=>document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(378);
  }
  await openCampaignBoard(page);
  await page.locator('#site-levels [data-screen="workshop"]').click();
  await expect(page.locator("#workshop-equation")).toBeVisible();
  const width=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(378);
});
