import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?preview=resident");
});

test("a rejected division actually CHOPS the floor sprite in half, pauses, then puts it together",async({page})=>{
  test.setTimeout(45000);
  const stage=page.locator("#left-attempt-stage");
  await page.locator('[data-operation="divide"]').click();
  await page.locator("#do-both").click();
  await expect(stage).toBeVisible({timeout:12000});
  await expect(stage).toHaveAttribute("data-issue","fraction");
  await expect(stage).toHaveClass(/fraction-floor-stage/);
  await expect(stage).toHaveAttribute("data-cut-factor","2");
  await expect(stage).toHaveAttribute("data-cut-sources","1");
  await expect(stage.locator(".fraction-cut-source[data-kind='posX']")).toHaveCount(1);
  await expect(stage.locator(".fraction-cut-piece")).toHaveCount(2);
  await expect(stage.locator(".fraction-cut-art.sprite-black")).toHaveCount(2);
  await expect(stage.locator(".fraction-cut-seam")).toHaveCount(1);
  await expect(stage.locator(".attempt-basket")).toHaveCount(0,
    "the actual floor character is cut, not an unrelated basket diagram");
  await expect(page.locator("#left-items .sprite-black.fraction-original-hidden")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(2);
  await expect(stage).toHaveAttribute("data-cut-phase","chopped",{timeout:13000});
  await page.waitForTimeout(260);
  const moved=await stage.locator(".fraction-cut-piece").first().evaluate(
    e=>getComputedStyle(e).transform);
  expect(moved).not.toBe("none");
  await expect(page.locator("#speech")).toBeHidden();
  await page.screenshot({path:"artifacts/pr13-actual-floor-sprite-chopped-into-halves.png"});
  await expect(page.locator("#speech")).toContainText("These pieces are too small",{timeout:14000});
  await expect(page.locator("#speech")).toContainText("put them back together");
  await expect(page.locator("#speech")).toContainText("undo");
  await page.screenshot({path:"artifacts/pr13-sprite-halves-and-explanation.png"});
  await expect(stage).toHaveAttribute("data-cut-phase","rejoining",{timeout:13000});
  await expect(stage).toBeHidden({timeout:13000});
  await expect(page.locator("#left-items .sprite-black.fraction-original-hidden")).toHaveCount(0);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(2);
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  await expect(page.locator("#undo")).toBeDisabled();
  await expect(page.locator("#replay-backdrop")).toBeHidden();
});

test("manual division really chips the remaining WEIGHT on the east floor",async({page})=>{
  test.setTimeout(45000);
  await page.locator("#mode-select").selectOption("manual");
  await page.locator('[data-operation="divide"]').click();
  await page.locator("#right-action").click();
  const stage=page.locator("#right-attempt-stage");
  await expect(stage).toHaveAttribute("data-issue","fraction",{timeout:12000});
  await expect(stage.locator(".fraction-cut-source[data-kind='posOne']")).toHaveCount(1);
  await expect(stage.locator(".fraction-cut-art.weight")).toHaveCount(2);
  await expect(stage.locator(".fraction-cut-piece")).toHaveCount(2);
  await expect(stage).toHaveAttribute("data-cut-phase","chopped",{timeout:13000});
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  await expect(page.locator("#right-items .weight.fraction-original-hidden")).toHaveCount(1);
  await expect(stage.locator(".attempt-basket")).toHaveCount(0);
  await page.screenshot({path:"artifacts/pr13-west-is-unchanged-east-weight-chopped.png"});
  await expect(page.locator("#speech")).toContainText("1/2 of a weight",{timeout:14000});
  await expect(stage).toBeHidden({timeout:13000});
  await expect(page.locator("#right-items .weight.fraction-original-hidden")).toHaveCount(0);
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#undo")).toBeDisabled();
});

test("the hand splits one REAL square sprite into three shaped fragments",async({page})=>{
  test.setTimeout(45000);
  await page.locator("#level-select").selectOption("7"); // 4 square x² sprites facing 36 weights
  await page.locator('[data-operation="divide"]').click();
  await page.locator("#amount-up").click();
  await expect(page.locator("#amount-value")).toHaveText("3");
  await page.locator("#do-both").click();
  const stage=page.locator("#left-attempt-stage");
  await expect(stage).toHaveAttribute("data-issue","fraction",{timeout:12000});
  await expect(stage).toHaveAttribute("data-cut-factor","3");
  await expect(stage.locator(".fraction-cut-source[data-kind='posX2']")).toHaveCount(1);
  await expect(stage.locator(".fraction-cut-piece")).toHaveCount(3);
  await expect(stage.locator(".fraction-cut-art.sprite-square")).toHaveCount(3);
  await expect(stage.locator(".fraction-cut-seam")).toHaveCount(2);
  await expect(stage).toHaveAttribute("data-cut-phase","chopped",{timeout:13000});
  await page.screenshot({path:"artifacts/pr13-square-sprite-three-actual-fragments.png"});
  await expect(page.locator("#speech")).toContainText("1/3 of a square sprite",{timeout:13000});
  await expect(stage).toBeHidden({timeout:13000});
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(4);
  await expect(page.locator("#right-items .weight")).toHaveCount(36);
  await expect(page.locator("#undo")).toBeDisabled();
});

test("the fractional creature stays in the real chamber on a small phone",async({page})=>{
  test.setTimeout(35000);
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-operation="divide"]').click();
  await page.locator("#do-both").click();
  const stage=page.locator("#left-attempt-stage");
  await expect(stage).toHaveAttribute("data-cut-phase","chopped",{timeout:15000});
  const bounds=await stage.locator(".fraction-cut-source").evaluate(actor=>{
    const r=actor.getBoundingClientRect();
    const chamber=actor.closest(".room-interior").getBoundingClientRect();
    return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
      roomLeft:chamber.left,roomRight:chamber.right,
      roomTop:chamber.top,roomBottom:chamber.bottom};
  });
  expect(bounds.left).toBeGreaterThanOrEqual(bounds.roomLeft-2);
  expect(bounds.right).toBeLessThanOrEqual(bounds.roomRight+2);
  expect(bounds.top).toBeGreaterThanOrEqual(bounds.roomTop-2);
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.roomBottom+2);
  await page.screenshot({path:"artifacts/pr13-fraction-cut-in-actual-phone-room.png"});
  await expect(page.locator("#speech")).toContainText("These pieces are too small",{timeout:13000});
  await expect(stage).toBeHidden({timeout:13000});
});

