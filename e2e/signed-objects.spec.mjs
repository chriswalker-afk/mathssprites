import {clickWithReferenceMove,chooseReferenceMoveIfBlank} from "./reference-move-helper.mjs";
import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/?preview=resident");
});

test("maths mode is INDEPENDENT of hand control, and positive-only lessons hide negatives",async({page})=>{
  await expect(page.locator("#mode-select")).toHaveValue("auto");
  await expect(page.locator("#quantity-mode")).toHaveValue("positive");
  await expect(page.locator('[data-kind="negX"]')).toBeHidden();
  await expect(page.locator('[data-kind="negOne"]')).toBeVisible();
  await page.locator("#mode-select").selectOption("manual");
  await expect(page.locator("#quantity-mode")).toHaveValue("positive");
  await page.locator("#quantity-mode").selectOption("signed");
  await expect(page.locator("#mode-select")).toHaveValue("manual");
  await page.locator('[data-operation="add"]').click();
  await expect(page.locator('[data-kind="negX"]')).toBeVisible();
  await expect(page.locator('[data-kind="negOne"]')).toBeVisible();
  await expect(page.locator("#journal-legend")).toContainText("white");
  await page.locator("#quantity-mode").selectOption("positive");
  await expect(page.locator('[data-kind="negOne"]')).toBeHidden();
});

