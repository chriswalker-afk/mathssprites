import {test,expect} from "@playwright/test";

const hero=page=>page.locator("#home-hero-art");
const counts=page=>page.evaluate(()=>({
 leftSprites:document.querySelectorAll("#hero-left-items .hero-creature").length,
 leftWeights:document.querySelectorAll("#hero-left-items .hero-weight").length,
 rightSprites:document.querySelectorAll("#hero-right-items .hero-creature").length,
 rightWeights:document.querySelectorAll("#hero-right-items .hero-weight").length
}));
test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});

test("home leads with the exact question and a functional animation control",async({page})=>{
  await expect(page.getByRole("heading",{name:"How much does the sprite weigh?"})).toBeVisible();
  await expect(page.locator("#site-home")).toBeVisible();
  await expect(page.locator("#game-shell")).toBeHidden();
  await expect(hero(page)).toHaveAttribute("data-playback","playing");
  await expect(page.locator("#hero-playback")).toHaveText("Pause animation");
  await expect(page.locator("#hero-playback")).toBeVisible();
  await expect(page.locator("#home-play")).toBeVisible();
  await expect(page.getByRole("button",{name:"Choose a world"})).toBeVisible();
  await expect(page.locator(".portal-feature")).toHaveCount(3);
});

test("physical beam lowers the heavier pan and settles level",async({page})=>{
  await expect(hero(page)).toHaveAttribute("data-balance","left-heavy",{timeout:4500});
  await page.waitForFunction(()=>parseFloat(getComputedStyle(
    document.querySelector(".hero-illustration")).getPropertyValue("--hero-angle"))<-.5);
  const leftHeavy=await page.evaluate(()=>{
    const left=document.querySelector(".hero-hanger-left .hero-pan").getBoundingClientRect();
    const right=document.querySelector(".hero-hanger-right .hero-pan").getBoundingClientRect();
    return {leftY:left.y,rightY:right.y,angle:getComputedStyle(
      document.querySelector(".hero-illustration")).getPropertyValue("--hero-angle")};
  });
  expect(leftHeavy.leftY).toBeGreaterThan(leftHeavy.rightY);
  await expect(hero(page)).toHaveAttribute("data-balance","level",{timeout:6000});
  await expect(hero(page)).toHaveAttribute("data-phase","hold",{timeout:5000});
  expect(await counts(page)).toEqual({leftSprites:1,leftWeights:0,rightSprites:0,rightWeights:3});
});

test("four animated scenes stay mathematically consistent, continuing A into B and looping",async({page})=>{
  test.setTimeout(46000);
  const wanted=[
    ["mystery",{leftSprites:1,leftWeights:0,rightSprites:0,rightWeights:3}],
    ["add-equally",{leftSprites:1,leftWeights:2,rightSprites:0,rightWeights:5}],
    ["two-sprites",{leftSprites:2,leftWeights:0,rightSprites:0,rightWeights:6}],
    ["both-sides",{leftSprites:2,leftWeights:1,rightSprites:1,rightWeights:4}]
  ];
  for(const [name,expected] of wanted){
    await expect(hero(page)).toHaveAttribute("data-scene",name,{timeout:13000});
    await expect(hero(page)).toHaveAttribute("data-phase","hold",{timeout:13000});
    await expect(hero(page)).toHaveAttribute("data-balance","level");
    expect(await counts(page)).toEqual(expected);
    const mass=await hero(page).evaluate(el=>[el.dataset.leftMass,el.dataset.rightMass]);
    expect(mass[0]).toBe(mass[1]);
  }
  await expect(hero(page)).toHaveAttribute("data-scene","mystery",{timeout:6500});
});

