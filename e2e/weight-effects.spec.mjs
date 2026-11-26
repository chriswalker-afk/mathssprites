import {test,expect} from "@playwright/test";
const key="mathssprites.cosmetics.v1";
const ids=["soft-glow","frost-shimmer","ember-glow","pearlescent-shimmer","golden-halo"];
const reward=(p,id)=>p.locator('[data-reward-id="'+id+'"]');
async function seed(page,{effect=null,motion="reduced"}={}){
  await page.addInitScript(({key,effect,motion})=>{
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:1,unlockedRewards:["dumbbell","copper","soft-glow","extra-fluffy",...(effect?[effect]:[])],equipped:{"weight-shape":"dumbbell","weight-material":"copper","weight-effect":effect,fur:"extra-fluffy"}}));
    if(!localStorage.getItem("mathssprites.motion-preference.v1"))localStorage.setItem("mathssprites.motion-preference.v1",motion);
  },{key,effect,motion});
}
const saved=page=>page.evaluate(key=>localStorage.getItem(key),key);
const visual=el=>el.evaluate(el=>{
  const body=getComputedStyle(el),light=getComputedStyle(el,"::before");
  return {width:body.width,height:body.height,clip:body.clipPath,base:body.backgroundImage,transform:body.transform,
    content:light.content,animation:light.animationName,paint:light.backgroundImage,pointer:light.pointerEvents};
});
async function custom(page,eq,world){
  await page.goto("/?workshop="+encodeURIComponent(eq)+"&workshopWorld="+world+"&workshopMode=auto");
  await page.locator("#workshop-create").click();
}
test("five distinct effects preview with copper dumbbells; locked try-ons, persistence and independent removal @quick @smoke",async({page},testInfo)=>{
  test.setTimeout(60000);await seed(page);await page.goto("/");
  await page.locator("#home-atelier").click();await page.locator('[data-atelier-collection="weights"]').click();
  await page.locator("#atelier-filter").selectOption("weight-effect");
  await expect(page.locator("#atelier-collection .atelier-reward:visible")).toHaveCount(5);
  const preview=page.locator("#atelier-preview"),whole=preview.locator(".atelier-weight-stage .weight"),fraction=preview.locator("#atelier-weight-fraction");
  const baseline=await visual(whole),before=await saved(page),paints=[];
  expect(baseline.content).toBe("none");
  const points=await fraction.locator(".fw-cut-edge").evaluateAll(els=>els.map(el=>el.getAttribute("points")));
  for(const id of ids){
    await reward(page,id).click();
    await expect(preview).toHaveAttribute("data-weight-effect",id);
    await expect(preview).toHaveAttribute("data-weight-shape","dumbbell");
    await expect(preview).toHaveAttribute("data-weight-material","copper");
    await expect(reward(page,id).locator(".atelier-thumb .weight")).toBeVisible();
    const v=await visual(whole);
    for(const property of ["width","height","clip","base","transform"])expect(v[property]).toBe(baseline[property]);
    expect(v.content).toBe('""');expect(v.animation).toBe("none");expect(v.pointer).toBe("none");
    expect(v.paint).not.toBe("none");paints.push(v.paint);
    await expect(fraction.locator(".fw-weight-effect")).toHaveCount(2);
    await expect(fraction.locator(".fw-weight-effect").first()).toHaveCSS("display","inline");
    await expect(fraction.locator(".fw-weight-effect").first()).toHaveCSS("animation-name","none");
    await expect(fraction.locator(".fw-label")).toHaveText("2/3");
    expect(await fraction.locator(".fw-cut-edge").evaluateAll(els=>els.map(el=>el.getAttribute("points")))).toEqual(points);
    await expect(page.locator("body")).toHaveAttribute("data-weight-effect","original");
    if(id!=="soft-glow")await expect(page.locator("#atelier-equip")).toBeDisabled();
    await testInfo.attach(id+".png",{body:await preview.screenshot(),contentType:"image/png"});
  }
  expect(new Set(paints).size).toBe(5);expect(await saved(page)).toBe(before);
  await reward(page,"soft-glow").click();await page.locator("#atelier-equip").click();
  await expect(page.locator("body")).toHaveAttribute("data-weight-effect","soft-glow");
  await page.locator("#atelier-back").click();await page.reload();await page.locator("#home-atelier").click();
  await page.locator('[data-atelier-collection="weights"]').click();
  await expect(page.locator("#atelier-weight-finish")).toHaveText("Dumbbell · Copper · Soft glow");
  await page.locator("#atelier-filter").selectOption("weight-effect");await reward(page,"soft-glow").click();
  await page.locator("#atelier-remove").click();
  await expect(page.locator("body")).toHaveAttribute("data-weight-effect","original");
  await expect(page.locator("body")).toHaveAttribute("data-weight-shape","dumbbell");
  await expect(page.locator("body")).toHaveAttribute("data-weight-material","copper");
  expect(JSON.parse(await saved(page)).equipped["weight-effect"]).toBeNull();
});
test("motion only changes decorative layers; reduced motion retains static light across worlds",async({page},testInfo)=>{
  test.setTimeout(75000);await page.emulateMedia({reducedMotion:"no-preference"});
  await seed(page,{effect:"golden-halo",motion:"on"});
  await custom(page,"x+5=10","positive");
  const whole=page.locator("#left-items .weight").first();
  await expect(page.locator("#left-items .weight")).toHaveCount(5);
  await expect.poll(async()=> (await visual(whole)).animation).toBe("weight-effect-glimmer");
  const animated=await visual(whole);
  await page.locator("#motion-toggle").click();
  await expect.poll(async()=> (await visual(whole)).animation).toBe("none");
  const still=await visual(whole);
  for(const prop of ["width","height","clip","base","transform","paint","content"])expect(still[prop]).toBe(animated[prop]);
  const before=await saved(page);
  await custom(page,"x+5-3=7","signed");
  await expect(page.locator("#left-items .weight")).toHaveCount(5);
  await expect(page.locator("#left-items .balloon")).toHaveCount(3);
  await page.locator('[data-pair-side="left"][data-pair-type="constants"]').click();
  await expect(page.locator("#left-items .weight")).toHaveCount(2,{timeout:20000});
  expect((await visual(page.locator("#left-items .weight").first())).animation).toBe("none");
  await custom(page,"x+2/3=4+2/3","fractions");
  const root=page.locator("#fraction-game-host #fraction-lab");
  await expect(root).toHaveAttribute("data-weight-effect","golden-halo");
  const cut=root.locator("#left-items .fw-weight-effect");
  await expect(cut).toHaveCount(2);
  await expect(cut.first()).toHaveCSS("animation-name","none");
  await expect(cut.first()).toHaveCSS("display","inline");
  await expect(root.locator("#left-items .fw-effect-rim").first()).toHaveCSS("stroke","rgb(255, 233, 163)");
  await expect(root.locator("#left-items .fw-label")).toHaveText("2/3");
  await root.locator("#fb-motion-toggle").click();
  await expect(cut.first()).toHaveCSS("animation-name","weight-effect-glimmer");
  await root.locator("#fb-motion-toggle").click();
  await expect(cut.first()).toHaveCSS("animation-name","none");
  await testInfo.attach("golden-fraction.png",{body:await page.screenshot(),contentType:"image/png"});
  await custom(page,"x²=25","squares");
  await expect(page.locator("#right-items .weight")).toHaveCount(25);
  expect((await visual(page.locator("#right-items .weight").first())).animation).toBe("none");
  expect(await saved(page)).toBe(before);
});
