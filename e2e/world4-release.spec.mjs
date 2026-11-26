import {playCampaignLevel} from "./campaign-menu-helper.mjs";
import {openCampaignBoard} from "./campaign-menu-helper.mjs";
import {test,expect} from "@playwright/test";
import {SQUARE_CAMPAIGN_STAGES} from "../src/square-campaign-levels.mjs";
import {equation,initialState} from "../src/engine.mjs";
import {probeWorld4} from "../scripts/world4-release-probe.mjs";

test("release journey visits every world/stage board then solves three custom squares without saved credit",async({page,baseURL})=>{
  test.setTimeout(120000);
  await probeWorld4(page,baseURL,{screenshots:true});
});
for(const stage of SQUARE_CAMPAIGN_STAGES){
  test("every "+stage.id+" Square Laboratory tile launches the exact authored initial inventory",async({page})=>{
    test.setTimeout(120000);
    await page.emulateMedia({reducedMotion:"reduce"});
    await page.goto("/");
    const errors=[];page.on("pageerror",e=>errors.push(String(e)));
    await openCampaignBoard(page,"squares",stage.id);
    for(const slot of stage.levels){
      await playCampaignLevel(page,page.locator('.level-tile[data-level-id="'+slot.id+'"]'));
      const level=slot.level;
      await expect(page.locator("#chapter-status")).toContainText("LEVEL "+String(slot.number).padStart(2,"0")+" / "+stage.levels.length);
      if(stage.method==="notebook"){
        await expect(page.locator("#scene")).toBeHidden();
        await expect(page.locator("#notebook-workspace")).toBeVisible();
        await expect(page.locator("#notebook-lines .notebook-line-equation").first()).toHaveAttribute("aria-label",equation(initialState(level)));
        await expect(page.locator("#notebook-operation")).toHaveValue("");
        await expect(page.locator("#notebook-replay")).toBeDisabled();
        await expect(page.locator("#square-inspect-toggle")).toBeHidden();
      }else{
        await expect(page.locator("#scene")).toBeVisible();
        for(const side of ["left","right"]){
          const root=page.locator("#"+side+"-items");
          await expect(root.locator(".sprite-square")).toHaveCount(level[side].posX2);
          await expect(root.locator(".sprite-black")).toHaveCount(level[side].posX);
          await expect(root.locator(".weight")).toHaveCount(level[side].posOne);
        }
        await expect(page.locator('.operation-picker [aria-pressed="true"]')).toHaveCount(0);
        await expect(page.locator("#undo")).toBeDisabled();
        if(stage.method==="manual"){
          await expect(page.locator("#left-action")).toBeDisabled();
          await expect(page.locator("#right-action")).toBeDisabled();
        }else await expect(page.locator("#do-both")).toBeDisabled();
      }
      await page.locator("#game-levels").click();
      await expect(page.locator("#site-levels")).toHaveAttribute("data-active-stage",stage.id);
    }
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
    expect(saved.worlds.squares.stages[stage.id].completed).toEqual([]);
    expect(saved.worlds.squares.stages[stage.id].bestMoves).toEqual({});
    expect(errors).toEqual([]);
  });
}
