import {test,expect} from "@playwright/test";
import {ALTERNATIVE_WEIGHT_SHAPES} from "../src/weight-shapes.mjs";
const key="mathssprites.cosmetics.v1";
const reward=(p,id)=>p.locator('[data-reward-id="'+id+'"]');
async function seed(page,shape=null){
  await page.addInitScript(({key,shape})=>{
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:1,unlockedRewards:["dumbbell","copper","extra-fluffy",...(shape?[shape]:[])],equipped:{"weight-shape":shape,"weight-material":"copper",fur:"extra-fluffy"}}));
    localStorage.setItem("mathssprites.motion-preference.v1","reduced");
  },{key,shape});
}
async function custom(page,eq,world){
  await page.goto("/?workshop="+encodeURIComponent(eq)+"&workshopWorld="+world+"&workshopMode=auto");
  await page.locator("#workshop-create").click();
}
test("six alternative shapes combine with saved copper; try-ons and fractional previews are isolated @quick @smoke",async({page},testInfo)=>{
  test.setTimeout(60000);await seed(page);await page.goto("/");
  await page.locator("#home-atelier").click();await page.locator('[data-atelier-collection="weights"]').click();
  await page.locator("#atelier-filter").selectOption("weight-shape");
  const preview=page.locator("#atelier-preview"),whole=preview.locator(".atelier-weight-stage .weight"),fraction=preview.locator("#atelier-weight-fraction");
  const measure=el=>el.evaluate(el=>{const c=getComputedStyle(el);return {width:c.width,height:c.height,clip:c.clipPath,background:c.backgroundImage};});
  const baseline=await measure(whole),before=await page.evaluate(key=>localStorage.getItem(key),key),clips=[];
  for(const id of ALTERNATIVE_WEIGHT_SHAPES){
    await reward(page,id).click();
    await expect(preview).toHaveAttribute("data-weight-shape",id);
    await expect(preview).toHaveAttribute("data-weight-material","copper");
    const variant=await measure(whole);
    expect(variant.width).toBe(baseline.width);expect(variant.height).toBe(baseline.height);expect(variant.clip).not.toBe(baseline.clip);
    expect(variant.background).toBe(baseline.background);clips.push(variant.clip);
    await expect(reward(page,id).locator(".atelier-thumb .weight")).toBeVisible();
    await expect(fraction.locator(".fw-assembly")).toHaveAttribute("data-shape",id);
    await expect(fraction.locator(".fw-label")).toHaveText("2/3");
    await expect(fraction.locator(".fw-piece")).toHaveCount(2);
    await expect(page.locator("body")).toHaveAttribute("data-weight-shape","original");
    if(id!=="dumbbell")await expect(page.locator("#atelier-equip")).toBeDisabled();
    await testInfo.attach("copper-"+id+".png",{body:await preview.screenshot(),contentType:"image/png"});
  }
  expect(new Set(clips).size).toBe(6);expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(before);
  await reward(page,"dumbbell").click();await page.locator("#atelier-equip").click();
  await expect(page.locator("body")).toHaveAttribute("data-weight-shape","dumbbell");
  await page.locator("#atelier-back").click();await page.reload();await page.locator("#home-atelier").click();
  await page.locator('[data-atelier-collection="weights"]').click();
  await expect(page.locator("#atelier-weight-finish")).toHaveText("Dumbbell · Copper");
  await page.locator("#atelier-filter").selectOption("weight-shape");await reward(page,"dumbbell").click();
  await page.locator("#atelier-remove").click();
  await expect(page.locator("body")).toHaveAttribute("data-weight-shape","original");
  await expect(page.locator("body")).toHaveAttribute("data-weight-material","copper");
});
test("kettlebell with actual handle opening retains five-weight piles and exact fraction pieces",async({page},testInfo)=>{
  test.setTimeout(60000);await seed(page,"kettlebell");
  await custom(page,"x+12=16","positive");
  const weights=page.locator("#left-items .floor-track > .weight");
  await expect(weights).toHaveCount(12);
  await expect(weights.first()).toHaveCSS("clip-path",/polygon\(evenodd,/);
  await expect(weights.first()).toHaveCSS("background-image",/rgb\(242, 185, 142\)/);
  await expect(page.locator("#left-items .weight-stack-count")).toHaveText("12 weights");
  await expect(page.locator("#left-items .weight[data-weight-slot='4']")).toHaveCount(1);
  await expect(page.locator("#left-items .weight[data-weight-slot='4']")).toHaveCSS("top","0px");
  await expect(page.locator("#left-items .weight[data-weight-slot='5']")).toHaveCSS("top","-24px");
  await expect(page.locator("#left-items .weight[data-weight-slot='10']")).toHaveCSS("top","-72px");
  await testInfo.attach("kettlebell-piles.png",{body:await page.screenshot(),contentType:"image/png"});
  await custom(page,"x+2/3=4+2/3","fractions");
  const root=page.locator("#fraction-game-host #fraction-lab");
  await expect(root).toHaveAttribute("data-weight-shape","kettlebell");
  await expect(root.locator("#left-items .fw-assembly")).toHaveAttribute("data-shape","kettlebell");
  await expect(root.locator("#left-items .fw-whole-outline")).toHaveAttribute("fill-rule","evenodd");
  await expect(root.locator("#left-items .fw-piece")).toHaveCount(2);
  await expect(root.locator("#left-items .fw-label")).toHaveText("2/3");
  await root.locator('[data-fb-op="remove"]').click();await root.locator('[data-fb-kind="posOne"]').click();
  await root.locator("#fb-whole").selectOption("0");await root.locator("#fb-denominator").selectOption("3");await root.locator("#fb-numerator").selectOption("2");
  await root.locator("#fb-apply").click();
  await expect(root).toHaveAttribute("data-solved","true",{timeout:25000});
  await expect(root.locator("#right-items .fw-pile-weight")).toHaveCount(4);
  await expect(root.locator("#right-items .fw-pile-weight .fw-assembly[data-shape='kettlebell']")).toHaveCount(4);
  await expect(root.locator("#fb-comic-page .fw-assembly[data-shape='kettlebell']").first()).toBeVisible();
  await testInfo.attach("kettlebell-fraction.png",{body:await page.screenshot(),contentType:"image/png"});
});
