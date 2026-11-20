import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
});
async function openGuided(page,number){
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="workshop"]').click();
  await page.locator('[data-map-stage="guided"]').click();
  await page.locator('[data-level="'+number+'"]').click();
  await expect(page.locator("#chapter-status")).toContainText(
    "WORLD 1 · STAGE 1 · LEVEL "+number);
}
async function pickDivide(page,n){
  await page.locator('[data-operation="divide"]').click();
  await expect(page.locator("#amount-value")).toHaveText("—");
  await page.locator("#amount-up").click();
  for(let i=2;i<n;i++)await page.locator("#amount-up").click();
  await expect(page.locator("#amount-value")).toHaveText(String(n));
}
async function pickRemove(page,kind,n){
  await page.locator('[data-operation="remove"]').click();
  await page.locator('[data-kind="'+kind+'"]').click();
  await expect(page.locator("#amount-value")).toHaveText("—");
  await page.locator("#amount-up").click();
  for(let i=1;i<n;i++)await page.locator("#amount-up").click();
  await expect(page.locator("#amount-value")).toHaveText(String(n));
}

test("six Guided chapters include four playable crate levels with neutral, non-symbolic scenes @quick @smoke",async({page})=>{
  test.setTimeout(65000);
  await page.locator("#home-choose-level").click();
  await expect(page.locator(".chapter-group")).toHaveCount(6);
  await expect(page.locator(".level-tile")).toHaveCount(24);
  await expect(page.locator(".chapter-illustration")).toHaveCount(6);
  await expect(page.locator('[data-level="19"]')).toContainText("Sealed Crates");
  await expect(page.locator('[data-level="20"]')).toContainText("The master experiment");
  for(const [number,crates,looseX,eastX] of [
    [21,2,0,0],[22,3,0,0],[23,2,0,1],[24,3,2,1]
  ]){
    await page.locator('[data-level="'+number+'"]').click();
    await expect(page.locator("#left-items .sealed-crate")).toHaveCount(crates);
    await expect(page.locator("#left-items .sprite-black")).toHaveCount(looseX);
    await expect(page.locator("#right-items .sprite-black")).toHaveCount(eastX);
    await expect(page.locator("#crate-controls")).toBeVisible();
    await expect(page.locator("#unpack-crates")).toBeEnabled();
    await expect(page.locator("#level-prompt")).toHaveText("");
    await expect(page.locator("[data-operation].selected")).toHaveCount(0);
    await expect(page.locator("[data-kind].selected")).toHaveCount(0);
    await expect(page.locator("#amount-value")).toHaveText("—");
    await expect(page.locator("#do-both")).toBeDisabled();
    await page.locator("#game-levels").click();
  }
});

test("Guided Level 21 can divide whole crates first, open the survivor and earn 3 stars @smoke",async({page})=>{
  test.setTimeout(115000);
  await openGuided(page,21);
  await pickDivide(page,2);
  await page.locator("#do-both").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(1,{timeout:32000});
  await expect(page.locator("#right-items .weight")).toHaveCount(4);
  await page.locator("#unpack-crates").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:35000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(1);
  await pickRemove(page,"posOne",1);
  await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:40000});
  await expect(page.locator("#replay-star-summary")).toContainText("★★★ 3 stars");
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(saved.worlds.workshop.stages.guided.completed).toContain("crates-21");
  expect(saved.worlds.workshop.stages.guided.bestMoves["crates-21"]).toBe(3);
});

test("Guided Level 23 cannot divide a loose sprite; opening crates changes only one room @smoke",async({page})=>{
  test.setTimeout(90000);
  await openGuided(page,23);
  await pickDivide(page,2);
  await page.locator("#do-both").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(2,{timeout:26000});
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#undo")).toBeDisabled();
  await page.locator("#unpack-crates").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:40000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(2);
  await expect(page.locator("#left-items .weight")).toHaveCount(8);
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(13);
  await page.locator("#undo").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(2);
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(1);
});

test("Guided Level 24 releases sprites alongside existing loose objects and restores everything on Undo @smoke",async({page})=>{
  test.setTimeout(100000);
  await page.setViewportSize({width:1024,height:720});
  await openGuided(page,24);
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(3);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(2);
  await expect(page.locator("#left-items .weight")).toHaveCount(1);
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(23);
  await page.screenshot({path:"artifacts/pr48-guided-final-closed.png",fullPage:true});
  await page.locator("#unpack-crates").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:50000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(5);
  await expect(page.locator("#left-items .weight")).toHaveCount(7);
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(23);
  await page.screenshot({path:"artifacts/pr48-guided-final-opened.png",fullPage:true});
  await page.locator("#undo").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(3);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(2);
  await expect(page.locator("#left-items .weight")).toHaveCount(1);
  const width=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(1027);
});

test("old 20-level Guided completion stays recorded but new chapter is not falsely mastered",async({page})=>{
  const legacy={completed:Array.from({length:20},(_,i)=>i+1),lastPlayed:20};
  await page.evaluate(value=>localStorage.setItem("mathssprites.progress.v1",
    JSON.stringify(value)),legacy);
  await page.reload();
  await page.locator('[data-screen="worlds"]').first().click();
  await expect(page.locator('[data-world-art="workshop"] .world-progress')).toContainText("20 / 60 complete");
  await page.getByRole("button",{name:"Explore stages"}).click();
  await expect(page.locator('[data-stage="guided"]')).toContainText("20 of 24");
  await expect(page.locator('[data-stage="guided"]')).not.toContainText("Stage mastered");
  await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
  await expect(page.locator(".level-tile.status-complete")).toHaveCount(20);
  await expect(page.locator('[data-level="20"]')).toHaveClass(/status-complete/);
  await expect(page.locator('[data-level="21"]')).not.toHaveClass(/status-complete/);
  const same=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.progress.v1")));
  expect(same).toEqual(legacy);
});
