import { test, expect } from "@playwright/test";

test.beforeEach(async ({page}) => {
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});
async function startFirstLevel(page) {
  await page.getByRole("button",{name:"Choose a world"}).click();
  await page.getByRole("button",{name:"Explore levels"}).click();
  await page.locator('[data-level="1"]').click();
}
test("home is the real entry point; four distinct world cards, three locked", async ({page}) => {
  await expect(page.locator("#site-home")).toBeVisible();
  await expect(page.locator("#game-shell")).toBeHidden();
  await expect(page.getByRole("heading",{name:/A little mystery/})).toBeVisible();
  await page.locator('[data-screen="worlds"]').first().click();
  await expect(page.locator(".world-card")).toHaveCount(4);
  await expect(page.locator(".world-ready")).toHaveCount(1);
  await expect(page.locator(".world-planned")).toHaveCount(3);
  await expect(page.getByText("The Opposite Chambers")).toBeVisible();
  await expect(page.getByText("The Fraction Workshop")).toBeVisible();
  await expect(page.getByText("The Square Laboratory")).toBeVisible();
});

test("twenty level cards render in five chapters, but unfinished puzzles cannot be opened", async ({page}) => {
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore levels"}).click();
  await expect(page.locator(".chapter-group")).toHaveCount(5);
  await expect(page.locator(".level-tile")).toHaveCount(20);
  await expect(page.locator(".level-tile.status-upcoming")).toHaveCount(15);
  await expect(page.locator('[data-level="1"]')).toBeEnabled();
  await expect(page.locator('[data-level="2"]')).toBeDisabled();
  await expect(page.locator('[data-level="6"]')).toBeDisabled();
});

test("World 1 uses only positive whole numbers; square/root and signed tools are absent", async ({page}) => {
  await startFirstLevel(page);
  await expect(page.locator("#game-shell")).toBeVisible();
  await expect(page.locator("#level-title")).toHaveText("One little resident");
  await expect(page.locator('[data-operation="square"]')).toBeHidden();
  await expect(page.locator('[data-operation="sqrt"]')).toBeHidden();
  await expect(page.locator('[data-kind="posX2"]')).toBeHidden();
  await expect(page.locator('[data-kind="negOne"]')).toBeHidden();
  await expect(page.locator('[data-kind="negX"]')).toBeHidden();
  await expect(page.locator("#quantity-mode")).toBeHidden();
  await expect(page.locator("#level-select")).toBeHidden();
  await expect(page.locator('[data-operation="remove"]')).toBeVisible();
  await expect(page.locator('[data-operation="divide"]')).toBeVisible();
  await page.locator("#game-levels").click();
  await expect(page.locator("#site-levels")).toBeVisible();
});

test("solving Level 1 persists progress, starts the real comic and unlocks Level 2", async ({page}) => {
  test.setTimeout(55000);
  await startFirstLevel(page);
  await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:25000});
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("x = 3");
  await expect(page.locator("#next-level")).toContainText("Next level");
  await page.locator("#next-level").click();
  await expect(page.locator("#level-title")).toHaveText("Three weights in the way");
  await page.reload();
  await expect(page.locator("#site-home")).toBeVisible();
  await expect(page.locator("#home-play")).toContainText("Continue at level 2");
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore levels"}).click();
  await expect(page.locator('[data-level="1"]')).toContainText("Completed");
  await expect(page.locator('[data-level="2"]')).toBeEnabled();
  await expect(page.locator('[data-level="3"]')).toBeDisabled();
});

test("teacher setting unlocks all available levels, not incomplete placeholders", async ({page}) => {
  await page.locator('[data-screen="settings"]').first().click();
  await page.locator("#teacher-unlock").check();
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore levels"}).click();
  for (let n = 1; n <= 5; n++) await expect(page.locator('[data-level="'+n+'"]')).toBeEnabled();
  await expect(page.locator('[data-level="6"]')).toBeDisabled();
  await page.reload();
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore levels"}).click();
  await expect(page.locator('[data-level="5"]')).toBeEnabled();
});

test("legacy deep-link preview retains older signed and square experiments for QA", async ({page}) => {
  await page.goto("/?preview=make-square");
  await expect(page.locator("#game-shell")).toBeVisible();
  await expect(page.locator("#site-shell")).toBeHidden();
  await expect(page.locator("#level-title")).toHaveText("Build the square");
  await expect(page.locator('[data-operation="square"]')).toBeVisible();
  await expect(page.locator("#level-select")).toBeVisible();
  await page.locator("#level-select").selectOption("10");
  await expect(page.locator("#quantity-mode")).toHaveValue("signed");
  await expect(page.locator('[data-kind="negOne"]')).toBeVisible();
});
