import {test,expect} from "@playwright/test";
async function open(page,{level="frac-g-01",mode="auto",reduced=true}={}){
  await page.goto("/fraction-balance-preview.html");
  await expect(page.locator("#fraction-lab")).toHaveAttribute("data-busy","false");
  if(reduced)await page.locator("#fb-reduced").check();
  else await page.locator("#fb-reduced").uncheck();
  await page.locator("#fb-level").selectOption(level);
  await page.locator("#fb-mode").selectOption(mode);
}
async function group(page,op,factor){
  await page.locator('[data-fb-op="'+op+'"]').click();
  await page.locator('[data-fb-factor="'+factor+'"]').click();
}
async function amount(page,op,kind,n,d,whole=0){
  await page.locator('[data-fb-op="'+op+'"]').click();
  await page.locator('[data-fb-kind="'+kind+'"]').click();
  await page.locator("#fb-whole").selectOption(String(whole));
  await page.locator("#fb-denominator").selectOption(String(d));
  await page.locator("#fb-numerator").selectOption(String(n));
}
const ready=page=>expect(page.locator("#fraction-lab")).toHaveAttribute("data-busy","false",{timeout:25000});
test("guided division visibly shares the exact leftovers into real wicker baskets and solves",async({page})=>{
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await open(page,{reduced:false});
  await expect(page.locator("#fb-review")).toBeHidden();
  await group(page,"divide",2);
  await page.locator("#fb-apply").click();
  await expect(page.locator("#left-items .group-basket")).toHaveCount(2);
  await expect(page.locator("#left-items")).toHaveAttribute("data-phase","sharing");
  await expect(page.locator("#left-items .group-basket .fs-piece")).toHaveCount(2);
  await ready(page);
  await expect(page.locator("#fraction-lab")).toHaveAttribute("data-solved","true");
  await expect(page.locator("#right-items")).toHaveAttribute("aria-label","East chamber: 0 sprites, 5/2 weights");
  await expect(page.locator("#fb-moves")).toHaveText("1 move");
  await expect(page.locator("#fb-history")).toContainText("x = 5/2");
  await page.locator("#fb-undo").click();
  await expect(page.locator("#fb-review")).toBeHidden();
  await expect(page.locator("#fb-moves")).toHaveText("0 moves");
  expect(errors).toEqual([]);
});
test("guided borrowing, copying and recombination produce the exact settled room",async({page})=>{
  await open(page,{level:"frac-g-05"});
  await amount(page,"remove","posOne",1,2);
  await page.locator("#fb-apply").click();await ready(page);
  await expect(page.locator("#fraction-lab")).toHaveAttribute("data-solved","true");
  await expect(page.locator("#right-items")).toHaveAttribute("aria-label","East chamber: 0 sprites, 5/2 weights");
  await page.locator("#fb-level").selectOption("frac-g-15");
  await group(page,"multiply",4);
  await page.locator("#fb-apply").click();await ready(page);
  await expect(page.locator("#left-items")).toHaveAttribute("aria-label","West chamber: 3 sprites, 0 weights");
  await group(page,"divide",3);
  await page.locator("#fb-apply").click();await ready(page);
  await expect(page.locator("#fraction-lab")).toHaveAttribute("data-solved","true");
  await expect(page.locator("#fb-moves")).toHaveText("2 moves");
});
test("independent mode accepts equivalent amounts and commits only after matching",async({page})=>{
  await open(page,{level:"frac-g-05",mode:"manual"});
  await amount(page,"remove","posOne",1,2);
  await page.locator("#left-action").click();await ready(page);
  await expect(page.locator("#fraction-lab")).toHaveAttribute("data-pending","left");
  await expect(page.locator("#scene")).toHaveAttribute("data-balance","right-heavy");
  await expect(page.locator("#fb-moves")).toHaveText("0 moves");
  await amount(page,"remove","posOne",2,4);
  await page.locator("#right-action").click();await ready(page);
  await expect(page.locator("#fraction-lab")).toHaveAttribute("data-solved","true");
  await expect(page.locator("#scene")).toHaveAttribute("data-balance","level");
  await expect(page.locator("#fb-moves")).toHaveText("1 move");
});
test("refused denominator and mismatched independent move roll back without a scored step",async({page})=>{
  await open(page,{level:"frac-g-15"});
  await group(page,"divide",5);await page.locator("#fb-apply").click();await ready(page);
  await expect(page.locator("#speech")).toContainText("Fractions like these are valid");
  await expect(page.locator("#left-items")).toHaveAttribute("aria-label","West chamber: 3/4 sprites, 0 weights");
  await expect(page.locator("#fb-moves")).toHaveText("0 moves");
  await page.locator("#fb-level").selectOption("frac-g-05");
  await page.locator("#fb-mode").selectOption("manual");
  await amount(page,"remove","posOne",1,2);await page.locator("#left-action").click();await ready(page);
  await amount(page,"remove","posOne",1,4);
  await page.locator("#right-action").click();await ready(page);
  await expect(page.locator("#fraction-lab")).toHaveAttribute("data-pending","");
  await expect(page.locator("#scene")).toHaveAttribute("data-balance","level");
  await expect(page.locator("#left-items")).toHaveAttribute("aria-label","West chamber: 1 sprites, 1/2 weights");
  await expect(page.locator("#fb-moves")).toHaveText("0 moves");
});
test("reduced-motion preview fits a phone and short laptop and does not create campaign records",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await open(page,{level:"frac-g-24"});
  const before=await page.evaluate(()=>JSON.stringify(localStorage));
  for(const viewport of [{width:360,height:640},{width:1280,height:720}]){
    await page.setViewportSize(viewport);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await expect(page.locator("#fraction-lab")).toHaveAttribute("data-reduced","true");
    await expect(page.locator("#hand")).toHaveCSS("transition-duration","0s");
  }
  await amount(page,"remove","posX",1,4);await page.locator("#fb-apply").click();await ready(page);
  expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
});
