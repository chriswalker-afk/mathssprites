import {openCampaignBoard,chooseCampaignStage} from "../e2e/campaign-menu-helper.mjs";
/** Strict deployed World 3 smoke check. Run after GitHub Pages has deployed
 * the release; never infer the branch under test from the public URL. */
import {chromium} from "@playwright/test";
import {mkdirSync,writeFileSync} from "node:fs";
const url="https://chriswalker-afk.github.io/mathssprites/";
const results={url,checks:[],errors:[]};
const browser=await chromium.launch({channel:"chrome",headless:true});
const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:"reduce"});
await page.addInitScript(()=>localStorage.setItem("mathssprites.motion-preference.v1","reduced"));
page.on("pageerror",e=>results.errors.push(String(e)));
const verify=(condition,message)=>{if(!condition)throw new Error(message);results.checks.push(message);};
mkdirSync("artifacts",{recursive:true});
try{
  const response=await page.goto(url+"?world3-release="+Date.now(),{waitUntil:"networkidle",timeout:30000});
  verify(response?.ok(),"Published home resolves");
  await openCampaignBoard(page,"fractions");
  for(const [stage,count] of [["guided",24],["independent",20],["notebook",16]]){
    await chooseCampaignStage(page,stage);
    await page.locator(".level-tile").first().waitFor({state:"visible"});
    verify(await page.locator(".level-tile").count()===count,"Published "+stage+" has "+count+" levels");
    verify(await page.locator(".level-tile:disabled").count()===0,"Published "+stage+" is fully selectable");
  }
  await page.screenshot({path:"artifacts/live-world3-board.png",fullPage:true});
  // Verify the deployed UI as seen by a returning student, not only engine outputs.
  await page.setViewportSize({width:1838,height:891});
  await chooseCampaignStage(page,"guided");
  await page.locator('.level-tile[data-level-id="frac-g-06"]').click();
  const host=page.locator("#fraction-game-host");
  await host.locator("#fraction-lab").waitFor({state:"visible"});
  const presentation=await host.evaluate(el=>{
    const r=el.shadowRoot,box=s=>r.querySelector(s).getBoundingClientRect(),scene=box("#scene"),panel=box(".fb-tools");
    const plaque=r.querySelector("#left-items .fw-label"),whole=r.querySelector("#left-items .fs-assembly[data-denominator='1']");
    return {revision:el.dataset.presentationRevision,styles:el.dataset.styles,sidebar:panel.x>scene.right&&Math.abs(panel.y-scene.y)<3&&Math.abs(panel.height-scene.height)<3,
      labelled:!!plaque&&getComputedStyle(plaque).borderTopStyle==="solid",singleActor:!!whole?.querySelector(".fs-whole-actor")&&!whole.querySelector("svg")};
  });
  verify(presentation.revision==="97"&&presentation.styles==="ready","Published fraction presentation uses current versioned assets");
  verify(presentation.sidebar,"Published desktop controls sit next to full-size scene");
  verify(presentation.labelled,"Published fractional quantity uses a physical plaque");
  verify(presentation.singleActor,"Published whole sprite is a single animated actor");
  await page.screenshot({path:"artifacts/live-world3-presentation.png",fullPage:true});
  await page.setViewportSize({width:1280,height:720});
  await page.goto(url+"?workshop=2x%3D5&workshopWorld=fractions&workshopMode=auto",{waitUntil:"networkidle"});
  verify(await page.locator("#workshop-quantity-mode").inputValue()==="fractions","Published fractional workshop deep link");
  const before=await page.evaluate(()=>JSON.stringify(localStorage));
  await page.locator("#workshop-create").click();
  const root=page.locator("#fraction-game-host #fraction-lab");
  await root.locator('[data-fb-op="divide"]').click();await root.locator('[data-fb-factor="2"]').click();
  await root.locator("#fb-apply").click();
  await root.locator("#fb-next-level").waitFor({state:"visible",timeout:30000});
  verify(await root.getAttribute("data-solved")==="true","Published physical fraction division solves 2x=5");
  verify((await root.locator("#right-items").getAttribute("aria-label")).includes("5/2 weights"),"Published result is exactly five halves");
  verify((await page.evaluate(()=>JSON.stringify(localStorage)))===before,"Published custom play leaves saves unchanged");
  await page.screenshot({path:"artifacts/live-world3-workshop.png",fullPage:true});
  verify(results.errors.length===0,"No uncaught browser errors");
}catch(e){results.errors.push(String(e));process.exitCode=1;}
finally{await browser.close();console.log(JSON.stringify(results,null,2));writeFileSync("artifacts/live-world3-release.json",JSON.stringify(results,null,2));}
