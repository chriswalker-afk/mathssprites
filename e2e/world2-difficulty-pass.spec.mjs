import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
});
async function open(page,stage,number){
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="opposites"]').click();
  await page.locator('[data-map-stage="'+stage+'"]').click();
  await page.locator('[data-level="'+number+'"]').click();
}
async function chooseSigned(page,op,kind,count){
  await page.locator('[data-operation="'+op+'"]').click();
  await page.locator('[data-kind="'+kind+'"]').click();
  await expect(page.locator("#amount-value")).toHaveText("—");
  await page.locator("#amount-up").click();
  for(let n=1;n<count;n++)await page.locator("#amount-up").click();
  await expect(page.locator("#amount-value")).toHaveText(String(count));
}
test("rebalanced white-sprite introduction is physical and controls remain neutral @smoke",async({page})=>{
  test.setTimeout(95000);
  await open(page,"guided",5);
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(1);
  await expect(page.locator("#right-items .sprite-white")).toHaveCount(1);
  await expect(page.locator("#right-items .weight")).toHaveCount(6);
  await expect(page.locator("[data-operation].selected")).toHaveCount(0);
  await expect(page.locator("[data-kind].selected")).toHaveCount(0);
  await expect(page.locator("#amount-value")).toHaveText("—");
  await expect(page.locator("#do-both")).toBeDisabled();
  await chooseSigned(page,"add","posX",1);
  await page.locator("#do-both").click();
  await expect(page.locator("#right-items .sprite-white")).toHaveCount(0,{timeout:22000});
  await expect(page.locator("#left-items .sprite-black")).toHaveCount(2);
  await expect(page.locator("#right-items .weight")).toHaveCount(6);
  await page.locator('[data-operation="divide"]').click();
  await page.locator("#amount-up").click();
  await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:34000});
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2")));
  const record=saved.worlds.opposites.stages.guided;
  expect(record.completed).toContain("op-g-05");
  expect(record.completedRevisions["op-g-05"]).toBe(2);
  expect(record.bestMoves["op-g-05"]).toBe(2);
});
test("World 2 mixed signed rooms keep the same hand action while cancelling differently @smoke",async({page})=>{
  test.setTimeout(98000);
  await open(page,"independent",6);
  await expect(page.locator("#left-items .weight")).toHaveCount(3);
  await expect(page.locator("#right-items .weight")).toHaveCount(13);
  await expect(page.locator("#right-items .balloon")).toHaveCount(2);
  await chooseSigned(page,"add","negOne",3);
  await page.locator("#left-action").click();
  // A Playwright click returns before async hand choreography finishes.
  // Wait for the completed first visit before attempting the second;
  // the game correctly ignores all clicks while the hand is busy.
  await expect(page.locator("#left-items .weight")).toHaveCount(0,{timeout:28000});
  await expect(page.locator("#left-items .balloon")).toHaveCount(0);
  await expect(page.locator("#balance-caption")).toContainText("matching move",{timeout:15000});
  await expect(page.locator("#right-items .balloon")).toHaveCount(2);
  await expect(page.locator("#right-action")).toBeEnabled();
  await page.locator("#right-action").click();
  // The east room has five genuine weight/balloon pairs. They neutralise
  // physically before the committed state contains eight loose weights.
  await expect(page.locator("#right-items .weight")).toHaveCount(8,{timeout:30000});
  await expect(page.locator("#right-items .balloon")).toHaveCount(0,{timeout:30000});
  await expect(page.locator("#undo")).toBeEnabled();
  await page.locator("#undo").click();
  await expect(page.locator("#left-items .weight")).toHaveCount(3);
  await expect(page.locator("#right-items .balloon")).toHaveCount(2);
});
test("existing World 2 completions are visibly archived when their puzzle is revised @smoke",async({page})=>{
  const old={
    version:2,
    worlds:{
      opposites:{stages:{
        guided:{completed:["op-g-01","op-g-05","op-g-18"],lastPlayed:"op-g-05",
          bestMoves:{"op-g-01":1,"op-g-05":2,"op-g-18":1}},
        independent:{completed:[],lastPlayed:"op-i-01",bestMoves:{}},
        notebook:{completed:[],lastPlayed:"op-a-01",bestMoves:{}}
      }}
    }
  };
  await page.evaluate(data=>localStorage.setItem("mathssprites.campaign.v2",JSON.stringify(data)),old);
  await page.reload();
  await page.locator("#home-choose-level").click();
  await page.locator('[data-map-world="opposites"]').click();
  await expect(page.locator('[data-level="1"]')).toHaveClass(/status-complete/);
  await expect(page.locator('[data-level="5"]')).toHaveClass(/status-revised/);
  await expect(page.locator('[data-level="5"] .tile-status')).toContainText("Revised");
  await expect(page.locator('[data-level="18"]')).toHaveClass(/status-revised/);
  await expect(page.locator("#world1-progress-number")).toContainText("1 of 24 complete");
  await expect(page.locator("#level-progress")).toContainText("3 / 72 stars earned");
  await page.locator('[data-level="5"]').click();
  const record=await page.evaluate(()=>JSON.parse(localStorage.getItem("mathssprites.campaign.v2"))
    .worlds.opposites.stages.guided);
  expect(record.historical["op-g-05"]).toEqual({revision:1,bestMoves:2});
  expect(record.historical["op-g-18"]).toEqual({revision:1,bestMoves:1});
  expect(record.completed).toEqual(["op-g-01"]);
  expect(record.completedRevisions["op-g-05"]).toBeUndefined();
});
