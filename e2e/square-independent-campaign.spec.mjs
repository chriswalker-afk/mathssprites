import {test,expect} from "@playwright/test";
import {mkdirSync} from "node:fs";
const items=(p,side="left")=>p.locator("#"+side+"-items");
const room=(p,side)=>p.locator("#"+side+"-chamber");
const tile=(p,id)=>p.locator('.level-tile[data-level-id="'+id+'"]');
const saved=p=>p.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
const ready=p=>expect(p.locator("#reset")).toBeEnabled({timeout:25000});
const other=side=>side==="left"?"right":"left";
async function board(p){
  await p.emulateMedia({reducedMotion:"reduce"});
  await p.addInitScript(()=>localStorage.setItem("mathssprites.motion-preference.v1","reduced"));
  await p.goto("/");
  await p.locator("#home-choose-level").click();
  await p.locator('[data-map-world="squares"]').click();
  await p.locator('[data-map-stage="independent"]').click();
  await expect(p.locator("#site-levels")).toHaveAttribute("data-active-world","squares");
  await expect(p.locator("#site-levels")).toHaveAttribute("data-active-stage","independent");
}
async function open(p,n){
  await tile(p,"square-i-"+String(n).padStart(2,"0")).click();
  await expect(p.locator("#chapter-status")).toHaveText("WORLD 4 · STAGE 2 · LEVEL "+String(n).padStart(2,"0")+" / 20");
  await ready(p);
}
async function choose(p,op,kind,count){
  await p.locator('.operation-picker [data-operation="'+op+'"]').click();
  if(kind)await p.locator('#object-picker [data-kind="'+kind+'"]').click();
  if(count!==undefined){
    const presses=["multiply","divide"].includes(op)?count-1:count;
    for(let i=0;i<presses;i++)await p.locator("#amount-up").click();
    await expect(p.locator("#amount-value")).toHaveText(String(count));
  }
}
async function visit(p,side,op,kind,count){
  await choose(p,op,kind,count);
  await p.locator("#"+side+"-action").click();await ready(p);
  await expect(p.locator("#left-area-box")).toBeHidden();
  await expect(p.locator("#right-area-box")).toBeHidden();
}
async function pair(p,side,op,kind,count){
  await visit(p,side,op,kind,count);
  await neutral(p);
  await visit(p,other(side),op,kind,count);
  await neutral(p);
}
async function neutral(p){
  await expect(p.locator('.operation-picker [aria-pressed="true"]')).toHaveCount(0);
  await expect(p.locator("#object-picker")).toBeHidden();
  await expect(p.locator("#amount-control")).toBeHidden();
  await expect(p.locator("#left-action")).toBeDisabled();
  await expect(p.locator("#right-action")).toBeDisabled();
}
async function noCredit(p){
  const data=await saved(p);
  expect(data.worlds.squares.stages.independent.completed).toEqual([]);
  expect(data.worlds.squares.stages.independent.bestMoves).toEqual({});
}
async function shot(p,name){
  mkdirSync("artifacts",{recursive:true});
  await p.screenshot({path:"artifacts/square-independent-"+name+".png",fullPage:true});
}
test("all twenty Independent Squares levels are available immediately, with separate visits and public Apprentice @quick @smoke",async({page})=>{
  await board(page);
  await expect(page.locator("#levels-stage-title")).toHaveText("Independent Squares");
  await expect(page.locator(".chapter-group")).toHaveCount(5);
  await expect(page.locator(".level-tile")).toHaveCount(20);
  await expect(page.locator(".level-tile:disabled")).toHaveCount(0);
  await expect(page.locator("#level-progress")).toContainText("0 / 60 stars");
  await expect(page.locator('[data-map-stage="guided"]')).toBeEnabled();
  await expect(page.locator('[data-map-stage="notebook"]')).toBeEnabled();
  await open(page,20);
  await expect(page.locator("#campaign-hand-title")).toHaveText("Your Turn");
  await expect(page.locator("#do-both")).toBeHidden();
  await expect(page.locator("#mode-select")).toBeDisabled();
  await expect(page.locator("#left-action")).toBeVisible();
  await expect(page.locator("#right-action")).toBeVisible();
  await expect(page.locator("#square-inspect-toggle")).toBeVisible();
  await neutral(page);
  await page.locator("#game-levels").click();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","independent");
  await shot(page,"board");
});
test("right-first square construction needs a new second selection; two visits earn one move and three stars",async({page})=>{
  test.setTimeout(60000);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await board(page);await open(page,1);
  await expect(page.locator("#level-prompt")).toContainText("Build a complete square");
  await expect(page.locator("#square-inspect-toggle")).toBeHidden();
  await visit(page,"right","square");
  await expect(items(page,"right").locator(".weight")).toHaveCount(16);
  await expect(items(page).locator(".sprite-black")).toHaveCount(1);
  await expect(room(page,"left")).toHaveClass(/needs-match/);
  await expect(room(page,"right")).toHaveClass(/already-moved/);
  await expect(page.locator("#replay-backdrop")).toBeHidden();
  await neutral(page);await noCredit(page);
  await choose(page,"square");
  await expect(page.locator("#left-action")).toHaveText("Visit other chamber");
  await expect(page.locator("#right-action")).toBeDisabled();
  await shot(page,"first-visit");
  await page.locator("#left-action").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:25000});
  await expect(items(page).locator(".sprite-square")).toHaveCount(1);
  await expect(items(page,"right").locator(".weight")).toHaveCount(16);
  await expect(page.locator("#replay-star-summary")).toContainText("★★★ 3 stars");
  await expect(page.locator("#replay-star-summary")).toContainText("1 move (optimal: 1)");
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("x² = 16");
  const data=await saved(page);
  expect(data.worlds.squares.stages.independent.completed).toEqual(["square-i-01"]);
  expect(data.worlds.squares.stages.independent.bestMoves["square-i-01"]).toBe(1);
  expect(data.worlds.squares.stages.guided.completed).toEqual([]);
  await page.locator("#next-level").click();
  await expect(page.locator("#chapter-status")).toContainText("STAGE 2 · LEVEL 02 / 20");
  await neutral(page);
  await page.locator("#game-home").click();await page.reload();
  await expect(page.locator("#home-play")).toContainText("Continue Independent Squares · Level 2");
  await page.locator("#home-play").click();
  await expect(page.locator("#chapter-status")).toContainText("STAGE 2 · LEVEL 02 / 20");
  expect(errors).toEqual([]);
});
test("different physical operation is shown and undone, without prechecking the selected match or granting credit",async({page})=>{
  test.setTimeout(60000);
  await board(page);await open(page,1);
  await page.evaluate(()=>{
    window.squareMismatchOutcomes=[];
    const scene=document.getElementById("scene");
    new MutationObserver(()=>{
      if(scene.dataset.balanceOutcome)window.squareMismatchOutcomes.push(scene.dataset.balanceOutcome);
    }).observe(scene,{attributes:true,attributeFilter:["data-balance-outcome"]});
  });
  await visit(page,"left","square");
  await expect(items(page).locator(".sprite-square")).toHaveCount(1);
  await choose(page,"sqrt");
  await expect(page.locator("#right-action")).toHaveText("Visit other chamber");
  await page.locator("#right-action").click();await ready(page);
  expect(await page.evaluate(()=>window.squareMismatchOutcomes)).toContain("tipped");
  await expect(items(page).locator(".sprite-square")).toHaveCount(0);
  await expect(items(page).locator(".sprite-black")).toHaveCount(1);
  await expect(items(page,"right").locator(".weight")).toHaveCount(4);
  await expect(room(page,"right")).not.toHaveClass(/needs-match/);
  await expect(page.locator("#undo")).toBeDisabled();
  await neutral(page);await noCredit(page);
  await visit(page,"right","square");
  await expect(items(page,"right").locator(".weight")).toHaveCount(16);
  await page.locator("#undo").click();
  await expect(items(page,"right").locator(".weight")).toHaveCount(4);
  await neutral(page);await noCredit(page);
});
test("matching an impossible second root restores the last committed equation and shows the actual incomplete area",async({page})=>{
  test.setTimeout(75000);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await board(page);await open(page,9);
  await pair(page,"left","add","posOne",11);
  await expect(items(page).locator(".weight")).toHaveCount(12);
  await expect(items(page,"right").locator(".weight")).toHaveCount(36);
  await visit(page,"right","sqrt");
  await expect(items(page,"right").locator(".weight")).toHaveCount(6);
  await expect(page.locator("#square-inspect-toggle")).toBeHidden();
  await page.evaluate(()=>{
    window.rootRefusalQA=[];
    const stage=document.getElementById("left-attempt-stage");
    new MutationObserver(()=>{
      if(stage.dataset.rootTrial==="true"){
        window.rootRefusalQA.push({missing:Number(stage.dataset.rootMissing),
          excess:Number(stage.dataset.rootExcess),actual:stage.querySelectorAll(".box-cell .box-actor").length,
          tray:stage.querySelectorAll(".root-trial-extra").length});
      }
    }).observe(stage,{attributes:true,attributeFilter:["data-root-trial","hidden"]});
  });
  await choose(page,"sqrt");
  await page.locator("#left-action").click();await ready(page);
  expect(await page.evaluate(()=>window.rootRefusalQA)).toContainEqual({missing:0,excess:11,actual:4,tray:11});
  await expect(items(page).locator(".sprite-square")).toHaveCount(1);
  await expect(items(page).locator(".sprite-black")).toHaveCount(2);
  await expect(items(page).locator(".weight")).toHaveCount(12);
  await expect(items(page,"right").locator(".weight")).toHaveCount(36);
  await expect(page.locator("#left-attempt-stage")).toBeHidden();
  await expect(page.locator("#undo")).toBeEnabled();
  await neutral(page);await noCredit(page);
  await page.locator("#undo").click();
  await expect(items(page).locator(".weight")).toHaveCount(1);
  await expect(items(page,"right").locator(".weight")).toHaveCount(25);
  await expect(page.locator("#undo")).toBeDisabled();
  expect(errors).toEqual([]);
});
test("public Independent inspection starts neutral, permits learner-selected dimensions and never counts as a move",async({page})=>{
  test.setTimeout(100000);
  await page.setViewportSize({width:390,height:844});
  await board(page);await open(page,14);
  const toggle=page.locator("#square-inspect-toggle");
  const box=page.locator("#left-inspection");
  const plus=k=>page.locator('#square-inspect-panel [data-inspect-dimension="'+k+'"][data-inspect-delta="1"]');
  await toggle.click();
  await expect(page.locator("#square-inspect-a")).toHaveText("0");
  await expect(page.locator("#square-inspect-b")).toHaveText("0");
  await expect(box).toBeHidden();
  await plus("a").click();await plus("b").click();
  await expect(box).toHaveAttribute("data-excess","2");
  await plus("b").click();
  await expect(box).toHaveAttribute("data-gaps","3");
  await expect(box).toHaveAttribute("data-scaffold","false");
  await expect(box.locator(".inspection-corner-gap")).toHaveCount(0);
  await expect(page.locator("#undo")).toBeDisabled();
  await noCredit(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await shot(page,"phone-inspection");
  await visit(page,"right","add","posOne",3);
  await expect(box).toBeHidden();
  await expect(toggle).toBeDisabled();
  await expect(items(page).locator(".weight")).toHaveCount(1);
  await expect(items(page,"right").locator(".weight")).toHaveCount(16);
  await neutral(page);await noCredit(page);
  await visit(page,"left","add","posOne",3);
  await expect(items(page).locator(".weight")).toHaveCount(4);
  await expect(toggle).toBeEnabled();
  await toggle.click();
  await expect(page.locator("#square-inspect-a")).toHaveText("0");
  await expect(page.locator("#square-inspect-b")).toHaveText("0");
  await page.locator("#square-inspect-close").click();
  await pair(page,"left","sqrt");
  await expect(items(page).locator(".sprite-black")).toHaveCount(1);
  await expect(items(page).locator(".weight")).toHaveCount(2);
  await expect(items(page,"right").locator(".weight")).toHaveCount(4);
  await visit(page,"right","remove","posOne",2);
  await choose(page,"remove","posOne",2);await page.locator("#left-action").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:25000});
  await expect(page.locator("#replay-star-summary")).toContainText("3 moves (optimal: 3)");
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("x = 2");
  await expect(page.locator("#replay-end-note")).toContainText("principal square root");
  const data=await saved(page);
  expect(data.worlds.squares.stages.independent.completed).toEqual(["square-i-14"]);
  expect(data.worlds.squares.stages.independent.bestMoves["square-i-14"]).toBe(3);
});
