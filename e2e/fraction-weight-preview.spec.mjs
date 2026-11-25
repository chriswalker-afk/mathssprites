import {test,expect} from "@playwright/test";

test("fraction weight art preview separates and rejoins the original pieces",async({page})=>{
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/fraction-weight-preview.html");
  const stage=page.locator("#split-stage");
  await expect(stage.locator(".fw-piece")).toHaveCount(2);
  await page.locator("#denominator").selectOption("12");
  await expect(stage.locator(".fw-piece")).toHaveCount(12);
  await page.getByRole("button",{name:"Separate",exact:true}).click();
  await expect(stage.locator(".fw-assembly")).toHaveClass(/is-separated/);
  await expect(page.locator("#split")).toHaveAttribute("aria-pressed","true");
  await page.getByRole("button",{name:"Rejoin",exact:true}).click();
  await expect(stage.locator(".fw-assembly")).not.toHaveClass(/is-separated/);
  await expect(stage.locator(".fw-piece")).toHaveCount(12);
  await expect(page.locator("#gallery .fw-sample")).toHaveCount(8);
  expect(errors).toEqual([]);
});
test("equivalent fractions and borrowing show the correct conserved fragments",async({page})=>{
  await page.goto("/fraction-weight-preview.html");
  await page.locator("#example").selectOption("whole");
  await page.getByRole("button",{name:"Next",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Borrow one whole into 4 equal pieces"})).toBeVisible();
  await expect(page.locator("#example-stage .fw-step-card").first().locator(".fw-piece")).toHaveCount(4);
  await page.getByRole("button",{name:"Next",exact:true}).click();
  await expect(page.locator("#example-stage .fw-step-card").last().locator(".fw-piece")).toHaveCount(3);
  await page.locator("#example").selectOption("sixths");
  await page.getByRole("button",{name:"Next",exact:true}).click();
  const cards=page.locator("#example-stage .fw-step-card");
  await expect(cards.first().locator(".fw-piece")).toHaveCount(3);
  await expect(cards.last().locator(".fw-piece")).toHaveCount(2);
  await page.getByRole("button",{name:"Next",exact:true}).click();
  await expect(cards.last().locator(".fw-piece")).toHaveCount(5);
  await expect(page.locator("#mixed .fw-count-plaque")).toHaveText("12 whole weights");
});
test("preview fits phone and short laptop, and honours reduced motion",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/fraction-weight-preview.html");
  for(const viewport of [{width:360,height:640},{width:1280,height:720}]){
    await page.setViewportSize(viewport);
    await page.locator("#denominator").selectOption("12");
    await expect(page.locator("#split-stage .fw-piece")).toHaveCount(12);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    expect(await page.locator("#split-stage .fw-piece").first().evaluate(el=>getComputedStyle(el).transitionDuration)).toBe("0s");
  }
});
