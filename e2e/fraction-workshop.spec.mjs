import {test,expect} from "@playwright/test";
const host=page=>page.locator("#fraction-game-host");
const root=page=>host(page).locator("#fraction-lab");
const ready=page=>expect(root(page)).toHaveAttribute("data-busy","false",{timeout:25000});
const saves=page=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
async function open(page){
  await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/");
  await page.locator("#home-choose-level").click();
  await page.locator('#site-levels [data-screen="workshop"]').click();
  await expect(page.locator("#site-workshop")).toBeVisible();
}
async function build(page,input,mode="auto"){
  await page.locator("#workshop-quantity-mode").selectOption("fractions");
  await page.locator("#workshop-equation").fill(input);
  await page.locator("#workshop-hand-mode").selectOption(mode);
  await page.locator("#workshop-create").click();
}
async function amount(page,n,d){
  const h=host(page);
  await h.locator('[data-fb-op="remove"]').click();await h.locator('[data-fb-kind="posOne"]').click();
  await h.locator("#fb-whole").selectOption("0");await h.locator("#fb-denominator").selectOption(String(d));
  await h.locator("#fb-numerator").selectOption(String(n));
}
async function divide(page,n){
  await host(page).locator('[data-fb-op="divide"]').click();
  await host(page).locator('[data-fb-factor="'+n+'"]').click();
}
test("Workshop number-system selection preserves legacy mode and introduces fractional examples @quick @smoke",async({page})=>{
  await open(page);
  await expect(page.locator("#workshop-quantity-mode")).toHaveValue("positive");
  await expect(page.locator('#workshop-hand-mode option[value="notebook"]')).toBeDisabled();
  await page.locator("#workshop-equation").fill("2x=5");await page.locator("#workshop-create").click();
  await expect(page.locator("#workshop-feedback")).toContainText("fractional value");
  await page.locator("#workshop-quantity-mode").selectOption("fractions");
  await expect(page.locator('#workshop-hand-mode option[value="notebook"]')).toBeEnabled();
  await page.locator('[data-workshop-example="(2/3)x = 4"]').click();
  await expect(page.locator("#workshop-equation")).toHaveValue("(2/3)x = 4");
  await page.locator("#workshop-hand-mode").selectOption("notebook");
  await page.locator("#workshop-quantity-mode").selectOption("positive");
  await expect(page.locator("#workshop-hand-mode")).toHaveValue("auto");
  await expect(page.locator('[data-workshop-example="3x + 5 = 20"]')).toBeVisible();
});
test("Guided custom equation solves with exact baskets and comic, then returns to its unchanged draft",async({page})=>{
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await open(page);const before=await saves(page);
  await build(page,"2x = 5");
  const h=host(page);
  await expect(h.locator("#fb-chapter-status")).toContainText("NO CAMPAIGN PROGRESS");
  await expect(h.locator("#fb-level-title")).toHaveText("Your own fraction balance");
  await expect(h.locator("#fb-review")).toBeHidden();
  await divide(page,2);await h.locator("#fb-apply").click();await ready(page);
  await expect(root(page)).toHaveAttribute("data-solved","true");
  await expect(h.locator("#right-items")).toHaveAttribute("aria-label","East chamber: 0 sprites, 5/2 weights");
  await expect(h.locator("#fb-rating")).toContainText("no stars awarded");
  await expect(h.locator("#fb-comic-page math mfrac")).toHaveText("52");
  await h.locator("#fb-next-level").click();
  await expect(page.locator("#site-workshop")).toBeVisible();
  await expect(page.locator("#workshop-equation")).toHaveValue("2x = 5");
  await expect(page.locator("#workshop-quantity-mode")).toHaveValue("fractions");
  expect(await saves(page)).toEqual(before);expect(errors).toEqual([]);
});
test("Independent custom equation requires a fresh equivalent second operation and has no saved credit",async({page})=>{
  await open(page);const before=await saves(page);
  await build(page,"x + 1/2 = 3","manual");
  const h=host(page);
  await amount(page,1,2);await h.locator("#left-action").click();await ready(page);
  await expect(root(page)).toHaveAttribute("data-pending","left");
  await expect(h.locator("#right-action")).toBeDisabled();
  await amount(page,2,4);await h.locator("#right-action").click();await ready(page);
  await expect(root(page)).toHaveAttribute("data-solved","true");
  await expect(h.locator("#fb-rating")).toContainText("1 checked move");
  await h.locator("#fb-game-levels").click();
  await expect(page.locator("#site-workshop")).toBeVisible();
  await expect(page.locator("#workshop-hand-mode")).toHaveValue("manual");
  expect(await saves(page)).toEqual(before);
});
test("Apprentice custom equation is paper-first and verified physical playback remains free play",async({page})=>{
  test.setTimeout(60000);
  await open(page);const before=await saves(page);
  await build(page,"x/2 = 7/4","notebook");
  const h=host(page);
  await expect(root(page)).toHaveAttribute("data-notebook-phase","paper");
  await expect(h.locator("#scene")).toBeHidden();
  await h.locator('[data-nb-sign="×"]').click();await h.locator("#fb-nb-num").fill("2");
  await h.locator("#fb-nb-preview").click();await h.locator("#fb-nb-confirm").click();
  await expect(h.locator("#fb-nb-watch")).toBeVisible();expect(await saves(page)).toEqual(before);
  await h.locator("#fb-nb-watch").click();
  await expect(root(page)).toHaveAttribute("data-notebook-phase","replay",{timeout:45000});
  await expect(root(page)).toHaveAttribute("data-notebook-playing","false");
  await expect(h.locator("#right-items")).toHaveAttribute("aria-label","East chamber: 0 sprites, 7/2 weights");
  await expect(h.locator("#fb-rating")).toContainText("no stars awarded");
  await h.locator("#fb-next-level").click();
  await expect(page.locator("#site-workshop")).toBeVisible();
  await expect(page.locator("#workshop-hand-mode")).toHaveValue("notebook");
  expect(await saves(page)).toEqual(before);
});
test("unsupported custom inputs do not create scenes; fraction deep link and phone layout work",async({page})=>{
  await open(page);
  for(const [equation,message] of [["x+1/7=2","reduced denominators"],["7x=21","no route was found"],["5x=1/3","solution needs a denominator"],["x=5/2","already isolates one sprite"]]){
    await build(page,equation);
    await expect(page.locator("#site-workshop")).toBeVisible();
    await expect(page.locator("#workshop-feedback")).toContainText(message);
    await expect(page.locator("#workshop-equation")).toHaveAttribute("aria-invalid","true");
    await expect(host(page)).toHaveCount(0);
  }
  await page.setViewportSize({width:360,height:640});
  await page.goto("/?workshop=2x%3D5&workshopWorld=fractions&workshopMode=notebook");
  await expect(page.locator("#workshop-quantity-mode")).toHaveValue("fractions");
  await expect(page.locator("#workshop-hand-mode")).toHaveValue("notebook");
  await expect(page.locator("#workshop-equation")).toHaveValue("2x=5");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.locator("#workshop-create").click();
  await expect(root(page)).toHaveAttribute("data-notebook-phase","paper");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
