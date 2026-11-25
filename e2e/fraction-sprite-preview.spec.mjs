import {test,expect} from "@playwright/test";
test("fraction sprite preview preserves the same actual piece actors through separation and rejoin",async({page})=>{
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/fraction-sprite-preview.html");
  const stage=page.locator("#split-stage"),pieces=stage.locator(".fs-piece");
  await expect(pieces).toHaveCount(2);
  await page.locator("#denominator").selectOption("12");
  await expect(pieces).toHaveCount(12);
  const ids=await pieces.evaluateAll(els=>els.map(el=>el.querySelector("clipPath").id));
  await page.locator("#split").click();
  await expect(stage.locator(".fs-assembly")).toHaveClass(/is-separated/);
  await expect(page.locator("#split")).toHaveAttribute("aria-pressed","true");
  await page.locator("#split").click();
  await expect(stage.locator(".fs-assembly")).not.toHaveClass(/is-separated/);
  expect(await pieces.evaluateAll(els=>els.map(el=>el.querySelector("clipPath").id))).toEqual(ids);
  await expect(stage.locator(".fs-joined-art")).toHaveCSS("opacity","1");
  await expect(page.locator("#gallery .fw-sample")).toHaveCount(8);
  expect(errors).toEqual([]);
});
test("partial sprite does not gain a full face or any missing pieces",async({page})=>{
  await page.goto("/fraction-sprite-preview.html");
  await page.locator("#denominator").selectOption("3");
  await page.locator("#numerator").selectOption("2");
  const stage=page.locator("#partial-stage");
  await expect(stage.locator(".fs-piece")).toHaveCount(2);
  await expect(stage.locator(".fs-joined-art")).toHaveCount(0);
  await expect(stage.locator(".fs-assembly")).toHaveAttribute("aria-label","2/3 of one dark sprite (2 equal pieces)");
  await page.locator("#partial-split").click();
  await expect(stage.locator(".fs-assembly")).toHaveClass(/is-separated/);
  await expect(stage.locator(".fs-piece")).toHaveCount(2);
});
test("exact engine regrouping demonstrates copies, equivalent pieces and a borrowed whole",async({page})=>{
  await page.goto("/fraction-sprite-preview.html");
  const cards=page.locator("#example-stage .fw-step-card");
  await page.locator("#next").click();
  await expect(cards.first().locator(".fs-piece")).toHaveCount(6);
  await expect(cards.last().locator(".fs-piece")).toHaveCount(6);
  await page.locator("#next").click();
  await expect(cards.last().locator(".fs-piece")).toHaveCount(2);
  await page.locator("#example").selectOption("sixths");
  await page.locator("#next").click();
  await expect(cards.first().locator(".fs-piece")).toHaveCount(3);
  await expect(cards.last().locator(".fs-piece")).toHaveCount(2);
  await page.locator("#example").selectOption("borrow");
  await page.locator("#next").click();
  await expect(cards.first().locator(".fs-piece")).toHaveCount(4);
  await page.locator("#next").click();
  await expect(cards.last().locator(".fs-piece")).toHaveCount(3);
});
test("sprite preview is responsive and reduced motion retains the same pieces",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/fraction-sprite-preview.html");
  for(const viewport of [{width:360,height:640},{width:1280,height:720}]){
    await page.setViewportSize(viewport);
    await page.locator("#denominator").selectOption("12");
    await page.locator("#numerator").selectOption("11");
    if(await page.locator("#split").getAttribute("aria-pressed")==="false")await page.locator("#split").click();
    await expect(page.locator("#split-stage .fs-piece")).toHaveCount(12);
    await expect(page.locator("#partial-stage .fs-piece")).toHaveCount(11);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    expect(await page.locator("#split-stage .fs-piece").first().evaluate(el=>getComputedStyle(el).transitionDuration)).toBe("0s");
    expect(await page.locator("#split-stage .fs-fragment-motion").first().evaluate(el=>getComputedStyle(el).animationName)).toBe("none");
  }
});
