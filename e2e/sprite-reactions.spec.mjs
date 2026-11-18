import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?preview=resident");
});

async function prepareSpritePickup(page, roll, manual = false) {
  // The game uses randomness only to pick the optional animation, never to
  // decide how many mathematical objects are removed.
  await page.evaluate(value => { Math.random = () => value; }, roll);
  await page.locator("#level-select").selectOption("3");
  await page.locator('[data-kind="posX"]').click();
  if (manual) await page.locator("#mode-select").selectOption("manual");
}
async function recordReactions(page) {
  await page.evaluate(() => {
    window.__spriteReactionEvents = [];
    new MutationObserver(mutations => {
      for (const entry of mutations) {
        if (!(entry.target instanceof HTMLElement)) continue;
        const kind = entry.target.dataset.reaction;
        const phase = entry.target.dataset.reactPhase;
        if (entry.attributeName === "data-reaction" && kind)
          window.__spriteReactionEvents.push("reaction:" + kind);
        if (entry.attributeName === "data-react-phase" && phase)
          window.__spriteReactionEvents.push("phase:" + phase);
      }
    }).observe(document.querySelector("#rooms-row"), {
      subtree: true, attributes: true,
      attributeFilter: ["data-reaction", "data-react-phase"]
    });
  });
}

test("sometimes the sprite ducks before being picked up, then the hand carries it away", async ({ page }) => {
  await prepareSpritePickup(page, 0.12);
  await recordReactions(page);
  await page.locator("#do-both").click();

  const actor = page.locator("#left-items .sprite-reacting");
  await expect(actor).toHaveAttribute("data-reaction", "duck");
  const visual = await actor.evaluate(el => {
    const shell = el.querySelector(".sprite-reaction-shell");
    const animation = shell.getAnimations().find(a => a.animationName === "sprite-duck");
    if (!animation) return { animationName: null, compressed: false };
    animation.pause();
    const t = animation.currentTime;
    const duration = animation.effect.getComputedTiming().duration;
    animation.currentTime = 0;
    const before = shell.getBoundingClientRect().height;
    animation.currentTime = duration * .5;
    const ducked = shell.getBoundingClientRect().height;
    animation.currentTime = t;
    animation.play();
    return { animationName: animation.animationName, compressed: ducked < before * .8 };
  });
  expect(visual).toEqual({ animationName: "sprite-duck", compressed: true });
  await page.screenshot({ path: "artifacts/sprite-ducks-before-pickup.png" });

  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#hand-cargo .held-sprite")).toBeVisible();
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(0);
  await expect(page.locator("#replay-backdrop")).toBeHidden();
  const events = await page.evaluate(() => window.__spriteReactionEvents);
  expect(events).toContain("reaction:duck");
  expect(events).toContain("phase:caught");
});

test("sometimes the sprite dodges sideways, hand tracks it, but still picks it up", async ({ page }) => {
  await prepareSpritePickup(page, 0.42);
  await recordReactions(page);
  await page.locator("#do-both").click();
  const actor = page.locator("#left-items .sprite-reacting");
  await expect(actor).toHaveAttribute("data-reaction", "dodge");
  const dodge = await actor.evaluate(el => {
    const shell = el.querySelector(".sprite-reaction-shell");
    const animation = shell.getAnimations().find(a => a.animationName === "sprite-dodge");
    if (!animation) return null;
    animation.pause();
    const original = animation.currentTime;
    const duration = animation.effect.getComputedTiming().duration;
    animation.currentTime = 0;
    const start = shell.getBoundingClientRect().left;
    animation.currentTime = duration * .4;
    const moved = shell.getBoundingClientRect().left;
    animation.currentTime = original;
    animation.play();
    return Math.abs(start - moved);
  });
  expect(dodge).not.toBeNull();
  expect(dodge).toBeGreaterThan(12);
  await page.screenshot({ path: "artifacts/sprite-dodges-before-pickup.png" });
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(0);
  const events = await page.evaluate(() => window.__spriteReactionEvents);
  expect(events).toContain("reaction:dodge");
  expect(events).toContain("phase:caught");
});

test("on other pickups the hand acts normally, with no comedy reaction", async ({ page }) => {
  await prepareSpritePickup(page, 0.93);
  await recordReactions(page);
  await page.locator("#do-both").click();
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(0);
  const events = await page.evaluate(() => window.__spriteReactionEvents);
  expect(events).toEqual([]);
});

test("manual matching still requires both sides, even if a sprite dodges", async ({ page }) => {
  await prepareSpritePickup(page, 0.41, true);
  await page.locator("#left-action").click();
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-action")).toContainText("Match the move here");
  await expect(page.locator("#replay-backdrop")).toBeHidden();
  await page.locator("#right-action").click();
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(0);
  await expect(page.locator("#replay-backdrop")).toBeHidden();
  await expect(page.locator("#undo")).toBeEnabled();
});

test("reduced motion and weight removal are reaction-free", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.locator("#motion-toggle").click();
  await prepareSpritePickup(page, 0.02);
  await recordReactions(page);
  await page.locator("#do-both").click();
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(0);
  expect(await page.evaluate(() => window.__spriteReactionEvents)).toEqual([]);
  // Even with Motion: on, weights are not living creatures.
  await page.locator("#level-select").selectOption("0");
  await page.locator("#motion-toggle").click();
  await recordReactions(page);
  await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible();
  expect(await page.evaluate(() => window.__spriteReactionEvents)).toEqual([]);
});
