import {clickWithReferenceMove} from "./reference-move-helper.mjs";
import { test, expect } from "@playwright/test";

test.beforeEach(async ({page}) => {
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});
async function startFirstLevel(page) {
  await page.getByRole("button",{name:"Choose a world and level"}).click();
      await page.locator('[data-level="1"]').click();
}
test("Worlds opens the same board as Choose a level; future worlds remain visible", async ({page}) => {
  await page.locator('.site-nav-links [data-screen="levels"]').click();
  await expect(page.locator("#site-levels")).toBeVisible();
  await expect(page.locator("#map-world-tabs button")).toHaveCount(4);
  await expect(page.locator('[data-map-world="opposites"]')).toBeEnabled();
  await expect(page.locator('[data-map-world="fractions"]')).toBeDisabled();
  await expect(page.locator('[data-map-world="squares"]')).toBeDisabled();
  await page.locator("#site-back").click();
  await page.locator("#home-choose-level").click();
  await expect(page.locator("#site-levels")).toBeVisible();
});

test("all 24 Guided levels are selectable from a fresh student account @quick @smoke", async ({page}) => {
  await page.locator('.site-nav-links [data-screen="levels"]').first().click();
      await expect(page.locator(".chapter-group")).toHaveCount(6);
  await expect(page.locator(".level-tile")).toHaveCount(24);
  await expect(page.locator(".level-tile.status-upcoming")).toHaveCount(0);
  await expect(page.locator('[data-level="1"]')).toBeEnabled();
  await expect(page.locator('[data-level="2"]')).toBeEnabled();
  await expect(page.locator('[data-level="6"]')).toBeEnabled();
  await expect(page.locator('[data-level="20"]')).toBeEnabled();
  await expect(page.locator('[data-level="24"]')).toBeEnabled();
  await expect(page.locator(".tile-stars")).toHaveCount(24);
  await expect(page.locator("#level-progress")).toContainText("0 / 72 stars");
});

test("World 1 uses only positive whole numbers; square/root and signed tools are absent", async ({page}) => {
  await startFirstLevel(page);
  await expect(page.locator("#game-shell")).toBeVisible();
  await expect(page.locator("#level-title")).toHaveText("One little resident");
  await expect(page.locator("#campaign-hand-mode")).toBeVisible();
  await expect(page.locator("#mode-select")).toBeHidden();
  await expect(page.locator("#do-both")).toBeVisible();
  await expect(page.locator("#left-action")).toBeHidden();
  await expect(page.locator("#right-action")).toBeHidden();
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

test("solving Level 1 persists progress and earns three stars for the optimal move", async ({page}) => {
  test.setTimeout(55000);
  await startFirstLevel(page);
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:25000});
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("x = 3");
  await expect(page.locator("#next-level")).toContainText("Next level");
  await page.locator("#next-level").click();
  await expect(page.locator("#level-title")).toHaveText("Three weights in the way");
  await page.reload();
  await expect(page.locator("#site-home")).toBeVisible();
  await expect(page.locator("#home-play")).toContainText("Continue Stage 1 · Level 2");
  await page.locator('.site-nav-links [data-screen="levels"]').first().click();
      await expect(page.locator('[data-level="1"]')).toContainText("Completed");
  await expect(page.locator('[data-level="2"]')).toBeEnabled();
  await expect(page.locator('[data-level="3"]')).toBeEnabled();
  await expect(page.locator('[data-level="1"] .tile-stars')).toHaveText("★★★");
});

