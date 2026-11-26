import {test,expect} from "@playwright/test";
import {mkdirSync,writeFileSync} from "node:fs";
import {COSMETIC_REWARDS,findCosmeticReward} from "../src/cosmetic-catalog.mjs";
import {CHAMBER_THEMES} from "../src/chamber-themes.mjs";
const key="mathssprites.cosmetics.v1";
const slots=["weight-shape","weight-material","weight-effect"];
const variants=Object.fromEntries(slots.map(slot=>[slot,[null,...COSMETIC_REWARDS.filter(r=>r.slot===slot).map(r=>r.id)]]));
const sizes=[{width:1280,height:900},{width:1280,height:720},{width:1092,height:540},{width:360,height:640}];
const all=COSMETIC_REWARDS.map(r=>r.id);
const outfit=findCosmeticReward("grand-alchemist").loadout;
const saved=p=>p.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
const reward=(p,id)=>p.locator('[data-reward-id="'+id+'"]');
async function seed(context,equipped={}){
  await context.addInitScript(({key,all,equipped})=>{
    if(localStorage.getItem(key)===null)localStorage.setItem(key,JSON.stringify({version:1,unlockedRewards:all,equipped}));
    localStorage.setItem("mathssprites.motion-preference.v1","reduced");
  },{key,all,equipped});
}
async function custom(page,eq,world){
  await page.goto("/?workshop="+encodeURIComponent(eq)+"&workshopWorld="+world+"&workshopMode=auto");
  await page.locator("#workshop-create").click();
}
async function gallery(page,collection){
  await page.locator("#home-atelier").click();
  await page.locator('[data-atelier-collection="'+collection+'"]').click();
}
async function equip(page,id){
  await reward(page,id).click();
  await expect(page.locator("#atelier-equip")).toBeEnabled();
  await page.locator("#atelier-equip").click();
}
function errors(page){
  const failures=[];
  page.on("pageerror",e=>failures.push(String(e)));
  page.on("response",res=>{if(/^https?:/.test(page.url())&&new URL(res.url()).origin===new URL(page.url()).origin&&res.status()>=400)failures.push(res.status()+" "+res.url())});
  return failures;
}

