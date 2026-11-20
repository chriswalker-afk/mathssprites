import {clickWithReferenceMove} from "./reference-move-helper.mjs";
import {test,expect} from "@playwright/test";

async function stages(page){
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
}
async function openLevel(page,stage,number){
  await stages(page);
  const n={guided:1,independent:2,notebook:3}[stage];
  await page.getByRole("button",{name:"Choose Stage "+n+" levels"}).click();
  await page.locator('[data-level="'+number+'"]').click();
}
async function doOneGuidedMove(page){
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#do-both")).toBeEnabled({timeout:15000});
}
async function doOneManualMove(page){
  await clickWithReferenceMove(page,"#left-action");
  await expect(page.locator("#right-action")).toContainText("Match the move",{timeout:14000});
  await clickWithReferenceMove(page,"#right-action");
}
async function write(page,text){
  await page.locator("#notebook-operation").fill(text);
  await page.locator("#notebook-operation").press("Enter");
}

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});

test("all 60 World 1 implemented levels open for a new student with empty progress @quick @smoke",async({page})=>{
  await stages(page);
  for(const [stage,n] of [["guided",24],["independent",20],["notebook",16]]){
    const number={guided:1,independent:2,notebook:3}[stage];
    await expect(page.locator('[data-stage="'+stage+'"] button')).toHaveCount(1);
    await page.getByRole("button",{name:"Choose Stage "+number+" levels"}).click();
    await expect(page.locator(".level-tile")).toHaveCount(n);
    await expect(page.locator(".level-tile:disabled")).toHaveCount(0);
    await expect(page.locator(".tile-stars")).toHaveCount(n);
    await expect(page.locator(".tile-stars[data-stars='0']")).toHaveCount(n);
    await page.locator("#site-back").click();
  }
  await expect(page.locator('[data-stage="notebook"] button')).toHaveCount(1);
  await expect(page.locator("#world1-workshop")).toBeVisible();
  await page.locator('[data-screen="worlds"]').first().click();
  await expect(page.locator(".world-planned")).toHaveCount(2);
});

test("two-step solution earns two stars; replaying optimally upgrades the best rating @smoke",async({page})=>{
  test.setTimeout(95000);
  await openLevel(page,"guided",1);
  await page.locator("#motion-toggle").click(); // short accessible snapshots
  await clickWithReferenceMove(page,"#amount-down"); // remove one, twice (optimal = one move)
  await doOneGuidedMove(page);
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
  await expect(page.locator("#replay-star-summary")).toContainText("★★☆ 2 stars");
  await page.locator("#replay-close").click();
  await page.locator("#game-levels").click();
  await expect(page.locator('[data-level="1"] .tile-stars')).toHaveText("★★☆");
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.stars.v1")));
  expect(saved.guided["1"]).toBe(2);
  await page.locator('[data-level="1"]').click();
  await clickWithReferenceMove(page,"#do-both"); // initial remove two
  await expect(page.locator("#replay-star-summary")).toContainText("★★★ 3 stars",{timeout:16000});
  saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.stars.v1")));
  expect(saved.guided["1"]).toBe(1);
  await page.reload();
  await stages(page);
  await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
  await expect(page.locator('[data-level="1"] .tile-stars')).toHaveText("★★★");
  await expect(page.locator("#level-progress")).toContainText("3 / 72 stars");
});

test("two manual hand visits count as one optimal move, not two @smoke",async({page})=>{
  test.setTimeout(65000);
  await openLevel(page,"independent",1);
  await page.locator("#motion-toggle").click();
  await clickWithReferenceMove(page,"#left-action");
  expect(await page.evaluate(()=>localStorage.getItem("mathssprites.stars.v1"))).toBeNull();
  await expect(page.locator("#right-action")).toContainText("Match the move",{timeout:14000});
  await clickWithReferenceMove(page,"#right-action");
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
  await expect(page.locator("#replay-star-summary")).toContainText("★★★ 3 stars");
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.stars.v1")));
  expect(saved.independent["1"]).toBe(1);
});

test("notebook earns its stars only after checked working is physically replayed @smoke",async({page})=>{
  test.setTimeout(110000);
  await openLevel(page,"notebook",1);
  await write(page,"−1");
  await write(page,"−2");
  await expect(page.locator("#notebook-replay")).toBeEnabled();
  expect(await page.evaluate(()=>localStorage.getItem("mathssprites.stars.v1"))).toBeNull();
  await page.locator("#motion-toggle").click();
  await page.locator("#notebook-replay").click();
  await expect(page.locator("#notebook-next")).toBeVisible({timeout:60000});
  await expect(page.locator("#notebook-playback-message")).toContainText("★★☆ 2 stars");
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.stars.v1")));
  expect(saved.notebook["1"]).toBe(2);
  await page.locator("#game-levels").click();
  await expect(page.locator('[data-level="1"] .tile-stars')).toHaveText("★★☆");
});

test("legacy completion is preserved without inventing a three-star rating",async({page})=>{
  const original={completed:[1,2],lastPlayed:3};
  await page.evaluate(value=>localStorage.setItem("mathssprites.progress.v1",JSON.stringify(value)),original);
  await page.reload();
  await stages(page);
  await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
  await expect(page.locator('[data-level="1"]')).toContainText("Completed");
  await expect(page.locator('[data-level="1"] .tile-stars')).toHaveText("☆☆☆");
  await expect(page.locator('[data-level="2"]')).toContainText("replay for stars");
  await expect(page.locator('[data-level="20"]')).toBeEnabled();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.progress.v1")))).toEqual(original);
});