test("an overfull room spills weights out, then the hand undoes the attempted duplication",async ({page})=>{
  await page.locator("#level-select").selectOption("7");
  await page.locator('[data-operation="multiply"]').click();
  await page.locator("#do-both").click();
  const stage=page.locator("#right-attempt-stage");
  await expect(stage).toHaveAttribute("data-issue","overflow",{timeout:14000});
  await expect(stage.locator(".overflow-piece")).toHaveCount(12);
  await expect(stage.locator(".weight-spill")).toHaveCount(12);
  await expect(stage).toContainText("72 objects");
  await expect(page.locator("#hand")).toHaveAttribute("data-phase","rest",{timeout:10000});
  await page.screenshot({path:"artifacts/rejected-overflow-weights-tumble.png"});
  await expect(page.locator("#speech")).toContainText("tumbling out",{timeout:12000});
  await expect(page.locator("#speech")).toContainText("undo");
  await expect(stage).toBeHidden({timeout:13000});
  await expect(page.locator("#right-items .weight")).toHaveCount(36);
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(4);
  await expect(page.locator("#undo")).toBeDisabled();
});

test("Your Turn allows a different action on the second side, tips dramatically, explains, then rewinds BOTH",async ({page})=>{
  await page.locator("#mode-select").selectOption("manual");
  await page.locator("#left-action").click();
  await expect(page.locator("#left-items .weight")).toHaveCount(0);
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  await page.locator('[data-operation="add"]').click();
  await expect(page.locator("#right-action")).toHaveText("Try different move here");
  await page.locator("#right-action").click();
  const scene=page.locator("#scene");
  await expect(scene).toHaveAttribute("data-balance-outcome","tipped",{timeout:12000});
  await expect(page.locator("#right-items .weight")).toHaveCount(7);
  await page.waitForTimeout(1050);
  const tilt = await page.locator("#rooms-row").evaluate(el => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return Math.atan2(m.b,m.a) * 180 / Math.PI;
  });
  expect(Math.abs(tilt)).toBeGreaterThan(9);
  await page.screenshot({path:"artifacts/manual-different-moves-scale-tips.png"});
  await expect(page.locator("#speech")).toContainText("scale tips",{timeout:12000});
  await expect(page.locator("#speech")).toContainText("undo both moves");
  const bubble = await page.locator("#speech").boundingBox();
  const height = page.viewportSize().height;
  expect(bubble.y).toBeGreaterThanOrEqual(0);
  expect(bubble.y + bubble.height).toBeLessThanOrEqual(height + 2);
  await page.screenshot({path:"artifacts/manual-different-moves-explained.png"});
  await expect(scene).not.toHaveAttribute("data-balance-outcome","tipped",{timeout:13000});
  await expect(page.locator("#left-items .weight")).toHaveCount(2);
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  await expect(page.locator("#undo")).toBeDisabled();
  await expect(page.locator("#replay-backdrop")).toBeHidden();
});

