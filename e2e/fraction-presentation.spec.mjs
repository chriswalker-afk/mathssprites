import {test,expect} from "@playwright/test";
import {mkdirSync} from "node:fs";
const lab=p=>p.locator("#fraction-game-host #fraction-lab");
const slot=(p,id)=>p.locator('.level-tile[data-level-id="'+id+'"]');
const ready=p=>expect(lab(p)).toHaveAttribute("data-busy","false",{timeout:25000});
async function board(p,world,stage){
  await p.locator("#home-choose-level").click();
  await p.locator('[data-map-world="'+world+'"]').click();
  await p.locator('[data-map-stage="'+stage+'"]').click();
}
async function enter(p,{world="fractions",stage="guided",id="frac-g-06"}={}){
  await board(p,world,stage);await slot(p,id).click();
}
async function shot(p,name){
  mkdirSync("artifacts",{recursive:true});
  await p.screenshot({path:"artifacts/fraction-presentation-"+name+".png",fullPage:true,animations:"allow"});
}
const geometry=async(p,selector)=>p.evaluate(selector=>{
  const r=selector==="fraction"?document.getElementById("fraction-game-host").shadowRoot:document.getElementById("game-shell");
  const rect=s=>{const {x,y,width,height,right,bottom}=r.querySelector(s).getBoundingClientRect();return {x,y,width,height,right,bottom};};
  return {scene:rect("#scene"),panel:rect(selector==="fraction"?".fb-tools":".experiment-controls"),room:rect(".room-interior"),header:rect(selector==="fraction"?".fb-campaign-header":".topbar")};
},selector);
test("World 3 uses the same campaign-scale composition as World 2, with attached quantity plaques @quick @smoke",async({page})=>{
  await page.addInitScript(()=>localStorage.setItem("mathssprites.motion-preference.v1","reduced"));
  await page.setViewportSize({width:1838,height:891});await page.goto("/");
  await enter(page,{world:"opposites",id:"op-g-05"});
  await expect(page.locator("#scene")).toBeVisible();
  const other=await geometry(page,"main");
  await page.locator("#game-home").click();
  await enter(page);
  await expect(lab(page).locator("#fb-level-title")).toHaveText("Two thirds to remove");
  await expect(lab(page).locator(".fb-identity")).toContainText("Maths Sprites");
  await expect(lab(page).locator(".fb-mode-badge")).toHaveText("Guided Mirror");
  await expect(lab(page).locator("#left-items .fs-whole-actor")).toBeVisible();
  await expect(lab(page).locator("#left-items .fw-label")).toHaveText("2/3");
  await expect(lab(page).locator("#left-items .fw-label")).toHaveCSS("border-top-style","solid");
  const g=await geometry(page,"fraction");
  expect(g.panel.x).toBeGreaterThan(g.scene.right);
  expect(Math.abs(g.panel.y-g.scene.y)).toBeLessThan(3);
  expect(Math.abs(g.panel.height-g.scene.height)).toBeLessThan(3);
  expect(g.scene.width/other.scene.width).toBeGreaterThan(.9);
  expect(g.scene.height/other.scene.height).toBeGreaterThan(.9);
  expect(g.room.height/other.room.height).toBeGreaterThan(.9);
  expect(g.header.height).toBeLessThan(66);
  expect(g.panel.bottom).toBeLessThanOrEqual(891+2);
  await expect(lab(page).locator("#fb-apply")).toBeDisabled();
  await shot(page,"desktop");
  for(const [width,height] of [[1280,720],[390,844]]){
    await page.setViewportSize({width,height});
    const frame=await geometry(page,"fraction");
    if(width>=900){
      expect(frame.panel.x).toBeGreaterThan(frame.scene.right);
      expect(frame.panel.bottom).toBeLessThanOrEqual(height+2);
    }else expect(frame.panel.y).toBeGreaterThan(frame.scene.bottom);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await shot(page,"viewport-"+width);
  }
});
async function amount(p,op,n,d){
  const r=lab(p);
  await r.locator('[data-fb-op="'+op+'"]').click();
  await r.locator('[data-fb-kind="posOne"]').click();
  await r.locator("#fb-whole").selectOption("0");
  await r.locator("#fb-denominator").selectOption(String(d));
  await r.locator("#fb-numerator").selectOption(String(n));
}
async function actualMovement(locator){
  await expect(locator).toBeVisible({timeout:12000});
  const result=await locator.evaluate(async el=>{
    const a=el.getBoundingClientRect();
    const active=el.getAnimations().some(a=>a.playState==="running");
    await new Promise(r=>setTimeout(r,85));
    const b=el.getBoundingClientRect();
    return {active,distance:Math.hypot(b.x-a.x,b.y-a.y)};
  });
  expect(result.active).toBe(true);expect(result.distance).toBeGreaterThan(2);
}
test("motion on really animates the original actor and moving exact cargo, including with the device preference reduced",async({page})=>{
  test.setTimeout(75000);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");await enter(page);
  const r=lab(page);
  // Match the established default: on until the player explicitly reduces it.
  await expect(r).toHaveAttribute("data-reduced","false");
  await expect(r.locator("#fb-motion-toggle")).toHaveText("Motion: on");
  await expect(r.locator("#left-items .fs-whole-actor .sprite-motion")).toHaveCSS("animation-name","sprite-hop");
  await expect(r.locator("#hand")).not.toHaveCSS("transition-duration","0s");
  await amount(page,"remove",2,3);await r.locator("#fb-apply").click();
  await expect(r).toHaveAttribute("data-busy","true");
  await expect(r.locator("#fb-reset")).toBeDisabled();
  await actualMovement(r.locator('.fb-transfer[data-transfer="collect"]').first());
  await ready(page);
  await expect(r).toHaveAttribute("data-solved","true");
  await expect(r.locator(".fb-transfer")).toHaveCount(0);
  await expect(r.locator("#right-items")).toHaveAttribute("aria-label","East chamber: 0 sprites, 4 weights");
  await expect(r.locator("#fb-moves")).toHaveText("1 move");
  await r.locator("#fb-undo").click();
  await amount(page,"add",1,3);await r.locator("#fb-apply").click();
  await actualMovement(r.locator('.fb-transfer[data-transfer="drop"]').first());
  await ready(page);
  await expect(r.locator("#left-items")).toHaveAttribute("aria-label","West chamber: 1 sprites, 1 weights");
  await expect(r.locator("#right-items")).toHaveAttribute("aria-label","East chamber: 0 sprites, 5 weights");
  await expect(r.locator(".fb-transfer")).toHaveCount(0);
  await expect(r.locator("#left-items .fw-label")).toHaveCount(0);
  await r.locator("#fb-motion-toggle").click();
  await expect(r).toHaveAttribute("data-reduced","true");
  await expect(r.locator("#left-items .fs-whole-actor .sprite-motion")).toHaveCSS("animation-name","none");
  await r.locator("#fb-game-levels").click();
  await slot(page,"frac-g-07").click();
  await expect(lab(page)).toHaveAttribute("data-reduced","true");
  await lab(page).locator("#fb-game-home").click();
  await enter(page,{world:"opposites",id:"op-g-05"});
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: reduced");
  expect(errors).toEqual([]);
});
test("Independent and Apprentice reuse the new full-width composition without exposing the paper early",async({page})=>{
  await page.addInitScript(()=>localStorage.setItem("mathssprites.motion-preference.v1","reduced"));
  await page.setViewportSize({width:1280,height:720});await page.goto("/");
  await enter(page,{stage:"independent",id:"frac-i-06"});
  await expect(lab(page).locator(".fb-mode-badge")).toHaveText("Your Turn");
  await expect(lab(page).locator("#left-action")).toBeVisible();
  await expect(lab(page).locator("#fb-apply")).toBeHidden();
  let g=await geometry(page,"fraction");expect(g.panel.x).toBeGreaterThan(g.scene.right);
  await lab(page).locator("#fb-game-levels").click();
  await page.locator('[data-map-stage="notebook"]').click();
  await slot(page,"frac-a-03").click();
  await expect(lab(page).locator("#fb-notebook")).toBeVisible();
  await expect(lab(page).locator(".fb-board")).toBeHidden();
  await expect(lab(page).locator("#scene")).toBeHidden();
  await shot(page,"paper");
});
