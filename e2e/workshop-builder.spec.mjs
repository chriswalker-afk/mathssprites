import {test,expect} from "@playwright/test";
import {openCampaignBoard} from "./campaign-menu-helper.mjs";
const modes=[
  ["positive","3x+5=20","posX",3,"posOne",20],
  ["signed","2x−3=x+4","negOne",3,"posOne",4],
  ["fractions","(2/3)x+1/2=4","posX",0,"posOne",4],
  ["squares","x²+4x=21","posX2",1,"posOne",21]
];
const save=page=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>/campaign|progress|resume|rating|cosmetic/.test(key))));
const root=page=>page.locator("#site-workshop");
const choice=(page,mode)=>root(page).locator('[data-workshop-choice="'+mode+'"]');
const method=(page,mode)=>root(page).locator('[data-workshop-method="'+mode+'"]');
async function start(page){
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/?workshop=");
  await expect(root(page)).toBeVisible();
}
test("world and method cards stay synchronized with native controls and live chamber objects @quick @smoke",async({page})=>{
  await page.setViewportSize({width:1366,height:768});await start(page);
  const before=await save(page);
  await expect(root(page).locator(".workshop-preview-board")).toHaveAttribute("data-preview-state","example");
  for(const [mode,equation,leftKind,leftCount,rightKind,rightCount] of modes){
    await choice(page,mode).click();
    await expect(choice(page,mode)).toHaveAttribute("aria-pressed","true");
    await expect(page.locator("#workshop-quantity-mode")).toHaveValue(mode);
    await page.locator("#workshop-equation").fill(equation);
    await expect(root(page).locator(".workshop-preview-board")).toHaveAttribute("data-preview-state","draft");
    await expect(page.locator('#workshop-west-inventory [data-kind="'+leftKind+'"]')).toHaveAttribute("data-whole",String(leftCount));
    await expect(page.locator('#workshop-east-inventory [data-kind="'+rightKind+'"]')).toHaveAttribute("data-whole",String(rightCount));
    if(mode==="fractions"){
      await expect(page.locator('#workshop-west-inventory [data-numerator="2"][data-denominator="3"]')).toBeVisible();
      await expect(page.locator('#workshop-west-inventory [data-numerator="1"][data-denominator="2"]')).toBeVisible();
    }
    await method(page,"manual").click();
    await expect(page.locator("#workshop-hand-mode")).toHaveValue("manual");
    await expect(method(page,"manual")).toHaveAttribute("aria-pressed","true");
    await page.locator("#workshop-hand-mode").selectOption("auto");
    await expect(method(page,"auto")).toHaveAttribute("aria-pressed","true");
    if(mode!=="positive"){
      await method(page,"notebook").click();
      await expect(page.locator("#workshop-hand-mode")).toHaveValue("notebook");
    }
  }
  await choice(page,"positive").click();
  await expect(method(page,"notebook")).toBeHidden();
  await expect(method(page,"auto")).toHaveAttribute("aria-pressed","true");
  await page.locator("#workshop-equation").fill("x+");
  await expect(root(page).locator(".workshop-preview-board")).toHaveAttribute("data-preview-state","incomplete");
  await expect(page.locator("#workshop-west-inventory .workshop-object-group")).toHaveCount(0);
  await page.locator("#workshop-quantity-mode").selectOption("signed");
  await expect(choice(page,"signed")).toHaveAttribute("aria-pressed","true");
  await page.locator('[data-workshop-example="x − 3 = 5"]').click();
  await expect(page.locator("#workshop-west-example")).toContainText("3 balloons");
  expect(await save(page)).toEqual(before);
});
for(const size of [{width:1240,height:488},{width:1092,height:540},{width:1366,height:768},{width:390,height:844},{width:844,height:390}]){
  test("Workshop build action remains accessible at "+size.width+"x"+size.height+" @smoke",async({page},info)=>{
    await page.setViewportSize(size);
    await page.goto("/?workshop=x%5E2%2B4x%3D21&workshopWorld=squares&workshopMode=notebook");
    await expect(root(page)).toBeVisible();
    await expect(choice(page,"squares")).toHaveAttribute("aria-pressed","true");
    await expect(method(page,"notebook")).toHaveAttribute("aria-pressed","true");
    const build=page.locator("#workshop-create");
    if(size.width>=900&&size.height>=420)await expect(build).toBeInViewport({ratio:1});
    else {await build.scrollIntoViewIfNeeded();await expect(build).toBeInViewport();}
    await expect(page.locator("#workshop-square-goal")).toBeVisible();
    // The most crowded variant: fourth world, extended rules, invalid input.
    await root(page).locator(".workshop-rules summary").click();
    if(size.width>=900&&size.height>=420)await expect(build).toBeInViewport({ratio:1});
    await page.locator("#workshop-equation").fill("x=x");
    await build.click();
    await expect(page.locator("#workshop-feedback")).toHaveAttribute("data-status","error");
    await expect(root(page)).toBeVisible();
    await expect(page.locator("#game-shell")).toBeHidden();
    if(size.width>=900&&size.height>=420){
      await expect(build).toBeInViewport({ratio:1});
      const clipping=await root(page).evaluate(el=>{
        const footer=el.querySelector(".workshop-launch-bar").getBoundingClientRect();
        const card=el.querySelector(".workshop-form-card").getBoundingClientRect();
        return footer.top>=card.bottom-2&&footer.bottom<=innerHeight+1;
      });
      expect(clipping).toBe(true);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3)).toBe(true);
    await page.locator("#workshop-equation").fill("x²+4x=21");
    await root(page).locator(".workshop-rules summary").click();
    await build.scrollIntoViewIfNeeded();
    await info.attach("workshop-"+size.width+"x"+size.height+".png",{body:await page.screenshot(),contentType:"image/png"});
    await method(page,"auto").click();
    await build.click();
    await expect(page.locator("#game-shell")).toBeVisible();
    await expect(page.locator("#level-title")).toContainText("x² + 4x = 21");
  });
}
test("coming from a level board and returning from free play preserves navigation and draft @smoke",async({page})=>{
  await page.setViewportSize({width:1092,height:540});await page.goto("/");
  await openCampaignBoard(page,"opposites","independent");
  await page.locator('#site-levels [data-screen="workshop"]').click();
  await expect(choice(page,"signed")).toHaveAttribute("aria-pressed","true");
  await page.locator("#workshop-equation").fill("x−3=5");
  await method(page,"manual").click();
  await page.locator("#workshop-create").click();
  await expect(page.locator("#game-shell")).toBeVisible();
  await page.locator("#game-levels").click();
  await expect(root(page)).toBeVisible();
  await expect(page.locator("#workshop-equation")).toHaveValue("x−3=5");
  await expect(method(page,"manual")).toHaveAttribute("aria-pressed","true");
  await page.locator("#workshop-back").click();
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-world","opposites");
  await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage","independent");
});