test("a different impossible move after one manual move also restores both sides",async ({page})=>{
  await page.locator("#mode-select").selectOption("manual");
  await page.locator("#left-action").click();
  await expect(page.locator("#left-items .weight")).toHaveCount(0);
  await page.locator('[data-kind="posX"]').click();
  await page.locator("#right-action").click();
  await expect(page.locator("#right-attempt-stage")).toHaveAttribute("data-issue","missing",{timeout:12000});
  await expect(page.locator("#speech")).toContainText("can't pick up",{timeout:12000});
  await expect(page.locator("#right-attempt-stage")).toBeHidden({timeout:12000});
  await expect(page.locator("#left-items .weight")).toHaveCount(2);
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  await expect(page.locator("#undo")).toBeDisabled();
});

test("a failed root shows why x+2 cannot form the square area, then undoes the attempt",async ({page})=>{
  await page.locator('[data-operation="sqrt"]').click();
  await page.locator("#do-both").click();
  await expect(page.locator("#left-attempt-stage")).toHaveAttribute("data-issue","unsupported-area",{timeout:14000});
  await expect(page.locator("#speech")).toContainText("complete square",{timeout:15000});
  await expect(page.locator("#speech")).toContainText("undo");
  await expect(page.locator("#left-attempt-stage")).toBeHidden({timeout:12000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(2);
  await expect(page.locator("#replay-backdrop")).toBeHidden();
});

test("reducing motion still gives an understandable fractional preview and reversal",async ({page})=>{
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: reduced");
  await page.locator('[data-operation="divide"]').click();
  await page.locator("#do-both").click();
  const stage=page.locator("#left-attempt-stage");
  await expect(stage).toHaveAttribute("data-issue","fraction",{timeout:10000});
  await expect(stage.locator(".fraction-cut-piece")).toHaveCount(2);
  await expect(stage).toHaveAttribute("data-cut-phase","chopped",{timeout:10000});
  await expect(stage.locator(".fraction-cut-piece").first()).toHaveCSS("transition-duration","0s");
  await expect(page.locator("#speech")).toContainText("small",{timeout:8000});
  await expect(stage).toBeHidden({timeout:8000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
});

test("rejected attempts don't interrupt later valid moves or pollute the comic replay",async ({page})=>{
  await page.locator('[data-operation="divide"]').click();
  await page.locator("#do-both").click();
  await expect(page.locator("#left-attempt-stage")).toHaveAttribute("data-issue","fraction",{timeout:12000});
  await expect(page.locator("#do-both")).toBeDisabled();
  await expect(page.locator("#left-attempt-stage")).toBeHidden({timeout:15000});
  await page.locator('[data-operation="remove"]').click();
  await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:15000});
  await expect(page.locator("#replay-progress")).toContainText("of 2");
});


test("Your Turn can remove an object found ONLY on the first side, then learns from a different second move",async ({page})=>{
  await page.locator("#mode-select").selectOption("manual");
  await page.locator('[data-kind="posX"]').click();
  await page.locator("#amount-down").click(); // one sprite, not two
  await page.locator("#left-action").click();
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(0);
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(0);
  await expect(page.locator("#replay-backdrop")).toBeHidden();
  await page.locator('[data-operation="add"]').click();
  await page.locator("#right-action").click();
  await expect(page.locator("#scene")).toHaveAttribute("data-balance-outcome","tipped",{timeout:12000});
  await expect(page.locator("#speech")).toContainText("scale tips",{timeout:12000});
  await expect(page.locator("#scene")).not.toHaveAttribute("data-balance-outcome","tipped",{timeout:13000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  await expect(page.locator("#undo")).toBeDisabled();
});
