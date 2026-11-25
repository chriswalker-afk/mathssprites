import {test,expect} from "@playwright/test";
import {mkdirSync} from "node:fs";
const root=p=>p.locator("#fraction-game-host #fraction-lab");
const wait=p=>expect(root(p)).toHaveAttribute("data-busy","false",{timeout:25000});
async function custom(page,equation){
  await page.goto("/?workshop="+encodeURIComponent(equation)+"&workshopWorld=fractions");
  await page.locator("#workshop-create").click();
  await wait(page);
}
async function scale(page,op,factor){
  await root(page).locator('[data-fb-op="'+op+'"]').click();
  await root(page).locator('[data-fb-factor="'+factor+'"]').click();
  await root(page).locator("#fb-apply").click();
}
async function shot(page,name){
  mkdirSync("artifacts",{recursive:true});
  await page.screenshot({path:"artifacts/world3-"+name+".png",fullPage:true,animations:"allow"});
}
test("unsupported cuts use the real sprite or weight geometry and rejoin without a move",async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await custom(page,"(3/4)x=3");
  await scale(page,"divide",5);
  const left=root(page).locator("#left-items");
  await expect(left.locator(".fb-refusal-cut .fs-piece")).toHaveCount(20);
  await expect(left.locator(".fb-refusal-cut .fs-assembly")).toHaveClass(/is-separated/);
  await shot(page,"refused-sprite-cut");
  await wait(page);
  await expect(root(page).locator("#fb-moves")).toHaveText("0 moves");
  await expect(left).toHaveAttribute("aria-label","West chamber: 3/4 sprites, 0 weights");
  await expect(left.locator(".fb-refusal-art")).toHaveCount(0);
  await custom(page,"x+1/8=2");
  await scale(page,"divide",3);
  await expect(left.locator(".fb-refusal-cut .fw-piece")).toHaveCount(24);
  await expect(left.locator(".fb-refusal-cut .fw-assembly")).toHaveClass(/is-separated/);
  await shot(page,"refused-weight-cut");
  await wait(page);
  await expect(left).toHaveAttribute("aria-label","West chamber: 1 sprites, 1/8 weights");
  await expect(root(page).locator("#fb-moves")).toHaveText("0 moves");
});
test("large custom rooms pack into rows and overflow props leave no state or saved credit",async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await custom(page,"48x=48");
  const before=await page.evaluate(()=>JSON.stringify(localStorage));
  for(const viewport of [{width:1280,height:720},{width:360,height:640}]){
    await page.setViewportSize(viewport);
    await expect(root(page).locator("#left-items .fb-room-floor")).toHaveAttribute("data-wrap","true");
    await expect(root(page).locator("#left-items .fs-piece")).toHaveCount(48);
    await expect(root(page).locator("#right-items .fw-pile-weight")).toHaveCount(48);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await shot(page,"crowded-"+viewport.width);
  }
  await scale(page,"multiply",2);
  await expect(root(page).locator("#left-items .fb-refusal-spill")).toHaveAttribute("data-excess","48");
  await expect(root(page).locator("#left-items .fb-spill-object")).toHaveCount(5);
  await shot(page,"overflow");
  await wait(page);
  await expect(root(page).locator("#left-items .fs-piece")).toHaveCount(48);
  await expect(root(page).locator(".fb-refusal-art")).toHaveCount(0);
  await expect(root(page).locator("#fb-moves")).toHaveText("0 moves");
  expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
});
test("fraction scene has an accessible local reduced-motion setting and keeps free play isolated",async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await custom(page,"2x=5");
  const before=await page.evaluate(()=>JSON.stringify(localStorage));
  const toggle=root(page).locator("#fb-motion-toggle");
  await expect(toggle).toHaveAttribute("aria-pressed","false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed","true");
  await expect(root(page)).toHaveAttribute("data-reduced","true");
  await scale(page,"divide",2);await wait(page);
  await expect(root(page)).toHaveAttribute("data-solved","true");
  await expect(root(page).locator("#fb-rating")).toContainText("no stars awarded");
  await shot(page,"solved-reduced");
  expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
});
