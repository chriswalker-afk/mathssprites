import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/?preview=resident");
});
async function multiplyBy(page,factor){
  await page.locator('[data-operation="multiply"]').click();
  for(let n=3;n<factor;n++)await page.locator("#amount-up").click();
  for(let n=3;n>factor;n--)await page.locator("#amount-down").click();
}

test("physical multiplication groups the original objects and hand-delivers full wicker copies @smoke",async({page})=>{
  test.setTimeout(85000);
  await multiplyBy(page,3);
  await page.locator("#do-both").click();
  const west=page.locator("#left-items .multiplication-stage");
  const row=west.locator(".basket-row");
  await expect(west).toHaveAttribute("data-phase","dropping",{timeout:8000});
  await expect(west.locator(".division-source .token")).toHaveCount(3);
  await expect(row.locator(".group-basket")).toHaveCount(3);
  await expect(row.locator(".group-basket[data-state='waiting']")).toHaveCount(2);
  await expect(west.locator(".basket-contents .token")).toHaveCount(0);
  await page.screenshot({path:"artifacts/pr29-01-first-wicker-basket-drops.png"});
  const drop=await row.locator(".group-basket[data-state='dropping']").first()
    .evaluate(el=>getComputedStyle(el).animationName);
  expect(drop).toContain("division-wicker-drop");

  await expect(west).toHaveAttribute("data-phase","copying",{timeout:13000});
  await expect(page.locator("#hand-cargo > .group-basket.basket-in-hand")).toBeVisible({timeout:15000});
  await expect(page.locator("#hand-cargo .basket-in-hand .token")).toHaveCount(3);
  await page.screenshot({path:"artifacts/pr29-02-hand-delivers-full-basket.png"});
  await expect(west).toHaveAttribute("data-phase","ready",{timeout:14000});
  await expect(row.locator(".group-basket")).toHaveCount(3);
  await expect(west.locator(".division-source .token")).toHaveCount(0);
  expect(await row.locator(".group-basket").evaluateAll(nodes=>nodes.map(b=>({
    sprites:b.querySelectorAll(".sprite-black").length,
    weights:b.querySelectorAll(".weight").length
  })))).toEqual([{sprites:1,weights:2},{sprites:1,weights:2},{sprites:1,weights:2}]);
  await page.screenshot({path:"artifacts/pr29-03-three-identical-wicker-baskets.png"});
  await expect(west).toHaveAttribute("data-phase","pouring",{timeout:12000});
  await expect(row.locator(".group-basket")).toHaveCount(2,{timeout:12000});
  await page.screenshot({path:"artifacts/pr29-04-hand-pours-and-discards-empty-basket.png"});

  await expect(west).toHaveCount(0,{timeout:25000});
  await expect(page.locator("#left-items .floor-track > .sprite-black")).toHaveCount(3);
  await expect(page.locator("#left-items .floor-track > .weight")).toHaveCount(6);
  await expect(page.locator("#right-items .multiplication-stage")).toHaveCount(1);
  await expect(page.locator("#right-items .floor-track > .weight")).toHaveCount(15,{timeout:25000});
  await expect(page.locator("#do-both")).toBeEnabled({timeout:12000});
  await expect(page.locator(".held-basket-double")).toHaveCount(0);
  await expect(page.locator(".multiplication-stage")).toHaveCount(0);
});

