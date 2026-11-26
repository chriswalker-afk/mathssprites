import {test,expect} from "@playwright/test";
const lab=page=>page.locator("#fraction-game-host");
const root=page=>lab(page).locator("#fraction-lab");
const ready=page=>expect(root(page)).toHaveAttribute("data-busy","false",{timeout:25000});
async function board(page){
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.addInitScript(()=>localStorage.setItem("mathssprites.motion-preference.v1","reduced"));await page.goto("/");
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="fractions"]').click();
  await page.locator('[data-map-stage="independent"]').click();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","independent");
}
async function open(page,n){await page.locator('[data-level="'+n+'"]').click();await ready(page);}
async function amount(page,op,kind,n,d,whole=0){
  const host=lab(page);
  await host.locator('[data-fb-op="'+op+'"]').click();await host.locator('[data-fb-kind="'+kind+'"]').click();
  await host.locator("#fb-whole").selectOption(String(whole));await host.locator("#fb-denominator").selectOption(String(d));
  await host.locator("#fb-numerator").selectOption(String(n));
}
async function factor(page,op,n){
  const host=lab(page);await host.locator('[data-fb-op="'+op+'"]').click();await host.locator('[data-fb-factor="'+n+'"]').click();
}
async function visit(page,side){await lab(page).locator("#"+side+"-action").click();await ready(page);}
async function neutral(page){
  const host=lab(page);
  await expect(host.locator("#fb-kind-tools")).toBeHidden();
  await expect(host.locator("#fb-amount-tools")).toBeHidden();
  await expect(host.locator("#fb-factor-tools")).toBeHidden();
  await expect(host.locator('[data-fb-op][aria-pressed="true"]')).toHaveCount(0);
}
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
test("Independent Fractions opens twenty selectable levels, alongside Apprentice @quick @smoke",async({page})=>{
  await board(page);
  await expect(page.locator(".chapter-group")).toHaveCount(5);
  await expect(page.locator(".level-tile")).toHaveCount(20);
  await expect(page.locator(".level-tile:disabled")).toHaveCount(0);
  await expect(page.locator("#level-progress")).toContainText("0 / 60 stars");
  await expect(page.locator('[data-map-stage="notebook"]')).toBeEnabled();
  await open(page,20);
  await expect(lab(page).locator("#fb-chapter-status")).toContainText("WORLD 3 · STAGE 2 · LEVEL 20 / 20");
  await expect(lab(page).locator(".fb-mode-badge")).toHaveText("Your Turn");
  await expect(lab(page).locator("#fb-apply")).toBeHidden();
  await expect(lab(page).locator("#left-action")).toBeVisible();
  await expect(lab(page).locator("#right-action")).toBeVisible();
  await neutral(page);
  await lab(page).locator("#fb-game-levels").click();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","independent");
});
test("right-first equivalent fractional removals require a fresh second selection and count as one move",async({page})=>{
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await board(page);await open(page,5);
  await amount(page,"remove","posOne",6,8);await visit(page,"right");
  await expect(root(page)).toHaveAttribute("data-pending","right");
  await expect(lab(page).locator("#scene")).toHaveAttribute("data-balance","left-heavy");
  await expect(lab(page).locator("#right-action")).toBeDisabled();
  await expect(lab(page).locator("#left-action")).toBeDisabled();
  await expect(lab(page).locator("#left-chamber")).toHaveClass(/needs-match/);
  await expect(lab(page).locator("#fb-feedback")).toContainText("west chamber");
  await neutral(page);
  expect((await saved(page)).worlds.fractions.stages.independent.completed).toEqual([]);
  await expect(lab(page).locator("#fb-moves")).toHaveText("0 moves");
  await amount(page,"remove","posOne",3,4);await visit(page,"left");
  await expect(root(page)).toHaveAttribute("data-solved","true");
  await expect(root(page)).toHaveAttribute("data-pending","");
  await expect(lab(page).locator("#scene")).toHaveAttribute("data-balance","level");
  await expect(lab(page).locator("#fb-moves")).toHaveText("1 move");
  await expect(lab(page).locator("#fb-rating")).toContainText("★★★");
  await expect(lab(page).locator("#fb-replay-step")).toHaveText("1 / 1");
  await expect(lab(page).locator("#fb-comic-page math mfrac").first()).toBeVisible();
  const records=await saved(page);
  expect(records.worlds.fractions.stages.independent.completed).toEqual(["frac-i-05"]);
  expect(records.worlds.fractions.stages.independent.bestMoves["frac-i-05"]).toBe(1);
  expect(records.worlds.fractions.stages.guided.completed).toEqual([]);
  await lab(page).locator("#fb-next-level").click();await ready(page);
  await expect(lab(page).locator("#fb-chapter-status")).toContainText("LEVEL 06 / 20");
  await lab(page).locator("#fb-game-home").click();await page.reload();
  await expect(page.locator("#home-play")).toContainText("Continue Independent Fractions · Level 6");
  await page.locator("#home-play").click();await ready(page);
  await expect(lab(page).locator("#fb-chapter-status")).toContainText("LEVEL 06 / 20");
  expect(errors).toEqual([]);
});
test("mismatch and Undo restore both chambers without committing or awarding progress",async({page})=>{
  await board(page);await open(page,5);
  await amount(page,"remove","posOne",3,4);await visit(page,"left");
  await amount(page,"remove","posOne",1,4);await visit(page,"right");
  await expect(root(page)).toHaveAttribute("data-pending","");
  await expect(lab(page).locator("#scene")).toHaveAttribute("data-balance","level");
  await expect(lab(page).locator("#left-items")).toHaveAttribute("aria-label","West chamber: 1 sprites, 3/4 weights");
  await expect(lab(page).locator("#right-items")).toHaveAttribute("aria-label","East chamber: 0 sprites, 4 weights");
  await expect(lab(page).locator("#fb-moves")).toHaveText("0 moves");
  await expect(lab(page).locator("#fb-review")).toBeHidden();
  await neutral(page);
  await amount(page,"remove","posOne",3,4);await visit(page,"left");
  await lab(page).locator("#fb-undo").click();
  await expect(root(page)).toHaveAttribute("data-pending","");
  await expect(lab(page).locator("#scene")).toHaveAttribute("data-balance","level");
  await expect(lab(page).locator("#fb-feedback")).toContainText("First visit undone");
  await neutral(page);
  expect((await saved(page)).worlds.fractions.stages.independent.completed).toEqual([]);
});
test("manual division shares fractional leftovers, with a fresh matching factor in the other chamber",async({page})=>{
  await board(page);await open(page,1);
  for(const size of [{width:1280,height:720},{width:360,height:640}]){
    await page.setViewportSize(size);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  await factor(page,"divide",2);await visit(page,"left");await neutral(page);
  await expect(lab(page).locator("#fb-moves")).toHaveText("0 moves");
  await factor(page,"divide",2);await visit(page,"right");
  await expect(root(page)).toHaveAttribute("data-solved","true");
  await expect(lab(page).locator("#right-items")).toHaveAttribute("aria-label","East chamber: 0 sprites, 7/2 weights");
  await expect(lab(page).locator("#fb-rating")).toContainText("★★★");
});
