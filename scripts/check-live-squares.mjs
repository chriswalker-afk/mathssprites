/** Strict post-deployment verification of the actual published release.
 * Run only on main, or manually after Pages deployment. Compare served
 * bytes with this checkout before using the same browser journeys as CI.
 */
import {chromium} from "@playwright/test";
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {setTimeout as pause} from "node:timers/promises";
import {probeWorld4} from "./world4-release-probe.mjs";
const url="https://balance.mrwalkermaths.com/";
const revision=process.env.GITHUB_SHA||"manual";
const result={url,revision,checks:[],errors:[]};
const record=message=>{result.checks.push(message);console.log(message);};
mkdirSync("artifacts",{recursive:true});
let browser;
try{
  const files=["index.html","src/site.mjs","src/app.mjs","src/square-level-plan.mjs",
    "src/square-workshop.mjs","src/square-campaign-levels.mjs","src/square-star-benchmarks.mjs"];
  const expected=new Map(files.map(f=>[f,readFileSync(new URL("../"+f,import.meta.url),"utf8")]));
  // Pages can be a little behind main. Poll a bounded period, rather than
  // accidentally verifying an earlier release and reporting green.
  const waitMs=process.argv.includes("--wait")?180000:0;
  const deadline=Date.now()+waitMs;
  let missing=files;
  do{
    const nonce=Date.now();
    const checks=await Promise.all(files.map(async f=>{
      try{
        const target=new URL(f,url);target.searchParams.set("release",revision+"-"+nonce);
        const response=await fetch(target,{cache:"no-store",signal:AbortSignal.timeout(10000)});
        return response.ok&&(await response.text())===expected.get(f)?null:f;
      }catch{return f;}
    }));
    missing=checks.filter(Boolean);
    if(!missing.length)break;
    if(Date.now()>=deadline)break;
    console.log("Waiting for deployed release files: "+missing.join(", "));
    await pause(6000);
  }while(Date.now()<deadline);
  if(missing.length)throw new Error("Published files do not match the checkout: "+missing.join(", "));
  record("Published entrypoint and World 4 modules match release checkout");
  browser=await chromium.launch({channel:"chrome",headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:"reduce"});
  await probeWorld4(page,url+"?world4-release="+Date.now(),{screenshots:true,log:record});
}catch(error){result.errors.push(String(error));process.exitCode=1;}
finally{
  if(browser)await browser.close();
  writeFileSync("artifacts/live-world4-release.json",JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
}