test("five wicker baskets on a small phone stay within each chamber",async({page})=>{
  test.setTimeout(90000);
  await page.setViewportSize({width:390,height:844});
  await multiplyBy(page,5);
  await page.locator("#do-both").click();
  const west=page.locator("#left-items .multiplication-stage");
  await expect(west).toHaveAttribute("data-phase","ready",{timeout:16000});
  await expect(west.locator(".group-basket")).toHaveCount(5);
  expect(await west.locator(".group-basket").evaluateAll(nodes=>
    nodes.map(n=>[n.querySelectorAll(".sprite-black").length,n.querySelectorAll(".weight").length])
  )).toEqual([[1,2],[1,2],[1,2],[1,2],[1,2]]);
  const rects=await page.locator("#left-items").evaluate(el=>{
    const room=el.getBoundingClientRect();
    return [...el.querySelectorAll(".basket-row > .group-basket")].map(node=>{
      const b=node.getBoundingClientRect();
      return {left:b.left-room.left,right:b.right-room.right};
    });
  });
  for(const {left,right} of rects){
    expect(left).toBeGreaterThanOrEqual(-6);
    expect(right).toBeLessThanOrEqual(6);
  }
  await page.screenshot({path:"artifacts/pr29-five-baskets-mobile.png"});
  await expect(page.locator("#left-items .floor-track > .sprite-black")).toHaveCount(5,{timeout:35000});
  await expect(page.locator("#left-items .floor-track > .weight")).toHaveCount(10);
  await expect(page.locator("#right-items .floor-track > .weight")).toHaveCount(25,{timeout:35000});
});

test("reduced motion retains understandable groups without flying props",async({page})=>{
  test.setTimeout(45000);
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-toggle")).toHaveText("Motion: reduced");
  await multiplyBy(page,3);
  await page.locator("#do-both").click();
  const west=page.locator("#left-items .multiplication-stage");
  await expect(west).toHaveAttribute("data-phase","ready",{timeout:10000});
  await expect(west.locator(".group-basket")).toHaveCount(3);
  const animation=await west.locator(".group-basket").first().evaluate(node=>
    getComputedStyle(node).animationName);
  expect(animation).toBe("none");
  await page.screenshot({path:"artifacts/pr29-reduced-motion-basket-snapshot.png"});
  await expect(page.locator("#left-items .floor-track > .sprite-black")).toHaveCount(3,{timeout:12000});
  await expect(page.locator("#right-items .floor-track > .weight")).toHaveCount(15,{timeout:12000});
});

test("manual multiplication commits the first room only, then the matching second room",async({page})=>{
  test.setTimeout(95000);
  await multiplyBy(page,2);
  await page.locator("#mode-select").selectOption("manual");
  await page.locator("#left-action").click();
  await expect(page.locator("#left-items .floor-track > .sprite-black")).toHaveCount(2,{timeout:25000});
  await expect(page.locator("#left-items .floor-track > .weight")).toHaveCount(4);
  await expect(page.locator("#right-items .floor-track > .weight")).toHaveCount(5);
  await expect(page.locator("#right-action")).toContainText("Match the move");
  await expect(page.locator("#replay-backdrop")).toBeHidden();
  await page.locator("#right-action").click();
  await expect(page.locator("#right-items .floor-track > .weight")).toHaveCount(10,{timeout:26000});
  await expect(page.locator("#left-action")).toBeEnabled({timeout:14000});
  await expect(page.locator("#right-items .multiplication-stage")).toHaveCount(0);
});

test("overflow multiplication keeps actual contents and uses wicker rather than ghost prop",async({page})=>{
  test.setTimeout(35000);
  await page.goto("/?preview=root-then-share");
  await multiplyBy(page,2);
  await page.locator("#do-both").click();
  await expect(page.locator("#left-items .multiplication-stage")).toHaveCount(0);
  await expect(page.locator("#right-items .multiplication-stage")).toHaveCount(0);
  await expect(page.locator("#hand-cargo .group-basket.basket-in-hand")).toBeVisible({timeout:10000});
  await expect(page.locator(".held-basket-double")).toHaveCount(0);
  await expect(page.locator("#right-items .floor-track > .weight")).toHaveCount(36);
  await expect(page.locator("#feedback")).toContainText(/too many|overflow|smaller/i,{timeout:22000});
  await expect(page.locator("#right-items .floor-track > .weight")).toHaveCount(36);
});
