/**
 * Browser regression helper for pre-PR45 tests of hand animation and physics.
 * The application never uses this helper: tests explicitly click the controls
 * previously prefilled by the game. New neutral-state tests use plain Playwright.
 */
import {LEVELS} from "../src/engine.mjs";
import {WORLD1_LEVELS} from "../src/worlds.mjs";
import {INDEPENDENT_LEVELS} from "../src/independent-levels.mjs";
import {OPPOSITE_LEVELS} from "../src/opposite-levels.mjs";

const all=[...LEVELS,...WORLD1_LEVELS.map(x=>x.level),
  ...INDEPENDENT_LEVELS.map(x=>x.level),
  ...Object.values(OPPOSITE_LEVELS).flat().map(x=>x.level)];
const parsedNumber=text=>Number((text||"").match(/LEVEL\s+(\d+)/)?.[1]||0);
async function referenceLevel(page){
  const location=await page.evaluate(()=>({
    title:document.querySelector("#level-title")?.textContent||"",
    world:document.body.dataset.campaignWorld||"",
    stage:document.body.dataset.workshopStage||"",
    label:document.querySelector("#chapter-status")?.textContent||"",
    preview:document.querySelector("#level-select")?.value||"0"
  }));
  let pool=all;
  if(location.world==="opposites")pool=OPPOSITE_LEVELS[location.stage]?.map(x=>x.level)||pool;
  else if(location.world==="workshop")pool=(location.stage==="independent"?
    INDEPENDENT_LEVELS:WORLD1_LEVELS).map(x=>x.level);
  else pool=LEVELS;
  const n=parsedNumber(location.label);
  const found=Number.isInteger(n)&&n>0?pool[n-1]:null;
  return found?.title===location.title?found:
    pool.find(x=>x.title===location.title)||all.find(x=>x.title===location.title)||null;
}
/** Only fill choices when the test has not already made them itself. */
export async function chooseReferenceMoveIfBlank(page){
  const level=await referenceLevel(page);
  const previewRoutes={
    "baskets":{op:"divide",factor:3},
    "five-baskets":{op:"divide",factor:5}
  };
  const previewRoute=previewRoutes[level?.id]||null;
  const action=level?.startingOperation||previewRoute?.op||
    ((level?.left?.posX||0)>1 && !(level?.left?.posOne||0)?"divide":"remove");
  const kind=level?.startingKind||"posOne";
  const left=level?.left||{},right=level?.right||{};
  const factor=level?.startingFactor||previewRoute?.factor||
    Math.min(5,Math.max(2, left.posX||right.posX||2));
  const count=level?.startingAmount||
    (kind==="posX"?Math.min(left.posX||right.posX||1,12):
     kind==="negX"||kind==="negOne"?1:
     Math.min(12,Math.max(1,Math.min(left.posOne||12,right.posOne||12))));
  const choice=await page.evaluate(()=>({
    operation:document.querySelector("[data-operation].selected")?.dataset.operation||null,
    kind:document.querySelector("[data-kind].selected")?.dataset.kind||null,
    amount:document.querySelector("#amount-value")?.textContent?.trim()||""
  }));
  if(!choice.operation)
    await page.locator('[data-operation="'+action+'"]').click();
  const selected=choice.operation||action;
  // Square/root acts on the entire room; the operation-first UI correctly
  // hides the quantity picker. Do not wait on a nonexistent number control.
  if(selected==="square"||selected==="sqrt")return;
  if(selected==="add"||selected==="remove"){
    if(!choice.kind)
      await page.locator('[data-kind="'+kind+'"]').click();
  }
  const value=await page.locator("#amount-value").textContent();
  if(value?.trim()==="—"){
    await page.locator("#amount-up").click();
    const target=(selected==="divide"||selected==="multiply")?factor:count;
    const minimum=(selected==="divide"||selected==="multiply")?2:1;
    const n=Math.max(minimum,Math.min(selected==="divide"||selected==="multiply"?5:12,target));
    for(let i=minimum;i<n;i++)await page.locator("#amount-up").click();
  }
}
export async function clickWithReferenceMove(page,selector){
  const button=page.locator(selector);
  if(await button.isDisabled()||!(await button.isVisible()))
    await chooseReferenceMoveIfBlank(page);
  await button.click();
}
