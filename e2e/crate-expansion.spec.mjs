import {clickWithReferenceMove} from "./reference-move-helper.mjs";
import {test,expect} from "@playwright/test";

async function level19(page){
  await page.goto("/");
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="workshop"]').click();
  await page.locator('[data-map-stage="guided"]').click();
  await page.locator('[data-level="19"]').click();
  await expect(page.locator("#level-title")).toHaveText("Sealed Crates");
}
async function phase(page,name){
  await expect(page.locator("#left-crate-expansion")).toHaveAttribute(
    "data-phase",name,{timeout:30000});
}
async function recordPhysicalPhases(page){
  await page.evaluate(()=>{
    window.__cratePhaseTrace=[];
    window.__cratePhaseEvidence=[];
    const observer=new MutationObserver(()=>{
      const stage=document.querySelector("#left-crate-expansion");
      const phase=stage?.dataset.phase;
      if(phase&&window.__cratePhaseTrace.at(-1)!==phase){
        window.__cratePhaseTrace.push(phase);
        window.__cratePhaseEvidence.push({
          phase,
          releasedSprites:stage.querySelectorAll(".crate-escaped-sprite.released").length,
          landedSprites:stage.querySelectorAll(".crate-escaped-sprite.landed").length,
          releasedWeights:stage.querySelectorAll(".crate-escaped-weight.released").length,
          landedWeights:stage.querySelectorAll(".crate-escaped-weight.landed").length,
          panelsDown:document.querySelectorAll("#left-items .crate-panels-down").length,
          weightBayCount:document.querySelectorAll("#left-items .crate-bay-weight").length,
          text:stage.textContent.trim()
        });
      }
    });
    observer.observe(document.body,{attributes:true,attributeFilter:["data-phase"],
      childList:true,subtree:true});
    window.__cratePhaseObserver=observer;
  });
}
test.beforeEach(async({page})=>page.emulateMedia({reducedMotion:"reduce"}));

