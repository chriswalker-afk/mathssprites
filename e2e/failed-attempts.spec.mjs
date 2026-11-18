import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
});

test("a non-whole division visually slices a sprite, waits, explains, and restores the room", async ({ page }) => {
  const stage = page.locator("#left-attempt-stage");
  await page.locator('[data-operation="divide"]').click();
  await page.locator("#do-both").click();
  await expect(stage).toBeVisible({timeout:12000});
  await expect(stage).toHaveAttribute("data-issue", "fraction");
  await expect(stage.locator(".attempt-basket")).toHaveCount(2);
  await expect(stage.locator(".slice-object")).toHaveCount(2);
  await expect(stage.locator(".slice-fraction").first()).toHaveText("1/2");
  // The hand shows the failed physical result before offering advice.
  await expect(page.locator("#hand")).toHaveAttribute("data-phase","rest",{timeout:10000});
  await expect(page.locator("#speech")).toBeHidden();
  await page.screenshot({path:"artifacts/rejected-sprite-cut-into-halves.png"});
  await expect(page.locator("#speech")).toContainText("These pieces are too small",{timeout:12000});
  await expect(page.locator("#speech")).toContainText("undo");
  await page.screenshot({path:"artifacts/rejected-sprite-speech-bubble.png"});
  await expect(stage).toBeHidden({timeout:12000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(2);
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  await expect(page.locator("#undo")).toBeDisabled();
  await expect(page.locator("#replay-backdrop")).toBeHidden();
});

test("manual first-side fraction cuts a WEIGHT, not a sprite in the other room",async ({page})=>{
  await page.locator("#mode-select").selectOption("manual");
  await page.locator('[data-operation="divide"]').click();
  await page.locator("#right-action").click();
  const stage=page.locator("#right-attempt-stage");
  await expect(stage).toHaveAttribute("data-issue","fraction",{timeout:12000});
  await expect(stage.locator(".slice-object.weight-part")).toHaveCount(2);
  await expect(stage.locator(".attempt-basket")).toHaveCount(2);
  await expect(stage.locator(".slice-fraction").first()).toHaveText("2 + 1/2");
  await expect(page.locator("#hand")).toHaveAttribute("data-phase","rest",{timeout:10000});
  await page.screenshot({path:"artifacts/rejected-weight-cut-into-halves.png"});
  await expect(page.locator("#speech")).toContainText("1/2 of a weight",{timeout:12000});
  await expect(stage).toBeHidden({timeout:12000});
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#undo")).toBeDisabled();
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
  await expect(stage.locator(".slice-object")).toHaveCount(2);
  await expect(stage.locator(".slice-object").first()).toHaveCSS("animation-name","none");
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
