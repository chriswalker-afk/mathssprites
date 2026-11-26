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
  await expect(lab(page).locator("#left-items .fs-assembly[data-denominator='1'] > svg")).toHaveCount(0);
  const ui=await lab(page).evaluate(root=>{
    const box=s=>root.querySelector(s).getBoundingClientRect();
    const title=box("#fb-level-title"),chapter=box("#fb-chapter-name"),status=box("#fb-chapter-status");
    const buttons=[...root.querySelectorAll(".fb-game-meta > *")].map(el=>el.getBoundingClientRect());
    const plaque=box("#left-items .fw-label"),piece=box("#left-items .fw-assembly:has(>.fw-label) > svg");
    return {titleY:title.y,chapterY:chapter.y,statusY:status.y,buttonTops:buttons.map(b=>b.y),buttonHeights:buttons.map(b=>b.height),plaqueLeft:plaque.left,pieceRight:piece.right,plaqueBottom:plaque.bottom,pieceBottom:piece.bottom};
  });
  expect(Math.abs(ui.titleY-ui.chapterY)).toBeLessThan(16);
  expect(Math.abs(ui.titleY-ui.statusY)).toBeLessThan(16);
  expect(Math.max(...ui.buttonTops)-Math.min(...ui.buttonTops)).toBeLessThan(2);
  expect(Math.max(...ui.buttonHeights)-Math.min(...ui.buttonHeights)).toBeLessThan(2);
  expect(ui.plaqueLeft).toBeGreaterThanOrEqual(ui.pieceRight-2);
  expect(Math.abs(ui.plaqueBottom-ui.pieceBottom)).toBeLessThan(12);
  await expect(lab(page).locator("#left-items .fw-label")).toHaveText("2/3");
  await expect(lab(page).locator("#left-items .fw-label")).toHaveCSS("border-top-style","solid");
  const g=await geometry(page,"fraction");
  expect(g.panel.x).toBeGreaterThan(g.scene.right);
  expect(Math.abs(g.panel.y-g.scene.y)).toBeLessThan(3);
  expect(Math.abs(g.panel.height-g.scene.height)).toBeLessThan(3);
  expect(g.scene.width/other.scene.width).toBeGreaterThan(.95);
  expect(g.scene.width/other.scene.width).toBeLessThan(1.05);
  expect(g.scene.height/other.scene.height).toBeGreaterThan(.95);
  expect(g.scene.height/other.scene.height).toBeLessThan(1.05);
  expect(g.room.height/other.room.height).toBeGreaterThan(.95);
  expect(g.room.height/other.room.height).toBeLessThan(1.05);
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
    let distance=0;
    for(let i=0;i<10&&el.isConnected;i++){
      await new Promise(r=>setTimeout(r,20));
      if(!el.isConnected)break;
      const b=el.getBoundingClientRect();
      distance=Math.max(distance,Math.hypot(b.x-a.x,b.y-a.y));
    }
    return {active,distance};
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

test("returning visitors cannot combine new fraction markup with stale shadow CSS @quick @smoke",async({page})=>{
  const stale=[];
  let unblock;
  const held=new Promise(resolve=>{unblock=resolve;});
  await page.route(/\/src\/fraction-(?:campaign|balance|weights|sprites|notebook)\.css(?:\?.*)?$/,async route=>{
    const url=new URL(route.request().url());
    if(url.searchParams.get("v")!=="85"){
      stale.push(url.pathname);
      return route.fulfill({contentType:"text/css",body:".fb-campaign{max-width:1220px!important}.fb-board{display:block!important}"});
    }
    if(url.pathname.endsWith("/fraction-campaign.css"))await held;
    return route.continue();
  });
  await page.setViewportSize({width:1838,height:891});
  await page.goto("/");await enter(page);
  try{
    await expect(page.locator("#fraction-game-host")).toHaveAttribute("data-styles","loading");
    await expect(lab(page)).toBeHidden();
    await expect(page.locator("#fraction-game-host").getByRole("status").filter({hasText:"Preparing the balance chambers"})).toBeVisible();
  }finally{unblock();}
  await expect(page.locator("#fraction-game-host")).toHaveAttribute("data-styles","ready");
  await expect(lab(page)).toBeVisible();
  expect(stale).toEqual([]);
  const g=await geometry(page,"fraction");
  expect(g.panel.x).toBeGreaterThan(g.scene.right);
  await expect(lab(page).locator("#left-items .fw-label")).toHaveCSS("border-top-style","solid");
  await expect(lab(page).locator("#left-items .fs-whole-actor")).toBeVisible();
  await expect(lab(page).locator("#left-items .fs-assembly[data-denominator='1'] > svg")).toHaveCount(0);
  await shot(page,"warm-cache");
});
