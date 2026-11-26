// Use the real, visible choices, not synthetic state or a test-only route.
export async function openCampaignBoard(page,world="workshop",stage="guided"){
  await page.locator('.site-nav-links [data-screen="worlds"]').click();
  await page.locator('#world-cards [data-world-stages="'+world+'"]').click();
  await page.locator('#world1-stage-cards [data-stage-open="'+stage+'"]').click();
}
export async function chooseCampaignWorld(page,world,stage){
  const board=page.locator("#site-levels");
  const previous=await board.isVisible()?await board.getAttribute("data-active-stage"):null;
  await openCampaignBoard(page,world,stage||previous||"guided");
}
export async function chooseCampaignStage(page,stage){
  if(await page.locator("#site-levels").isVisible())await page.locator("#site-back").click();
  await page.locator('#world1-stage-cards [data-stage-open="'+stage+'"]').click();
}
export async function launchHomeOrFirst(page){
  if(await page.locator("#home-play").isVisible())await page.locator("#home-play").click();
  else {await openCampaignBoard(page);await playCampaignLevel(page,page.locator('#level-sections [data-level="1"]'));}
}

export async function playCampaignLevel(page,tile){
  await tile.click();
  await page.locator("#board-continue").click();
}