test("pause freezes the current scene and resume continues without duplicating animation loops",async({page})=>{
  await expect(hero(page)).toHaveAttribute("data-balance","left-heavy",{timeout:4500});
  await page.locator("#hero-playback").click();
  await expect(hero(page)).toHaveAttribute("data-playback","paused");
  await expect(page.locator("#hero-playback")).toHaveText("Play animation");
  const frozen=await page.evaluate(()=>({
    scene:document.querySelector("#home-hero-art").dataset.scene,
    phase:document.querySelector("#home-hero-art").dataset.phase,
    left:document.querySelector("#hero-left-items").innerHTML,
    right:document.querySelector("#hero-right-items").innerHTML,
    angle:getComputedStyle(document.querySelector(".hero-illustration"))
      .getPropertyValue("--hero-angle")
  }));
  await page.waitForTimeout(750);
  const still=await page.evaluate(()=>({
    scene:document.querySelector("#home-hero-art").dataset.scene,
    phase:document.querySelector("#home-hero-art").dataset.phase,
    left:document.querySelector("#hero-left-items").innerHTML,
    right:document.querySelector("#hero-right-items").innerHTML,
    angle:getComputedStyle(document.querySelector(".hero-illustration"))
      .getPropertyValue("--hero-angle")
  }));
  expect(still).toEqual(frozen);
  await page.locator("#hero-playback").click();
  await expect(hero(page)).toHaveAttribute("data-playback","playing");
  await expect(hero(page)).toHaveAttribute("data-phase","hold",{timeout:5500});
  expect(await counts(page)).toEqual({leftSprites:1,leftWeights:0,rightSprites:0,rightWeights:3});
});

test("settings and OS reduced-motion modes present a stationary accessible illustration",async({page})=>{
  await page.locator('[data-screen="settings"]').first().click();
  await page.locator("#site-motion").click();
  await page.locator('[data-screen="home"]').first().click();
  await expect(hero(page)).toHaveAttribute("data-playback","reduced");
  await expect(hero(page)).toHaveAttribute("data-scene","still");
  await expect(page.locator("#hero-playback")).toBeHidden();
  expect(await counts(page)).toEqual({leftSprites:1,leftWeights:0,rightSprites:0,rightWeights:3});
  await page.reload();
  await expect(hero(page)).toHaveAttribute("data-playback","reduced");
  await page.locator('[data-screen="settings"]').first().click();
  await page.locator("#site-motion").click();
  await page.locator('[data-screen="home"]').first().click();
  await expect(hero(page)).toHaveAttribute("data-playback","playing");
  await page.emulateMedia({reducedMotion:"reduce"});
  await expect(hero(page)).toHaveAttribute("data-playback","reduced");
  await expect(hero(page)).toHaveAttribute("data-scene","still");
  await page.emulateMedia({reducedMotion:"no-preference"});
  await expect(hero(page)).toHaveAttribute("data-playback","playing");
});

test("navigation stops the loop and preserves home continuation/progress",async({page})=>{
  const before=await page.evaluate(()=>Object.fromEntries([
    "mathssprites.progress.v1",
    "mathssprites.independent-progress.v1",
    "mathssprites.apprentice-progress.v1"
  ].map(key=>[key,localStorage.getItem(key)])));
  await page.locator('[data-screen="worlds"]').first().click();
  await expect(hero(page)).toHaveAttribute("data-playback","inactive");
  const state=await hero(page).getAttribute("data-scene");
  await page.waitForTimeout(650);
  expect(await hero(page).getAttribute("data-scene")).toBe(state);
  await page.locator('[data-screen="home"]').first().click();
  await expect(hero(page)).toHaveAttribute("data-playback","playing");
  const after=await page.evaluate(()=>Object.fromEntries([
    "mathssprites.progress.v1",
    "mathssprites.independent-progress.v1",
    "mathssprites.apprentice-progress.v1"
  ].map(key=>[key,localStorage.getItem(key)])));
  expect(after).toEqual(before);
  await page.locator("#home-play").click();
  await expect(page.locator("#game-shell")).toBeVisible();
  await expect(hero(page)).toHaveAttribute("data-playback","inactive");
});

test("desktop tablet and phone layouts keep the heading, both pans and playback control in view",async({page},testInfo)=>{
  for(const width of [375,768,1440]){
    await page.setViewportSize({width,height:900});
    await expect(page.locator("#home-title")).toBeVisible();
    const measures=await page.evaluate(()=>{
      const keys=["#home-title","#hero-left-items","#hero-right-items","#hero-playback","#home-play"];
      const rects=keys.map(selector=>{
        const box=document.querySelector(selector).getBoundingClientRect();
        return {selector,left:box.left,right:box.right,width:box.width};
      });
      return {scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth,rects};
    });
    expect(measures.scrollWidth).toBeLessThanOrEqual(width+1);
    for(const box of measures.rects){
      expect(box.left,box.selector).toBeGreaterThanOrEqual(-1);
      expect(box.right,box.selector).toBeLessThanOrEqual(width+1);
    }
    await testInfo.attach("home-hero-"+width+".png",{
      body:await page.screenshot({fullPage:true}),
      contentType:"image/png"
    });
  }
});
