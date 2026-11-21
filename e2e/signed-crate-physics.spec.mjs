import {test,expect} from "@playwright/test";

/**
 * PR56 tests the real chamber-view constructor using an isolated fixture.
 * There are deliberately NO new playable World 2 levels in this PR.
 */
test("signed crates release genuine pale sprites and balloons with no duplicate loose tokens @smoke",async({page})=>{
  test.setTimeout(60000);
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
  await page.locator("#home-play").click();
  await page.evaluate(async()=>{
    const {crateMarkup}=await import("./src/group-crates.mjs");
    const {crateExpansionPlan}=await import("./src/crate-expansion.mjs");
    const {createCrateExpansionView}=await import("./src/crate-expansion-view.mjs");
    const source={crates:{count:2,contents:{
      posX:1,negX:1,posOne:1,negOne:2
    }}};
    const plan=crateExpansionPlan(source);
    const items=document.querySelector("#left-items");
    items.innerHTML='<div class="floor-shell"><div class="items-grid floor-track" data-layout="floor" data-crate-count="2">'+
      crateMarkup(source)+'</div></div>';
    const chamber=document.querySelector("#left-chamber .room-interior");
    const tokenMarkup=kind=>{
      if(kind==="posX"||kind==="negX")
        return '<span class="token sprite '+(kind==="negX"?"sprite-white":"sprite-black")+'">'+
          '<span class="sprite-ground-shadow"></span><span class="sprite-reaction-shell">'+
          '<span class="sprite-motion"><span class="sprite-feet"></span>'+
          '<span class="sprite-body"><span class="sprite-eyes"><i></i><i></i></span>'+
          '</span></span></span></span>';
      if(kind==="posOne")
        return '<span class="token weight"><i class="weight-handle"></i><i class="weight-shine"></i></span>';
      return '<span class="token balloon"><i class="balloon-body"></i>'+
        '<i class="balloon-knot"></i><i class="balloon-string"></i></span>';
    };
    const view=createCrateExpansionView({
      side:"left",chamber,items,plan,tokenMarkup,reducedMotion:true
    });
    window.__signedCrateQA={view,plan};
  });
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(2);
  await expect(page.locator("#left-items .token.sprite")).toHaveCount(0);
  await expect(page.locator("#left-items .token.balloon")).toHaveCount(0);
  const stage=page.locator("#left-crate-expansion");
  await expect(stage.locator('[data-kind="posX"]')).toHaveCount(2);
  await expect(stage.locator('[data-kind="negX"]')).toHaveCount(2);
  await expect(stage.locator('[data-kind="posOne"]')).toHaveCount(2);
  await expect(stage.locator('[data-kind="negOne"]')).toHaveCount(4);
  await expect(stage.locator(".crate-escaped-white-sprite .sprite-white")).toHaveCount(2);
  await expect(stage.locator(".crate-escaped-balloon .balloon-body")).toHaveCount(4);
  await page.evaluate(()=>{
    const view=window.__signedCrateQA.view;
    for(let i=0;i<window.__signedCrateQA.plan.count;i++)view.openCrate(i);
  });
  await page.evaluate(()=>window.__signedCrateQA.view.playReleaseSteps());
  await expect(stage).toHaveAttribute("data-phase","settle");
  await expect(stage.locator('[data-landed="true"]')).toHaveCount(10);
  await expect(page.locator(".sealed-crate.crate-panels-down")).toHaveCount(2);
  const state=await page.evaluate(()=>({
    kinds:[...document.querySelectorAll("#left-crate-expansion .crate-escaped-actor")].
      reduce((map,node)=>{map[node.dataset.kind]=(map[node.dataset.kind]||0)+1;return map;},{}),
    occupied:[...document.querySelectorAll("#left-crate-expansion .crate-escaped-actor")].
      every(node=>node.getBoundingClientRect().width>0),
    countedLoose:document.querySelectorAll("#left-items .token.sprite, #left-items .token.balloon").length
  }));
  expect(state.kinds).toEqual({posX:2,negX:2,posOne:2,negOne:4});
  expect(state.occupied).toBe(true);
  expect(state.countedLoose).toBe(0);
  await page.screenshot({path:"artifacts/pr56-signed-crates-physical-release.png"});
  await page.evaluate(()=>window.__signedCrateQA.view.destroy());
  await expect(page.locator(".crate-expansion-stage")).toHaveCount(0);
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(2);
});
