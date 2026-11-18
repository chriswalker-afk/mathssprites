import { test, expect } from "@playwright/test";

test("reduced-motion users see an unmistakable way to enable the game animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: reduced");
  await expect(page.locator("#motion-notice")).toBeVisible();
  await expect(page.locator("#motion-notice")).toContainText("Animations are off");
  await expect(page.locator("#motion-enable")).toBeVisible();
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-name","none");
  await page.screenshot({ path: "artifacts/reduced-motion-enable-prompt.png" });

  await page.locator("#motion-enable").click();
  await expect(page.locator("#motion-notice")).toBeHidden();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: on");
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-name", "sprite-hop");
  await expect(page.locator("#left-items .sprite-body").first()).toHaveCSS("animation-name", "sprite-wiggle");
  await page.screenshot({ path: "artifacts/animations-enabled.png" });
});

test("the user's deliberate motion choice persists through a refresh", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#motion-notice")).toBeVisible();
  await page.locator("#motion-enable").click();
  await page.reload();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: on");
  await expect(page.locator("#motion-notice")).toBeHidden();
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-name", "sprite-hop");

  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-notice")).toBeVisible();
  await page.reload();
  await expect(page.locator("#motion-notice")).toBeVisible();
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-name", "none");
});

test("normal-motion visitors see bouncing sprites and no warning", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("#motion-notice")).toBeHidden();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: on");
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-name", "sprite-hop");
});

test("motion controls continue to work even when browser storage is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() { throw new Error("Storage disabled"); }
    });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#motion-notice")).toBeVisible();
  await page.locator("#motion-enable").click();
  await expect(page.locator("#motion-notice")).toBeHidden();
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-name", "sprite-hop");
});
