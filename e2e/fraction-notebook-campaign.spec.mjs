import {assertGrounded} from "./scene-grounding-helper.mjs";
import {playCampaignLevel} from "./campaign-menu-helper.mjs";
import {openCampaignBoard} from "./campaign-menu-helper.mjs";
import {test,expect} from "@playwright/test";
const lab=page=>page.locator("#fraction-game-host");
const root=page=>lab(page).locator("#fraction-lab");
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
async function board(page){
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.addInitScript(()=>localStorage.setItem("mathssprites.motion-preference.v1","reduced"));await page.goto("/");
  await openCampaignBoard(page,"fractions","notebook");
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","notebook");
}
async function open(page,n){await playCampaignLevel(page,page.locator('[data-level="'+n+'"]'));await expect(root(page)).toHaveAttribute("data-notebook-phase","paper");}
async function typeOperation(page,text){
  const h=lab(page);
  if(!await h.locator("#fb-nb-type-details").evaluate(el=>el.open))await h.locator("#fb-nb-type-details summary").click();
  await h.locator("#fb-nb-typed").fill(text);
}
async function preview(page){await lab(page).locator("#fb-nb-preview").click();}
async function confirm(page){await lab(page).locator("#fb-nb-confirm").click();}
async function watch(page){
  await lab(page).locator("#fb-nb-watch").click();
  await expect(root(page)).toHaveAttribute("data-notebook-phase","replay",{timeout:45000});
  await expect(root(page)).toHaveAttribute("data-notebook-playing","false");
}
test("World 3 Apprentice publishes all sixteen levels and starts with paper, not a balance @quick @smoke",async({page})=>{
  await board(page);await expect(page.locator(".chapter-group")).toHaveCount(4);
  await expect(page.locator(".level-tile")).toHaveCount(16);
  await expect(page.locator(".level-tile:disabled")).toHaveCount(0);
  await expect(page.locator("#level-progress")).toContainText("0 / 48 stars");
  await open(page,16);const h=lab(page);
  await expect(h.locator("#fb-chapter-status")).toContainText("WORLD 3 · STAGE 3 · LEVEL 16 / 16");
  await expect(h.locator(".fb-mode-badge")).toHaveText("Algebra Apprentice");
  await expect(h.locator("#fb-notebook")).toBeVisible();
  await expect(h.locator("#scene")).toBeHidden();
  await expect(h.locator(".fb-tools")).toBeHidden();
  await expect(h.locator("#fb-nb-lines li")).toHaveCount(1);
  await expect(h.locator("#fb-nb-watch")).toBeHidden();
  await expect(h.locator("#fb-nb-confirm")).toBeDisabled();
  await h.locator("#fb-game-levels").click();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","notebook");
});
test("structured stacked fractions preview without committing, confirm, then earn stars only after physical replay",async({page})=>{
  test.setTimeout(60000);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await board(page);await open(page,3);
  const h=lab(page);
  await h.locator('[data-nb-sign="−"]').click();
  await h.locator("#fb-nb-fraction-toggle").click();
  await h.locator("#fb-nb-num").fill("3");
  await h.locator("#fb-nb-den").fill("5");
  await expect(h.locator("#fb-nb-operation-preview mfrac")).toHaveText("35");
  await preview(page);
  await expect(h.locator("#fb-nb-result math mfrac")).toHaveText("75");
  await expect(h.locator("#fb-nb-lines li")).toHaveCount(1);
  expect((await saved(page)).worlds.fractions.stages.notebook.completed).toEqual([]);
  await confirm(page);
  await expect(h.locator("#fb-nb-lines li")).toHaveCount(2);
  await expect(root(page)).toHaveAttribute("data-notebook-solved","true");
  await expect(h.locator("#scene")).toBeHidden();
  await expect(h.locator("#fb-nb-watch")).toBeVisible();
  expect((await saved(page)).worlds.fractions.stages.notebook.completed).toEqual([]);
  await expect(page.locator("#reward-celebration")).toBeHidden();
  await watch(page);
  await expect(page.locator("#reward-celebration-names")).toContainText("Curious eyes");
  await expect(h.locator("#scene")).toBeVisible();
  const replayViewport=page.viewportSize();
  await page.setViewportSize({width:1092,height:540});
  await assertGrounded(h.locator("#scene"));
  await page.setViewportSize(replayViewport);
  await assertGrounded(h.locator("#scene"));
  await expect(h.locator(".fb-tools")).toBeHidden();
  await expect(h.locator("#right-items")).toHaveAttribute("aria-label","East chamber: 0 sprites, 7/5 weights");
  await expect(h.locator("#fb-rating")).toContainText("★★★");
  await expect(h.locator("#fb-comic-page math mfrac").last()).toHaveText("75");
  const data=await saved(page);
  expect(data.worlds.fractions.stages.notebook.completed).toEqual(["frac-a-03"]);
  expect(data.worlds.fractions.stages.notebook.bestMoves["frac-a-03"]).toBe(1);
  expect(data.worlds.fractions.stages.guided.completed).toEqual([]);
  expect(data.worlds.fractions.stages.independent.completed).toEqual([]);
  await h.locator("#fb-nb-again").click();
  await expect(root(page)).toHaveAttribute("data-notebook-phase","replay",{timeout:45000});
  await expect(root(page)).toHaveAttribute("data-notebook-playing","false");
  await expect(h.locator("#fb-rating")).toContainText("★★★");
  expect((await saved(page)).worlds.fractions.stages.notebook.completed).toEqual(["frac-a-03"]);
  await h.locator("#fb-next-level").click();
  await expect(root(page)).toHaveAttribute("data-notebook-phase","paper");
  await expect(lab(page).locator("#fb-chapter-status")).toContainText("LEVEL 04 / 16");
  await lab(page).locator("#fb-game-home").click();await page.reload();
  await expect(page.locator("#home-play")).toContainText("Continue: Fractions · Algebra Apprentice · Level 4");
  await page.locator("#home-play").click();await expect(root(page)).toHaveAttribute("data-notebook-phase","paper");
  expect(errors).toEqual([]);
});
test("typed equivalent fractions, invalid preview, editing invalidation, undo and multi-step exact replay",async({page})=>{
  test.setTimeout(60000);
  await board(page);await open(page,9);const h=lab(page);
  await typeOperation(page,"−1/7");await preview(page);
  await expect(h.locator("#fb-nb-feedback")).toHaveAttribute("data-error","true");
  await expect(h.locator("#fb-nb-confirm")).toBeDisabled();
  await typeOperation(page,"−2/4");await preview(page);
  await expect(h.locator("#fb-nb-confirm")).toBeEnabled();
  await h.locator("#fb-nb-typed").fill("−3/6");
  await expect(h.locator("#fb-nb-confirm")).toBeDisabled();
  await preview(page);await confirm(page);
  await expect(h.locator("#fb-nb-lines li").last().locator(".fb-paper-op mfrac")).toHaveText("36");
  await h.locator("#fb-nb-undo").click();await expect(h.locator("#fb-nb-lines li")).toHaveCount(1);
  await typeOperation(page,"−1/2");await preview(page);await confirm(page);
  await typeOperation(page,"÷3");await preview(page);await confirm(page);
  await expect(h.locator("#fb-nb-count")).toHaveText("2 moves");
  await expect(h.locator("#fb-nb-lines li").last().locator("mfrac").first()).toHaveText("52");
  await watch(page);
  await expect(h.locator("#fb-replay-step")).toHaveText("1 / 2");
  await h.locator("#fb-replay-next").click();
  await expect(h.locator("#fb-replay-step")).toHaveText("2 / 2");
  await expect(h.locator("#fb-rating")).toContainText("optimal: 2");
  await h.locator("#fb-nb-back").click();
  await expect(root(page)).toHaveAttribute("data-notebook-phase","paper");
  await expect(h.locator("#fb-nb-lines li")).toHaveCount(3);
  await expect(h.locator("#scene")).toBeHidden();
});
test("fractional coefficient editor fits a narrow phone and short laptop without horizontal scrolling",async({page})=>{
  await board(page);await open(page,16);const h=lab(page);
  for(const viewport of [{width:1280,height:720},{width:360,height:640}]){
    await page.setViewportSize(viewport);
    await h.locator('[data-nb-sign="−"]').click();await h.locator("#fb-nb-fraction-toggle").click();
    await h.locator("#fb-nb-num").fill("1");await h.locator("#fb-nb-den").fill("2");await h.locator("#fb-nb-variable").click();
    await preview(page);await expect(h.locator("#fb-nb-result")).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await h.locator("#fb-nb-restart").click();
  }
});
