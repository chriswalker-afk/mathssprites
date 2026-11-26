import {playCampaignLevel} from "./campaign-menu-helper.mjs";
import {openCampaignBoard} from "./campaign-menu-helper.mjs";
import {test,expect} from "@playwright/test";
import {mkdirSync} from "node:fs";
const card=(page,id)=>page.locator('[data-study="'+id+'"]');
const saveKey="mathssprites.cosmetics.v1";
const profile=(fur="extra-fluffy",eyes="curious-eyes")=>({
  version:1,unlockedRewards:["curious-eyes","extra-fluffy","sleepy-eyes","spiky-fur","knitted-beanie","brass-spectacles","little-bow-tie"],equipped:{fur,eyes,headwear:"knitted-beanie",eyewear:"brass-spectacles",neckwear:"little-bow-tie"}
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
  await expect(page.locator(".study-card")).toHaveCount(32);
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
  await expect(page.locator("#left-items .sprite-white .sprite-wear-headwear")).toHaveCount(2);
  await expect(page.locator("#left-items .sprite-white .sprite-wear-headwear").first()).toBeVisible();
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
  for(const slot of ["headwear","eyewear","neckwear"]){
    await expect(lab).toHaveAttribute("data-sprite-"+slot,profile().equipped[slot]);
    await expect(lab.locator("#left-items .fs-whole-actor .sprite-wear-"+slot)).toBeVisible();
  }
  await expect(lab.locator(".fs-piece .sprite-wear")).toHaveCount(0);
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

test("every wearable fits the native body envelope and keeps both signs and the square face intact",async({page},testInfo)=>{
  await page.goto("/sprite-cosmetic-preview.html");
  const report=await page.locator(".study-card").evaluateAll(cards=>{
    const read=actor=>{
      const body=actor.querySelector(".sprite-body"),b=body.getBoundingClientRect(),style=getComputedStyle(body),token=getComputedStyle(actor);
      const scale=b.width/parseFloat(style.width);
      const visible=[...body.querySelectorAll(".sprite-wear")].filter(layer=>getComputedStyle(layer).display!=="none").map(layer=>{
        const r=layer.getBoundingClientRect(),s=getComputedStyle(layer);
        return {slot:layer.className,art:s.backgroundImage.startsWith('url("data:image/svg+xml,'),pointer:s.pointerEvents,
          fits:r.left>=b.left-5*scale-1&&r.right<=b.right+5*scale+1&&r.top>=b.top-5*scale-1&&r.bottom<=b.bottom+5*scale+1};
      });
      return {kind:actor.classList.contains("sprite-white")?"white":actor.classList.contains("sprite-square")?"square":"black",
        width:token.width,height:token.height,bodyWidth:style.width,bodyHeight:style.height,bodyColor:style.backgroundImage,radius:style.borderTopLeftRadius,visible};
    };
    return cards.map(c=>({id:c.dataset.study,actors:[...c.querySelectorAll(".study-stage>.sprite")].map(read),
      fragmentWear:c.querySelectorAll(".fs-assembly .sprite-wear").length}));
  });
  const baseline=report.find(c=>c.id==="original");
  expect(report.length).toBe(32);
  for(const entry of report.slice(6,21)){
    expect(entry.fragmentWear).toBe(0);
    for(const actor of entry.actors){
      const reference=baseline.actors.find(a=>a.kind===actor.kind);
      for(const prop of ["width","height","bodyWidth","bodyHeight","bodyColor","radius"])expect(actor[prop]).toBe(reference[prop]);
      expect(actor.visible).toHaveLength(entry.id==="wearable-combination"?3:1);
      expect(actor.visible.every(v=>v.fits&&v.art&&v.pointer==="none"),entry.id+" "+actor.kind).toBe(true);
    }
  }
  await testInfo.attach("combined-wearables.png",{body:await card(page,"wearable-combination").screenshot(),contentType:"image/png"});
});

test("motion and effect art study preserves each sign and has distinct variants",async({page},testInfo)=>{
  await page.goto("/sprite-cosmetic-preview.html");
  const effects=[["stardust-footsteps","cos-footsteps"],["golden-landing-sparkles","cos-landing"],["celestial-particle-trail","cos-celestial"],["constellation-aura","cos-aura"]];
  const arts=[];
  for(const [id] of effects){
    const effect=card(page,id).locator(".sprite-black .sprite-cosmetic-effect");
    await expect(effect).toBeVisible();
    await expect(effect).toHaveCSS("animation-name","none");
    arts.push(await effect.evaluate(el=>getComputedStyle(el).backgroundImage));
    await expect(card(page,id).locator(".fs-assembly .sprite-cosmetic-effect")).toHaveCount(0);
  }
  expect(new Set(arts).size).toBe(4);
  await page.locator("#study-motion").click();
  await expect(card(page,"springy-bounce").locator(".sprite-black .sprite-motion")).toHaveCSS("animation-name","cos-spring-round");
  await expect(card(page,"springy-bounce").locator(".sprite-white .sprite-motion")).toHaveCSS("animation-name","cos-spring-round");
  await expect(card(page,"springy-bounce").locator(".sprite-square .sprite-motion")).toHaveCSS("animation-name","cos-spring-square");
  for(const kind of ["sprite-black","sprite-white","sprite-square"])
    await expect(card(page,"magical-levitation").locator("."+kind+" .sprite-motion")).toHaveCSS("animation-name","cos-levitate");
  for(const [id,name] of effects)await expect(card(page,id).locator(".sprite-black .sprite-cosmetic-effect")).toHaveCSS("animation-name",name);
  await page.locator("#study-motion").click();
  await testInfo.attach("constellation-aura.png",{body:await card(page,"constellation-aura").screenshot(),contentType:"image/png"});
});

test("final textures and Grand Alchemist preserve body dimensions, sign contrast, exact cuts and square outline",async({page},testInfo)=>{
  await page.goto("/sprite-cosmetic-preview.html");
  const ids=["mischievous-eyes","curled-fur","distinguished-eyebrows","silky-fur","grand-alchemist"];
  const cuts=await card(page,"original").locator(".fs-cut-edge").evaluateAll(els=>els.map(el=>el.getAttribute("d")));
  for(const kind of ["sprite-black","sprite-white","sprite-square"]){
    const baseline=await spriteMetrics(card(page,"original").locator("."+kind));
    for(const id of ids){
      const actor=card(page,id).locator("."+kind),variant=await spriteMetrics(actor);
      for(const k of ["tokenW","tokenH","bodyW","bodyH","bodyColor","radius","eyeColor"])expect(variant[k],id+" "+kind+" "+k).toBe(baseline[k]);
      expect(variant.hop).toBe("none");
      if(["curled-fur","silky-fur","grand-alchemist"].includes(id))expect(variant.furColor).not.toBe(baseline.furColor);
      if(["mischievous-eyes","distinguished-eyebrows","grand-alchemist"].includes(id)){
        const brow=await actor.locator(".sprite-eyes i").first().evaluate(el=>getComputedStyle(el,"::before").display);
        expect(brow).toBe("block");
      }
    }
  }
  for(const id of ids){
    expect(await card(page,id).locator(".fs-cut-edge").evaluateAll(els=>els.map(el=>el.getAttribute("d")))).toEqual(cuts);
    await expect(card(page,id).locator(".fs-label")).toHaveText("2/3");
    await expect(card(page,id).locator(".fs-assembly .sprite-wear")).toHaveCount(0);
    await expect(card(page,id).locator(".fs-assembly .sprite-cosmetic-effect")).toHaveCount(0);
  }
  for(const [id,group] of [["curled-fur","curled"],["silky-fur","silky"],["grand-alchemist","grand"]])
    await expect(card(page,id).locator(".fs-fur-"+group)).toHaveCSS("display","inline");
  await page.locator("#study-motion").click();
  for(const kind of ["sprite-black","sprite-white","sprite-square"]){
    await expect(card(page,"grand-alchemist").locator("."+kind+" .sprite-motion")).toHaveCSS("animation-name","cos-grand-rise");
    await expect(card(page,"grand-alchemist").locator("."+kind+" .sprite-cosmetic-effect")).toHaveCSS("animation-name","cos-grand-glimmer");
  }
  await page.locator("#study-motion").click();
  await testInfo.attach("grand-alchemist-art.png",{body:await card(page,"grand-alchemist").screenshot(),contentType:"image/png"});
});
test("full outfit follows the real sprites through signed, fraction and square campaign scenes",async({page},testInfo)=>{
  test.setTimeout(90000);
  const equipped=Object.fromEntries(["fur","eyes","headwear","eyewear","neckwear","movement","effect"].map(slot=>[slot,"grand-alchemist-"+slot]));
  await seed(page,{version:1,unlockedRewards:["grand-alchemist"],equipped});
  await page.goto("/?workshop="+encodeURIComponent("3x-2x+3-5=6")+"&workshopWorld=signed");
  await page.locator("#workshop-create").click();
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(3);
  await expect(page.locator("#left-items .sprite-white")).toHaveCount(2);
  await expect(page.locator("#left-items .sprite-white .sprite-wear-headwear").first()).toBeVisible();
  await page.locator('[data-pair-side="left"][data-pair-type="sprites"]').click();
  await expect(page.locator("#left-items .sprite-white")).toHaveCount(0,{timeout:20000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await page.goto("/?workshop="+encodeURIComponent("x+2/3=4+2/3")+"&workshopWorld=fractions");
  await page.locator("#workshop-create").click();
  const lab=page.locator("#fraction-game-host").locator("#fraction-lab");
  await expect(lab).toBeVisible();
  for(const [slot,id] of Object.entries(equipped))await expect(lab).toHaveAttribute("data-sprite-"+slot,id);
  await expect(lab.locator("#left-items .fs-whole-actor")).toHaveCount(1);
  await expect(lab.locator("#left-items .fs-whole-actor .sprite-wear-headwear")).toBeVisible();
  await page.goto("/");await openCampaignBoard(page,"squares","guided");
  await playCampaignLevel(page,page.locator('[data-level="1"]'));
  await page.locator('.operation-picker [data-operation="square"]').click();
  await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:25000});
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(9);
  await page.locator("#replay-close").click();
  await expect(page.locator("#left-items .sprite-square .sprite-wear-headwear")).toBeVisible();
  await expect(page.locator("#left-items .sprite-square .sprite-body")).toHaveCSS("border-top-left-radius","7px");
  await testInfo.attach("grand-alchemist-square.png",{body:await page.screenshot({fullPage:true}),contentType:"image/png"});
});
