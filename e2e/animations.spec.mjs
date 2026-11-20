import {clickWithReferenceMove} from "./reference-move-helper.mjs";
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?preview=resident");
});

test("dark sprites are visible and visibly bounce rather than staying still", async ({ page }) => {
  const sprite = page.locator("#left-items .sprite").first();
  await expect(sprite).toBeVisible();

  const movement = await sprite.locator(".sprite-motion").evaluate(el => {
    const anim = el.getAnimations().find(candidate => candidate.animationName === "sprite-hop");
    if (!anim) return null;
    anim.pause();
    const cycle = anim.effect.getComputedTiming().duration;
    const originalTime = anim.currentTime;
    const heights = [];
    // The sprites now have individual negative phase delays. Sweep one whole
    // cycle instead of assuming the peak occurs at the same absolute time.
    for (let i = 0; i <= 60; i++) {
      anim.currentTime = cycle * i / 60;
      heights.push(el.getBoundingClientRect().top);
    }
    anim.currentTime = originalTime;
    anim.play();
    return Math.max(...heights) - Math.min(...heights);
  });
  expect(movement, "Sprite needs a real vertical hop").not.toBeNull();
  expect(movement).toBeGreaterThan(22);
  // Visual review must include an idle room without the hand obscuring the sprite.
  await page.screenshot({ path: "artifacts/sprites-idle-desktop.png" });
});

test("hand changes objects while touching EACH room, then waits before algebra reveal", async ({ page }) => {
  const left = page.locator("#left-items .weight");
  const right = page.locator("#right-items .weight");
  const hand = page.locator("#hand");
  const replay = page.locator("#replay-backdrop");

  await expect(left).toHaveCount(2);
  await expect(right).toHaveCount(5);
  await replay.evaluate(el => { if (!el.hidden) throw new Error("Replay appeared before solving"); });

  await clickWithReferenceMove(page,"#do-both");

  // This exact intermediate state would never exist if the app just re-rendered
  // the answer instantly and played a cosmetic hand animation afterwards.
  await expect(left).toHaveCount(0);
  const afterLeft = await page.evaluate(() => ({
    handDown: document.querySelector("#hand").classList.contains("reaching"),
    rightCount: document.querySelectorAll("#right-items .weight").length,
    replayHidden: document.querySelector("#replay-backdrop").hidden,
    physicalActionVisible: !document.querySelector("#action-caption").hidden
  }));
  expect(afterLeft.handDown).toBe(true);
  expect(afterLeft.rightCount).toBe(5);
  expect(afterLeft.replayHidden).toBe(true);
  expect(afterLeft.physicalActionVisible).toBe(true);
  await page.screenshot({ path: "artifacts/hand-contact-desktop.png" });

  await expect(right).toHaveCount(3);
  const afterRight = await page.evaluate(() => ({
    handDown: document.querySelector("#hand").classList.contains("reaching"),
    replayHidden: document.querySelector("#replay-backdrop").hidden
  }));
  expect(afterRight.handDown).toBe(true);
  expect(afterRight.replayHidden).toBe(true);
  await expect(replay).toBeVisible();
  await expect(page.locator("#pencil-lines")).toContainText("x + 2 = 5");
});

test("manual mode does not complete the puzzle after only one room is changed", async ({ page }) => {
  await page.locator("#mode-select").selectOption("manual");
  await clickWithReferenceMove(page,"#left-action");
  await expect(page.locator("#left-items .weight")).toHaveCount(0);
  await expect(page.locator("#right-items .weight")).toHaveCount(5);
  await expect(page.locator("#right-action")).toContainText("Match the move here");
  await expect(page.locator("#replay-backdrop")).toBeHidden();

  await clickWithReferenceMove(page,"#right-action");
  await expect(page.locator("#right-items .weight")).toHaveCount(3);
  await expect(page.locator("#replay-backdrop")).toBeVisible();
});

test("Motion: on overrides the system's reduced-motion preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  // Even with an OS-level reduced-motion preference, first visit animates.
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: on");
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: reduced");
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: on");
  const duration = await page.locator("#left-items .sprite-motion").first().evaluate(el => (
    getComputedStyle(el).animationDuration
  ));
  expect(parseFloat(duration)).toBeGreaterThanOrEqual(1);
});

test("on a narrow viewport the hand actually enters the chamber", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#left-items .weight")).toHaveCount(0);
  const overlap = await page.evaluate(() => {
    const hand = document.querySelector("#hand").getBoundingClientRect();
    const items = document.querySelector("#left-items").getBoundingClientRect();
    return Math.max(0, Math.min(hand.bottom, items.bottom) - Math.max(hand.top, items.top));
  });
  expect(overlap).toBeGreaterThan(25);
  await page.screenshot({ path: "artifacts/hand-contact-mobile.png" });
});
