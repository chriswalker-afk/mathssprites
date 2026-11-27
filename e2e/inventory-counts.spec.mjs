import {test,expect} from "@playwright/test";
import {openCampaignBoard,playCampaignLevel} from "./campaign-menu-helper.mjs";
const sizes=[{width:1366,height:781},{width:1092,height:540},{width:1920,height:1080},{width:390,height:844}];
const host=p=>p.locator("#fraction-game-host");
const native=(p,side)=>p.locator("#game-shell #"+side+"-items");
const frac=(p,side)=>host(p).locator("#"+side+"-items");
async function setup(page){
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.addInitScript(()=>localStorage.setItem("mathssprites.motion-preference.v1","reduced"));
}
async function board(page,world,stage,n){
  await page.goto("/");
  await openCampaignBoard(page,world,stage);
  await playCampaignLevel(page,page.locator('[data-level="'+n+'"]'));
}
async function workshop(page,eq,world){
  await page.goto("/?"+new URLSearchParams({workshop:eq,workshopWorld:world,workshopMode:"auto"}));
  await page.locator("#workshop-create").click();
  if(world==="fractions")await expect(host(page)).toHaveAttribute("data-styles","ready");
  else await expect(page.locator("#game-shell")).toBeVisible();
}
async function measure(room,kind,text){
  const badge=room.locator(":scope > .inventory-counts > ."+kind);
  await expect(badge).toBeVisible();
  await expect(badge).toHaveText(text);
  await expect(badge).toHaveCSS("font-size","13px");
  const m=await room.evaluate((el,kind)=>{
    const badge=el.querySelector(":scope > .inventory-counts > ."+kind);
    const rail=badge.parentElement;
    const tracks=[...el.querySelectorAll(".floor-track,.fb-room-floor")];
    const r=e=>{const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,width:b.width,height:b.height}};
    const atoms=[...el.querySelectorAll(".floor-track > .token, .fb-room-floor .fw-pile-weight, .fb-room-floor .fs-assembly, .fb-room-floor .fw-inventory-objects > .fw-assembly")];
    return {font:parseFloat(getComputedStyle(badge).fontSize),badge:r(badge),rail:r(rail),room:r(el),
      trackScales:tracks.map(t=>parseFloat(getComputedStyle(t).getPropertyValue(t.classList.contains("floor-track")?"--floor-scale":"--fb-fit"))),
      minTokenTop:Math.min(...atoms.map(t=>r(t).top)),hasScaledAncestor:!!badge.closest(".floor-track,.fb-room-floor"),
      nested:tracks.some(t=>t.querySelector("."+kind)),
      total:el.querySelectorAll("."+kind).length};
  },kind);
  expect(m.hasScaledAncestor).toBe(false);
  expect(m.nested).toBe(false);
  expect(m.total).toBe(1);
  expect(m.font).toBe(13);
  expect(m.badge.height).toBeGreaterThanOrEqual(25);
  expect(m.badge.left).toBeGreaterThanOrEqual(m.room.left-2);
  expect(m.badge.right).toBeLessThanOrEqual(m.room.right+2);
  expect(m.badge.bottom).toBeLessThanOrEqual(m.minTokenTop+3);
  return m;
}
async function nativePiles(room,count){
  const weights=room.locator(".floor-track > .token.weight");
  await expect(weights).toHaveCount(count);
  return weights.evaluateAll(nodes=>{
    const groups=new Map();
    for(const w of nodes){const pile=Number(w.dataset.weightPile);groups.set(pile,(groups.get(pile)||0)+1);}
    return [...groups.values()];
  });
}
test("reported World 4 Independent level 20 keeps a readable 29-weight count while crowded objects fit @quick @smoke",async({page},info)=>{
  test.setTimeout(75000);
  await setup(page);await page.setViewportSize(sizes[0]);
  await board(page,"squares","independent",20);
  await expect(page.locator("#level-title")).toHaveText("The final reconstruction");
  const room=native(page,"right");
  await expect(room.locator(".floor-track")).toHaveAttribute("data-workshop-stack","ten");
  expect(await nativePiles(room,29)).toEqual([10,10,9]);
  await expect(native(page,"left").locator(".weight-stack-count")).toHaveCount(0);
  await expect(native(page,"left").locator(".floor-track > .weight")).toHaveCount(5);
  const results=[];
  for(const size of sizes){
    await page.setViewportSize(size);
    results.push(await measure(room,"weight-stack-count","29 weights"));
    await info.attach("final-reconstruction-"+size.width+"x"+size.height+".png",{body:await page.screenshot(),contentType:"image/png"});
  }
  expect(results.some(m=>m.trackScales.some(s=>s<.75))).toBe(true);
  expect(results.every(m=>m.font===13)).toBe(true);
  expect(new Set(results.flatMap(m=>m.trackScales.map(s=>s.toFixed(2)))).size).toBeGreaterThan(1);
});
test("both weight and crate badges leave their scaled track; ordinary campaign stacks stay the same @smoke",async({page})=>{
  test.setTimeout(70000);
  await setup(page);await page.setViewportSize(sizes[1]);
  await board(page,"workshop","guided",24);
  await measure(native(page,"left"),"crate-stack-count","3 crates");
  await measure(native(page,"right"),"weight-stack-count","23 weights");
  expect(await nativePiles(native(page,"right"),23)).toEqual([10,10,3]);
  await board(page,"workshop","guided",9);
  const right=native(page,"right");
  await measure(right,"weight-stack-count","11 weights");
  expect(await nativePiles(right,11)).toEqual([5,5,1]);
  await expect(right.locator(".floor-track")).not.toHaveAttribute("data-workshop-stack","ten");
});
test("fractional Workshop counts are independent of the scale; fraction pieces and campaign five stacks remain exact @smoke",async({page},info)=>{
  test.setTimeout(90000);
  await setup(page);await page.setViewportSize(sizes[0]);
  await workshop(page,"2x+1/2=45/2","fractions");
  const room=frac(page,"right");
  await expect(room.locator(".fw-pile-weight")).toHaveCount(22);
  await expect(room.locator(".fw-pile")).toHaveCount(3);
  await expect(room.locator(".fw-label")).toHaveText("1/2");
  for(const size of [sizes[0],sizes[1],sizes[3]]){
    await page.setViewportSize(size);
    await measure(room,"fw-count-plaque","22 whole weights");
    await info.attach("fraction-plaque-"+size.width+".png",{body:await page.screenshot(),contentType:"image/png"});
  }
  await page.setViewportSize(sizes[0]);
  const h=host(page);
  await h.locator('[data-fb-op="remove"]').click();await h.locator('[data-fb-kind="posOne"]').click();
  await h.locator("#fb-whole").selectOption("0");await h.locator("#fb-denominator").selectOption("2");await h.locator("#fb-numerator").selectOption("1");
  await h.locator("#fb-apply").click();
  await expect(h.locator("#fraction-lab")).toHaveAttribute("data-busy","false",{timeout:25000});
  await expect(room.locator(".fw-label")).toHaveCount(0);
  await measure(room,"fw-count-plaque","22 whole weights");
  await h.locator("#fb-undo").click();
  await expect(room.locator(".fw-label")).toHaveText("1/2");
  await measure(room,"fw-count-plaque","22 whole weights");
  await board(page,"fractions","guided",3);
  const campaign=frac(page,"right");
  await expect(host(page)).toHaveAttribute("data-styles","ready");
  await expect(campaign.locator(".fw-pile-weight")).toHaveCount(11);
  await expect(campaign.locator(".fw-pile[data-stack-layout='ten']")).toHaveCount(0);
  await measure(campaign,"fw-count-plaque","11 whole weights");
});
