import {playCampaignLevel} from "./campaign-menu-helper.mjs";
import {openCampaignBoard,chooseCampaignWorld} from "./campaign-menu-helper.mjs";
import {test,expect} from "@playwright/test";
async function board(page){
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.addInitScript(()=>localStorage.setItem("mathssprites.motion-preference.v1","reduced"));
  await page.goto("/");
  await openCampaignBoard(page,"fractions");
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-world","fractions");
}
const lab=page=>page.locator("#fraction-game-host");
const ready=page=>expect(lab(page).locator("#fraction-lab")).toHaveAttribute("data-busy","false",{timeout:25000});
async function factor(page,op,n){
  const root=lab(page);
  await root.locator('[data-fb-op="'+op+'"]').click();
  await root.locator('[data-fb-factor="'+n+'"]').click();
  await root.locator("#fb-apply").click();
  await ready(page);
}
async function amount(page,op,kind,whole,num,den){
  const root=lab(page);
  await root.locator('[data-fb-op="'+op+'"]').click();
  await root.locator('[data-fb-kind="'+kind+'"]').click();
  await root.locator("#fb-whole").selectOption(String(whole));
  await root.locator("#fb-denominator").selectOption(String(den));
  await root.locator("#fb-numerator").selectOption(String(num));
  await root.locator("#fb-apply").click();
  await ready(page);
}
test("Fraction Workshop opens all 24 Guided levels, alongside Apprentice @quick @smoke",async({page})=>{
  await board(page);
  await expect(page.locator(".chapter-group")).toHaveCount(6);
  await expect(page.locator(".level-tile")).toHaveCount(24);
  await expect(page.locator(".level-tile:disabled")).toHaveCount(0);
  await expect(page.locator('[data-stage-open="independent"]')).toBeEnabled();
  await expect(page.locator('[data-stage-open="notebook"]')).toBeEnabled();
  await expect(page.locator("#level-progress")).toContainText("0 / 72 stars");
  await playCampaignLevel(page,page.locator('[data-level="24"]'));
  await expect(lab(page).locator("#fb-level-title")).toHaveText("The twelfths challenge");
  await expect(lab(page).locator("#fb-chapter-status")).toContainText("WORLD 3 · STAGE 1 · LEVEL 24 / 24");
  await expect(lab(page).locator("#fb-kind-tools")).toBeHidden();
  await expect(lab(page).locator("#fb-amount-tools")).toBeHidden();
  await expect(lab(page).locator("#fb-factor-tools")).toBeHidden();
  await expect(lab(page).locator("#fb-review")).toBeHidden();
  await lab(page).locator("#fb-game-levels").click();
  await expect(lab(page)).toHaveCount(0);
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-world","fractions");
});
test("solve a Guided fraction level, reveal exact comic and stars, advance and resume without touching legacy saves",async({page})=>{
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await board(page);
  const legacy=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>!k.endsWith(".v2")&&k!=="mathssprites.cosmetics.v1"&&!k.startsWith("mathssprites.route-guide."))));
  await playCampaignLevel(page,page.locator('[data-level="1"]'));
  const root=lab(page);
  await expect(root.locator("#fb-level-title")).toHaveText("Share the spare weight");
  await expect(root.locator("#fb-apply")).toBeDisabled();
  await factor(page,"divide",2);
  await expect(root.locator("#fraction-lab")).toHaveAttribute("data-solved","true");
  await expect(root.locator("#fb-rating")).toContainText("★★★ 3 stars");
  await expect(root.locator("#level-clear")).toBeVisible();
  await expect(page.locator("#replay-backdrop")).toBeVisible();
  await expect(page.locator("#replay-title")).toHaveText("Your algebra, illustrated.");
  await expect(page.locator("#comic-panels")).toContainText("Before the hand began");
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("x = 7/2");
  await expect(page.locator("#comic-panels .current-panel [data-numerator=\"1\"][data-denominator=\"2\"]")).toBeVisible();
  await expect(page.locator("#reward-celebration-names")).toContainText("Curious eyes");
  await expect(page.locator("#reward-celebration")).toBeVisible();
  const cosmetic=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.cosmetics.v1")));
  expect(cosmetic.unlockedRewards).toEqual(["curious-eyes"]);
  const store=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(store.worlds.fractions.stages.guided.completed).toEqual(["frac-g-01"]);
  expect(store.worlds.fractions.stages.guided.bestMoves["frac-g-01"]).toBe(1);
  expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>!k.endsWith(".v2")&&k!=="mathssprites.cosmetics.v1"&&!k.startsWith("mathssprites.route-guide."))))).toEqual(legacy);
  await page.locator("#next-level").click();
  await expect(lab(page).locator("#fb-chapter-status")).toContainText("LEVEL 02 / 24");
  await lab(page).locator("#fb-game-home").click();
  await expect(page.locator("#home-play")).toContainText("Continue: Fractions · Guided · Level 2");
  await page.reload();
  await page.locator("#home-play").click();
  await expect(lab(page).locator("#fb-chapter-status")).toContainText("LEVEL 02 / 24");
  await lab(page).locator("#fb-game-levels").click();
  await expect(page.locator('[data-level="1"] .tile-stars')).toHaveAttribute("data-stars","3");
  await chooseCampaignWorld(page,"workshop");
  await playCampaignLevel(page,page.locator('[data-level="1"]'));
  await expect(page.locator("#game-shell")).toBeVisible();
  await expect(page.locator("#level-title")).toHaveText("One little resident");
  expect(errors).toEqual([]);
});
test("multi-step fraction comic pages and Undo use exact committed operations",async({page})=>{
  await board(page);
  await playCampaignLevel(page,page.locator('[data-level="15"]'));
  await factor(page,"multiply",4);await factor(page,"divide",3);
  const root=lab(page);
  await expect(root.locator("#fb-rating")).toContainText("optimal: 2");
  await expect(page.locator("#replay-backdrop")).toBeVisible();
  await page.locator("#replay-play").click();
  await expect(page.locator("#replay-progress")).toContainText("Panel 1 of 3");
  await expect(page.locator("#reward-celebration")).toBeHidden();
  await page.locator("#replay-skip").click();
  await expect(page.locator("#reward-celebration-names")).toContainText("Curious eyes");
  await expect(page.locator("#reward-celebration")).toBeVisible();
  await expect(page.locator("#comic-panels .comic-panel")).toHaveCount(3);
  await expect(page.locator("#replay-next")).toBeDisabled();
  await page.locator("#replay-back").click();
  await expect(page.locator("#replay-progress")).toContainText("Panel 2 of 3");
  await page.locator("#replay-close").click();
  await root.locator("#fb-undo").click();
  await expect(root.locator("#fb-review")).toBeHidden();
  await expect(root.locator("#fb-moves")).toHaveText("1 move");
  await expect(root.locator("#fb-rating")).toBeEmpty();
  await factor(page,"divide",3);
  await expect(root.locator("#fb-rating")).toContainText("★★★");
  await expect(page.locator("#replay-backdrop")).toBeVisible();
});
test("Guided fraction board and physical scene stay usable on a short laptop and phone",async({page})=>{
  await board(page);
  await playCampaignLevel(page,page.locator('[data-level="5"]'));
  for(const viewport of [{width:1280,height:720},{width:360,height:640}]){
    await page.setViewportSize(viewport);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await expect(lab(page).locator("#scene")).toBeVisible();
  }
  await amount(page,"remove","posOne",0,1,2);
  await expect(lab(page).locator("#fraction-lab")).toHaveAttribute("data-solved","true");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
