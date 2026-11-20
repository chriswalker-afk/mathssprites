import {test,expect} from "@playwright/test";

async function level19(page){
  await page.goto("/");
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="workshop"]').click();
  await page.locator('[data-map-stage="guided"]').click();
  await page.locator('[data-level="19"]').click();
  await expect(page.locator("#level-title")).toHaveText("Sealed Crates");
}
async function recordCrateDiscard(page){
  await page.evaluate(()=>{
    window.__crateDiscardTrace=[];
    const observe=()=>{
      const stage=document.querySelector("#left-items .crate-division-stage");
      if(!stage)return;
      const phase=stage.dataset.phase;
      const actor=document.querySelector("#hand-cargo > .hand-held-crate");
      const label=stage.querySelector(".crate-stack-count");
      const snapshot={
        phase,remaining:stage.querySelectorAll(".floor-track > .sealed-crate").length,
        westBaskets:document.querySelectorAll("#left-items .group-basket").length,
        heldOriginal:!!actor,
        flying:actor?.dataset.crateState==="thrown",
        animationName:actor?getComputedStyle(actor).animationName:null,
        pictureCount:stage.querySelectorAll(".crate-picture-sign").length,
        label:label?.firstChild?.textContent?.trim()||""
      };
      const history=window.__crateDiscardTrace;
      const last=history.at(-1);
      if(!last||JSON.stringify(last)!==JSON.stringify(snapshot))
        history.push(snapshot);
    };
    const observer=new MutationObserver(observe);
    observer.observe(document.body,{subtree:true,childList:true,
      attributes:true,attributeFilter:["data-phase","data-crate-state","data-crate-count"]});
    window.__crateDiscardObserver=observer;
    observe();
  });
}
test("dividing sealed crates throws away the ORIGINAL unwanted crate, never a wicker basket @smoke",async({page})=>{
  test.setTimeout(75000);
  await page.emulateMedia({reducedMotion:"no-preference"});
  await level19(page);
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(2);
  await expect(page.locator("#left-items .crate-picture-sign")).toHaveCount(1);
  await page.screenshot({path:"artifacts/pr43-01-two-sealed-crates.png",fullPage:true});
  await recordCrateDiscard(page);
  await page.locator("#do-both").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(1,{timeout:35000});
  await expect(page.locator("#right-items .weight")).toHaveCount(7,{timeout:35000});
  await expect(page.locator("#left-items .crate-picture-sign")).toHaveCount(1);
  await expect(page.locator("#left-items .crate-stack-count")).toHaveText("1 crate");
  await expect(page.locator("#left-items .group-basket")).toHaveCount(0);
  await page.screenshot({path:"artifacts/pr43-02-one-surviving-crate.png",fullPage:true});
  const trace=await page.evaluate(()=>window.__crateDiscardTrace);
  // "waiting" exists only during initial DOM insertion and is allowed to
  // transition to "taking" before an asynchronous MutationObserver samples it.
  for(const name of ["taking","lifting","throwing","remaining"])
    expect(trace.some(x=>x.phase===name),
      "Expected physical phase "+name+": "+JSON.stringify(trace)).toBe(true);
  expect(trace.some(x=>x.phase==="lifting"&&x.heldOriginal)).toBe(true);
  expect(trace.some(x=>x.phase==="throwing"&&x.flying)).toBe(true);
  expect(trace.some(x=>x.phase==="throwing"&&
    (x.animationName||"").includes("discard-sealed-crate"))).toBe(true);
  expect(trace.some(x=>x.phase==="remaining"&&x.label==="1 crate")).toBe(true);
  expect(trace.every(x=>x.westBaskets===0)).toBe(true);
  expect(trace.every(x=>x.pictureCount===1)).toBe(true);
  await expect(page.locator("#hand-cargo > .hand-held-crate")).toHaveCount(0);
  await page.locator("#undo").click();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(2);
  await expect(page.locator("#left-items .crate-stack-count")).toHaveText("2 crates");
  await expect(page.locator("#right-items .weight")).toHaveCount(14);
  await page.screenshot({path:"artifacts/pr43-03-undo-restores-stack.png",fullPage:true});
});
test("reduced-motion discard still keeps one signed crate on compact laptop and phone @smoke",async({page})=>{
  test.setTimeout(70000);
  await page.emulateMedia({reducedMotion:"reduce"});
  for(const size of [{width:1092,height:540},{width:375,height:812}]){
    await page.setViewportSize(size);
    await level19(page);
    await recordCrateDiscard(page);
    await page.locator("#do-both").click();
    await expect(page.locator("#left-items .sealed-crate")).toHaveCount(1,{timeout:35000});
    await expect(page.locator("#left-items .crate-stack-count")).toHaveText("1 crate");
    await expect(page.locator("#left-items .crate-picture-sign")).toHaveCount(1);
    await expect(page.locator("#right-items .weight")).toHaveCount(7,{timeout:35000});
    const trace=await page.evaluate(()=>window.__crateDiscardTrace);
    expect(trace.some(x=>x.phase==="throwing"&&x.flying)).toBe(true);
    expect(trace.every(x=>x.westBaskets===0)).toBe(true);
    const width=await page.evaluate(()=>document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(size.width+3);
    await page.screenshot({path:"artifacts/pr43-compact-"+size.width+".png",fullPage:true});
    await page.locator("#game-home").click();
  }
});
