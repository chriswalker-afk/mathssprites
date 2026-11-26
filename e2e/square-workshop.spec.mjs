import {openCampaignBoard,chooseCampaignWorld} from "./campaign-menu-helper.mjs";
import {test,expect} from "@playwright/test";
const saves=p=>p.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
const tile=(p,n)=>p.locator('.level-tile[data-level-id="square-g-'+String(n).padStart(2,"0")+'"]');
async function open(p,{fromBoard=true}={}){
  await p.emulateMedia({reducedMotion:"reduce"});
  await p.addInitScript(()=>localStorage.setItem("mathssprites.motion-preference.v1","reduced"));
  await p.goto("/");
  await openCampaignBoard(p);
  if(fromBoard)await chooseCampaignWorld(p,"squares");
  await p.locator('#site-levels [data-screen="workshop"]').click();
  await expect(p.locator("#site-workshop")).toBeVisible();
}
async function build(p,text,mode="auto",goal="isolate"){
  await p.locator("#workshop-quantity-mode").selectOption("squares");
  await p.locator("#workshop-square-goal").selectOption(goal);
  await p.locator("#workshop-equation").fill(text);
  await p.locator("#workshop-hand-mode").selectOption(mode);
  await p.locator("#workshop-create").click();
}
async function choose(p,op,kind,count){
  await p.locator('.operation-picker [data-operation="'+op+'"]').click();
  if(kind)await p.locator('#object-picker [data-kind="'+kind+'"]').click();
  if(count!==undefined)for(let i=0;i<count;i++)await p.locator("#amount-up").click();
}
async function visit(p,side,op,kind,count){
  await choose(p,op,kind,count);
  await p.locator("#"+side+"-action").click();
  await expect(p.locator("#reset")).toBeEnabled({timeout:25000});
}
async function paper(p,command,result){
  await p.locator("#notebook-operation").fill(command);
  await expect(p.locator("#notebook-result-math")).toHaveAttribute("aria-label",result);
  await p.locator("#notebook-apply").click();
}
test("Square Workshop is available directly from World 4 with two distinct goals and scoped modes @quick @smoke",async({page})=>{
  await open(page);
  await expect(page.locator("#workshop-quantity-mode")).toHaveValue("squares");
  await expect(page.locator("#workshop-goal-field")).toBeVisible();
  await expect(page.locator('#workshop-hand-mode option[value="notebook"]')).toBeEnabled();
  await page.locator('[data-workshop-example="x² + 4x = 21"]').click();
  await expect(page.locator("#workshop-equation")).toHaveValue("x² + 4x = 21");
  await page.locator("#workshop-square-goal").selectOption("area");
  await expect(page.locator('[data-workshop-example="x + 1 = 4"]')).toBeVisible();
  await page.locator("#workshop-hand-mode").selectOption("notebook");
  await page.locator("#workshop-quantity-mode").selectOption("positive");
  await expect(page.locator("#workshop-goal-field")).toBeHidden();
  await expect(page.locator("#workshop-hand-mode")).toHaveValue("auto");
  await expect(page.locator('#workshop-hand-mode option[value="notebook"]')).toBeDisabled();
  await page.locator("#workshop-quantity-mode").selectOption("fractions");
  await expect(page.locator("#workshop-goal-field")).toBeHidden();
  await expect(page.locator('#workshop-hand-mode option[value="notebook"]')).toBeEnabled();
});
test("guided custom quadratic can use the read-only inspection and solve with an actual principal root",async({page})=>{
  test.setTimeout(75000);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await open(page);const before=await saves(page);
  await build(page,"x²+4x=21");
  await expect(page.locator("#chapter-status")).toContainText("NO CAMPAIGN PROGRESS");
  await expect(page.locator("#square-inspect-toggle")).toBeVisible();
  await page.locator("#square-inspect-toggle").click();
  await expect(page.locator("#left-inspection .inspection-corner-gap")).toHaveCount(4);
  await page.locator("#square-inspect-close").click();
  for(const [op,kind,count] of [["add","posOne",4],["sqrt"],["remove","posOne",2]]){
    await choose(page,op,kind,count);
    await page.locator("#do-both").click();
    await expect(page.locator("#reset")).toBeEnabled({timeout:25000});
  }
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:25000});
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("x = 3");
  await expect(page.locator("#replay-star-summary")).toBeHidden();
  await expect(page.locator("#replay-end-note")).toContainText("principal square root");
  await page.locator("#next-level").click();
  await expect(page.locator("#workshop-equation")).toHaveValue("x²+4x=21");
  await expect(page.locator("#workshop-quantity-mode")).toHaveValue("squares");
  expect(await saves(page)).toEqual(before);
  expect(errors).toEqual([]);
});
test("Independent custom balance requires a fresh second selection, resets cleanly and earns no stars",async({page})=>{
  test.setTimeout(65000);
  await page.setViewportSize({width:390,height:844});
  await open(page);const before=await saves(page);
  await build(page,"x^2=25","manual");
  await expect(page.locator("#mode-select")).toHaveValue("manual");
  await page.locator("#square-inspect-toggle").click();
  await expect(page.locator("#square-inspect-a")).toHaveText("0");
  await expect(page.locator("#square-inspect-b")).toHaveText("0");
  await page.locator("#square-inspect-close").click();
  await visit(page,"right","sqrt");
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(1);
  await expect(page.locator("#left-action")).toBeDisabled();
  await expect(page.locator('.operation-picker [aria-pressed="true"]')).toHaveCount(0);
  await page.locator("#reset").click();
  await expect(page.locator("#right-items .weight")).toHaveCount(25);
  await expect(page.locator("#mode-select")).toHaveValue("manual");
  await visit(page,"left","sqrt");
  await choose(page,"sqrt");
  await expect(page.locator("#right-action")).toHaveText("Visit other chamber");
  await page.locator("#right-action").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:25000});
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("x = 5");
  await page.locator("#next-level").click();
  await expect(page.locator("#workshop-equation")).toHaveValue("x^2=25");
  await expect(page.locator("#workshop-hand-mode")).toHaveValue("manual");
  expect(await saves(page)).toEqual(before);
});
test("paper-first custom square construction awards no credit and returns to its goal and original draft",async({page})=>{
  test.setTimeout(65000);
  await open(page);const before=await saves(page);
  await build(page,"x+1=4","notebook","area");
  await expect(page.locator("#notebook-workspace")).toBeVisible();
  await expect(page.locator("#scene")).toBeHidden();
  await expect(page.locator("#notebook-stage-kicker")).toContainText("FREE PLAY");
  await expect(page.locator("#mode-wrapper")).toBeHidden();
  await paper(page,"square","x² + 2x + 1 = 16");
  await expect(page.locator("#notebook-replay")).toBeEnabled();
  expect(await saves(page)).toEqual(before);
  await page.locator("#notebook-replay").click();
  await expect(page.locator("#notebook-next")).toBeVisible({timeout:35000});
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(1);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(2);
  await expect(page.locator("#right-items .weight")).toHaveCount(16);
  await expect(page.locator("#notebook-playback-message")).toContainText("no stars awarded");
  expect(await saves(page)).toEqual(before);
  await page.locator("#notebook-back-paper").click();
  await expect(page.locator("#scene")).toBeHidden();
  await page.locator("#notebook-replay").click();
  await expect(page.locator("#notebook-next")).toContainText("Build another equation");
  await expect(page.locator("#notebook-next")).toBeVisible({timeout:35000});
  await page.locator("#notebook-next").click();
  await expect(page.locator("#workshop-equation")).toHaveValue("x+1=4");
  await expect(page.locator("#workshop-square-goal")).toHaveValue("area");
  await expect(page.locator("#workshop-hand-mode")).toHaveValue("notebook");
  expect(await saves(page)).toEqual(before);
});
test("invalid custom quadratic input remains in the builder; direct draft links preserve goal and mode",async({page})=>{
  await open(page);const before=await saves(page);
  for(const [value,goal,message] of [
    ["x²=2x","isolate","one possible weight"],
    ["x²=2","isolate","positive whole-number"],
    ["x²-1=3","isolate","Negative objects"],
    ["x+1=8","area","more than 48 objects"],
    ["x²=4","area","round sprites and weights"]
  ]){
    await build(page,value,"auto",goal);
    await expect(page.locator("#site-workshop")).toBeVisible();
    await expect(page.locator("#game-shell")).toBeHidden();
    await expect(page.locator("#workshop-feedback")).toContainText(message);
    await expect(page.locator("#workshop-equation")).toHaveAttribute("aria-invalid","true");
  }
  expect(await saves(page)).toEqual(before);
  await page.goto("/?workshop="+encodeURIComponent("2x+1=5")+"&workshopWorld=squares&workshopMode=notebook&workshopGoal=area");
  await expect(page.locator("#workshop-equation")).toHaveValue("2x+1=5");
  await expect(page.locator("#workshop-square-goal")).toHaveValue("area");
  await expect(page.locator("#workshop-hand-mode")).toHaveValue("notebook");
});
