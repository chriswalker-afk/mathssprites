import {test,expect} from "@playwright/test";
import {openCampaignBoard,playCampaignLevel} from "./campaign-menu-helper.mjs";
import {assertGrounded} from "./scene-grounding-helper.mjs";
const sizes=[
  {width:1920,height:1080},{width:1652,height:834},{width:1366,height:768},
  {width:1280,height:720},{width:1092,height:540},{width:1024,height:720},
  {width:844,height:390},{width:390,height:844}
];
const lab=(page,world)=>world==="fractions"?page.locator("#fraction-game-host #fraction-lab"):page.locator("#game-shell");
const saves=page=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>key.startsWith("mathssprites."))));
async function start(page){
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.addInitScript(()=>localStorage.setItem("mathssprites.motion-preference.v1","reduced"));
  await page.setViewportSize({width:1280,height:720});await page.goto("/");
}
async function enter(page,world,method,number){
  await openCampaignBoard(page,world,method);
  await playCampaignLevel(page,page.locator('[data-level="'+number+'"]'));
  const root=lab(page,world);
  await expect(root.locator("#scene")).toBeVisible();
  if(world==="fractions")await expect(root).toHaveAttribute("data-busy","false");
  else if(await page.locator("#guide-skip").isVisible())await page.locator("#guide-skip").click();
  return root;
}
async function inventory(root){
  return root.locator("#scene").evaluate(el=>["left","right"].map(side=>{
    const n=el.querySelector("#"+side+"-items");return [n.dataset.signature||"",n.getAttribute("aria-label")];
  }));
}
for(const [world,guided] of [["workshop",8],["opposites",5],["fractions",6],["squares",1]]){
  for(const method of ["guided","independent"]){
    test(world+" "+method+" stays grounded across eight viewports @smoke",async({page},info)=>{
      test.setTimeout(90000);
      await start(page);const root=await enter(page,world,method,method==="guided"?guided:1);
      const scene=root.locator("#scene"),before=await inventory(root),saved=await saves(page);
      for(const size of sizes){
        await page.setViewportSize(size);
        await assertGrounded(scene);
        expect(await inventory(root)).toEqual(before);
        expect(await saves(page)).toEqual(saved);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3)).toBe(true);
        if(method==="guided"){
          await scene.scrollIntoViewIfNeeded();
          if([1920,1366,1092,390].includes(size.width))
            await info.attach(world+"-"+size.width+"x"+size.height+".png",{body:await page.screenshot(),contentType:"image/png"});
        }
        const action=method==="independent"?root.locator("#left-action"):
          root.locator(world==="fractions"?"#fb-apply":"#do-both");
        await expect(action).toBeVisible();
        await action.scrollIntoViewIfNeeded();await expect(action).toBeInViewport();
      }
    });
  }
}
test("a real independent move stays attached to the floor while tilted and resized @quick @smoke",async({page})=>{
  await start(page);const root=await enter(page,"workshop","independent",1);
  const scene=root.locator("#scene");
  await page.locator('[data-operation="remove"]').click();
  await page.locator('[data-kind="posOne"]').click();
  await page.locator("#amount-up").click();await page.locator("#amount-up").click();
  await page.locator("#left-action").click();
  await expect(page.locator("#balance-caption")).toContainText("waiting for its matching move",{timeout:25000});
  await expect(page.locator("#reset")).toBeEnabled({timeout:25000});
  const before=await inventory(root),saved=await saves(page);
  for(const size of [{width:1092,height:540},{width:1920,height:1080},{width:1366,height:768}]){
    await page.setViewportSize(size);
    const m=await assertGrounded(scene,{settled:false});
    expect(m.angle).not.toBe("rotate(0deg)");
    expect(await inventory(root)).toEqual(before);expect(await saves(page)).toEqual(saved);
  }
  // Match the actual operation in the opposite chamber after resizing.
  if(await page.locator("#right-action").isDisabled()){
    await page.locator('[data-operation="remove"]').click();
    await page.locator('[data-kind="posOne"]').click();
    const amount=page.locator("#amount-value");
    if((await amount.textContent()).trim()==="—"){await page.locator("#amount-up").click();await page.locator("#amount-up").click();}
  }
  await page.locator("#right-action").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:30000});
  await assertGrounded(scene);
});
test("fraction independent pending move survives a resize and a matching hand visit @smoke",async({page})=>{
  await start(page);const root=await enter(page,"fractions","independent",5);
  const scene=root.locator("#scene");
  async function choose(){
    await root.locator('[data-fb-op="remove"]').click();
    await root.locator('[data-fb-kind="posOne"]').click();
    await root.locator("#fb-whole").selectOption("0");
    await root.locator("#fb-denominator").selectOption("4");
    await root.locator("#fb-numerator").selectOption("3");
  }
  await choose();await root.locator("#right-action").click();
  await expect(root).toHaveAttribute("data-busy","false",{timeout:25000});
  await expect(root).toHaveAttribute("data-pending","right");
  const before=await inventory(root),saved=await saves(page);
  for(const size of [{width:1092,height:540},{width:1652,height:834}]){
    await page.setViewportSize(size);await assertGrounded(scene,{settled:false});
    expect(await inventory(root)).toEqual(before);expect(await saves(page)).toEqual(saved);
    await expect(root).toHaveAttribute("data-pending","right");
  }
  await choose();await root.locator("#left-action").click();
  await expect(root).toHaveAttribute("data-busy","false",{timeout:25000});
  await expect(root).toHaveAttribute("data-solved","true");
  await expect(scene).toHaveAttribute("data-balance","level");
  await assertGrounded(scene);
});
for(const [quantity,equation] of [["positive","x + 3 = 8"],["fractions","(2/3)x = 4"]]){
  test("Equation Workshop "+quantity+" uses the same grounded apparatus @smoke",async({page})=>{
    await start(page);
    await page.locator('#site-home [data-screen="workshop"]').click();
    await page.locator("#workshop-quantity-mode").selectOption(quantity);
    await page.locator("#workshop-equation").fill(equation);
    await page.locator("#workshop-create").click();
    const root=lab(page,quantity==="fractions"?"fractions":"workshop");
    const scene=root.locator("#scene");
    const saved=await saves(page);
    for(const size of [{width:1092,height:540},{width:1652,height:834},{width:390,height:844}]){
      await page.setViewportSize(size);await assertGrounded(scene);expect(await saves(page)).toEqual(saved);
    }
  });
}
