import {test,expect} from "@playwright/test";

/**
 * PR52: Use the original, physical weight .token nodes: 3 below + 2 above.
 * Geometry checks run against REAL rendered scene objects, not fake drawings,
 * so the tests also catch CSS selectors that accidentally re-flatten a pile.
 */
test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
});

async function openGuided(page,level){
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="workshop"]').click();
  await page.locator('[data-map-stage="guided"]').click();
  await page.locator('#level-sections [data-level="'+level+'"]').click();
  await expect(page.locator("#game-shell")).toBeVisible();
}
async function measureWeights(page,side,loose=false){
  const track=page.locator("#"+side+"-items "+
    (loose?".loose-floor-shell ":"")+".floor-track:has(> .weight)").first();
  const geometry=await track.evaluate(el=>{
    const weights=[...el.querySelectorAll(":scope > .token.weight")];
    const take=element=>{
      const r=element.getBoundingClientRect();
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
        width:r.width,height:r.height};
    };
    return {
      total:weights.length,
      piles:Object.groupBy(weights,w=>w.dataset.weightPile),
      positions:weights.map(w=>({
        pile:Number(w.dataset.weightPile),slot:Number(w.dataset.weightSlot),
        pileSize:Number(w.dataset.weightPileSize),
        end:w.dataset.weightPileEnd?Number(w.dataset.weightPileEnd):0,
        ...take(w)
      })),
      label:el.querySelector(":scope > .weight-stack-count")?.textContent||"",
      labelCount:el.querySelectorAll(":scope > .weight-stack-count").length,
      noOldCount:document.querySelectorAll(".floor-count").length===0,
      roomLabel:el.closest(".room-items")?.getAttribute("aria-label"),
      width:take(el).width
    };
  });
  delete geometry.piles;
  return geometry;
}
function checkPiles(data,count,{expectedLabel=count>10}={}){
  expect(data.total).toBe(count);
  expect(data.noOldCount).toBe(true);
  expect(data.labelCount).toBe(expectedLabel?1:0);
  expect(data.label).toBe(expectedLabel?count+" weights":"");
  expect(data.roomLabel).toContain(count+" weight");
  const groups=new Map();
  for(const p of data.positions){
    if(!groups.has(p.pile))groups.set(p.pile,[]);
    groups.get(p.pile).push(p);
  }
  expect(groups.size).toBe(Math.ceil(count/5));
  for(const [index,items] of groups){
    const n=Math.min(5,count-index*5);
    expect(items.length).toBe(n);
    expect(items.map(p=>p.slot)).toEqual(Array.from({length:n},(_,i)=>i+1));
    expect(items.map(p=>p.pileSize)).toEqual(Array.from({length:n},()=>n));
    expect(items.map(p=>p.end)).toEqual(Array.from({length:n},(_,i)=>i===n-1?n:0));
    const lower=items.slice(0,Math.min(3,n));
    for(const other of lower.slice(1))
      expect(Math.abs(lower[0].top-other.top)).toBeLessThan(1.7);
    for(const upper of items.slice(3)){
      expect(upper.top).toBeLessThan(lower[0].top-4);
      // Their bases overlap the shoulders of the lower layer, NOT float
      // completely above it and not sit on the chamber's floor.
      expect(upper.bottom).toBeGreaterThan(lower[0].top-1.7);
      expect(upper.bottom).toBeLessThan(lower[0].bottom-4);
    }
    if(n>=4){
      expect(items[3].left).toBeGreaterThan(lower[0].left+1);
      expect(items[3].left).toBeLessThan(lower[1].left-1);
    }
    if(n===5){
      expect(items[4].left).toBeGreaterThan(lower[1].left+1);
      expect(items[4].left).toBeLessThan(lower[2].left-1);
    }
    if(groups.has(index-1)){
      const before=groups.get(index-1);
      const lastBottom=before.slice(0,Math.min(3,before.length)).at(-1);
      expect(lower[0].left).toBeGreaterThanOrEqual(lastBottom.right-.9);
    }
  }
}

test("all Guided weights form 3+2 floor piles, including 1–4 remainders and >10 plaques @quick @smoke",async({page})=>{
  test.setTimeout(105000);
  // 5, 12 (5+5+2), 10, 16 (5+5+5+1), 25, 29 (5×5+4)
  for(const [level,count] of [[1,5],[4,12],[6,10],[7,16],[8,25],[20,29]]){
    await openGuided(page,level);
    checkPiles(await measureWeights(page,"right"),count);
    await page.locator("#game-levels").click();
    await page.locator("#site-back").click();
  }
});

test("crate rooms retain separate intact crates while all loose weights still pile correctly @smoke",async({page})=>{
  await openGuided(page,24);
  const west=page.locator("#left-items");
  const east=page.locator("#right-items");
  await expect(west.locator(".crate-floor-shell > .floor-track > .sealed-crate")).toHaveCount(3);
  await expect(west.locator(".loose-floor-shell > .floor-track > .sprite-black")).toHaveCount(2);
  checkPiles(await measureWeights(page,"left",true),1);
  checkPiles(await measureWeights(page,"right"),23);
  await expect(east.locator(".floor-track > .weight")).toHaveCount(23);
  await expect(west).toHaveAttribute("aria-label",/3 sealed crates, 2 dark sprites, 1 weight/);
});

test("basket sharing still moves exactly the real weight tokens, and finished groups re-stack @smoke",async({page})=>{
  test.setTimeout(75000);
  await openGuided(page,6); // two x = ten weights; divide by two
  checkPiles(await measureWeights(page,"right"),10);
  await page.locator('[data-operation="divide"]').click();
  await page.locator("#amount-up").click();
  await expect(page.locator("#amount-value")).toHaveText("2");
  await page.locator("#do-both").click();
  await expect(page.locator("#right-items .floor-track > .weight")).toHaveCount(5,{timeout:35000});
  checkPiles(await measureWeights(page,"right"),5);
  await expect(page.locator("#right-items .weight-stack-count")).toHaveCount(0);
});