test("students can opt into white sprites on an introductory puzzle and see a REAL zero pair",async({page})=>{
  test.setTimeout(55000);
  await page.locator("#quantity-mode").selectOption("signed");
  await page.locator('[data-operation="add"]').click();
  await page.locator('[data-kind="negX"]').click();
  await clickWithReferenceMove(page,"#amount-down"); // one white sprite
  await clickWithReferenceMove(page,"#do-both");
  const effect=page.locator("#left-neutral-effect");
  await expect(effect).toHaveAttribute("data-pair-type","sprites",{timeout:16000});
  await expect(page.locator("#left-items .zero-pair-actor")).toHaveCount(2);
  await expect(page.locator("#left-items .sprite-white")).toHaveCount(1);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await page.waitForTimeout(420); // Catch the midair collision instead of the first frame.
  const bubble=await page.locator("#speech").boundingBox();
  const viewport=page.viewportSize().height;
  expect(bubble.y).toBeGreaterThanOrEqual(0);
  expect(bubble.y+bubble.height).toBeLessThanOrEqual(viewport+2);
  await page.screenshot({path:"artifacts/pr12-black-white-sprites-collide.png"});
  await expect(page.locator("#speech")).toContainText("cancel to zero",{timeout:8000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(0,{timeout:15000});
  await expect(page.locator("#left-items .sprite-white")).toHaveCount(0);
  await expect(page.locator("#right-items .sprite-white")).toHaveCount(1,{timeout:15000});
  await expect(page.locator("#undo")).toBeEnabled();
  await page.locator("#undo").click();
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .sprite-white")).toHaveCount(0);
  await expect(page.locator("#quantity-mode")).toHaveValue("signed");
});

test("signed balloon rescue shows two distinct lifts before revealing x = 4",async({page})=>{
  test.setTimeout(65000);
  await page.locator("#level-select").selectOption("10");
  await expect(page.locator("#quantity-mode")).toHaveValue("signed");
  await expect(page.locator("#quantity-mode option[value=positive]")).toBeDisabled();
  await expect(page.locator("#left-items .balloon")).toHaveCount(2);
  await expect(page.locator('[data-kind="negOne"]')).toBeHidden();
  await expect(page.locator("[data-operation].selected")).toHaveCount(0);
  await chooseReferenceMoveIfBlank(page);
  await expect(page.locator('[data-kind="negOne"]')).toBeVisible();
  await expect(page.locator('[data-operation="add"]')).toHaveClass(/selected/);
  await expect(page.locator('[data-kind="posOne"]')).toHaveClass(/selected/);
  await expect(page.locator("#amount-value")).toHaveText("2");
  await clickWithReferenceMove(page,"#do-both");
  const effect=page.locator("#left-neutral-effect");
  await expect(effect).toHaveAttribute("data-pair-type","constants",{timeout:17000});
  await expect(page.locator("#left-items .zero-pair-actor")).toHaveCount(2);
  await expect(effect.locator(".balloon-trail")).toHaveCount(1);
  await page.waitForTimeout(460); // Capture the upward lift.
  await page.screenshot({path:"artifacts/pr12-balloon-lifts-weight-upwards.png"});
  await expect(page.locator("#speech")).toContainText("balloon lift",{timeout:9000});
  await expect(page.locator("#left-items .balloon")).toHaveCount(0,{timeout:22000});
  await expect(page.locator("#left-items .weight")).toHaveCount(0);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(4);
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("(+1) + (−1) = 0");
  await expect(page.locator("#pencil-lines")).toContainText("x = 4");
  await expect(page.locator(".panel-footnote").last()).toContainText("2 weight/balloon pairs");
  await page.waitForTimeout(680); // Let the current comic panel unfold for the screenshot.
  await page.screenshot({path:"artifacts/pr12-signed-zero-pairs-in-notebook.png"});
});

test("white sprite chapter pairs dark with pale in each room then isolates x",async({page})=>{
  test.setTimeout(65000);
  await page.locator("#level-select").selectOption("11");
  await expect(page.locator("#quantity-mode")).toHaveValue("signed");
  await expect(page.locator("[data-kind].selected")).toHaveCount(0);
  await chooseReferenceMoveIfBlank(page);
  await expect(page.locator('[data-kind="negX"]')).toHaveClass(/selected/);
  await expect(page.locator("#amount-value")).toHaveText("1");
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#left-neutral-effect")).toHaveAttribute("data-pair-type","sprites",{timeout:17000});
  await expect(page.locator("#right-neutral-effect")).toHaveAttribute("data-pair-type","sprites",{timeout:17000});
  await expect(page.locator("#left-items .sprite-white")).toHaveCount(0,{timeout:18000});
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(0);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await page.locator('[data-operation="remove"]').click();
  await page.locator('[data-kind="posOne"]').click();
  await clickWithReferenceMove(page,"#amount-up");
  await clickWithReferenceMove(page,"#amount-up");
  await clickWithReferenceMove(page,"#amount-up");
  await expect(page.locator("#amount-value")).toHaveText("3");
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("x = 4");
  await expect(page.locator("#pencil-lines")).toContainText("(+x) + (−x) = 0");
});

test("both sorts of zero pair solve the combined signed puzzle with two committed steps",async({page})=>{
  test.setTimeout(85000);
  await page.locator("#level-select").selectOption("12");
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#left-neutral-effect")).toHaveAttribute("data-pair-type","constants",{timeout:17000});
  await expect(page.locator("#left-items .balloon")).toHaveCount(0,{timeout:22000});
  await expect(page.locator("#right-items .weight")).toHaveCount(4);
  await page.locator('[data-kind="negX"]').click();
  await clickWithReferenceMove(page,"#amount-down");
  await expect(page.locator("#amount-value")).toHaveText("1");
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#left-neutral-effect")).toHaveAttribute("data-pair-type","sprites",{timeout:17000});
  await expect(page.locator("#right-neutral-effect")).toHaveAttribute("data-pair-type","sprites",{timeout:17000});
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("(+1) + (−1) = 0");
  await expect(page.locator("#pencil-lines")).toContainText("(+x) + (−x) = 0");
  await expect(page.locator("#pencil-lines")).toContainText("x = 4");
});

test("Your Turn only provisionally changes the first signed room until the opposite room matches",async({page})=>{
  test.setTimeout(68000);
  await page.locator("#level-select").selectOption("10");
  await page.locator("#mode-select").selectOption("manual");
  await clickWithReferenceMove(page,"#left-action");
  await expect(page.locator("#left-neutral-effect")).toHaveAttribute("data-pair-type","constants",{timeout:16000});
  await expect(page.locator("#left-items .balloon")).toHaveCount(0,{timeout:20000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(2);
  await expect(page.locator("#replay-backdrop")).toBeHidden();
  await clickWithReferenceMove(page,"#right-action");
  await expect(page.locator("#right-items .weight")).toHaveCount(4,{timeout:16000});
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
  await page.locator("#replay-close").click();
  await page.locator("#undo").click();
  await expect(page.locator("#left-items .balloon")).toHaveCount(2);
  await expect(page.locator("#right-items .weight")).toHaveCount(2);
});

test("reduced motion teaches balloon and weight cancellation as a clear static stage",async({page})=>{
  test.setTimeout(35000);
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: reduced");
  await page.locator("#level-select").selectOption("10");
  await clickWithReferenceMove(page,"#do-both");
  const effect=page.locator("#left-neutral-effect");
  await expect(effect).toHaveAttribute("data-pair-type","constants",{timeout:10000});
  await expect(effect.locator(".balloon-trail")).toHaveCSS("animation-name","none");
  await expect(page.locator("#left-items .balloon")).toHaveCount(0,{timeout:12000});
  await expect(page.locator("#right-items .weight")).toHaveCount(4);
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:14000});
});
