import {test,expect} from "@playwright/test";
import {mkdirSync} from "node:fs";
const card=(page,id)=>page.locator('[data-study="'+id+'"]');
const saveKey="mathssprites.cosmetics.v1";
const profile=(fur="extra-fluffy",eyes="curious-eyes")=>({
  version:1,unlockedRewards:["curious-eyes","extra-fluffy","sleepy-eyes","spiky-fur"],equipped:{fur,eyes}
});
async function seed(page,value=profile()){
  await page.addInitScript(({key,value})=>{
    localStorage.setItem(key,JSON.stringify(value));
    localStorage.setItem("mathssprites.motion-preference.v1","reduced");
  },{key:saveKey,value});
}
async function spriteMetrics(actor){
  return actor.evaluate(el=>{
    const body=el.querySelector(".sprite-body"),eye=el.querySelector(".sprite-eyes i"),
      motion=el.querySelector(".sprite-motion"),fur=getComputedStyle(body,"::before"),
      bodyCSS=getComputedStyle(body),eyeCSS=getComputedStyle(eye),tokenCSS=getComputedStyle(el);
    return {tokenW:tokenCSS.width,tokenH:tokenCSS.height,bodyW:bodyCSS.width,bodyH:bodyCSS.height,
      bodyColor:bodyCSS.backgroundImage,radius:bodyCSS.borderTopLeftRadius,fur:fur.clipPath,
      furColor:fur.backgroundImage,eyeW:eyeCSS.width,eyeH:eyeCSS.height,eyeColor:eyeCSS.backgroundColor,
      hop:getComputedStyle(motion).animationName};
  });
}
test("all first cosmetics retain native body dimensions, sign contrast, square corners and exact fragments @quick @smoke",async({page},testInfo)=>{
  await page.goto("/sprite-cosmetic-preview.html");
  const before=await page.evaluate(()=>JSON.stringify(localStorage));
  await expect(page.locator(".study-card")).toHaveCount(6);
  for(const kind of ["sprite-black","sprite-white","sprite-square"]){
    const baseline=await spriteMetrics(card(page,"original").locator("."+kind));
    for(const name of ["curious","fluffy","sleepy","spiky","combined"]){
      const variant=await spriteMetrics(card(page,name).locator("."+kind));
      for(const property of ["tokenW","tokenH","bodyW","bodyH","bodyColor","radius","eyeColor"])
        expect(variant[property],kind+" "+name+" "+property).toBe(baseline[property]);
      if(["curious","combined"].includes(name))expect(parseFloat(variant.eyeH)).toBeGreaterThan(parseFloat(baseline.eyeH));
      if(name==="sleepy")expect(parseFloat(variant.eyeH)).toBeLessThan(parseFloat(baseline.eyeH));
      if(["fluffy","spiky","combined"].includes(name))expect(variant.furColor).not.toBe(baseline.furColor);
      expect(variant.hop).toBe("none");
    }
  }
  const dark=await spriteMetrics(card(page,"combined").locator(".sprite-black"));
  const light=await spriteMetrics(card(page,"combined").locator(".sprite-white"));
  expect(dark.bodyColor).not.toBe(light.bodyColor);expect(dark.eyeColor).not.toBe(light.eyeColor);
  expect(dark.furColor).not.toBe(light.furColor);
  expect((await spriteMetrics(card(page,"spiky").locator(".sprite-square"))).radius).toBe("7px");
  const baseCuts=await card(page,"original").locator(".fs-cut-edge").evaluateAll(els=>els.map(el=>el.getAttribute("d")));
  for(const id of ["curious","fluffy","sleepy","spiky","combined"]){
    expect(await card(page,id).locator(".fs-cut-edge").evaluateAll(els=>els.map(el=>el.getAttribute("d")))).toEqual(baseCuts);
    await expect(card(page,id).locator(".fs-label")).toHaveText("2/3");
  }
  await expect(card(page,"fluffy").locator(".fs-fur-fluffy")).toHaveCSS("display","inline");
  await expect(card(page,"spiky").locator(".fs-fur-spiky")).toHaveCSS("display","inline");
  await expect(card(page,"fluffy").locator(".fs-fur-original")).toHaveCSS("display","none");
  await page.locator("#study-motion").click();
  await expect(card(page,"combined").locator(".sprite-black .sprite-motion")).toHaveCSS("animation-name","sprite-hop");
  await expect(card(page,"combined").locator(".sprite-square .sprite-motion")).toHaveCSS("animation-name","square-creature-hop");
  await expect(card(page,"curious").locator(".sprite-white .sprite-eyes i").first()).toHaveCSS("animation-name","sprite-blink");
  await page.locator("#study-motion").click();
  for(const width of [1440,375]){
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
    await testInfo.attach("sprite-study-"+width+".png",{body:await page.screenshot({fullPage:true}),contentType:"image/png"});
  }
  expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
});
test("saved unlocked appearance reaches home, signed Workshop and fraction shadow scene without changing counts",async({page})=>{
  await seed(page);
  await page.goto("/");
  const body=page.locator("body");
  await expect(body).toHaveAttribute("data-sprite-fur","extra-fluffy");
  await expect(body).toHaveAttribute("data-sprite-eyes","curious-eyes");
  await expect(page.locator("#hero-left-items .sprite-eyes i").first()).toHaveCSS("height","14px");
  await page.goto("/?workshop="+encodeURIComponent("3x-2x+3-5=6")+"&workshopWorld=signed");
  await page.locator("#workshop-create").click();
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(3);
  await expect(page.locator("#left-items .sprite-white")).toHaveCount(2);
  await expect(page.locator("#left-items .sprite-white .sprite-eyes i").first()).toHaveCSS("height","14px");
  await expect(page.locator('[data-pair-side="left"][data-pair-type="sprites"]')).toBeVisible();
  await page.locator('[data-pair-side="left"][data-pair-type="sprites"]').click();
  await expect(page.locator("#left-items .sprite-white")).toHaveCount(0,{timeout:15000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await page.locator("#undo").click();
  await expect(page.locator("#left-items .sprite-white")).toHaveCount(2);
  await page.goto("/?workshop="+encodeURIComponent("x+2/3=4+2/3")+"&workshopWorld=fractions");
  await page.locator("#workshop-create").click();
  const lab=page.locator("#fraction-game-host").locator("#fraction-lab");
  await expect(lab).toBeVisible();
  await expect(lab).toHaveAttribute("data-sprite-fur","extra-fluffy");
  await expect(lab).toHaveAttribute("data-sprite-eyes","curious-eyes");
  await expect(lab.locator("#left-items .fs-whole-actor")).toHaveCount(1);
  await expect(lab.locator("#left-items .fs-whole-actor .sprite-eyes i").first()).toHaveCSS("height","14px");
  await expect(lab.locator("#left-items .fs-whole-actor > svg")).toHaveCount(0);
});
test("a locked saved selection falls back to the original appearance",async({page})=>{
  await seed(page,{version:1,unlockedRewards:["curious-eyes"],equipped:{fur:"spiky-fur",eyes:"curious-eyes"}});
  await page.goto("/");
  await expect(page.locator("body")).toHaveAttribute("data-sprite-fur","original");
  await expect(page.locator("body")).toHaveAttribute("data-sprite-eyes","curious-eyes");
});
test("scoped previews and the live equip event change CSS without replacing the character",async({page})=>{
  await seed(page);
  await page.goto("/");
  await page.locator("#hero-left-items .sprite").evaluate(el=>el.dataset.sameActor="true");
  const result=await page.evaluate(async()=>{
    const {cosmeticRewards}=await import(document.querySelector('script[src*="site.mjs"]').src);
    const before=cosmeticRewards.getSnapshot();
    cosmeticRewards.equip("eyes","sleepy-eyes");
    cosmeticRewards.equip("fur","spiky-fur");
    return {before:before.earnedStars,after:cosmeticRewards.getSnapshot().earnedStars};
  });
  expect(result.after).toBe(result.before);
  await expect(page.locator("#hero-left-items .sprite")).toHaveAttribute("data-same-actor","true");
  await expect(page.locator("#hero-left-items .sprite-eyes i").first()).toHaveCSS("height","5px");
  await expect(page.locator("body")).toHaveAttribute("data-sprite-fur","spiky-fur");
});
