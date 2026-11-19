import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});
async function openBuilder(page){
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await expect(page.locator("#world1-workshop")).toContainText("FREE PLAY");
  await page.getByRole("button",{name:"Create your own equation"}).click();
  await expect(page.locator("#site-workshop")).toBeVisible();
}
async function build(page,text,mode="auto"){
  await page.locator("#workshop-equation").fill(text);
  await page.locator("#workshop-hand-mode").selectOption(mode);
  await page.locator("#workshop-create").click();
}
async function saved(page){
  return page.evaluate(()=>Object.fromEntries([
    "mathssprites.progress.v1",
    "mathssprites.independent-progress.v1",
    "mathssprites.apprentice-progress.v1"
  ].map(key=>[key,localStorage.getItem(key)])));
}

test("free-play builder opens for new students without campaign unlock or teacher access",async({page})=>{
  await openBuilder(page);
  await expect(page.locator("#workshop-hand-mode")).toHaveValue("auto");
  await expect(page.locator("#workshop-feedback")).toContainText("campaign progress will not change");
  await expect(page.locator("#site-workshop")).toContainText("48 objects");
  await page.locator('[data-workshop-example="3x + 5 = 20"]').click();
  await expect(page.locator("#workshop-equation")).toHaveValue("3x + 5 = 20");
  await expect(page.locator("#site-workshop")).toBeVisible();
  await expect(page.locator('[data-stage="notebook"] button')).toHaveCount(1);
});

test("validated user equation becomes real rooms; guided hand solves and comic returns to builder",async({page})=>{
  test.setTimeout(70000);
  await page.evaluate(()=>{
    localStorage.setItem("mathssprites.progress.v1",
      JSON.stringify({completed:[1,2],lastPlayed:3}));
  });
  await page.reload();
  await openBuilder(page);
  const before=await saved(page);
  await build(page,"x+3=8");
  await expect(page.locator("#game-shell")).toBeVisible();
  await expect(page.locator("#level-title")).toContainText("x + 3 = 8");
  await expect(page.locator("#chapter-status")).toContainText("NO CAMPAIGN PROGRESS");
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(3);
  await expect(page.locator("#right-items .weight")).toHaveCount(8);
  await expect(page.locator("#do-both")).toBeVisible();
  await expect(page.locator("#mode-select")).toHaveValue("auto");
  await expect(page.locator('[data-operation="square"]')).toBeHidden();
  await expect(page.locator('[data-kind="negX"]')).toBeHidden();
  await expect(page.locator('[data-kind="posX2"]')).toBeHidden();
  await page.locator("#motion-toggle").click();
  await page.locator("#amount-up").click();
  await page.locator("#amount-up").click();
  await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:28000});
  await expect(page.locator("#replay-level-stamp")).toContainText("FREE PLAY");
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("x = 5");
  await expect(page.locator("#next-level")).toContainText("Build another equation");
  await page.locator("#next-level").click();
  await expect(page.locator("#site-workshop")).toBeVisible();
  await expect(page.locator("#workshop-equation")).toHaveValue("x+3=8");
  expect(await saved(page)).toEqual(before);
});

test("manual hand mode requires two separate room visits and keeps its own controls",async({page})=>{
  test.setTimeout(70000);
  await openBuilder(page);
  const before=await saved(page);
  await build(page,"x + 2 = 7","manual");
  await expect(page.locator("#mode-select")).toHaveValue("manual");
  await expect(page.locator("#do-both")).toBeHidden();
  await expect(page.locator("#left-action")).toBeVisible();
  await expect(page.locator("#right-action")).toBeVisible();
  await page.locator("#motion-toggle").click();
  await page.locator("#amount-up").click();
  await page.locator("#left-action").click();
  await expect(page.locator("#balance-caption")).toHaveClass(/unbalanced/);
  await expect(page.locator("#right-action")).toContainText("Match the move here");
  await page.locator("#right-action").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:28000});
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("x = 5");
  await page.locator("#replay-close").click();
  await expect(page.locator("#game-levels")).toContainText("Equation Workshop");
  await page.locator("#game-levels").click();
  await expect(page.locator("#site-workshop")).toBeVisible();
  expect(await saved(page)).toEqual(before);
});

test("unsupported equations show specific feedback and NEVER create a room",async({page})=>{
  await openBuilder(page);
  for(const [value,message] of [
    ["x=x","no single mystery"],
    ["2x=2x+1","cannot balance"],
    ["2x=5","fractional value"],
    ["x+5=3","negative sprite"],
    ["x=5","already leaves one sprite"],
    ["7x=21","current hand cannot reach"],
    ["x+99=100","48-object limit"],
    ["x²=9","whole sprites"]
  ]){
    await build(page,value);
    await expect(page.locator("#site-workshop")).toBeVisible();
    await expect(page.locator("#workshop-feedback")).toContainText(message);
    await expect(page.locator("#workshop-equation")).toHaveAttribute("aria-invalid","true");
    await expect(page.locator("#game-shell")).toBeHidden();
  }
});

test("free-play hand mode may be changed; reset restores the custom equation and mode",async({page})=>{
  await openBuilder(page);
  await build(page,"2x+3=x+7","auto");
  await expect(page.locator("#mode-select")).toHaveValue("auto");
  await page.locator("#mode-select").selectOption("manual");
  await expect(page.locator("#do-both")).toBeHidden();
  await expect(page.locator("#left-action")).toBeVisible();
  await page.locator("#motion-toggle").click();
  await page.locator('[data-kind="posX"]').click();
  await page.locator("#left-action").click();
  await expect(page.locator("#balance-caption")).toHaveClass(/unbalanced/);
  await page.locator("#reset").click();
  await expect(page.locator("#mode-select")).toHaveValue("manual");
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(2);
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-action")).toContainText("Use hand here");
  await page.locator("#mode-select").selectOption("auto");
  await expect(page.locator("#do-both")).toBeVisible();
  await page.locator("#game-home").click();
  await expect(page.locator("#site-home")).toBeVisible();
});

test("custom equation builder is accessible on a narrow phone and from a deep link",async({page})=>{
  await page.setViewportSize({width:375,height:740});
  await page.goto("/?workshop=3x%2B5%3D20");
  await expect(page.locator("#site-workshop")).toBeVisible();
  await expect(page.locator("#workshop-equation")).toHaveValue("3x+5=20");
  for(const selector of ["#workshop-equation","#workshop-hand-mode","#workshop-create"]){
    const rect=await page.locator(selector).boundingBox();
    expect(rect).not.toBeNull();
    expect(rect.x).toBeGreaterThanOrEqual(-1);
    expect(rect.x+rect.width).toBeLessThanOrEqual(377);
  }
  await page.locator("#workshop-equation").press("Enter");
  await expect(page.locator("#game-shell")).toBeVisible();
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(3);
  await expect(page.locator("#left-items .weight")).toHaveCount(5);
  await expect(page.locator("#right-items .weight")).toHaveCount(20);
});
