import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const url = "https://chriswalker-afk.github.io/mathssprites/";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
mkdirSync("artifacts", { recursive: true });

async function inspect(mode) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 },
    reducedMotion: mode });
  const errors = [];
  page.on("pageerror", err => errors.push("JS_ERROR: " + String(err)));
  page.on("response", r => { if (r.status() >= 400) errors.push(r.status() + " " + r.url()); });
  try {
    const response = await page.goto(url + "?live-browser-check=" + mode + "-" +
      (process.env.GITHUB_RUN_ID || "manual"), { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForSelector("#left-items .sprite", { timeout: 12000 });
    const details = await page.evaluate(() => {
      const q = selector => document.querySelector(selector);
      const body = q("body");
      const sprite = q("#left-items .sprite-motion");
      const spriteBody = q("#left-items .sprite-body");
      return {
        bodyClass: body?.className,
        motionText: q("#motion-toggle")?.textContent,
        motionPressed: q("#motion-toggle")?.getAttribute("aria-pressed"),
        options: q("#level-select")?.options.length,
        hasSprite: !!sprite,
        spriteAnimation: sprite ? {
          name: getComputedStyle(sprite).animationName,
          duration: getComputedStyle(sprite).animationDuration,
          state: getComputedStyle(sprite).animationPlayState,
          running: sprite.getAnimations().map(a => ({
            name: a.animationName, state: a.playState
          }))
        } : null,
        bodyAnimation: spriteBody ? {
          name: getComputedStyle(spriteBody).animationName,
          duration: getComputedStyle(spriteBody).animationDuration
        } : null,
        motionPreference: matchMedia("(prefers-reduced-motion: reduce)").matches
      };
    });
    await page.screenshot({ path: "artifacts/live-" + mode + "-initial.png", fullPage: true });
    if (mode === "reduce") {
      // Before the default-on change deploys, the published site starts
      // reduced. Afterwards it starts on. Diagnose both versions fairly.
      if (details.motionText === "Motion: on") {
        details.defaultOnDespiteDevicePreference = true;
        await page.locator("#motion-toggle").click();
        details.afterExplicitMotionOff = await page.evaluate(() => ({
          button: document.querySelector("#motion-toggle")?.textContent,
          spriteAnimation: getComputedStyle(document.querySelector(".sprite-motion")).animationName
        }));
        await page.screenshot({ path: "artifacts/live-explicit-motion-off.png", fullPage: true });
      } else {
        details.defaultOnDespiteDevicePreference = false;
      }
      await page.locator("#motion-toggle").click();
      details.afterExplicitMotionOn = await page.evaluate(() => ({
        bodyClass: document.body.className,
        button: document.querySelector("#motion-toggle")?.textContent,
        spriteAnimation: getComputedStyle(document.querySelector(".sprite-motion")).animationName,
        duration: getComputedStyle(document.querySelector(".sprite-motion")).animationDuration
      }));
      await page.screenshot({ path: "artifacts/live-reduce-then-motion-on.png", fullPage: true });
    }
    results.push({ mode, responseStatus: response?.status(), details, errors });
  } catch (error) {
    results.push({ mode, error: String(error), errors });
  } finally { await page.close(); }
}
await inspect("no-preference");
await inspect("reduce");
await browser.close();
console.log("LIVE BROWSER ANIMATIONS", JSON.stringify(results, null, 2));
writeFileSync("artifacts/live-browser-animations.json", JSON.stringify(results, null, 2));
if (results.some(x => x.error || x.responseStatus !== 200 ||
  (x.mode === "no-preference" && x.details?.spriteAnimation?.name !== "sprite-hop") ||
  (x.mode === "reduce" && x.details?.afterExplicitMotionOn?.spriteAnimation !== "sprite-hop")
)) process.exitCode = 1;
