import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?preview=resident");
});

test("waiting sprite bounces, its body wiggles and its eyes independently blink and glance", async ({ page }) => {
  const sprite = page.locator("#left-items .sprite").first();
  await expect(sprite).toBeVisible();

  const motion = await sprite.evaluate(el => {
    const hop = el.querySelector(".sprite-motion");
    const body = el.querySelector(".sprite-body");
    const eyes = el.querySelector(".sprite-eyes");
    const eye = el.querySelector(".sprite-eyes i");
    const samples = [hop, body, eyes, eye].map(node => {
      const animation = node.getAnimations()[0];
      if (!animation) return { name: null, moving: false };
      animation.pause();
      const cycle = animation.effect.getComputedTiming().duration;
      const originalTime = animation.currentTime;
      const poses = new Set();
      const heights = [];
      // Sweep an entire cycle, including the brief blink. Per-sprite delays
      // intentionally make arbitrary fixed-time snapshots unreliable.
      for (let i = 0; i <= 120; i++) {
        animation.currentTime = cycle * i / 120;
        poses.add(getComputedStyle(node).transform);
        if (node === hop) heights.push(node.getBoundingClientRect().top);
      }
      animation.currentTime = originalTime;
      animation.play();
      return {
        name: animation.animationName,
        moving: poses.size > 2,
        travel: node === hop ? Math.max(...heights) - Math.min(...heights) : null
      };
    });
    return samples;
  });

  expect(motion.map(item => item.name)).toEqual([
    "sprite-hop", "sprite-wiggle", "sprite-look", "sprite-blink"
  ]);
  expect(motion.every(item => item.moving)).toBe(true);
  expect(motion[0].travel).toBeGreaterThan(25);
  await page.screenshot({ path: "artifacts/sprites-lively-idle-desktop.png" });
});

test("sprites in the same room do not hop in lockstep and do not reset on tool changes", async ({ page }) => {
  await page.locator("#level-select").selectOption("3");
  const sprites = page.locator("#left-items .sprite");
  await expect(sprites).toHaveCount(2);
  const before = await sprites.evaluateAll(nodes => nodes.map(el => ({
    duration: getComputedStyle(el.querySelector(".sprite-motion")).animationDuration,
    delay: getComputedStyle(el.querySelector(".sprite-motion")).animationDelay,
    wiggle: getComputedStyle(el.querySelector(".sprite-body")).animationDuration,
    blink: getComputedStyle(el.querySelector(".sprite-eyes i")).animationDelay
  })));
  expect(before[0]).not.toEqual(before[1]);

  // Cosmetic UI updates must not recreate the individual actors and synchronise them.
  await sprites.first().evaluate(el => { el.dataset.continuity = "alive"; });
  await page.locator('[data-operation="divide"]').click();
  await page.locator('[data-operation="remove"]').click();
  await expect(sprites.first()).toHaveAttribute("data-continuity", "alive");
  const after = await sprites.evaluateAll(nodes => nodes.map(el => ({
    duration: getComputedStyle(el.querySelector(".sprite-motion")).animationDuration,
    delay: getComputedStyle(el.querySelector(".sprite-motion")).animationDelay,
    wiggle: getComputedStyle(el.querySelector(".sprite-body")).animationDuration,
    blink: getComputedStyle(el.querySelector(".sprite-eyes i")).animationDelay
  })));
  expect(after).toEqual(before);
});

test("hand pauses the target room but not the untouched room", async ({ page }) => {
  await page.locator("#level-select").selectOption("3");
  await page.locator('[data-kind="posX"]').click();
  await page.locator("#do-both").click();
  await expect(page.locator("#left-chamber")).toHaveClass(/hand-target/);
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-play-state", "paused");
  await expect(page.locator("#left-items .sprite-body").first()).toHaveCSS("animation-play-state", "paused");
  await expect(page.locator("#right-items .sprite-motion").first()).toHaveCSS("animation-play-state", "running");
  await expect(page.locator("#right-chamber")).toHaveClass(/hand-target/);
  // After visiting the west chamber, its remaining resident resumes idle life.
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-play-state", "running");
  await expect(page.locator("#right-items .sprite-motion")).toHaveCount(0);
});

test("reduced motion has no fast flickering and Motion: on restores active wiggles", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  // Reduced motion is now an explicit in-game choice rather than an OS default.
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: on");
  await page.locator("#motion-toggle").click();
  const selectors = [".sprite-motion", ".sprite-body", ".sprite-eyes", ".sprite-eyes i"];
  for (const selector of selectors) {
    await expect(page.locator("#left-items " + selector).first()).toHaveCSS("animation-name", "none");
  }
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-name", "sprite-hop");
  await expect(page.locator("#left-items .sprite-body").first()).toHaveCSS("animation-name", "sprite-wiggle");
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#left-items .sprite-eyes i").first()).toHaveCSS("animation-name", "none");
});

test("grouped sprites gently bob inside baskets while counting remains legible on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#level-select").selectOption("1");
  await page.locator("#do-both").click();
  // First the originals must visibly travel into the EMPTY baskets.
  await expect(page.locator("#left-items .division-stage")).toHaveAttribute("data-phase","ready",{timeout:12000});
  const groups = page.locator("#left-items .basket-row > .group-basket");
  await expect(groups).toHaveCount(3);
  const animations = await page.locator("#left-items .group-basket .sprite-motion").evaluateAll(nodes =>
    nodes.map(el => getComputedStyle(el).animationName));
  expect(animations).toEqual(["sprite-basket-bob", "sprite-basket-bob", "sprite-basket-bob"]);
  const width = await page.locator("#left-items .group-basket .sprite").first().evaluate(el =>
    el.getBoundingClientRect().width);
  expect(width).toBeGreaterThan(0);
  await page.screenshot({ path: "artifacts/sprites-lively-baskets-mobile.png" });
});