test("all 336 weight appearances use independent, matching native and exact fractional artwork",async({page,context},info)=>{
  test.setTimeout(60000);
  await page.emulateMedia({reducedMotion:"reduce"});
  await seed(context,{"weight-shape":"kettlebell","weight-material":"cast-iron","weight-effect":"golden-halo"});
  await page.goto("/");await gallery(page,"weights");
  const before=await saved(page),faults=errors(page);
  // Use the real Atelier native and fractional renderers in an isolated,
  // unsaved preview scope. No synthetic progress or fake game transactions.
  const report=await page.evaluate(async variants=>{
    const {applyLaboratoryAppearance}=await import(new URL("src/laboratory-cosmetics.mjs?v=96",document.baseURI).href);
    const {weightAssemblyMarkup}=await import(new URL("src/fraction-weights.mjs?v=94",document.baseURI).href);
    const scope=document.querySelector("#atelier-preview"),whole=scope.querySelector(".atelier-weight-stage .weight"),fraction=scope.querySelector("#atelier-weight-fraction");
    const tiny=document.createElement("span");tiny.className="tiny-weight";scope.append(tiny);
    const previous=Object.fromEntries(["weight-shape","weight-material","weight-effect","chamber-theme"].map(k=>[k,scope.getAttribute("data-"+k)]));
    const oldMarkup=fraction.innerHTML;
    const bad=[],shapePaint=new Map(),materialPaint=new Map(),effectPaint=new Map(),signatures=new Set();
    const describe=()=>{const w=getComputedStyle(whole),e=getComputedStyle(whole,"::before");return {width:w.width,height:w.height,clip:w.clipPath,metal:w.backgroundImage,transform:w.transform,light:e.backgroundImage,content:e.content,anim:e.animationName,pointer:e.pointerEvents};};
    let baseline,checked=0;
    function consistent(map,key,value,why){if(map.has(key)&&map.get(key)!==value)bad.push(why);map.set(key,value);}
    try{
      for(const shape of variants["weight-shape"]){
        fraction.innerHTML=weightAssemblyMarkup(3,[0,1],{shape:shape||"original"});
        const outline=[...fraction.querySelectorAll(".fw-cut-edge")].map(el=>el.getAttribute("points")||el.getAttribute("d")).join("|");
        for(const material of variants["weight-material"])for(const effect of variants["weight-effect"]){
          const selection={"weight-shape":shape,"weight-material":material,"weight-effect":effect};
          const id=[shape,material,effect].map(x=>x||"original").join("/");
          applyLaboratoryAppearance(scope,selection);
          const d=describe(),g=fraction.querySelector(".fw-weight-effect"),stop=getComputedStyle(fraction.querySelector(".fw-material-light")).stopColor;
          if(!baseline)baseline=d;
          if(d.width!==baseline.width||d.height!==baseline.height||d.transform!==baseline.transform)bad.push(id+" changed token footprint");
          if(!d.metal.includes(stop)||d.metal==="none"||getComputedStyle(tiny).backgroundImage==="none")bad.push(id+" missing/mismatched metal paint");
          if(!d.clip.startsWith("polygon("))bad.push(id+" missing silhouette");
          if(d.anim!=="none"||d.pointer!=="none"||d.content!==(effect?'""':"none")||(effect&&d.light==="none"))bad.push(id+" incorrect static lighting");
          if(getComputedStyle(g).display!==(effect?"inline":"none")||getComputedStyle(g).animationName!=="none")bad.push(id+" incorrect fractional effect");
          if(fraction.querySelectorAll(".fw-piece").length!==2||fraction.querySelector(".fw-label").textContent!=="2/3"||fraction.querySelector(".fw-assembly").dataset.shape!==(shape||"original"))bad.push(id+" fractional quantity changed");
          if([...fraction.querySelectorAll(".fw-cut-edge")].map(el=>el.getAttribute("points")||el.getAttribute("d")).join("|")!==outline)bad.push(id+" paint changed cuts");
          consistent(shapePaint,shape,d.clip,id+" shape depends on material/effect");
          consistent(materialPaint,material,d.metal,id+" material depends on shape/effect");
          consistent(effectPaint,effect,d.light,id+" effect depends on shape/material");
          signatures.add([d.clip,d.metal,d.light,d.content].join("|"));
          checked++;
        }
      }
      applyLaboratoryAppearance(scope,{});
      fraction.innerHTML=weightAssemblyMarkup(3,[0,1]);
      const reset=describe();
      if(JSON.stringify(reset)!==JSON.stringify(baseline))bad.push("nested original did not reset to baseline");
      return {checked,unique:signatures.size,shapes:new Set(shapePaint.values()).size,materials:new Set(materialPaint.values()).size,effects:new Set(effectPaint.values()).size,failures:bad};
    }finally{tiny.remove();fraction.innerHTML=oldMarkup;applyLaboratoryAppearance(scope,previous);}
  },variants);
  await info.attach("weight-combination-audit.json",{body:JSON.stringify(report,null,2),contentType:"application/json"});
  expect(report).toEqual({checked:336,unique:336,shapes:7,materials:8,effects:6,failures:[]});
  expect(await saved(page)).toEqual(before);
  expect(faults).toEqual([]);
});