test("teacher tools persist but do not affect the already-open level access", async ({page}) => {
  await page.locator('[data-screen="settings"]').first().click();
  await page.locator("#teacher-unlock").check();
  await page.locator('.site-nav-links [data-screen="levels"]').first().click();
      for (let n = 1; n <= 24; n++)
    await expect(page.locator('[data-level="'+n+'"]')).toBeEnabled();
  await page.reload();
  await page.locator('.site-nav-links [data-screen="levels"]').first().click();
      await expect(page.locator('[data-level="20"]')).toBeEnabled();
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


test("teacher can open the final multi-step puzzle with only whole-number tools", async ({page}) => {
  await page.locator('[data-screen="settings"]').first().click();
  await page.locator("#teacher-unlock").check();
  await page.locator('.site-nav-links [data-screen="levels"]').first().click();
      await page.locator('[data-level="20"]').click();
  await expect(page.locator("#level-title")).toHaveText("The master experiment");
  await expect(page.locator("#level-prompt")).toContainText("Sometimes adding something helps");
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(5);
  await expect(page.locator("#left-items .weight")).toHaveCount(17);
  await expect(page.locator("#right-items .sprite-black")).toHaveCount(2);
  await expect(page.locator("#right-items .weight")).toHaveCount(29);
  await expect(page.locator('[data-operation="square"]')).toBeHidden();
  await expect(page.locator('[data-operation="sqrt"]')).toBeHidden();
  await expect(page.locator('[data-kind="posX2"]')).toBeHidden();
  await page.locator("#hint").click();
  await expect(page.locator("#speech")).toContainText("ONE weight");
  await page.locator("#game-levels").click();
  await expect(page.locator('[data-level="20"]')).toBeEnabled();
});

test("a reversed, two-sided World 1 level completes and reveals correct algebra", async ({page}) => {
  test.setTimeout(70000);
  await page.locator('[data-screen="settings"]').first().click();
  await page.locator("#teacher-unlock").check();
  await page.locator('.site-nav-links [data-screen="levels"]').first().click();
      await page.locator('[data-level="18"]').click();
  await expect(page.locator("#level-title")).toHaveText("The other way round");
  await clickWithReferenceMove(page,"#amount-up"); // remove two sprites on both sides
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#undo")).toBeEnabled();
  await page.locator('[data-kind="posOne"]').click();
  await page.locator("#amount-up").click();
  await page.locator("#amount-up").click();
  await clickWithReferenceMove(page,"#do-both"); // remove two weights
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:30000});
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("5 = x");
  await expect(page.locator("#next-level")).toContainText("Next level");
  await page.locator("#next-level").click();
  await expect(page.locator("#level-title")).toHaveText("Sealed Crates");
});

test("World 1 stage tabs and Equation Workshop remain accessible from the board", async ({page}) => {
  await page.locator("#home-choose-level").click();
  await expect(page.locator("#map-stage-tabs button")).toHaveCount(3);
  await expect(page.locator('[data-map-stage="guided"]')).toBeEnabled();
  await expect(page.locator('[data-map-stage="independent"]')).toBeEnabled();
  await expect(page.locator('[data-map-stage="notebook"]')).toBeEnabled();
  await page.locator('#site-levels [data-screen="workshop"]').click();
  await expect(page.locator("#site-workshop")).toBeVisible();
  await page.locator("#workshop-back").click();
  await expect(page.locator("#site-levels")).toBeVisible();
});

test("Stage 1 ignores a synthetic switch to manual and mirrors moves automatically", async ({page}) => {
  await startFirstLevel(page);
  await page.locator("#mode-select").evaluate(el => {
    el.value = "manual";
    el.dispatchEvent(new Event("change", {bubbles:true}));
  });
  await expect(page.locator("#mode-select")).toHaveValue("auto");
  await expect(page.locator("#campaign-hand-mode")).toBeVisible();
  await expect(page.locator("#left-action")).toBeHidden();
  await expect(page.locator("#right-action")).toBeHidden();
  await page.locator("#motion-toggle").click();
  await clickWithReferenceMove(page,"#do-both");
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:24000});
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("x = 3");
});

test("old saved Stage 1 progress survives the new stage selection unchanged", async ({page}) => {
  const original={completed:[1,2,3],lastPlayed:4};
  await page.evaluate(data=>localStorage.setItem("mathssprites.progress.v1",JSON.stringify(data)),original);
  await page.reload();
  await expect(page.locator("#home-play")).toContainText("Continue Stage 1 · Level 4");
  await page.locator('.site-nav-links [data-screen="levels"]').first().click();
    await expect(page.locator('[data-stage="guided"]')).toContainText("3 of 24");
    await expect(page.locator(".status-complete")).toHaveCount(3);
  await expect(page.locator('[data-level="4"]')).toBeEnabled();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.progress.v1")));
  expect(stored).toEqual(original);
});

test("Stage 1 mastery still shows completion, and all stages remain selectable", async ({page}) => {
  const complete={completed:Array.from({length:24},(_,i)=>i+1),lastPlayed:24};
  await page.evaluate(data=>localStorage.setItem("mathssprites.progress.v1",JSON.stringify(data)),complete);
  await page.reload();
  await page.locator('[data-screen="settings"]').first().click();
  await page.locator("#teacher-unlock").check();
  await page.locator('.site-nav-links [data-screen="levels"]').first().click();
    await expect(page.locator('[data-stage="guided"]')).toContainText("Stage mastered");
  await expect(page.locator('[data-stage="independent"] button')).toHaveCount(1);
  await expect(page.locator('[data-stage="notebook"] button')).toHaveCount(1);
    await expect(page.locator("#world1-finale")).toBeVisible();
  await expect(page.locator("#world1-finale")).toContainText("Guided Balance mastered");
  await expect(page.locator("#world1-progress-bar")).toHaveJSProperty("value",24);
});
