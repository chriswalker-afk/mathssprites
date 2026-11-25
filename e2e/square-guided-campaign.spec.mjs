import {test,expect} from "@playwright/test";
import {mkdirSync} from "node:fs";
const world=p=>p.locator('[data-map-world="squares"]');
const tile=(p,id)=>p.locator('.level-tile[data-level-id="'+id+'"]');
const items=(p,side="left")=>p.locator("#"+side+"-items");
async function start(p){
  await p.addInitScript(()=>localStorage.setItem("mathssprites.motion-preference.v1","reduced"));
  await p.goto("/");
}
async function board(p){
  await p.locator("#home-choose-level").click();await world(p).click();
  await expect(p.locator("#site-levels")).toHaveAttribute("data-active-world","squares");
}
async function choose(p,op,kind,count){
  await p.locator('.operation-picker [data-operation="'+op+'"]').click();
  if(kind)await p.locator('#object-picker [data-kind="'+kind+'"]').click();
  if(count!==undefined){
    const grouped=op==="multiply"||op==="divide",presses=grouped?count-1:count;
    for(let i=0;i<presses;i++)await p.locator("#amount-up").click();
    await expect(p.locator("#amount-value")).toHaveText(String(count));
  }
}
async function move(p,op,kind,count){
  await choose(p,op,kind,count);
  await p.locator("#do-both").click();
  // The inventory can paint before the hand finishes: wait for the
  // controls and the actual frame to be restored, not a transitional beat.
  await expect(p.locator("#reset")).toBeEnabled({timeout:25000});
  await expect(p.locator("#left-area-box")).toBeHidden();
  await expect(p.locator("#right-area-box")).toBeHidden();
}
async function shot(p,name){mkdirSync("artifacts",{recursive:true});await p.screenshot({path:"artifacts/square-guided-"+name+".png",fullPage:true});}
test("World 4 board is live with 24 accessible Guided levels and all three stages available @smoke",async({page})=>{
  await start(page);await board(page);
  await expect(page.locator("#levels-stage-title")).toHaveText("Guided Squares");
  await expect(page.locator(".chapter-group")).toHaveCount(6);
  await expect(page.locator(".level-tile")).toHaveCount(24);
  await expect(page.locator(".level-tile:disabled")).toHaveCount(0);
  await expect(page.locator('[data-map-stage="independent"]')).toBeEnabled();
  await expect(page.locator('[data-map-stage="notebook"]')).toBeEnabled();
  await expect(page.locator("#level-progress")).toContainText("0 / 72 stars");
  await expect(tile(page,"square-g-24")).toBeEnabled();
  await shot(page,"board");
  await tile(page,"square-g-24").click();
  await expect(page.locator("#chapter-status")).toHaveText("WORLD 4 · STAGE 1 · LEVEL 24 / 24");
  await expect(page.locator("#square-inspect-toggle")).toBeVisible();
  await expect(page.locator(".operation-picker [aria-pressed=true]")).toHaveCount(0);
  await expect(page.locator("#mode-select")).toBeDisabled();
  await choose(page,"remove","posX2",1);
  await expect(page.locator('#object-picker [data-kind="posX2"]')).toBeEnabled();
  await expect(page.locator('#object-picker [data-kind="negX"]')).toBeHidden();
  await expect(page.locator('#object-picker [data-kind="negOne"]')).toBeHidden();
  await page.locator("#game-levels").click();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-world","squares");
  await expect(tile(page,"square-g-24")).toBeEnabled();
});
test("building the first square wins only after actual construction, awards three stars and resumes at the next level",async({page})=>{
  test.setTimeout(65000);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await start(page);await board(page);await tile(page,"square-g-01").click();
  await expect(page.locator("#level-prompt")).toContainText("Build a complete square");
  await expect(page.locator("#replay-backdrop")).toBeHidden();
  await expect(page.locator("#undo")).toBeDisabled();
  await expect(page.locator("#square-inspect-toggle")).toBeHidden();
  await expect(items(page).locator(".sprite-black")).toHaveCount(1);
  await expect(items(page,"right").locator(".weight")).toHaveCount(3);
  await choose(page,"square");await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:25000});
  await expect(items(page).locator(".sprite-square")).toHaveCount(1);
  await expect(items(page,"right").locator(".weight")).toHaveCount(9);
  await expect(page.locator("#replay-star-summary")).toContainText("★★★ 3 stars");
  await expect(page.locator("#replay-star-summary")).toContainText("1 move (optimal: 1)");
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("x² = 9");
  await expect(page.locator("#replay-end-note")).toContainText("Both entire expressions were squared");
  const saved=await page.evaluate(()=>({records:JSON.parse(localStorage.getItem("mathssprites.campaign.v2")),resume:JSON.parse(localStorage.getItem("mathssprites.resume.v2"))}));
  expect(saved.records.worlds.squares.stages.guided.completed).toEqual(["square-g-01"]);
  expect(saved.records.worlds.squares.stages.guided.bestMoves["square-g-01"]).toBe(1);
  expect(saved.records.worlds.workshop.stages.guided.completed).toEqual([]);
  expect(saved.resume).toEqual({worldId:"squares",stageId:"guided",levelId:"square-g-02"});
  await page.locator("#next-level").click();
  await expect(page.locator("#chapter-status")).toContainText("LEVEL 02 / 24");
  await page.locator("#game-levels").click();
  await expect(tile(page,"square-g-01").locator(".tile-stars")).toHaveAttribute("data-stars","3");
  await expect(page.locator("#world1-progress-number")).toHaveText("1 of 24 complete");
  await page.reload();
  await page.locator("#home-play").click();
  await expect(page.locator("#chapter-status")).toContainText("LEVEL 02 / 24");
  expect(errors).toEqual([]);
});
test("public Guided completing-the-square level earns certified stars without counting inspection as a move",async({page})=>{
  test.setTimeout(90000);
  await start(page);await board(page);await tile(page,"square-g-18").click();
  await page.locator("#square-inspect-toggle").click();
  await expect(page.locator("#left-inspection .inspection-corner-gap")).toHaveCount(4);
  await expect(page.locator("#undo")).toBeDisabled();
  await page.locator("#square-inspect-close").click();
  await move(page,"add","posOne",4);
  await expect(items(page).locator(".weight")).toHaveCount(4);
  await expect(items(page,"right").locator(".weight")).toHaveCount(25);
  await move(page,"sqrt");
  await expect(items(page).locator(".sprite-square")).toHaveCount(0);
  await expect(items(page).locator(".sprite-black")).toHaveCount(1);
  await expect(items(page).locator(".weight")).toHaveCount(2);
  await expect(items(page,"right").locator(".weight")).toHaveCount(5);
  await choose(page,"remove","posOne",2);await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:25000});
  await expect(page.locator("#replay-star-summary")).toContainText("3 moves (optimal: 3)");
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("x = 3");
  await expect(page.locator("#replay-end-note")).toContainText("principal square root");
  await shot(page,"completed-square-replay");
});
test("the new six-chapter board fits a school laptop; mobile can reach later chapters",async({page})=>{
  test.setTimeout(35000);
  await page.setViewportSize({width:1024,height:720});
  await start(page);await board(page);
  await expect(page.locator("#level-sections")).toHaveAttribute("data-chapter-layout","multi-row");
  await tile(page,"square-g-24").scrollIntoViewIfNeeded();
  await expect(tile(page,"square-g-24")).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.setViewportSize({width:390,height:844});
  await tile(page,"square-g-18").scrollIntoViewIfNeeded();
  await tile(page,"square-g-18").click();
  await page.locator("#square-inspect-toggle").click();
  await expect(page.locator("#left-inspection .inspection-corner-gap")).toHaveCount(4);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await shot(page,"phone");
});
