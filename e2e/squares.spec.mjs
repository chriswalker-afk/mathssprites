import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
});

async function floorMetrics(page, side) {
  return page.locator("#" + side + "-items").evaluate(room => {
    const track = room.querySelector(".floor-track");
    if (!track) return null;
    const b = room.getBoundingClientRect(), t = track.getBoundingClientRect();
    const tokens = [...track.querySelectorAll(":scope > .token")];
    const bottoms = tokens.map(el => el.getBoundingClientRect().bottom);
    return {
      count: tokens.length, wrap: getComputedStyle(track).flexWrap,
      width: t.width, roomWidth: b.width,
      minBottom: Math.min(...bottoms), maxBottom: Math.max(...bottoms),
      left: t.left, right: t.right, roomLeft: b.left, roomRight: b.right
    };
  });
}

test("weights and sprites always occupy one row along the floor on desktop and phone", async ({ page }) => {
  await page.locator("#level-select").selectOption("4");
  for (const side of ["left", "right"]) {
    const m = await floorMetrics(page, side);
    expect(m).not.toBeNull();
    expect(m.wrap).toBe("nowrap");
    expect(m.count).toBe(side === "left" ? 15 : 20);
    expect(m.maxBottom - m.minBottom).toBeLessThan(2.5);
    expect(m.width).toBeLessThanOrEqual(m.roomWidth + 2);
    expect(m.left).toBeGreaterThanOrEqual(m.roomLeft - 4);
    expect(m.right).toBeLessThanOrEqual(m.roomRight + 4);
  }
  await page.screenshot({path:"artifacts/all-on-one-floor-row-desktop.png"});
  await page.setViewportSize({width:390,height:844});
  for (const side of ["left", "right"]) {
    const m = await floorMetrics(page, side);
    expect(m.wrap).toBe("nowrap");
    expect(m.count).toBe(side === "left" ? 15 : 20);
    expect(m.maxBottom - m.minBottom).toBeLessThan(2.5);
    expect(m.width).toBeLessThanOrEqual(m.roomWidth + 2);
  }
  await page.screenshot({path:"artifacts/all-on-one-floor-row-mobile.png"});
});

test("squaring constructs a matching column and square before pounding round x to x²", async ({ page }) => {
  await page.locator("#level-select").selectOption("5");
  await expect(page.locator('[data-operation="square"]')).toHaveClass(/selected/);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(3);
  await expect(page.locator("#amount-control")).toBeHidden();
  await page.locator("#do-both").click();
  await expect(page.locator("#left-area-preview")).toBeVisible();
  await expect(page.locator("#left-area-preview")).toHaveAttribute("data-phase","arranging");
  await expect(page.locator("#left-area-preview .area-cell")).toHaveCount(1);
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(1);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(0);
  await expect(page.locator("#right-items .weight")).toHaveCount(3);
  await page.screenshot({path:"artifacts/hand-presses-sprite-into-square.png"});
  await expect(page.locator("#right-area-preview .area-cell")).toHaveCount(9);
  await expect(page.locator("#right-area-preview .area-cell.role-row")).toHaveCount(3);
  await expect(page.locator("#right-area-preview .area-cell.role-column")).toHaveCount(2);
  await expect(page.locator("#right-area-preview .area-cell.role-fill")).toHaveCount(4);
  await page.screenshot({path:"artifacts/hand-builds-three-by-three.png"});
  await expect(page.locator("#right-items .weight")).toHaveCount(9);
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
  await expect(page.locator("#pencil-lines")).toContainText("x²", {timeout:16000});
});

test("principal root keeps a side of the array and squishes a square sprite round", async ({ page }) => {
  await page.locator("#level-select").selectOption("6");
  await expect(page.locator('[data-operation="sqrt"]')).toHaveClass(/selected/);
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(1);
  await page.locator("#do-both").click();
  await expect(page.locator("#left-area-preview")).toBeVisible();
  await expect(page.locator("#left-area-preview .area-cell")).toHaveCount(1);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(0);
  await page.screenshot({path:"artifacts/square-squishes-back-into-round-sprite.png"});
  await expect(page.locator("#right-area-preview .area-cell")).toHaveCount(9);
  await expect(page.locator("#right-area-preview")).toHaveAttribute("data-operation","sqrt");
  await expect(page.locator("#right-items .weight")).toHaveCount(3);
  await page.screenshot({path:"artifacts/nine-weight-square-keeps-three.png"});
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
});

test("advanced square root reduces 4x²=36 to 2x=6 before sharing equally", async ({page}) => {
  await page.locator("#level-select").selectOption("7");
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(4);
  await expect(page.locator("#right-items .weight")).toHaveCount(36);
  const floor = await floorMetrics(page,"right");
  expect(floor.count).toBe(36);
  expect(floor.wrap).toBe("nowrap");
  await page.locator("#do-both").click();
  await expect(page.locator("#left-area-preview .area-cell")).toHaveCount(4);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(2);
  await expect(page.locator("#right-area-preview .area-cell")).toHaveCount(36);
  await page.screenshot({path:"artifacts/root-36-objects-into-six.png"});
  await expect(page.locator("#right-items .weight")).toHaveCount(6);
  await expect(page.locator("#replay-backdrop")).toBeHidden();
  await page.locator('[data-operation="divide"]').click();
  await page.locator("#do-both").click();
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(3);
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
});

test("the hand refuses to square a mixed x+2 room instead of teaching false algebra", async ({page}) => {
  await page.locator('[data-operation="square"]').click();
  await page.locator("#do-both").click();
  await expect(page.locator("#feedback")).toContainText(/mixed rooms|4x/i);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#left-items .weight")).toHaveCount(2);
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  await expect(page.locator("#hand")).toHaveAttribute("data-phase","rest");
  await expect(page.locator("#replay-backdrop")).toBeHidden();
});

test("manual square must be applied on both sides before a victory replay",async ({page})=>{
  await page.locator("#level-select").selectOption("5");
  await page.locator("#mode-select").selectOption("manual");
  await page.locator("#left-action").click();
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(3);
  await expect(page.locator("#replay-backdrop")).toBeHidden();
  await page.locator("#right-action").click();
  await expect(page.locator("#right-items .weight")).toHaveCount(9);
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:20000});
});
