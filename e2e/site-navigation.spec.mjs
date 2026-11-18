import { test, expect } from "@playwright/test";

test.beforeEach(async ({page}) => {
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
});
async function startFirstLevel(page) {
  await page.getByRole("button",{name:"Choose a world"}).click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
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

test("all 20 levels render in five chapters with sequential student unlocking", async ({page}) => {
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
  await expect(page.locator(".chapter-group")).toHaveCount(5);
  await expect(page.locator(".level-tile")).toHaveCount(20);
  await expect(page.locator(".level-tile.status-upcoming")).toHaveCount(0);
  await expect(page.locator('[data-level="1"]')).toBeEnabled();
  await expect(page.locator('[data-level="2"]')).toBeDisabled();
  await expect(page.locator('[data-level="6"]')).toBeDisabled();
  await expect(page.locator('[data-level="20"]')).toBeDisabled();
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
  await expect(page.locator("#home-play")).toContainText("Continue Stage 1 · Level 2");
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
  await expect(page.locator('[data-level="1"]')).toContainText("Completed");
  await expect(page.locator('[data-level="2"]')).toBeEnabled();
  await expect(page.locator('[data-level="3"]')).toBeDisabled();
});

test("teacher setting unlocks every World 1 level and persists across reloads", async ({page}) => {
  await page.locator('[data-screen="settings"]').first().click();
  await page.locator("#teacher-unlock").check();
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
  for (let n = 1; n <= 20; n++)
    await expect(page.locator('[data-level="'+n+'"]')).toBeEnabled();
  await page.reload();
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
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
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
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
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
  await page.locator('[data-level="18"]').click();
  await expect(page.locator("#level-title")).toHaveText("The other way round");
  await page.locator("#amount-up").click(); // remove two sprites on both sides
  await page.locator("#do-both").click();
  await expect(page.locator("#undo")).toBeEnabled();
  await page.locator('[data-kind="posOne"]').click();
  await page.locator("#do-both").click(); // remove two weights
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:30000});
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("5 = x");
  await expect(page.locator("#next-level")).toContainText("Next level");
  await page.locator("#next-level").click();
  await expect(page.locator("#level-title")).toHaveText("The quicker route");
});

test("World 1 offers 3 stage cards and an honest, unbuilt Equation Workshop", async ({page}) => {
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await expect(page.locator(".stage-card")).toHaveCount(3);
  await expect(page.locator('.stage-card.stage-ready')).toHaveCount(1);
  await expect(page.locator('.stage-card.stage-planned')).toHaveCount(2);
  await expect(page.locator('[data-stage="guided"]')).toContainText("20");
  await expect(page.locator('[data-stage="independent"]')).toContainText("16");
  await expect(page.locator('[data-stage="notebook"]')).toContainText("12");
  await expect(page.locator('[data-stage="independent"] button')).toHaveCount(0);
  await expect(page.locator('[data-stage="notebook"] button')).toHaveCount(0);
  await expect(page.locator("#world1-workshop")).toContainText("Equation Workshop");
  await expect(page.locator("#world1-workshop button")).toHaveCount(0);
  await page.locator("#stages-back").click();
  await expect(page.locator("#site-worlds")).toBeVisible();
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
  await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:24000});
  await page.locator("#replay-skip").click();
  await expect(page.locator("#pencil-lines")).toContainText("x = 3");
});

test("old saved Stage 1 progress survives the new stage selection unchanged", async ({page}) => {
  const original={completed:[1,2,3],lastPlayed:4};
  await page.evaluate(data=>localStorage.setItem("mathssprites.progress.v1",JSON.stringify(data)),original);
  await page.reload();
  await expect(page.locator("#home-play")).toContainText("Continue Stage 1 · Level 4");
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await expect(page.locator('[data-stage="guided"]')).toContainText("3 of 20");
  await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
  await expect(page.locator(".status-complete")).toHaveCount(3);
  await expect(page.locator('[data-level="4"]')).toBeEnabled();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.progress.v1")));
  expect(stored).toEqual(original);
});

test("Stage 1 mastery does not falsely unlock unfinished stages even for teachers", async ({page}) => {
  const complete={completed:Array.from({length:20},(_,i)=>i+1),lastPlayed:20};
  await page.evaluate(data=>localStorage.setItem("mathssprites.progress.v1",JSON.stringify(data)),complete);
  await page.reload();
  await page.locator('[data-screen="settings"]').first().click();
  await page.locator("#teacher-unlock").check();
  await page.locator('[data-screen="worlds"]').first().click();
  await page.getByRole("button",{name:"Explore stages"}).click();
  await expect(page.locator('[data-stage="guided"]')).toContainText("Stage mastered");
  await expect(page.locator('[data-stage="independent"] button')).toHaveCount(0);
  await expect(page.locator('[data-stage="notebook"] button')).toHaveCount(0);
  await page.getByRole("button",{name:"Choose Stage 1 levels"}).click();
  await expect(page.locator("#world1-finale")).toBeVisible();
  await expect(page.locator("#world1-finale")).toContainText("Guided Balance mastered");
  await expect(page.locator("#world1-progress-bar")).toHaveJSProperty("value",20);
});
