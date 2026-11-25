import {test,expect} from "@playwright/test";
import {mkdirSync} from "node:fs";
const box=(page,side="left")=>page.locator("#"+side+"-area-box");
const items=(page,side="left")=>page.locator("#"+side+"-items");
const trial=page=>page.locator("#left-attempt-stage");
async function shot(page,name){mkdirSync("artifacts",{recursive:true});await page.screenshot({path:"artifacts/square-root-"+name+".png",fullPage:true});}
async function open(page,id="mixed-root",reduced=false){
  await page.emulateMedia({reducedMotion:reduced?"reduce":"no-preference"});
  await page.addInitScript(v=>localStorage.setItem("mathssprites.motion-preference.v1",v),reduced?"reduced":"on");
  await page.goto("/?preview="+id);
}
async function chooseRoot(page){
  const button=page.locator('[data-operation="sqrt"]');
  if(!await button.evaluate(e=>e.classList.contains("selected")))await button.click();
}
async function observe(page){
  await page.evaluate(()=>{
    window.rootStages=[];
    for(const side of ["left","right"]){
      const b=document.getElementById(side+"-area-box"),i=document.getElementById(side+"-items");
      let previous="";
      new MutationObserver(()=>{
        const step=b.dataset.step;
        if(b.hidden||b.dataset.construction!=="root"||!step||step===previous)return;
        previous=step;
        window.rootStages.push({side,step,cells:Number(b.dataset.visibleCells),opacity:getComputedStyle(i).opacity,
          square:i.querySelectorAll(".sprite-square").length,round:i.querySelectorAll(".sprite-black").length,weight:i.querySelectorAll(".weight").length,
          top:b.querySelector(".box-edge-top")?.classList.contains("kept"),left:b.querySelector(".box-edge-left")?.classList.contains("retired"),
          released:b.dataset.released||null,
          hiddenActors:[...b.querySelectorAll(".box-cell .box-actor,.square-edge-actor")].every(a=>getComputedStyle(a).visibility==="hidden")});
      }).observe(b,{attributes:true,attributeFilter:["data-step","hidden"]});
    }
  });
}
test("mixed root arranges the existing complete area, retires every region, retains exactly one side and releases",async({page})=>{
  test.setTimeout(60000);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await open(page);await observe(page);await chooseRoot(page);await page.locator("#do-both").click();
  const b=box(page);
  await expect(b).toHaveAttribute("data-step","arrange");
  await expect(b.locator(".box-cell.placed")).toHaveCount(25);
  await shot(page,"arranged");
  await expect(b).toHaveAttribute("data-step","mixed-bottom");
  await expect(b.locator(".region-mixed-bottom.removed")).toHaveCount(6);
  await expect(b).toHaveAttribute("data-step","edge");
  await expect(b.locator(".box-edge-top.kept .box-edge-token")).toHaveCount(5);
  await expect(b.locator(".box-edge-left.retired")).toHaveCount(1);
  await shot(page,"one-side");
  await expect(b).toHaveAttribute("data-released","true");
  await expect(items(page).locator(".sprite-square")).toHaveCount(0);
  await expect(items(page).locator(".sprite-black")).toHaveCount(2);
  await expect(items(page).locator(".weight")).toHaveCount(3);
  await expect(items(page,"right").locator(".weight")).toHaveCount(5);
  await expect(box(page,"right")).toBeHidden({timeout:15000});
  await expect(page.locator("#undo")).toBeEnabled();
  const stages=await page.evaluate(()=>window.rootStages);
  const w=stages.filter(r=>r.side==="left");
  expect(w.map(r=>[r.step,r.cells])).toEqual([["frame",0],["arrange",25],["units",16],["mixed-bottom",10],["mixed-top",4],["quadratic",0],["column",0],["edge",0],["result",0]]);
  expect(w[0]).toMatchObject({opacity:"1",square:4,round:12,weight:9});
  expect(w[1]).toMatchObject({opacity:"0",square:4,round:12,weight:9});
  expect(w.at(-1)).toMatchObject({opacity:"1",square:0,round:2,weight:3,top:true,left:true,released:"true",hiddenActors:true});
  expect(stages.filter(r=>r.side==="right").map(r=>r.step)).toEqual(["frame","arrange","units","column","edge","result"]);
  await page.locator("#undo").click();
  await expect(items(page).locator(".sprite-square")).toHaveCount(4);
  await expect(items(page,"right").locator(".weight")).toHaveCount(25);
  expect(errors).toEqual([]);
});
test("a missing unit corner displays the actual incomplete area and restores the prior committed room",async({page})=>{
  test.setTimeout(45000);await open(page,"mixed-root",true);
  await page.locator('[data-operation="remove"]').click();await page.locator('[data-kind="posOne"]').click();
  await page.locator("#amount-up").click();await page.locator("#do-both").click();
  await expect(items(page).locator(".weight")).toHaveCount(8);
  await expect(page.locator("#undo")).toBeEnabled();
  await chooseRoot(page);await page.locator("#do-both").click();
  const t=trial(page);
  await expect(t).toHaveAttribute("data-root-trial","true",{timeout:12000});
  await expect(t).toHaveAttribute("data-root-missing","1");
  await expect(t).toHaveAttribute("data-root-excess","0");
  await expect(t.locator(".root-gap[data-kind=posOne]")).toHaveCount(1);
  await expect(t.locator(".root-gap .box-actor")).toHaveCount(0);
  await expect(t.locator(".box-cell .box-actor")).toHaveCount(24);
  await expect(t.locator(".root-trial-extra")).toHaveCount(0);
  await shot(page,"missing-corner");
  await expect(page.locator("#speech")).toContainText("missing 1 weight",{timeout:12000});
  await expect(t).toBeHidden({timeout:12000});
  await expect(items(page).locator(".weight")).toHaveCount(8);
  await expect(items(page,"right").locator(".weight")).toHaveCount(24);
  await expect(page.locator("#undo")).toBeEnabled();
  await page.locator("#undo").click();
  await expect(items(page).locator(".weight")).toHaveCount(9);
  await expect(items(page,"right").locator(".weight")).toHaveCount(25);
});
test("an odd mixed region cannot masquerade as equal regions",async({page})=>{
  test.setTimeout(45000);await open(page,"mixed-root",true);
  // Add one round sprite to both rooms: 13 in the west, 1 in the east.
  await page.locator('[data-operation="add"]').click();await page.locator('[data-kind="posX"]').click();
  await page.locator("#amount-up").click();await page.locator("#do-both").click();
  await expect(items(page).locator(".sprite-black")).toHaveCount(13);
  await expect(page.locator("#undo")).toBeEnabled();
  await chooseRoot(page);await page.locator("#do-both").click();
  const t=trial(page);await expect(t).toHaveAttribute("data-root-excess","1",{timeout:12000});
  await expect(t.locator(".region-mixed-top .box-actor")).toHaveCount(6);
  await expect(t.locator(".region-mixed-bottom .box-actor")).toHaveCount(6);
  await expect(t.locator(".root-trial-extra[data-kind=posX]")).toHaveCount(1);
  await expect(page.locator("#speech")).toContainText("1 round sprite left over",{timeout:12000});
  await expect(t).toBeHidden({timeout:12000});
  await expect(items(page).locator(".sprite-black")).toHaveCount(13);
  await expect(items(page,"right").locator(".sprite-black")).toHaveCount(1);
});
test("numeric root refusal retains leftover weights, and reduced-motion mobile root keeps one side",async({page})=>{
  test.setTimeout(60000);
  await page.setViewportSize({width:390,height:844});
  await open(page,"take-root",true);
  await page.locator('[data-operation="add"]').click();await page.locator('[data-kind="posOne"]').click();
  await page.locator("#amount-up").click();await page.locator("#amount-up").click();await page.locator("#amount-up").click();
  await page.locator("#do-both").click();
  await expect(items(page,"right").locator(".weight")).toHaveCount(12);
  await expect(page.locator("#undo")).toBeEnabled();
  // Both rooms now have incomplete areas; exercise the east room directly.
  await page.locator("#mode-select").selectOption("manual");await chooseRoot(page);
  await page.locator("#right-action").click();
  const t=page.locator("#right-attempt-stage");
  await expect(t).toHaveAttribute("data-root-excess","3",{timeout:12000});
  await expect(t.locator(".root-trial-extra[data-kind=posOne]")).toHaveCount(3);
  await expect(t.locator(".box-cell .box-actor")).toHaveCount(9);
  await shot(page,"leftover-weights-phone");
  await expect(t).toBeHidden({timeout:12000});
  await open(page,"mixed-root",true);
  await page.locator("#mode-select").selectOption("manual");await chooseRoot(page);
  await page.locator("#left-action").click();
  await expect(box(page)).toHaveAttribute("data-step","arrange");
  const geometry=await box(page).locator(".box-grid").evaluate(el=>{
    const a=el.getBoundingClientRect(),b=el.closest(".room-interior").getBoundingClientRect();
    return {square:Math.abs(a.width-a.height)<2,inside:a.left>=b.left-2&&a.right<=b.right+2&&a.top>=b.top-2&&a.bottom<=b.bottom+2};
  });
  expect(geometry).toEqual({square:true,inside:true});
  await expect(box(page).locator(".box-cell.placed .box-actor").first()).toHaveCSS("animation-name","none");
  await expect(box(page)).toBeHidden({timeout:12000});
  await expect(items(page).locator(".sprite-black")).toHaveCount(2);
  await expect(items(page,"right").locator(".weight")).toHaveCount(25);
  await chooseRoot(page);await page.locator("#right-action").click();
  await expect(items(page,"right").locator(".weight")).toHaveCount(5);
  await expect(box(page,"right")).toBeHidden({timeout:12000});
  await expect(page.locator("#undo")).toBeEnabled();
  await page.locator("#undo").click();
  await expect(items(page).locator(".sprite-square")).toHaveCount(4);
});
