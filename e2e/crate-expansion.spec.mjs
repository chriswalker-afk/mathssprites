import {test,expect} from "@playwright/test";

async function level19(page){
  await page.goto("/");
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="workshop"]').click();
  await page.locator('[data-map-stage="guided"]').click();
  await page.locator('[data-level="19"]').click();
  await expect(page.locator("#level-title")).toHaveText("The sealed brackets");
}
async function awaitPhase(page,phase){
  await expect(page.locator("#left-crate-expansion")).toHaveAttribute("data-phase",phase,{timeout:30000});
}
test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
});
test("two crates open with a crowbar, distribute all sprites first, then two weight groups @smoke",async({page})=>{
  test.setTimeout(90000);
  await level19(page);
  await expect(page.locator(".sealed-crate")).toHaveCount(2);
  await expect(page.locator(".crate-picture-sign")).toHaveCount(1);
  await expect(page.locator(".crate-stack-count")).toHaveText("2 crates");
  await page.screenshot({path:"artifacts/pr39-01-two-sealed-crates.png",fullPage:true});
  await page.locator("#unpack-crates").click();
  const first=page.locator('.sealed-crate[data-crate-index="0"]');
  const second=page.locator('.sealed-crate[data-crate-index="1"]');
  await expect(first).toHaveAttribute("data-crate-state","opened",{timeout:15000});
  await expect(second).toHaveAttribute("data-crate-state","sealed");
  await expect(page.locator("#hand")).toHaveAttribute("data-crowbar","true");
  await expect(page.locator("#hand-cargo .held-crowbar")).toBeAttached();
  await page.screenshot({path:"artifacts/pr39-02-crowbar-first-crate.png",fullPage:true});
  await expect(second).toHaveAttribute("data-crate-state","opened",{timeout:15000});
  await expect(page.locator(".crate-stack-count")).toHaveText("2 crates");
  await page.screenshot({path:"artifacts/pr39-03-crowbar-both-crates.png",fullPage:true});

  await awaitPhase(page,"sprite-total");
  await expect(page.locator("#left-crate-expansion .crate-expansion-math")).toHaveText("2 × x = 2x");
  await expect(page.locator("#left-crate-expansion .crate-release-sprite.released")).toHaveCount(2);
  await expect(page.locator("#left-crate-expansion .crate-release-weight.released")).toHaveCount(0);
  await expect(page.locator("#left-items .sealed-crate .crate-mini-weight")).toHaveCount(6);
  await expect(page.locator("#right-items .weight")).toHaveCount(14);
  await page.screenshot({path:"artifacts/pr39-04-all-sprites-first.png",fullPage:true});

  await awaitPhase(page,"weight-total");
  await expect(page.locator("#left-crate-expansion .crate-expansion-math")).toHaveText("2 × 3 = 6");
  await expect(page.locator('[data-source-crate="0"] .crate-release-weight.released')).toHaveCount(3);
  await expect(page.locator('[data-source-crate="1"] .crate-release-weight.released')).toHaveCount(3);
  await page.screenshot({path:"artifacts/pr39-05-three-plus-three-weights.png",fullPage:true});

  await expect(page.locator("#left-crate-expansion")).toHaveCount(0,{timeout:30000});
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(2);
  await expect(page.locator("#left-items .weight")).toHaveCount(6);
  await expect(page.locator("#right-items .weight")).toHaveCount(14);
  await expect(page.locator("#crate-controls")).toBeHidden();
  await page.screenshot({path:"artifacts/pr39-06-expanded-two-crates.png",fullPage:true});
});
test("divide-first crowbar opens only one crate and shows 1×x and 1×3 @smoke",async({page})=>{
  test.setTimeout(85000);
  await level19(page);
  await page.locator("#do-both").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(1,{timeout:30000});
  await expect(page.locator("#right-items .weight")).toHaveCount(7);
  await page.screenshot({path:"artifacts/pr39-07-divide-first-one-crate.png",fullPage:true});
  await expect(page.locator(".crate-stack-count")).toHaveText("1 crate");
  await expect(page.locator(".crate-picture-sign")).toHaveCount(1);
  await page.locator("#unpack-crates").click();
  await awaitPhase(page,"sprite-total");
  await expect(page.locator("#left-crate-expansion .crate-expansion-math")).toHaveText("1 × x = x");
  await expect(page.locator("#left-crate-expansion .crate-release-sprite.released")).toHaveCount(1);
  await page.screenshot({path:"artifacts/pr39-08-single-crate-sprite.png",fullPage:true});
  await awaitPhase(page,"weight-total");
  await expect(page.locator("#left-crate-expansion .crate-expansion-math")).toHaveText("1 × 3 = 3");
  await expect(page.locator("#left-crate-expansion .crate-release-weight.released")).toHaveCount(3);
  await page.screenshot({path:"artifacts/pr39-09-single-crate-weights.png",fullPage:true});
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:30000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(3);
});
test("comic shows crowbar and the distinct multiplications with the correct current crate count @smoke",async({page})=>{
  test.setTimeout(100000);
  await level19(page);
  await page.locator("#unpack-crates").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:30000});
  await page.locator('[data-operation="remove"]').click();
  await page.locator('[data-kind="posOne"]').click();
  const amount=Number(await page.locator("#amount-value").textContent());
  for(let i=amount;i<6;i++)await page.locator("#amount-up").click();
  for(let i=amount;i>6;i--)await page.locator("#amount-down").click();
  await expect(page.locator("#amount-value")).toHaveText("6");
  await page.locator("#do-both").click();
  await expect(page.locator("#right-items .weight")).toHaveCount(8,{timeout:30000});
  await page.locator('[data-operation="divide"]').click();
  await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:35000});
  await page.locator("#replay-skip").click();
  await expect(page.locator(".comic-crate-sequence")).toContainText("2 × x = 2x");
  await expect(page.locator(".comic-crate-sequence")).toContainText("2 × 3 = 6");
  await expect(page.locator("#pencil-lines")).toContainText("All sprites: 2 × x = 2x");
  await expect(page.locator("#pencil-lines")).toContainText("All weights: 2 × 3 = 6");
  await expect(page.locator("#replay-star-summary")).toContainText("★★★ 3 stars");
  await page.screenshot({path:"artifacts/pr39-10-comic-expansion.png",fullPage:true});
});
test("reduced motion still shows each multiplication and compact control remains reachable @smoke",async({page})=>{
  test.setTimeout(65000);
  await page.setViewportSize({width:1092,height:540});
  await level19(page);
  await expect(page.locator(".crate-stack-count")).toBeInViewport();
  await expect(page.locator("#unpack-crates")).toBeInViewport();
  const width=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(1095);
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: reduced");
  await page.locator("#unpack-crates").click();
  await awaitPhase(page,"sprite-total");
  await expect(page.locator("#left-crate-expansion .crate-expansion-math")).toContainText("2 × x");
  await awaitPhase(page,"weight-total");
  await expect(page.locator("#left-crate-expansion .crate-expansion-math")).toContainText("2 × 3");
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:20000});
  await page.screenshot({path:"artifacts/pr39-11-compact-expanded.png",fullPage:true});
});
