import { test, expect } from "@playwright/test";

test("animations start ON by default even when the device prefers reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: on");
  await expect(page.locator("#motion-notice")).toBeHidden();
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-name", "sprite-hop");
  await expect(page.locator("#left-items .sprite-body").first()).toHaveCSS("animation-name", "sprite-wiggle");
  await page.screenshot({ path: "artifacts/motion-on-by-default.png" });
});

test("turning motion OFF explains the choice and provides a clear enable button", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: reduced");
  await expect(page.locator("#motion-notice")).toBeVisible();
  await expect(page.locator("#motion-notice")).toContainText("Animations are off");
  await expect(page.locator("#motion-enable")).toBeVisible();
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-name", "none");
  await page.screenshot({ path: "artifacts/reduced-motion-enable-prompt.png" });

  await page.locator("#motion-enable").click();
  await expect(page.locator("#motion-notice")).toBeHidden();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: on");
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-name", "sprite-hop");
  await expect(page.locator("#left-items .sprite-body").first()).toHaveCSS("animation-name", "sprite-wiggle");
  await page.screenshot({ path: "artifacts/animations-enabled.png" });
});

test("explicitly reduced motion persists through refresh until user turns it back on", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#motion-notice")).toBeHidden();

  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-notice")).toBeVisible();
  await page.reload();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: reduced");
  await expect(page.locator("#motion-notice")).toBeVisible();
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-name", "none");

  await page.locator("#motion-enable").click();
  await page.reload();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: on");
  await expect(page.locator("#motion-notice")).toBeHidden();
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-name", "sprite-hop");
});

test("normal-motion visitors see bouncing sprites and no warning", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("#motion-notice")).toBeHidden();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: on");
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-name", "sprite-hop");
});

test("motion controls work even when browser storage is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() { throw new Error("Storage disabled"); }
    });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#motion-notice")).toBeHidden();
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-name", "sprite-hop");
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-notice")).toBeVisible();
  await page.locator("#motion-enable").click();
  await expect(page.locator("#motion-notice")).toBeHidden();
  await expect(page.locator("#left-items .sprite-motion").first()).toHaveCSS("animation-name", "sprite-hop");
});
