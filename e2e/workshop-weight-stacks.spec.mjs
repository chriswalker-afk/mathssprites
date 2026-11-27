import {test,expect} from "@playwright/test";
import {openCampaignBoard,playCampaignLevel} from "./campaign-menu-helper.mjs";
const split=n=>Array.from({length:Math.ceil(n/10)},(_,i)=>Math.min(10,n-i*10));
const pattern=[[],[1],[2],[3],[4],[3,2],[3,2,1],[4,3],[4,3,1],[4,3,2],[4,3,2,1]];
const host=p=>p.locator("#fraction-game-host");
const nativeRoom=(p,s)=>p.locator("#game-shell #"+s+"-items");
const fracRoom=(p,s)=>host(p).locator("#"+s+"-items");
async function start(page,equation,world="positive",mode="auto"){
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.addInitScript(()=>localStorage.setItem("mathssprites.motion-preference.v1","reduced"));
  const q=new URLSearchParams({workshop:equation,workshopWorld:world,workshopMode:mode});
  await page.goto("/?"+q);
  await expect(page.locator("#site-workshop")).toBeVisible();
  await page.locator("#workshop-create").click();
  if(world==="fractions"){
    await expect(host(page)).toHaveAttribute("data-styles","ready");
    await expect(host(page).locator("#fraction-lab")).toHaveAttribute("data-free-play","true");
  }else await expect(page.locator("#game-shell")).toBeVisible();
}
async function nativeGeometry(page,count,side="right"){
  const track=nativeRoom(page,side).locator(".floor-track:has(> .token.weight)").first();
  await expect(track).toHaveAttribute("data-workshop-stack","ten");
  await expect(track.locator(":scope > .token.weight")).toHaveCount(count);
  const data=await track.evaluate(el=>{
    const room=el.closest(".room-items"),styles=getComputedStyle(el);
    return {scale:parseFloat(styles.getPropertyValue("--floor-scale")),
      width:el.offsetWidth,height:el.offsetHeight,
      availableW:el.closest(".floor-shell").clientWidth,availableH:el.closest(".floor-shell").clientHeight,
      pitch:parseFloat(styles.getPropertyValue("--workshop-weight-pitch")),
      plaque:el.querySelector(":scope > .weight-stack-count")?.textContent||"",
      weights:[...el.querySelectorAll(":scope > .token.weight")].map(w=>({
        group:Number(w.dataset.weightPile),row:Number(w.dataset.workshopRow),slot:Number(w.dataset.weightSlot),
        x:w.offsetLeft,y:w.offsetTop,width:w.offsetWidth,height:w.offsetHeight
      }))};
  });
  const groups=split(count).map((_,i)=>data.weights.filter(w=>w.group===i));
  expect(groups.map(g=>g.length)).toEqual(split(count));
  for(const [i,g] of groups.entries()){
    expect(pattern[g.length].map((_,row)=>g.filter(p=>p.row===row).length)).toEqual(pattern[g.length]);
    const base=g.filter(w=>w.row===0);
    for(const w of g){
      const row=g.filter(q=>q.row===w.row);
      expect(Math.abs(w.x-base[0].x-(w.row/2+row.indexOf(w))*data.pitch)).toBeLessThanOrEqual(2);
      expect(Math.abs(w.y-row[0].y)).toBeLessThanOrEqual(1);
      if(w.row>0){
        const lower=g.find(q=>q.row===w.row-1);
        expect(w.y).toBeLessThan(lower.y);
        expect(w.y+w.height).toBeGreaterThan(lower.y-1);
      }
    }
    if(i){
      const last=groups[i-1].filter(w=>w.row===0).at(-1);
      expect(Math.abs(base[0].x-last.x-data.pitch-3)).toBeLessThanOrEqual(2);
    }
  }
  expect(data.plaque).toBe(count>10?count+" weights":"");
  expect(data.width*data.scale).toBeLessThanOrEqual(data.availableW+2);
  expect(data.height*data.scale).toBeLessThanOrEqual(data.availableH+2);
}
async function fractionGeometry(page,count,{side="right",piece=null}={}){
  const room=fracRoom(page,side),inventory=room.locator(".fw-inventory-objects[data-stack-layout='ten']");
  await expect(inventory.locator(".fw-pile-weight")).toHaveCount(count);
  const data=await inventory.evaluate(el=>{
    const floor=el.closest(".fb-room-floor"),room=floor.closest(".room-items");
    return {scale:parseFloat(getComputedStyle(floor).getPropertyValue("--fb-fit")),
      width:floor.offsetWidth,height:floor.offsetHeight,availableW:room.clientWidth,availableH:room.clientHeight,
      plaque:el.querySelector(".fw-count-plaque")?.textContent||"",
      piles:[...el.querySelectorAll(":scope > .fw-pile")].map(p=>{
        const style=getComputedStyle(p);
        return {x:p.offsetLeft,y:p.offsetTop,width:p.offsetWidth,height:p.offsetHeight,
          pitch:parseFloat(style.getPropertyValue("--fw-stack-pitch")),
          rise:parseFloat(style.getPropertyValue("--fw-stack-rise")),
          weights:[...p.querySelectorAll(":scope > .fw-pile-weight")].map(w=>({
            row:Number(w.dataset.stackRow),x:w.offsetLeft,y:w.offsetTop,height:w.offsetHeight
          }))};
      })};
  });
  expect(data.piles.map(p=>p.weights.length)).toEqual(split(count));
  for(const [i,p] of data.piles.entries()){
    const g=p.weights,base=g.filter(w=>w.row===0);
    expect(pattern[g.length].map((_,row)=>g.filter(w=>w.row===row).length)).toEqual(pattern[g.length]);
    expect(Math.abs(p.width-base.length*p.pitch)).toBeLessThanOrEqual(1);
    for(const w of g){
      const row=g.filter(q=>q.row===w.row);
      expect(Math.abs(w.x-(w.row/2+row.indexOf(w))*p.pitch)).toBeLessThanOrEqual(1.5);
      expect(Math.abs(base[0].y-w.y-w.row*p.rise)).toBeLessThanOrEqual(2);
    }
    if(i){
      const prior=data.piles[i-1];
      if(Math.abs(prior.y+prior.height-p.y-p.height)<2)
        expect(Math.abs(p.x-prior.x-prior.width-3)).toBeLessThanOrEqual(2);
    }
  }
  expect(data.plaque).toBe(count>10?count+" whole weights":"");
  if(piece)await expect(inventory.locator(":scope > .fw-assembly .fw-label")).toHaveText(piece);
  else await expect(inventory.locator(":scope > .fw-assembly")).toHaveCount(0);
  expect(data.width*data.scale).toBeLessThanOrEqual(data.availableW+2);
  expect(data.height*data.scale).toBeLessThanOrEqual(data.availableH+2);
}
test("the reported 22 whole weights form 10 + 10 + 2 with exact fractional pieces and no large intra-row gaps @smoke",async({page},info)=>{
  test.setTimeout(80000);
  await page.setViewportSize({width:1266,height:531});
  await start(page,"2x+1/2=45/2","fractions");
  await fractionGeometry(page,22,{piece:"1/2"});
  await expect(fracRoom(page,"right")).toHaveAttribute("aria-label","East chamber: 0 sprites, 45/2 weights");
  for(const size of [{width:1366,height:768},{width:1092,height:540},{width:390,height:844}]){
    await page.setViewportSize(size);
    await expect.poll(async()=>await fracRoom(page,"right").locator(".fb-room-floor").evaluate(el=>el.offsetWidth*parseFloat(getComputedStyle(el).getPropertyValue("--fb-fit"))<=el.parentElement.clientWidth+2)).toBe(true);
    await fractionGeometry(page,22,{piece:"1/2"});
    await info.attach("fraction-22-"+size.width+"x"+size.height+".png",{body:await page.screenshot(),contentType:"image/png"});
  }
  await page.setViewportSize({width:1366,height:768});
  const h=host(page);
  await h.locator('[data-fb-op="remove"]').click();await h.locator('[data-fb-kind="posOne"]').click();
  await h.locator("#fb-whole").selectOption("0");await h.locator("#fb-denominator").selectOption("2");await h.locator("#fb-numerator").selectOption("1");
  await h.locator("#fb-apply").click();
  await expect(h.locator("#fraction-lab")).toHaveAttribute("data-busy","false",{timeout:25000});
  await fractionGeometry(page,22);
  await h.locator('[data-fb-op="divide"]').click();await h.locator('[data-fb-factor="2"]').click();await h.locator("#fb-apply").click();
  await expect(h.locator("#fraction-lab")).toHaveAttribute("data-solved","true",{timeout:30000});
  await fractionGeometry(page,11);
  await expect(fracRoom(page,"right")).toHaveAttribute("aria-label","East chamber: 0 sprites, 11 weights");
  await expect(page.locator("#replay-backdrop")).toBeVisible();
  await page.locator("#replay-close").click();
  await h.locator("#fb-game-levels").click();await page.locator("#workshop-back").click();
  await openCampaignBoard(page,"fractions","guided");
  await playCampaignLevel(page,page.locator('[data-level="3"]'));
  await expect(host(page)).toHaveAttribute("data-styles","ready");
  await expect(host(page).locator("#fraction-lab")).toHaveAttribute("data-free-play","false");
  await expect(fracRoom(page,"right").locator(".fw-pile[data-stack-layout='ten']")).toHaveCount(0);
  await expect(fracRoom(page,"right").locator(".fw-pile")).toHaveCount(3);
  await expect(fracRoom(page,"right").locator(".fw-pile-weight")).toHaveCount(11);
});
test("native free play uses compact ten stacks with original individual floor tokens, then restores campaign piles @smoke",async({page},info)=>{
  test.setTimeout(80000);
  await page.setViewportSize({width:1266,height:531});
  await start(page,"2x=22");
  await nativeGeometry(page,22);
  await info.attach("whole-22.png",{body:await page.screenshot(),contentType:"image/png"});
  await page.setViewportSize({width:390,height:844});
  await nativeGeometry(page,22);
  await page.setViewportSize({width:1366,height:768});
  await page.locator('[data-operation="divide"]').click();
  await page.locator("#amount-up").click();
  await expect(page.locator("#amount-value")).toHaveText("2");
  await page.locator("#do-both").click();
  await expect(page.locator("#replay-backdrop")).toBeVisible({timeout:35000});
  await nativeGeometry(page,11);
  await page.locator("#replay-close").click();
  await page.locator("#game-levels").click();await page.locator("#workshop-back").click();
  await openCampaignBoard(page,"workshop","guided");
  await playCampaignLevel(page,page.locator('[data-level="6"]'));
  await expect(nativeRoom(page,"right").locator(".floor-track > .weight")).toHaveCount(10);
  await expect(nativeRoom(page,"right").locator("[data-workshop-weight]")).toHaveCount(0);
  await expect(nativeRoom(page,"right").locator(".weight[data-weight-slot='5']")).toHaveCount(2);
});
test("large mixed signed and square Workshop inventories retain cosmetics and their native objects @smoke",async({page})=>{
  test.setTimeout(60000);
  await page.setViewportSize({width:1092,height:540});
  await page.addInitScript(()=>{
    localStorage.setItem("mathssprites.cosmetics.v1",JSON.stringify({version:1,unlockedRewards:["dumbbell","copper"],equipped:{"weight-shape":"dumbbell","weight-material":"copper"}}));
  });
  await start(page,"x+22-3=24","signed","manual");
  await expect(nativeRoom(page,"left").locator(".balloon")).toHaveCount(3);
  await expect(nativeRoom(page,"left").locator(".sprite-black")).toHaveCount(1);
  await expect(page.locator("body")).toHaveAttribute("data-weight-shape","dumbbell");
  await nativeGeometry(page,22,"left");
  await start(page,"x²=36","squares");
  await expect(nativeRoom(page,"left").locator(".sprite-square")).toHaveCount(1);
  await nativeGeometry(page,36);
  await start(page,"2x=48","fractions");
  await expect(host(page).locator("#fraction-lab")).toHaveAttribute("data-weight-shape","dumbbell");
  await fractionGeometry(page,48);
  await expect(fracRoom(page,"right").locator(".fw-pile-weight .fw-assembly[data-shape='dumbbell']")).toHaveCount(48);
});
