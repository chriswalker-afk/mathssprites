import {test,expect} from "@playwright/test";
import {mkdirSync} from "node:fs";
const left=page=>page.locator("#left-area-box");
const right=page=>page.locator("#right-area-box");
const west=page=>page.locator("#left-items");
const east=page=>page.locator("#right-items");
async function shot(page,name){
  mkdirSync("artifacts",{recursive:true});
  await page.screenshot({path:"artifacts/square-construction-"+name+".png",fullPage:true});
}
async function open(page,{reduced=false}={}){
  await page.emulateMedia({reducedMotion:reduced?"reduce":"no-preference"});
  await page.addInitScript(value=>localStorage.setItem("mathssprites.motion-preference.v1",value),reduced?"reduced":"on");
  await page.goto("/?preview=mixed-area");
  await expect(west(page).locator(".sprite-black")).toHaveCount(2);
  await expect(west(page).locator(".weight")).toHaveCount(3);
}
async function chooseSquare(page){await page.locator('[data-operation="square"]').click();}
async function observeStages(page){
  await page.evaluate(()=>{
    window.squareStageQA=[];
    for(const side of ["left","right"]){
      const box=document.getElementById(side+"-area-box"),items=document.getElementById(side+"-items");
      let previous="";
      new MutationObserver(()=>{
        const step=box.dataset.step;
        if(box.hidden||box.dataset.construction!=="square"||!step||step===previous)return;
        previous=step;
        const actors=[...box.querySelectorAll(".box-cell .box-actor")];
        window.squareStageQA.push({side,step,cells:Number(box.dataset.visibleCells),
          floorOpacity:getComputedStyle(items).opacity,
          originalRound:items.querySelectorAll(".sprite-black").length,
          originalSquare:items.querySelectorAll(".sprite-square").length,
          weights:items.querySelectorAll(".weight").length,
          guideCount:box.querySelectorAll(".box-edge-token[data-non-counting=true]").length,
          mixedTop:box.querySelectorAll(".region-mixed-top.placed").length,
          released:box.dataset.released||null,
          hiddenActors:actors.every(a=>getComputedStyle(a).visibility==="hidden")});
      }).observe(box,{attributes:true,attributeFilter:["data-step","hidden"]});
    }
  });
}
test("mixed square transfers the original row, fills each region and releases only the real output",async({page})=>{
  test.setTimeout(60000);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await open(page);await observeStages(page);await chooseSquare(page);
  await page.locator("#do-both").click();
  await expect.poll(()=>page.evaluate(()=>window.squareStageQA.some(r=>r.side==="left"&&r.step==="mixed-top"&&r.mixedTop===6))).toBe(true);
  await expect.poll(()=>page.evaluate(()=>window.squareStageQA.some(r=>r.side==="left"&&r.step==="units"&&r.cells===25))).toBe(true);
  await expect.poll(()=>page.evaluate(()=>window.squareStageQA.some(r=>r.side==="left"&&r.step==="result"&&r.released==="true"))).toBe(true);
  await expect(west(page).locator(".sprite-square")).toHaveCount(4);
  await expect(west(page).locator(".sprite-black")).toHaveCount(12);
  await expect(west(page).locator(".weight")).toHaveCount(9);
  await shot(page,"release");
  await expect(east(page).locator(".weight")).toHaveCount(25);
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:25000});
  const history=await page.evaluate(()=>window.squareStageQA);
  const w=history.filter(r=>r.side==="left");
  expect(w.map(r=>[r.step,r.cells])).toEqual([["frame",0],["edge",0],["column",0],["quadratic",4],["mixed-top",10],["mixed-bottom",16],["units",25],["result",25]]);
  expect(w[0].floorOpacity).toBe("1");expect(w[0].originalRound).toBe(2);
  expect(w[1].floorOpacity).toBe("0");expect(w[1].guideCount).toBe(10);
  expect(w.at(-1)).toMatchObject({floorOpacity:"1",originalSquare:4,originalRound:12,weights:9,released:"true",hiddenActors:true});
  expect(history.filter(r=>r.side==="right").map(r=>r.step)).toEqual(["frame","edge","column","units","result"]);
  await expect(left(page)).toBeHidden();await expect(right(page)).toBeHidden();
  expect(errors).toEqual([]);
});
test("manual construction releases a provisional room, then matches the other room",async({page})=>{
  test.setTimeout(60000);await open(page,{reduced:true});
  await page.locator("#mode-select").selectOption("manual");
  await chooseSquare(page);await page.locator("#left-action").click();
  await expect(west(page).locator(".sprite-square")).toHaveCount(4);
  await expect(left(page)).toBeHidden();
  await expect(east(page).locator(".weight")).toHaveCount(5);
  await expect(page.locator("#replay-backdrop")).toBeHidden();
  // The existing prototype keeps its manual operation selected; if reset
  // in a later release, choose the same operation afresh.
  if(!await page.locator('[data-operation="square"]').evaluate(e=>e.classList.contains("selected")))await chooseSquare(page);
  await page.locator("#right-action").click();
  await expect(east(page).locator(".weight")).toHaveCount(25);
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
});
test("oversized mixed square physically spills but does not commit an operation",async({page})=>{
  test.setTimeout(60000);
  await open(page,{reduced:true});
  await page.locator('[data-operation="add"]').click();
  await page.locator('[data-kind="posOne"]').click();
  await page.locator("#amount-up").click();await page.locator("#amount-up").click();
  await page.locator("#do-both").click();
  await expect(west(page).locator(".weight")).toHaveCount(5);
  await expect(east(page).locator(".weight")).toHaveCount(7);
  await expect(page.locator('[data-operation="square"]')).toBeEnabled();
  await chooseSquare(page);await page.locator("#do-both").click();
  const trial=page.locator("#left-attempt-stage .square-overflow-trial");
  await expect(trial).toHaveAttribute("data-total","49");
  await expect(trial).toHaveAttribute("data-excess","1");
  await expect(trial.locator(".square-overflow-cell")).toHaveCount(48);
  await expect(trial.locator(".square-overflow-prop")).toHaveCount(1);
  await shot(page,"overflow");
  await expect(page.locator("#speech")).toContainText("49 objects",{timeout:12000});
  await expect(page.locator("#left-attempt-stage")).toBeHidden({timeout:12000});
  await expect(west(page).locator(".sprite-black")).toHaveCount(2);
  await expect(west(page).locator(".weight")).toHaveCount(5);
  await expect(east(page).locator(".weight")).toHaveCount(7);
  await expect(page.locator("#undo")).toBeEnabled();
  await page.locator("#undo").click();
  await expect(west(page).locator(".weight")).toHaveCount(3);
  await expect(east(page).locator(".weight")).toHaveCount(5);
});
test("reduced-motion phone builds a real square within the chamber and clears it after contact",async({page})=>{
  test.setTimeout(45000);
  await page.setViewportSize({width:390,height:844});
  await open(page,{reduced:true});await chooseSquare(page);
  await page.locator("#do-both").click();
  await expect(left(page).locator(".box-grid")).toBeVisible();
  const b=await left(page).locator(".box-grid").evaluate(el=>{
    const r=el.getBoundingClientRect(),p=el.closest(".room-interior").getBoundingClientRect();
    return {w:r.width,h:r.height,inside:r.left>=p.left-2&&r.right<=p.right+2&&r.top>=p.top-2&&r.bottom<=p.bottom+2};
  });
  expect(Math.abs(b.w-b.h)).toBeLessThan(2);expect(b.inside).toBe(true);
  await expect(left(page).locator(".region-quadratic.placed")).toHaveCount(4);
  await expect(left(page).locator(".box-actor-x2").first()).toHaveCSS("animation-name","none");
  await shot(page,"phone-reduced");
  await expect(west(page).locator(".sprite-square")).toHaveCount(4);
  await expect(left(page)).toBeHidden();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:25000});
});