for(const scenario of [{world:"positive",eq:"12x=48",sprites:12},{world:"fractions",eq:"48x=48",sprites:48}]){
  test("all ten themes in crowded "+scenario.world+" chambers at four viewport sizes",async({page,context},info)=>{
    test.setTimeout(180000);
    await page.emulateMedia({reducedMotion:"reduce"});
    await seed(context,{...outfit,"weight-shape":"kettlebell","weight-material":"cast-iron","weight-effect":"frost-shimmer"});
    const faults=errors(page);
    await custom(page,scenario.eq,scenario.world);
    const isFraction=scenario.world==="fractions";
    const host=page.locator("#fraction-game-host"),root=isFraction?host.locator("#fraction-lab"):page.locator("body");
    if(isFraction)await expect(host).toHaveAttribute("data-styles","ready");
    await expect(root.locator("#right-items "+(isFraction?".fw-pile-weight":".weight"))).toHaveCount(48);
    await expect(root.locator("#left-items "+(isFraction?".fs-whole-actor":".sprite-black"))).toHaveCount(scenario.sprites);
    const before=await saved(page),report=[];
    const apply=id=>root.evaluate((el,id)=>{el.setAttribute("data-chamber-theme",id);},id);
    const measure=()=>root.evaluate(el=>{
      const selectors=["#left-chamber .room-interior","#right-chamber .room-interior","#left-items","#right-items","#left-chamber .scale-pan","#right-chamber .scale-pan",".pivot-dial"];
      return selectors.map(sel=>{const e=el.querySelector(sel),c=getComputedStyle(e),b=e.getBoundingClientRect();return {sel,width:c.width,height:c.height,border:c.borderWidth,radius:c.borderRadius,box:[b.x,b.y,b.width,b.height].map(n=>Math.round(n*10)/10)};});
    });
    for(const size of sizes){
      await page.setViewportSize(size);
      await apply("original");
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      const baseline=await measure();
      for(const theme of CHAMBER_THEMES){
        // In-place paint sweep of the actual game DOM. Gameplay and profile
        // saves remain untouched; ordinary equipment is covered separately.
        await apply(theme.id);
        const rooms=root.locator(".playfield .room-interior");
        await expect(rooms).toHaveCount(2);
        const art=await rooms.evaluateAll(async(els,id)=>Promise.all(els.map(async el=>{
          const bg=getComputedStyle(el).backgroundImage;
          const m=bg.match(/url\("([^"]+)"\)/);
          if(!m||!m[1].includes(id+".svg"))return false;
          const img=new Image();img.src=m[1];
          try{await img.decode();return img.naturalWidth===480&&img.naturalHeight===320;}catch{return false;}
        })),theme.id);
        expect(art,theme.id).toEqual([true,true]);
        expect(await measure(),theme.id+" changed room geometry").toEqual(baseline);
        await expect(root.locator("#right-items "+(isFraction?".fw-pile-weight":".weight"))).toHaveCount(48);
        await expect(root.locator("#left-items "+(isFraction?".fs-whole-actor":".sprite-black"))).toHaveCount(scenario.sprites);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
        const name=scenario.world+"-"+size.width+"x"+size.height+"-"+theme.id;
        mkdirSync("artifacts/cosmetic-release-qa",{recursive:true});
        await page.screenshot({path:"artifacts/cosmetic-release-qa/"+name+".png",fullPage:true,animations:"disabled"});
        report.push({name,geometryUnchanged:true,weightCount:48,spriteCount:scenario.sprites});
      }
    }
    await apply("original");
    writeFileSync("artifacts/cosmetic-release-qa/"+scenario.world+".json",JSON.stringify(report,null,2));
    expect(report.length).toBe(40);
    expect(await saved(page)).toEqual(before);
    expect(faults).toEqual([]);
  });
}

test("cosmetic changes synchronize between tabs, deferring active fraction experiments until leaving the level",async({page,context})=>{
  test.setTimeout(75000);
  await seed(context);
  await page.goto("/");await gallery(page,"chambers");
  const other=await context.newPage();
  try{
    await other.goto("/");await gallery(other,"chambers");
    await equip(page,"astral-sanctuary");
    await expect(other.locator("body")).toHaveAttribute("data-chamber-theme","astral-sanctuary");
    await expect(other.locator("#atelier-chamber-name")).toHaveText("Astral Sanctuary");
    await expect(other.locator("#reward-celebration")).toBeHidden();
    await custom(other,"x+2/3=4+2/3","fractions");
    const lab=other.locator("#fraction-game-host #fraction-lab");
    await expect(lab).toHaveAttribute("data-chamber-theme","astral-sanctuary");
    await expect(lab.locator("#left-items .fw-assembly")).toHaveAttribute("data-shape","original");
    await page.locator('[data-atelier-collection="weights"]').click();
    await equip(page,"kettlebell");
    await page.locator('[data-atelier-collection="chambers"]').click();
    await equip(page,"frostbound-vault");
    // Receive the real browser storage event but preserve the active scene.
    await expect.poll(()=>other.evaluate(key=>JSON.parse(localStorage.getItem(key)).equipped["chamber-theme"],key)).toBe("frostbound-vault");
    await expect(lab).toHaveAttribute("data-chamber-theme","astral-sanctuary");
    await expect(lab.locator("#left-items .fw-assembly")).toHaveAttribute("data-shape","original");
    await lab.locator("#fb-game-home").click();
    await expect(other.locator("body")).toHaveAttribute("data-chamber-theme","frostbound-vault");
    await expect(other.locator("body")).toHaveAttribute("data-weight-shape","kettlebell");
    await custom(other,"x+2/3=4+2/3","fractions");
    await expect(lab).toHaveAttribute("data-chamber-theme","frostbound-vault");
    await expect(lab.locator("#left-items .fw-assembly")).toHaveAttribute("data-shape","kettlebell");
    await expect(lab.locator("#left-items .fw-label")).toHaveText("2/3");
    await expect(other.locator("#reward-celebration")).toBeHidden();
  }finally{await other.close();}
});
