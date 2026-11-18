import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});

async function floorMetrics(page,side){
  return page.locator("#"+side+"-items").evaluate(room=>{
    const track=room.querySelector(".floor-track");
    if(!track)return null;
    const b=room.getBoundingClientRect(),t=track.getBoundingClientRect();
    const tokens=[...track.querySelectorAll(":scope > .token")];
    const bottoms=tokens.map(el=>el.getBoundingClientRect().bottom);
    return {count:tokens.length,wrap:getComputedStyle(track).flexWrap,
      width:t.width,roomWidth:b.width,left:t.left,right:t.right,
      roomLeft:b.left,roomRight:b.right,
      minBottom:Math.min(...bottoms),maxBottom:Math.max(...bottoms)};
  });
}

test("outside the box, every sprite and weight rests on ONE floor row",async({page})=>{
  await page.locator("#level-select").selectOption("4");
  for(const side of ["left","right"]){
    const m=await floorMetrics(page,side);
    expect(m.wrap).toBe("nowrap");
    expect(m.count).toBe(side==="left"?15:20);
    expect(m.maxBottom-m.minBottom).toBeLessThan(2.5);
    expect(m.width).toBeLessThanOrEqual(m.roomWidth+2);
    expect(m.left).toBeGreaterThanOrEqual(m.roomLeft-4);
    expect(m.right).toBeLessThanOrEqual(m.roomRight+4);
  }
  await page.screenshot({path:"artifacts/ordinary-one-row-floor.png"});
});

test("the existing simple square is built INSIDE the room, not in a detached inset",async({page})=>{
  await page.locator("#level-select").selectOption("5");
  await expect(page.locator('[data-operation="square"]')).toHaveClass(/selected/);
  await page.locator("#do-both").click();
  const left=page.locator("#left-area-box");
  await expect(left).toBeVisible();
  await expect(left).toHaveAttribute("data-layout","in-room");
  await expect(left.locator(".box-cell")).toHaveCount(1);
  await expect(left.locator(".box-edge-top .box-edge-token.edge-sprite")).toHaveCount(1);
  await expect(left.locator(".box-edge-left .box-edge-token.edge-sprite")).toHaveCount(1);
  const parent=await left.evaluate(el=>el.parentElement?.className);
  expect(parent).toContain("room-interior");
  await expect(left.locator(".box-cell.placed")).toHaveCount(1);
  await page.screenshot({path:"artifacts/in-room-one-sprite-square.png"});
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(1,{timeout:10000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(0);
  const right=page.locator("#right-area-box");
  await expect(right).toBeVisible();
  await expect(right.locator(".box-cell")).toHaveCount(9);
  await expect(right.locator(".box-cell.stage-units")).toHaveCount(9);
  await expect(right.locator(".box-edge-top .edge-weight")).toHaveCount(3);
  await expect(right.locator(".box-edge-left .edge-weight")).toHaveCount(3);
  await expect(right.locator(".box-cell.placed")).toHaveCount(9);
  await page.screenshot({path:"artifacts/hand-fills-in-room-three-by-three.png"});
  await expect(page.locator("#right-items .weight")).toHaveCount(9);
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
  await expect(page.locator("#pencil-lines")).toContainText("x²",{timeout:16000});
});

test("principal root unbuilds the real in-room square and keeps one side",async({page})=>{
  await page.locator("#level-select").selectOption("6");
  await expect(page.locator('[data-operation="sqrt"]')).toHaveClass(/selected/);
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(1);
  await page.locator("#do-both").click();
  const left=page.locator("#left-area-box");
  await expect(left).toBeVisible();
  await expect(left).toHaveAttribute("data-operation","sqrt");
  await expect(left.locator(".box-cell.placed")).toHaveCount(1);
  await expect(left.locator(".box-cell.removed")).toHaveCount(1,{timeout:10000});
  await expect(left.locator(".box-edge-top.kept")).toHaveCount(1);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await page.screenshot({path:"artifacts/in-room-square-squished-round.png"});
  const right=page.locator("#right-area-box");
  await expect(right).toBeVisible();
  await expect(right.locator(".box-cell")).toHaveCount(9);
  await expect(right.locator(".box-cell.stage-units.removed")).toHaveCount(9);
  await expect(right.locator(".box-edge-top.kept")).toHaveCount(1);
  await page.screenshot({path:"artifacts/in-room-root-keep-three-weights.png"});
  await expect(page.locator("#right-items .weight")).toHaveCount(3);
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
});

test("root 4x²=36 still gives 2x=6 then ÷2, without a separate overlay",async({page})=>{
  test.setTimeout(60000);
  await page.locator("#level-select").selectOption("7");
  const floor=await floorMetrics(page,"right");
  expect(floor.count).toBe(36);
  expect(floor.wrap).toBe("nowrap");
  await page.locator("#do-both").click();
  await expect(page.locator("#left-area-box .box-cell")).toHaveCount(4);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(2,{timeout:12000});
  const right=page.locator("#right-area-box");
  await expect(right.locator(".box-cell")).toHaveCount(36);
  const dimensions=await right.locator(".box-grid").evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {width:r.width,height:r.height};
  });
  expect(Math.abs(dimensions.width-dimensions.height)).toBeLessThan(2);
  await expect(right.locator(".box-edge-top.kept")).toHaveCount(1);
  await page.screenshot({path:"artifacts/in-room-six-by-six-unbuild.png"});
  await expect(page.locator("#right-items .weight")).toHaveCount(6);
  await page.locator('[data-operation="divide"]').click();
  await page.locator("#do-both").click();
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(3);
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
});