test("crowbar, simultaneous sprite bounce, falling wooden panels and physical weights all stay in-room @smoke",async({page})=>{
  test.setTimeout(105000);
  await level19(page);
  await expect(page.locator(".sealed-crate")).toHaveCount(2);
  await expect(page.locator(".crate-picture-sign")).toHaveCount(1);
  await expect(page.locator(".crate-stack-count")).toHaveText("2 crates");
  await expect(page.locator("#crate-controls .eyebrow")).toHaveText("SEALED CRATES");
  await expect(page.locator("#unpack-crates")).toHaveText(/Open crates/);
  await expect(page.locator("#level-prompt")).toHaveText("");
  await page.screenshot({path:"artifacts/pr41-01-sealed-stack.png",fullPage:true});
  await recordPhysicalPhases(page);
  await page.locator("#unpack-crates").click();
  const first=page.locator('.sealed-crate[data-crate-index="0"]');
  const second=page.locator('.sealed-crate[data-crate-index="1"]');
  await expect(first).toHaveAttribute("data-crate-state","opened",{timeout:20000});
  await expect(second).toHaveAttribute("data-crate-state","sealed");
  await expect(page.locator("#hand-cargo .held-crowbar")).toBeAttached();
  await expect(page.locator("#action-caption")).toBeHidden();
  await page.screenshot({path:"artifacts/pr41-02-crowbar-opening.png",fullPage:true});
  await expect(second).toHaveAttribute("data-crate-state","opened",{timeout:20000});
  await expect(page.locator("#left-crate-expansion .crate-escaped-actor.released")).toHaveCount(0);
  await page.screenshot({path:"artifacts/pr41-03-both-lids-open.png",fullPage:true});

  // Every physical phase is captured at the instant it occurs, before the
  // temporary actors are removed. This prevents screenshot overhead from
  // racing a subsecond hinge / bounce phase. Assertions below verify both
  // the order AND the real physical objects visible at each milestone.
  await expect(page.locator("#left-crate-expansion")).toHaveCount(0,{timeout:30000});
  const trace=await page.evaluate(()=>window.__cratePhaseTrace);
  let last=-1;
  for(const name of ["opening","sprites-bouncing","sprites-landed",
    "panels-falling","weights-revealed","weights-tumbling",
    "weights-landed","settle"]){
    const next=trace.indexOf(name,last+1);
    expect(next, "Expected ordered physical phase "+name+": "+trace.join(" > ")).toBeGreaterThan(last);
    last=next;
  }
  const evidence=await page.evaluate(()=>window.__cratePhaseEvidence);
  const at=name=>evidence.find(frame=>frame.phase===name);
  expect(at("sprites-bouncing").releasedSprites).toBe(2);
  expect(at("sprites-bouncing").releasedWeights).toBe(0);
  expect(at("sprites-landed").landedSprites).toBe(2);
  expect(at("sprites-landed").panelsDown).toBe(0);
  expect(at("panels-falling").panelsDown).toBe(2);
  expect(at("weights-revealed").weightBayCount).toBe(6);
  expect(at("weights-revealed").releasedWeights).toBe(0);
  expect(at("weights-landed").landedWeights).toBe(6);
  for(const frame of evidence)expect(frame.text).toBe("");
  await page.screenshot({path:"artifacts/pr41-09-loose-sprites-and-weights.png",fullPage:true});
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(2);
  await expect(page.locator("#left-items .weight")).toHaveCount(6);
  await expect(page.locator("#right-items .weight")).toHaveCount(14);
  await expect(page.locator("#crate-controls")).toBeHidden();
  await page.screenshot({path:"artifacts/pr41-10-final-room.png",fullPage:true});
});
test("divide-first opens just one crate and produces one sprite and three weights @smoke",async({page})=>{
  test.setTimeout(90000);
  await level19(page);
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(1,{timeout:30000});
  await expect(page.locator("#right-items .weight")).toHaveCount(7);
  await expect(page.locator(".crate-stack-count")).toHaveText("1 crate");
  await recordPhysicalPhases(page);
  await page.locator("#unpack-crates").click();
  // This one-crate sequence runs quickly in reduced-motion mode. Record the
  // actual ordered states rather than trying to sample a transient DOM phase.
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:30000});
  const evidence=await page.evaluate(()=>window.__cratePhaseEvidence);
  const phases=evidence.map(frame=>frame.phase);
  expect(phases).toContain("sprites-landed");
  expect(phases).toContain("weights-revealed");
  expect(phases.indexOf("sprites-landed")).toBeLessThan(phases.indexOf("weights-revealed"));
  expect(evidence.find(frame=>frame.phase==="sprites-landed").landedSprites).toBe(1);
  expect(evidence.find(frame=>frame.phase==="sprites-landed").panelsDown).toBe(0);
  expect(evidence.find(frame=>frame.phase==="weights-revealed").weightBayCount).toBe(3);
  await page.screenshot({path:"artifacts/pr41-11-one-crate-revealed.png",fullPage:true});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(3);
});
test("opening stays silent and the resulting comic is a visual storyboard, not multiplication captions @smoke",async({page})=>{
  test.setTimeout(105000);
  await level19(page);
  await page.locator("#unpack-crates").click();
  await expect(page.locator("#left-crate-expansion")).toBeAttached({timeout:10000});
  await expect(page.locator("#left-crate-expansion .crate-expansion-step")).toHaveCount(0);
  await expect(page.locator("#left-crate-expansion .crate-release-group")).toHaveCount(0);
  await expect(page.locator("#left-crate-expansion")).toHaveText("");
  await expect(page.locator("#feedback")).toHaveText("");
  await expect(page.locator("#speech")).toBeHidden();
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:30000});
  await page.locator('[data-operation="remove"]').click();
  await page.locator('[data-kind="posOne"]').click();
  await page.locator("#amount-up").click();
  for(let i=1;i<6;i++)await page.locator("#amount-up").click();
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#right-items .weight")).toHaveCount(8,{timeout:30000});
  await page.locator('[data-operation="divide"]').click();
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:35000});
  await page.locator("#replay-skip").click();
  await expect(page.locator(".comic-crate-story")).toHaveCount(1);
  await expect(page.locator(".comic-crate-story .comic-crate-frame")).toHaveCount(4);
  await expect(page.locator("#comic-panels")).not.toContainText("Expand");
  await expect(page.locator("#comic-panels")).not.toContainText("multiplication");
  await expect(page.locator("#pencil-lines")).not.toContainText("2 ×");
  await expect(page.locator("#replay-star-summary")).toContainText("★★★ 3 stars");
  await page.screenshot({path:"artifacts/pr41-12-visual-comic.png",fullPage:true});
});
test("Pause freezes the physical choreography and Resume continues; reduced motion keeps all states @smoke",async({page})=>{
  test.setTimeout(75000);
  await page.setViewportSize({width:1092,height:540});
  await level19(page);
  await expect(page.locator("#unpack-crates")).toBeInViewport();
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: reduced");
  await page.locator("#unpack-crates").click();
  await expect(page.locator("#crate-animation-pause")).toBeEnabled({timeout:15000});
  await page.locator("#crate-animation-pause").click();
  await expect(page.locator("#crate-animation-pause")).toHaveAttribute("aria-pressed","true");
  const before=await page.locator("#left-crate-expansion").getAttribute("data-phase");
  await page.waitForTimeout(750);
  await expect(page.locator("#left-crate-expansion")).toHaveAttribute("data-phase",before);
  await page.screenshot({path:"artifacts/pr41-13-paused.png",fullPage:true});
  await page.locator("#crate-animation-pause").click();
  await expect(page.locator("#crate-animation-pause")).toHaveAttribute("aria-pressed","false");
  await phase(page,"weights-revealed");
  await expect(page.locator("#left-items .crate-bay-weight")).toHaveCount(6);
  await expect(page.locator("#left-items .sealed-crate")).toHaveCount(0,{timeout:30000});
  const width=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(1095);
  await page.screenshot({path:"artifacts/pr41-14-compact-finished.png",fullPage:true});
});
