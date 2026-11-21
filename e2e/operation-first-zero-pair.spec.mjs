import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.goto("/");
});

test("objects cannot be selected until an action is chosen, then the controls follow 1-2-3 @quick @smoke",async({page})=>{
  await page.locator("#home-play").click();
  await expect(page.locator("#object-picker")).toBeHidden();
  await expect(page.locator("#amount-control")).toBeHidden();
  // Defensive check: synthetic clicks must not bypass the operation-first rule.
  await page.evaluate(()=>{
    document.querySelector('[data-kind="posOne"]')
      .dispatchEvent(new MouseEvent("click",{bubbles:true}));
  });
  await expect(page.locator('[data-kind="posOne"]')).toHaveAttribute("aria-pressed","false");
  await page.locator('[data-operation="add"]').click();
  await expect(page.locator("#object-picker")).toBeVisible();
  await expect(page.locator("#amount-control")).toBeHidden();
  await page.locator('[data-kind="posOne"]').click();
  await expect(page.locator("#amount-control")).toBeVisible();
  await expect(page.locator("#amount-label")).toHaveText("3 · How many?");
  await page.locator('[data-operation="divide"]').click();
  await expect(page.locator("#object-picker")).toBeHidden();
  await expect(page.locator("#amount-label")).toHaveText("2 · How many groups?");
  await page.locator('[data-operation="multiply"]').click();
  await expect(page.locator("#amount-label")).toHaveText("2 · How many groups?");
  await page.locator('[data-operation="remove"]').click();
  await expect(page.locator("#object-picker")).toBeVisible();
  await expect(page.locator("#amount-control")).toBeHidden();
  await expect(page.locator('[data-kind="posOne"]')).toHaveAttribute("aria-pressed","false");
});

test("selected white-sprite and balloon buttons use exactly the ordinary selection outline @quick",async({page})=>{
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="opposites"]').click();
  await page.locator("#board-continue").click();
  await page.locator('[data-operation="add"]').click();
  const style=async kind=>{
    await page.locator('[data-kind="'+kind+'"]').click();
    return page.locator('[data-kind="'+kind+'"]').evaluate(el=>{
      const css=getComputedStyle(el);
      return {border:css.borderTopColor,background:css.backgroundColor,shadow:css.boxShadow};
    });
  };
  const normal=await style("posOne");
  expect(await style("posX")).toEqual(normal);
  expect(await style("negX")).toEqual(normal);
  expect(await style("negOne")).toEqual(normal);
});

test("the hand releases its weight before a balloon lifts that SAME physical weight @smoke",async({page})=>{
  test.setTimeout(65000);
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="opposites"]').click();
  await page.locator("#board-continue").click();
  await expect(page.locator("#level-title")).toHaveText("One rising balloon");
  await page.locator("#guide-skip").click();
  await page.locator('[data-operation="add"]').click();
  await page.locator('[data-kind="posOne"]').click();
  await page.locator("#amount-up").click();
  await page.evaluate(()=>{
    const effect=document.getElementById("left-neutral-effect");
    window.__pairObservation=null;
    const observer=new MutationObserver(()=>{
      if(effect.hidden||window.__pairObservation)return;
      const room=document.getElementById("left-items");
      window.__pairObservation={
        realWeights:room.querySelectorAll(".token.weight").length,
        realBalloons:room.querySelectorAll(".token.balloon").length,
        liftedWeights:room.querySelectorAll(".token.weight.zero-weight-positive").length,
        risingBalloons:room.querySelectorAll(".token.balloon.zero-balloon-negative").length,
        handCargoHidden:document.getElementById("hand-cargo").hidden
      };
      observer.disconnect();
    });
    observer.observe(effect,{attributes:true,attributeFilter:["hidden"]});
  });
  await page.locator("#do-both").click();
  await expect.poll(()=>page.evaluate(()=>window.__pairObservation),{timeout:18000})
    .not.toBeNull();
  const observed=await page.evaluate(()=>window.__pairObservation);
  expect(observed).toEqual({
    realWeights:1,realBalloons:1,liftedWeights:1,risingBalloons:1,
    handCargoHidden:true
  });
  // The original objects, not a duplicate visual pair, disappear after lift.
  await expect(page.locator("#left-items .token.weight")).toHaveCount(0,{timeout:30000});
  await expect(page.locator("#left-items .token.balloon")).toHaveCount(0);
});
