import {test,expect} from "@playwright/test";
import {CHAMBER_THEMES} from "../src/chamber-themes.mjs";
const key="mathssprites.cosmetics.v1";
const reward=(p,id)=>p.locator('[data-reward-id="'+id+'"]');
const saved=p=>p.evaluate(key=>localStorage.getItem(key),key);
async function seed(page,theme=null,extraUnlocked=[]){
  await page.addInitScript(({key,theme,extraUnlocked})=>{
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:1,unlockedRewards:["clockmakers-workshop","extra-fluffy","copper","dumbbell","soft-glow",...(theme?[theme]:[]),...extraUnlocked],equipped:{"chamber-theme":theme,fur:"extra-fluffy","weight-shape":"dumbbell","weight-material":"copper","weight-effect":"soft-glow"}}));
    localStorage.setItem("mathssprites.motion-preference.v1","reduced");
  },{key,theme,extraUnlocked});
}
async function gallery(page){
  await page.locator("#home-atelier").click();
  await page.locator('[data-atelier-collection="chambers"]').click();
}
async function assertArt(locator,id){
  await expect(locator).toHaveCSS("background-image",new RegExp(id+"\\.svg"));
  // Decode the actual requested image, not merely the presence of a URL.
  const loaded=await locator.evaluate(async el=>{
    const match=getComputedStyle(el).backgroundImage.match(/url\("([^"]+)"\)/);
    if(!match)return false;
    const image=new Image();image.src=match[1];
    try{await image.decode();return image.naturalWidth===480&&image.naturalHeight===320;}catch{return false;}
  });
  expect(loaded).toBe(true);
}
async function custom(page,eq,world){
  await page.goto("/?workshop="+encodeURIComponent(eq)+"&workshopWorld="+world+"&workshopMode=auto");
  await page.locator("#workshop-create").click();
}
test("ten chamber themes use identical gallery/thumb artwork, safe locked previews and persistent independent selection @quick @smoke",async({page},testInfo)=>{
  test.setTimeout(90000);await seed(page);await page.goto("/");await gallery(page);
  const before=await saved(page),preview=page.locator("#atelier-preview"),rooms=preview.locator(".atelier-mini-room");
  await expect(page.locator("#atelier-collection .atelier-reward:visible")).toHaveCount(10);
  await expect(rooms).toHaveCount(2);
  await expect(preview.locator("#atelier-chamber-west .sprite-black")).toBeVisible();
  await expect(preview.locator("#atelier-chamber-east .sprite-white")).toBeVisible();
  for(const t of CHAMBER_THEMES){
    await reward(page,t.id).click();
    await expect(preview).toHaveAttribute("data-chamber-theme",t.id);
    await expect(preview).toHaveAttribute("data-weight-material","copper");
    await expect(page.locator("#atelier-chamber-name")).toHaveText(t.name);
    for(const room of await rooms.all())await assertArt(room,t.id);
    await assertArt(reward(page,t.id).locator(".atelier-chamber-thumbnail"),t.id);
    await expect(page.locator("body")).toHaveAttribute("data-chamber-theme","original");
    if(t.id!=="clockmakers-workshop")await expect(page.locator("#atelier-equip")).toBeDisabled();
    await testInfo.attach(t.id+".png",{body:await preview.screenshot(),contentType:"image/png"});
  }
  await expect(page.locator("#atelier-collection [data-status$='coming']")).toHaveCount(0);
  await reward(page,"astral-sanctuary").click();
  await expect(reward(page,"astral-sanctuary")).toHaveAttribute("data-status","locked");
  await expect(preview).toHaveAttribute("data-chamber-theme","astral-sanctuary");
  await page.locator("#atelier-cancel-preview").click();
  await expect(preview).toHaveAttribute("data-chamber-theme","original");
  await expect(page.locator("#atelier-equip")).toBeDisabled();
  expect(await saved(page)).toBe(before);
  await reward(page,"clockmakers-workshop").click();await page.locator("#atelier-equip").click();
  await expect(page.locator("body")).toHaveAttribute("data-chamber-theme","clockmakers-workshop");
  await page.locator("#atelier-back").click();await page.reload();await gallery(page);
  await expect(page.locator("#atelier-chamber-name")).toHaveText("Clockmaker's Workshop");
  await page.setViewportSize({width:375,height:812});
  await assertArt(rooms.first(),"clockmakers-workshop");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
  await testInfo.attach("chamber-phone.png",{body:await preview.screenshot(),contentType:"image/png"});
  await page.locator("#atelier-restore").click();
  await expect(page.locator("body")).toHaveAttribute("data-chamber-theme","original");
  await expect(page.locator("body")).toHaveAttribute("data-weight-effect","soft-glow");
  await expect(page.locator("body")).toHaveAttribute("data-sprite-fur","extra-fluffy");
});
test("equipped chamber art is shared by both rooms and four worlds; dimensions and object counts are unchanged",async({page},testInfo)=>{
  test.setTimeout(90000);await seed(page,null,["astral-sanctuary"]);await custom(page,"x+5=10","positive");
  const geometry=async room=>room.evaluate(el=>{
    const c=getComputedStyle(el);return {width:c.width,height:c.height,border:c.borderWidth,radius:c.borderRadius,position:c.position};
  });
  const original=await geometry(page.locator("#left-chamber .room-interior"));
  await page.goto("/");await gallery(page);await reward(page,"astral-sanctuary").click();await page.locator("#atelier-equip").click();
  await custom(page,"x+5=10","positive");
  for(const side of ["left","right"])await assertArt(page.locator("#"+side+"-chamber .room-interior"),"astral-sanctuary");
  expect(await geometry(page.locator("#left-chamber .room-interior"))).toEqual(original);
  await expect(page.locator("#left-items .weight")).toHaveCount(5);
  await expect(page.locator("#right-items .weight")).toHaveCount(10);
  await testInfo.attach("astral-positive.png",{body:await page.screenshot(),contentType:"image/png"});
  await custom(page,"x+5-3=7","signed");
  await assertArt(page.locator("#left-chamber .room-interior"),"astral-sanctuary");
  await expect(page.locator("#left-items .weight")).toHaveCount(5);
  await expect(page.locator("#left-items .balloon")).toHaveCount(3);
  await page.locator('[data-pair-side="left"][data-pair-type="constants"]').click();
  await expect(page.locator("#left-items .weight")).toHaveCount(2,{timeout:20000});
  await custom(page,"x+2/3=4+2/3","fractions");
  const host=page.locator("#fraction-game-host"),lab=host.locator("#fraction-lab");
  await expect(host).toHaveAttribute("data-styles","ready");
  await expect(lab).toHaveAttribute("data-chamber-theme","astral-sanctuary");
  await assertArt(lab.locator("#left-chamber .room-interior"),"astral-sanctuary");
  await assertArt(lab.locator("#right-chamber .room-interior"),"astral-sanctuary");
  await expect(lab.locator("#left-items .fw-label")).toHaveText("2/3");
  await expect(lab.locator("#right-items .fw-pile-weight")).toHaveCount(4);
  await testInfo.attach("themed-fractions.png",{body:await page.screenshot(),contentType:"image/png"});
  await page.setViewportSize({width:375,height:812});
  await assertArt(lab.locator("#left-chamber .room-interior"),"astral-sanctuary");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
  await page.setViewportSize({width:1280,height:720});
  await custom(page,"x²=25","squares");
  await assertArt(page.locator("#left-chamber .room-interior"),"astral-sanctuary");
  await expect(page.locator("#right-items .weight")).toHaveCount(25);
  await expect(page.locator("#left-items .sprite-square")).toHaveCount(1);
  await testInfo.attach("astral-square.png",{body:await page.screenshot(),contentType:"image/png"});
});
