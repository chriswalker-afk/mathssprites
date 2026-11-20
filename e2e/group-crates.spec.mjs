import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
});
async function openBrackets(page){
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="workshop"]').click();
  await page.locator('[data-map-stage="guided"]').click();
  await page.locator('[data-level="19"]').click();
  await expect(page.locator("#level-title")).toHaveText("Sealed Crates");
  await expect(page.locator("#chapter-status")).toContainText("WORLD 1 · STAGE 1 · LEVEL 19");
  await expect(page.locator("#crate-controls")).toBeVisible();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(2);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(0);
  await expect(page.locator("#right-items .weight")).toHaveCount(14);
}
async function chooseRemoval(page,amount){
  await page.locator('[data-operation="remove"]').click();
  await page.locator('[data-kind="posOne"]').click();
  const current=Number(await page.locator("#amount-value").textContent());
  for(let n=current;n<amount;n++)await page.locator("#amount-up").click();
  for(let n=current;n>amount;n--)await page.locator("#amount-down").click();
  await expect(page.locator("#amount-value")).toHaveText(String(amount));
}
test("sealed opaque crates remain separate physical objects, not loose hidden sprites @smoke",async({page})=>{
  await openBrackets(page);
  await expect(page.locator(".sealed-crate .crate-mini-sprite")).toHaveCount(2);
  await expect(page.locator(".sealed-crate .crate-mini-weight")).toHaveCount(6);
  await expect(page.locator(".sealed-crate .crate-name")).toHaveCount(0);
  await expect(page.locator(".crate-picture-sign")).toHaveCount(1);
  await expect(page.locator(".crate-stack-count")).toHaveText("2 crates");
  await expect(page.locator(".crate-contents-note:visible")).toHaveCount(0);
  await expect(page.locator("#unpack-crates")).toHaveText(/Open crates/);
  await expect(page.locator("#unpack-crates")).toBeEnabled();
  await expect(page.locator('[data-operation="square"]')).toBeHidden();
  await expect(page.locator('[data-kind="negOne"]')).toBeHidden();
  await page.screenshot({path:"artifacts/pr38-initial-sealed-brackets.png",fullPage:true});
  await page.locator("#game-levels").click();
  await expect(page.locator('[data-level="19"]')).toContainText("Sealed Crates");
});
test("divide-first throws an unwanted sealed crate, opens the survivor, and earns 3 stars @smoke",async({page})=>{
  test.setTimeout(85000);
  await openBrackets(page);
  await expect(page.locator('[data-operation="divide"]')).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("#amount-value")).toHaveText("2");
  await page.locator("#do-both").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(1,{timeout:30000});
  await expect(page.locator("#right-items .weight")).toHaveCount(7,{timeout:30000});
  await expect(page.locator("#unpack-crates")).toBeEnabled();
  await page.screenshot({path:"artifacts/pr38-divide-then-one-crate.png",fullPage:true});
  await page.locator("#unpack-crates").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:20000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(3);
  await expect(page.locator("#crate-controls")).toBeHidden();
  await page.screenshot({path:"artifacts/pr38-opened-one-crate.png",fullPage:true});
  await chooseRemoval(page,3);
  await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:35000});
  await expect(page.locator("#replay-star-summary")).toContainText("★★★ 3 stars");
  // The comic intentionally reveals one panel at a time with the pencil.\n  // Show the complete checked history before inspecting the unpack panel.\n  await page.locator("#replay-skip").click();\n  await expect(page.locator(".comic-crate-story")).toHaveCount(1);
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  expect(save.worlds.workshop.stages.guided.completed).toContain("master-19");
  expect(save.worlds.workshop.stages.guided.bestMoves["master-19"]).toBe(3);
});
test("unpack-first expands into 2 sprites + 6 weights, then solves by removal and division @smoke",async({page})=>{
  test.setTimeout(85000);
  await openBrackets(page);
  await page.locator("#unpack-crates").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:20000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(2);
  await expect(page.locator("#left-items .weight")).toHaveCount(6);
  await page.screenshot({path:"artifacts/pr38-unpack-before-division.png",fullPage:true});
  await chooseRemoval(page,6);
  await page.locator("#do-both").click();
  await expect(page.locator("#left-items .weight")).toHaveCount(0,{timeout:20000});
  await expect(page.locator("#right-items .weight")).toHaveCount(8);
  await page.locator('[data-operation="divide"]').click();
  await expect(page.locator("#amount-value")).toHaveText("2");
  await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:35000});
  await expect(page.locator("#replay-star-summary")).toContainText("★★★ 3 stars");
});
test("locked crate refuses a weight pickup, but Undo and Reset retain the groups @smoke",async({page})=>{
  test.setTimeout(75000);
  await openBrackets(page);
  await chooseRemoval(page,3);
  await page.locator("#do-both").click();
  await expect(page.locator("#feedback")).toContainText("sealed",{timeout:20000});
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(2);
  await expect(page.locator("#undo")).toBeDisabled();
  await page.locator("#unpack-crates").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:20000});
  await page.locator("#undo").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(2);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(0);
  await page.locator("#reset").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(2);
});
test("brackets remain readable and their action reachable on phone, laptop and desktop @smoke",async({page})=>{
  test.setTimeout(65000);
  for(const size of [
    {width:1092,height:540,name:"short-laptop"},
    {width:1024,height:720,name:"laptop"},
    {width:1440,height:900,name:"desktop"},
    {width:1920,height:1080,name:"wide"},
    {width:375,height:812,name:"phone"}
  ]){
    await page.setViewportSize(size);
    await openBrackets(page);
    await expect(page.locator("#left-items .sealed-crate")).toHaveCount(2);
    const m=await page.evaluate(()=>({
      width:document.documentElement.scrollWidth,
      height:document.documentElement.scrollHeight,
      w:innerWidth,h:innerHeight
    }));
    expect(m.width).toBeLessThanOrEqual(size.width+3);
    if(size.width>=900)expect(m.height).toBeLessThanOrEqual(size.height+3);
    await page.locator("#unpack-crates").scrollIntoViewIfNeeded();
    await expect(page.locator("#unpack-crates")).toBeInViewport();
    await page.screenshot({path:"artifacts/pr38-crates-"+size.name+".png",fullPage:true});
    await page.locator("#game-home").click();
  }
});
