import {test,expect} from "@playwright/test";
const key="mathssprites.cosmetics.v1";
const copper=/rgb\(242, 185, 142\)/;
async function seed(page){
  await page.addInitScript(key=>{
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:1,unlockedRewards:["copper","extra-fluffy"],equipped:{"weight-material":"copper",fur:"extra-fluffy"}}));
    localStorage.setItem("mathssprites.motion-preference.v1","reduced");
  },key);
}
async function custom(page,eq,world){
  await page.goto("/?workshop="+encodeURIComponent(eq)+"&workshopWorld="+world+"&workshopMode=auto");
  await page.locator("#workshop-create").click();
}
test("equipped finish follows native weights, signed cancellation, fractional cuts and square weights @quick @smoke",async({page},testInfo)=>{
  test.setTimeout(65000);await seed(page);await page.goto("/");
  await expect(page.locator("body")).toHaveAttribute("data-weight-material","copper");
  await expect(page.locator("#hero-right-items .hero-weight").first()).toHaveCSS("background-image",copper);
  const before=await page.evaluate(key=>localStorage.getItem(key),key);
  await custom(page,"x+5=10","positive");
  await expect(page.locator("#left-items .weight")).toHaveCount(5);
  await expect(page.locator("#right-items .weight")).toHaveCount(10);
  await expect(page.locator("#left-items .weight").first()).toHaveCSS("background-image",copper);
  await expect(page.locator("#left-items .weight[data-weight-slot='4']")).toHaveCount(1);
  await custom(page,"x+5-3=7","signed");
  await expect(page.locator("#left-items .weight")).toHaveCount(5);
  await expect(page.locator("#left-items .balloon")).toHaveCount(3);
  await page.locator('[data-pair-side="left"][data-pair-type="constants"]').click();
  await expect(page.locator("#left-items .balloon")).toHaveCount(0,{timeout:20000});
  await expect(page.locator("#left-items .weight")).toHaveCount(2);
  await expect(page.locator("#left-items .weight").first()).toHaveCSS("background-image",copper);
  await custom(page,"x+2/3=4+2/3","fractions");
  const root=page.locator("#fraction-game-host #fraction-lab");
  await expect(root).toHaveAttribute("data-weight-material","copper");
  await expect(root.locator("#left-items .fw-label")).toHaveText("2/3");
  await expect(root.locator("#left-items .fw-piece")).toHaveCount(2);
  await expect(root.locator("#left-items .fw-material-light")).toHaveCSS("stop-color","rgb(242, 185, 142)");
  await expect(root.locator("#right-items .fw-pile-weight")).toHaveCount(4);
  await root.locator('[data-fb-op="remove"]').click();
  await root.locator('[data-fb-kind="posOne"]').click();
  await root.locator("#fb-whole").selectOption("0");
  await root.locator("#fb-denominator").selectOption("3");
  await root.locator("#fb-numerator").selectOption("2");
  await root.locator("#fb-apply").click();
  await expect(root).toHaveAttribute("data-solved","true",{timeout:25000});
  await expect(root.locator("#right-items .fw-pile-weight")).toHaveCount(4);
  await expect(root.locator("#right-items .fw-material-light").first()).toHaveCSS("stop-color","rgb(242, 185, 142)");
  await testInfo.attach("copper-fraction.png",{body:await page.screenshot(),contentType:"image/png"});
  await custom(page,"x²=25","squares");
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(25);
  await expect(page.locator("#right-items .weight").first()).toHaveCSS("background-image",copper);
  expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(before);
});
