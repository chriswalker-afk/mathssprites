import {test,expect} from "@playwright/test";
import {openCampaignBoard,playCampaignLevel} from "./campaign-menu-helper.mjs";

const cases=[
  {world:"workshop",level:3,ops:["−4","÷2"],solution:"x = 4"},
  {world:"opposites",level:8,ops:["−(−4)","+(−x)","÷2"],solution:"x = 5"},
  {world:"fractions",level:9,ops:["−1/2","÷3"],solution:"x = 5/2"},
  {world:"squares",level:1,ops:["square"],solution:"x² + 2x + 1 = 16"}
];
const widths=[{width:1092,height:540},{width:1243,height:531},{width:1366,height:768},{width:390,height:844}];
async function start(page,fixture){
  await page.setViewportSize(widths[0]);
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.addInitScript(()=>localStorage.setItem("mathssprites.motion-preference.v1","reduced"));
  await page.goto("/");
  await openCampaignBoard(page,fixture.world,"notebook");
  await playCampaignLevel(page,page.locator('[data-level="'+fixture.level+'"]'));
  const fraction=fixture.world==="fractions";
  const root=fraction?page.locator("#fraction-game-host"):page;
  const workspace=root.locator(fraction?"#fb-notebook":"#notebook-workspace");
  await expect(workspace).toBeVisible();
  return {fraction,root,workspace,
    paper:workspace.locator(".notebook-paper"),
    tools:workspace.locator(".notebook-control-panel"),
    lines:workspace.locator(fraction?"#fb-nb-lines":"#notebook-lines"),
    replay:workspace.locator(fraction?"#fb-nb-watch":"#notebook-replay")};
}
async function apply(view,op){
  if(view.fraction){
    const details=view.root.locator("#fb-nb-type-details");
    if(!await details.evaluate(el=>el.open))await details.locator("summary").click();
    await view.root.locator("#fb-nb-typed").fill(op);
    await view.root.locator("#fb-nb-preview").click();
    await expect(view.root.locator("#fb-nb-confirm")).toBeEnabled();
    await view.root.locator("#fb-nb-confirm").click();
  }else{
    await view.root.locator("#notebook-operation").fill(op);
    await expect(view.root.locator("#notebook-apply")).toBeEnabled();
    await view.root.locator("#notebook-apply").click();
  }
}
async function checkLayout(view,size,count){
  const m=await view.workspace.evaluate((el)=>{
    const p=el.querySelector(".notebook-paper"),t=el.querySelector(".notebook-control-panel");
    const l=p.querySelector("ol"),box=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height,width:r.width}};
    const margin=getComputedStyle(p,"::before");
    const lr=l.getBoundingClientRect();
    return {paper:box(p),tools:box(t),list:box(l),marginLeft:parseFloat(margin.left),marginWidth:parseFloat(margin.width),
      marginZ:parseInt(margin.zIndex),isolation:getComputedStyle(p).isolation,
      childZ:[...p.children].map(e=>parseInt(getComputedStyle(e).zIndex)),
      lineCount:l.children.length,listHeight:l.clientHeight,contentHeight:l.scrollHeight,
      math:[...l.querySelectorAll("math")].map(e=>box(e)),
      rows:[...l.children].map(e=>box(e)),
      listInnerRight:lr.left+l.clientWidth,listInnerBottom:lr.top+l.clientHeight,
      mathScrollWidth:l.scrollWidth,listWidth:l.clientWidth};
  });
  expect(m.lineCount).toBe(count);
  expect(m.marginZ).toBeLessThan(0);
  expect(m.isolation).toBe("isolate");
  expect(m.childZ.every(z=>z>=0)).toBe(true);
  expect(m.list.left).toBeGreaterThan(m.paper.left+m.marginLeft+m.marginWidth);
  if(size.width>=900&&size.height>=500){
    expect(m.tools.right).toBeLessThanOrEqual(m.paper.left+1);
    expect(Math.abs(m.tools.top-m.paper.top)).toBeLessThan(3);
    expect(m.list.height).toBeGreaterThan(230);
    // Ordinary working (up to four equations) must fit without any
    // vertical or horizontal scroll; the full equation and operation
    // text is visible simultaneously at the affected short resolutions.
    expect(m.contentHeight).toBeLessThanOrEqual(m.listHeight+2);
    expect(m.mathScrollWidth).toBeLessThanOrEqual(m.listWidth+2);
    for(const row of m.rows){expect(row.top).toBeGreaterThanOrEqual(m.list.top-1);expect(row.bottom).toBeLessThanOrEqual(m.listInnerBottom+2);}
    for(const math of m.math){expect(math.left).toBeGreaterThanOrEqual(m.list.left-1);expect(math.right).toBeLessThanOrEqual(m.listInnerRight+2);}
  }else{
    expect(m.paper.bottom).toBeLessThanOrEqual(m.tools.top+1);
    expect(m.contentHeight).toBeLessThanOrEqual(m.listHeight+2);
  }
}
for(const fixture of cases){
  test(fixture.world+" Apprentice has a separate full-height journal and usable controls @smoke",async({page},info)=>{
    test.setTimeout(90000);
    const view=await start(page,fixture);
    const editor=view.workspace.locator(view.fraction?"#fb-nb-editor":"#notebook-form");
    await expect(view.paper.locator("button,input,form")).toHaveCount(0);
    await expect(view.tools.locator(view.fraction?"#fb-nb-editor":"#notebook-form")).toHaveCount(1);
    await expect(view.tools.locator(".route-guide")).toHaveCount(1);
    await expect(view.tools.locator(".route-guide-content")).toBeVisible();
    await checkLayout(view,widths[0],1);
    await view.tools.locator('[data-guide-action="skip"]').click();
    const saved=await page.evaluate(()=>localStorage.getItem("mathssprites.campaign.v2"));
    for(let i=0;i<fixture.ops.length;i++){
      await apply(view,fixture.ops[i]);
      await expect(view.lines.locator("li")).toHaveCount(i+2);
    }
    await expect(view.replay).toBeEnabled();
    if(view.fraction)await expect(view.lines.locator("li").last().locator("mfrac").first()).toHaveText("52");
    else await expect(view.lines.locator("li").last()).toContainText(fixture.solution);
    for(const size of widths){
      await page.setViewportSize(size);
      await checkLayout(view,size,fixture.ops.length+1);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3)).toBe(true);
      await view.replay.scrollIntoViewIfNeeded();
      await expect(view.replay).toBeInViewport();
      if(size.width!==390)await info.attach(fixture.world+"-journal-"+size.width+"x"+size.height+".png",{body:await page.screenshot(),contentType:"image/png"});
    }
    expect(await page.evaluate(()=>localStorage.getItem("mathssprites.campaign.v2"))).toBe(saved);
    await view.tools.locator(view.fraction?"#fb-nb-undo":"#notebook-undo").click();
    await expect(view.lines.locator("li")).toHaveCount(fixture.ops.length);
    await expect(editor).toBeVisible();
    await view.tools.locator(view.fraction?"#fb-nb-restart":"#notebook-reset").click();
    await expect(view.lines.locator("li")).toHaveCount(1);
  });
}
test("long checked working can scroll from its full first line to its full last line without moving the controls @quick @smoke",async({page})=>{
  const view=await start(page,{world:"workshop",level:3});
  await view.tools.locator('[data-guide-action="skip"]').click();
  // Legal balancing operations; deliberately do not isolate x.
  for(let i=0;i<6;i++){await apply(view,"+1");await apply(view,"−1");}
  await expect(view.lines.locator("li")).toHaveCount(13);
  const measures=await view.lines.evaluate(el=>({height:el.clientHeight,scrollHeight:el.scrollHeight,top:el.scrollTop}));
  expect(measures.scrollHeight).toBeGreaterThan(measures.height);
  await expect.poll(()=>view.lines.evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop)).toBeLessThanOrEqual(3);
  const controls=await view.tools.boundingBox();
  await view.lines.focus();await page.keyboard.press("Home");
  await expect.poll(()=>view.lines.evaluate(el=>el.scrollTop)).toBeLessThanOrEqual(3);
  await page.keyboard.press("End");
  await expect.poll(()=>view.lines.evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop)).toBeLessThanOrEqual(3);
  const after=await view.tools.boundingBox();
  expect(Math.abs(controls.top-after.top)).toBeLessThan(1);
  expect(Math.abs(controls.left-after.left)).toBeLessThan(1);
  await expect(view.tools.locator("#notebook-reset")).toBeInViewport();
});
