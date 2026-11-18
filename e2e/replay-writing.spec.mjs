import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?preview=resident");
});

async function solveFirstLevel(page) {
  await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible();
}

test("the pencil reveals only the symbol it has reached, not whole equations", async ({ page }) => {
  await solveFirstLevel(page);
  const all = page.locator("#pencil-lines .ink-glyph");
  const ink = page.locator("#pencil-lines .ink-glyph.written");
  await expect(all).toHaveCount("x + 2 = 5".length);
  await expect.poll(() => ink.count()).toBeGreaterThan(0);
  const firstCount = await ink.count();
  expect(firstCount).toBeLessThan(await all.count());

  const firstStatus = await page.locator("#replay-progress").innerText();
  expect(firstStatus).toContain("Panel 1 of 2");
  await page.waitForTimeout(650);
  expect(await ink.count()).toBeGreaterThan(firstCount);
  await expect(page.locator("#pencil")).toBeVisible();
  const proximity = await page.evaluate(() => {
    const pen = document.querySelector("#pencil").getBoundingClientRect();
    const written = [...document.querySelectorAll("#pencil-lines .ink-glyph.written")].at(-1);
    const glyph = written.getBoundingClientRect();
    return Math.abs((pen.left + pen.width / 2) - (glyph.left + glyph.width / 2));
  });
  expect(proximity).toBeLessThan(100);
  await page.screenshot({ path: "artifacts/pencil-mid-write-desktop.png" });
  await expect(page.locator("#replay-progress")).toContainText("Panel 1 of 2");

  // The next comic panel cannot appear until the first equation is actually written.
  await expect(page.locator("#replay-progress")).toContainText("Panel 2 of 2", { timeout: 13000 });
});

test("pause freezes partial handwriting and play continues from the same symbol", async ({ page }) => {
  await solveFirstLevel(page);
  const ink = page.locator("#pencil-lines .ink-glyph.written");
  await expect.poll(() => ink.count()).toBeGreaterThan(0);
  await page.locator("#replay-play").click();
  await expect(page.locator("#replay-play")).toContainText("Play");
  const pausedAt = await ink.count();
  await page.waitForTimeout(850);
  expect(await ink.count()).toBe(pausedAt);
  await expect(page.locator("#replay-backdrop")).toHaveClass(/replay-paused/);
  await page.locator("#replay-play").click();
  await expect.poll(() => ink.count()).toBeGreaterThan(pausedAt);
});

test("manual step shows complete equations; watch again restarts the pencil", async ({ page }) => {
  await solveFirstLevel(page);
  await page.locator("#replay-next").click();
  await expect(page.locator("#replay-progress")).toContainText("Panel 2 of 2");
  await expect(page.locator("#pencil-lines")).toContainText("x = 3");
  await expect(page.locator("#pencil-lines .ink-glyph")).toHaveCount(0);
  await expect(page.locator("#pencil")).toBeHidden();
  await expect(page.locator("#next-level")).toBeEnabled();

  await page.locator("#replay-restart").click();
  await expect(page.locator("#replay-progress")).toContainText("Panel 1 of 2");
  await expect(page.locator("#pencil-lines .ink-glyph")).toHaveCount("x + 2 = 5".length);
  await page.locator("#replay-speed").selectOption("0.7");
  await expect(page.locator("#replay-speed")).toHaveValue("0.7");
  await expect.poll(() => page.locator("#pencil-lines .ink-glyph.written").count())
    .toBeGreaterThan(0);
});

test("the pencil remains present on mobile and writes only visible symbols", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await solveFirstLevel(page);
  await expect.poll(() => page.locator("#pencil-lines .ink-glyph.written").count())
    .toBeGreaterThan(1);
  await expect(page.locator("#pencil")).toBeVisible();
  await page.screenshot({ path: "artifacts/pencil-mid-write-mobile.png" });
});

test("reduced-motion mode displays complete readable lines without pencil movement", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: reduced");
  await solveFirstLevel(page);
  await expect(page.locator("#pencil-lines")).toContainText("x + 2 = 5");
  await expect(page.locator("#pencil-lines .ink-glyph")).toHaveCount(0);
  await expect(page.locator("#pencil")).toBeHidden();
});
