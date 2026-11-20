import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});

test("the foyer retains direct play and all three shortcuts @quick @smoke",async({page})=>{
  await expect(page.getByRole("heading",{name:"How much does the sprite weigh?"})).toBeVisible();
  await expect(page.locator("#home-stage-shortcuts .home-stage-quick")).toHaveCount(3);
  await expect(page.locator("#site-home .landing-copy p")).toHaveText("Balance the rooms. Discover the algebra.");
  await page.locator('[data-home-stage="notebook"]').click();
  await expect(page.locator("#notebook-workspace")).toBeVisible();
});

test("world cards show only essential information, and future doors stay locked @quick @smoke",async({page})=>{
  await page.locator('[data-screen="worlds"]').first().click();
  await expect(page.locator("#site-worlds h1")).toHaveText("Choose a world");
  await expect(page.locator(".world-card")).toHaveCount(4);
  await expect(page.locator(".world-card-body .world-subtitle")).toHaveCount(4);
  await expect(page.locator(".world-card-body p:not(.world-subtitle)")).toHaveCount(0);
  await expect(page.locator(".world-card-footer")).toContainText(["0 / 48 complete","0 / 48 complete","COMING SOON","COMING SOON"]);
  await expect(page.locator(".world-planned button")).toHaveCount(0);
  await page.getByRole("button",{name:"Explore stages"}).click();
  await expect(page.locator(".stage-card")).toHaveCount(3);
  await expect(page.locator('.stage-card[data-stage="guided"]')).toContainText("0 of 20 complete");
  await expect(page.locator('.stage-card[data-stage="notebook"]')).toContainText("0 of 12 complete");
  await expect(page.locator(".stage-card > p")).toHaveCount(3);
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

test("Inventor's Desk opens with the editor focused and optional rules @quick @smoke",async({page})=>{
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Create your own equation"}).click();
  await expect(page.locator("#workshop-equation")).toBeFocused();
  await expect(page.locator("#workshop-rules, .workshop-rules")).toHaveCount(1);
  await page.locator(".workshop-rules summary").click();
  await expect(page.locator(".workshop-rules")).toHaveAttribute("open","");
  await page.locator('[data-workshop-example="3x + 5 = 20"]').click();
  await expect(page.locator("#workshop-equation")).toHaveValue("3x + 5 = 20");
  await expect(page.locator("#workshop-feedback")).toContainText("Example ready");
  await expect(page.locator("#workshop-feedback")).not.toHaveAttribute("data-status","error");
});

test("Experiment Board retains 20/16/12 levels and optional star help @smoke",async({page})=>{
  await page.locator("#home-choose-level").click();
  await expect(page.locator(".level-tile")).toHaveCount(20);
  await expect(page.locator("#level-progress")).toContainText("0 / 60 stars earned");
  await page.locator("#level-star-legend summary").click();
  await expect(page.locator("#level-star-legend")).toHaveAttribute("open","");
  await expect(page.locator("#level-star-legend")).toContainText("shortest route");
  await page.locator('[data-map-stage="independent"]').click();
  await expect(page.locator(".level-tile")).toHaveCount(16);
  await page.locator('[data-map-stage="notebook"]').click();
  await expect(page.locator(".level-tile")).toHaveCount(12);
  await expect(page.locator("#level-progress")).toContainText("0 / 36 stars earned");
});

for(const size of [{width:1024,height:720},{width:1092,height:540}]){
  test("compact menu copy fits laptop "+size.width+"x"+size.height+" @smoke",async({page})=>{
    await page.setViewportSize(size);
    for(const screen of ["worlds","help","settings"]){
      await page.locator('.site-nav-links [data-screen="'+screen+'"]').click();
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

test("phone menus remain usable without sideways clipping @quick @smoke",async({page})=>{
  await page.setViewportSize({width:375,height:812});
  for(const screen of ["worlds","help","settings"]){
    await page.locator('.site-nav-links [data-screen="'+screen+'"]').click();
    const width=await page.evaluate(()=>document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(378);
  }
  await page.locator('.site-nav-links [data-screen="worlds"]').click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Create your own equation"}).click();
  await expect(page.locator("#workshop-equation")).toBeVisible();
  const width=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(378);
});