test("the hand completes all FOUR regions of the 2x+3 illustrated square",async({page})=>{
  test.setTimeout(50000);
  await page.locator("#level-select").selectOption("8");
  await expect(page.locator('[data-operation="square"]')).toHaveClass(/selected/);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(2);
  await expect(page.locator("#left-items .weight")).toHaveCount(3);
  await page.locator("#do-both").click();
  const box=page.locator("#left-area-box");
  await expect(box).toBeVisible();
  await expect(box).toHaveAttribute("data-sprite-side","2");
  await expect(box).toHaveAttribute("data-weight-side","3");
  await expect(box.locator(".box-cell")).toHaveCount(25);
  await expect(box.locator(".box-edge-top .edge-sprite")).toHaveCount(2);
  await expect(box.locator(".box-edge-top .edge-weight")).toHaveCount(3);
  await expect(box.locator(".box-edge-left .edge-sprite")).toHaveCount(2);
  await expect(box.locator(".box-edge-left .edge-weight")).toHaveCount(3);
  await expect(box.locator(".box-cell.region-quadratic")).toHaveCount(4);
  await expect(box.locator(".box-cell.region-mixed-top")).toHaveCount(6);
  await expect(box.locator(".box-cell.region-mixed-bottom")).toHaveCount(6);
  await expect(box.locator(".box-cell.region-units")).toHaveCount(9);
  await expect(box.locator(".box-cell.stage-quadratic.placed")).toHaveCount(4);
  await page.screenshot({path:"artifacts/pr11-stage4-four-square-sprites.png"});
  await expect(box.locator(".box-cell.stage-mixed.placed")).toHaveCount(12);
  await page.screenshot({path:"artifacts/pr11-stage5-twelve-round-sprites.png"});
  await expect(box.locator(".box-cell.stage-units.placed")).toHaveCount(9);
  await page.screenshot({path:"artifacts/pr11-stage6-complete-twenty-five-piece-square.png"});
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(4);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(12);
  await expect(page.locator("#left-items .weight")).toHaveCount(9);
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  await expect(page.locator("#right-area-box .box-cell")).toHaveCount(25);
  await expect(page.locator("#right-items .weight")).toHaveCount(25);
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
  await expect(page.locator("#pencil-lines")).toContainText("4x²",{timeout:16000});
});

test("reverse 4x²+12x+9 square into exactly two sprites and three weights",async({page})=>{
  test.setTimeout(50000);
  await page.locator("#level-select").selectOption("9");
  await expect(page.locator('[data-operation="sqrt"]')).toHaveClass(/selected/);
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(4);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(12);
  await expect(page.locator("#left-items .weight")).toHaveCount(9);
  await page.locator("#do-both").click();
  const box=page.locator("#left-area-box");
  await expect(box).toBeVisible();
  await expect(box.locator(".box-cell.placed")).toHaveCount(25);
  await page.screenshot({path:"artifacts/pr11-root-stage1-complete-square.png"});
  await expect(box.locator(".box-cell.stage-units.removed")).toHaveCount(9);
  await expect(box.locator(".box-cell.stage-mixed.removed")).toHaveCount(12);
  await expect(box.locator(".box-cell.stage-quadratic.removed")).toHaveCount(4);
  await expect(box.locator(".box-edge-left.retired")).toHaveCount(1);
  await expect(box.locator(".box-edge-top.kept")).toHaveCount(1);
  await page.screenshot({path:"artifacts/pr11-root-stage6-keep-one-side.png"});
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(0);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(2);
  await expect(page.locator("#left-items .weight")).toHaveCount(3);
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  await expect(page.locator("#right-area-box .box-cell")).toHaveCount(25);
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  await expect(page.locator("#replay-backdrop")).toBeHidden();
});

test("the in-room frame fits inside the chamber on small mobile screens",async({page})=>{
  test.setTimeout(45000);
  await page.setViewportSize({width:390,height:844});
  await page.locator("#level-select").selectOption("8");
  await page.locator("#do-both").click();
  const dimensions=await page.locator("#left-area-box .box-grid").evaluate(box=>{
    const a=box.getBoundingClientRect();
    const c=box.closest(".room-interior").getBoundingClientRect();
    return {width:a.width,height:a.height,x:a.left,y:a.top,
      roomLeft:c.left,roomRight:c.right,roomTop:c.top,roomBottom:c.bottom};
  });
  expect(Math.abs(dimensions.width-dimensions.height)).toBeLessThan(2);
  expect(dimensions.x).toBeGreaterThanOrEqual(dimensions.roomLeft-2);
  expect(dimensions.x+dimensions.width).toBeLessThanOrEqual(dimensions.roomRight+2);
  expect(dimensions.y).toBeGreaterThanOrEqual(dimensions.roomTop-2);
  expect(dimensions.y+dimensions.height).toBeLessThanOrEqual(dimensions.roomBottom+2);
  await expect(page.locator("#left-area-box .box-cell.stage-quadratic.placed")).toHaveCount(4);
  await page.screenshot({path:"artifacts/pr11-in-room-square-phone.png"});
});

test("Your Turn can build the box in one room and must match in the other",async({page})=>{
  test.setTimeout(50000);
  await page.locator("#level-select").selectOption("8");
  await page.locator("#mode-select").selectOption("manual");
  await page.locator("#left-action").click();
  await expect(page.locator("#left-area-box .box-cell")).toHaveCount(25);
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(4);
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  await expect(page.locator("#replay-backdrop")).toBeHidden();
  await page.locator("#right-action").click();
  await expect(page.locator("#right-items .weight")).toHaveCount(25);
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
});

test("no active bouncing is required to understand the six physical stages",async({page})=>{
  test.setTimeout(30000);
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: reduced");
  await page.locator("#level-select").selectOption("8");
  await page.locator("#do-both").click();
  const box=page.locator("#left-area-box");
  await expect(box).toBeVisible();
  await expect(box.locator(".box-cell")).toHaveCount(25);
  await expect(box.locator(".box-cell.stage-units.placed")).toHaveCount(9);
  await expect(box.locator(".box-actor-x2").first()).toHaveCSS("animation-name","none");
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(4);
  await expect(page.locator("#right-items .weight")).toHaveCount(25);
});
