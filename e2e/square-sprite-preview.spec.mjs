import {test,expect} from "@playwright/test";
import {mkdirSync} from "node:fs";
const preview="/square-sprite-preview.html";
const actor=page=>page.locator("#ss-morph-stage .sprite");
const body=page=>actor(page).locator(".sprite-body");
async function shot(page,name){mkdirSync("artifacts",{recursive:true});await page.screenshot({path:"artifacts/square-sprite-"+name+".png",fullPage:true});}
test("square art uses the same species and a distinct unlabelled silhouette @quick @smoke",async({page})=>{
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.emulateMedia({reducedMotion:"no-preference"});await page.goto(preview);
  const round=page.locator("#ss-round .sprite-black"),square=page.locator("#ss-square .sprite-square");
  await expect(round).toHaveCount(1);await expect(square).toHaveCount(1);
  await expect(square.locator(".sprite-body")).toHaveCSS("border-top-left-radius","7px");
  await expect(square.locator(".sprite-motion")).toHaveCSS("animation-name","square-creature-hop");
  await expect(square.locator(".sprite-body")).toHaveCSS("animation-name","square-creature-wiggle");
  await expect(round.locator(".sprite-motion")).toHaveCSS("animation-name","sprite-hop");
  await expect(square.locator(".sprite-eyes i")).toHaveCount(2);
  const colors=await page.locator("#ss-round .sprite-body,#ss-square .sprite-body").evaluateAll(els=>els.map(e=>getComputedStyle(e).backgroundImage));
  expect(colors[0]).toBe(colors[1]);
  expect(await square.locator(".sprite-body").evaluate(el=>getComputedStyle(el,"::before").clipPath)).toMatch(/^polygon/);
  await expect(page.locator(".square-symbol")).toHaveCount(0);
  await expect(page.locator("#ss-held .held-sprite-square")).toHaveCount(1);
  await expect(page.locator("#ss-cell .box-actor-x2")).toHaveCount(1);
  await expect(page.locator("#ss-mini .mini-token.posX2")).toHaveCount(1);
  expect(errors).toEqual([]);
  await shot(page,"comparison");
});
test("shape preview morphs in both directions without replacing the actor or writing progress",async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});await page.goto(preview);
  const before=await page.evaluate(()=>JSON.stringify(localStorage));
  await actor(page).evaluate(el=>el.dataset.qaIdentity="same");
  await page.locator("#ss-to-square").click();
  await expect(actor(page)).toHaveClass(/sprite-square/);
  await expect(actor(page)).toHaveAttribute("data-qa-identity","same");
  await expect(page.locator("#ss-form-status")).toHaveText("Square form");
  await expect(actor(page)).not.toHaveAttribute("data-square-morph","square");
  await expect(body(page)).toHaveCSS("animation-name","square-creature-wiggle");
  await page.locator("#ss-to-round").click();
  await expect(actor(page)).toHaveClass(/sprite-black/);
  await expect(actor(page)).toHaveAttribute("data-qa-identity","same");
  await expect(actor(page)).not.toHaveAttribute("data-square-morph","round");
  await expect(body(page)).toHaveCSS("animation-name","sprite-wiggle");
  await expect(page.locator("#ss-morph-stage .token")).toHaveCount(1);
  expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
});
test("crowded square creatures retain independent phases and pause when the hand approaches",async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});await page.goto(preview);
  await page.locator("#ss-quantity").selectOption("12");
  const room=page.locator("#ss-room");
  await expect(room.locator(".sprite-square")).toHaveCount(12);
  await expect(room.locator(".sprite-black")).toHaveCount(3);
  const phases=await room.locator(".sprite-square").evaluateAll(els=>els.map(e=>e.style.getPropertyValue("--hop-delay")));
  expect(new Set(phases).size).toBeGreaterThan(8);
  await page.locator("#ss-pause").click();
  await expect(room.locator(".sprite-motion").first()).toHaveCSS("animation-play-state","paused");
  await expect(page.locator("#ss-square .sprite-motion")).toHaveCSS("animation-play-state","running");
  await page.locator("#ss-pause").click();
  await expect(room.locator(".sprite-motion").first()).toHaveCSS("animation-play-state","running");
  for(const size of [{width:1280,height:720},{width:360,height:640}]){
    await page.setViewportSize(size);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    const fits=await room.evaluate(el=>[...el.querySelectorAll(".token")].every(t=>{
      const a=t.getBoundingClientRect(),b=el.getBoundingClientRect();
      return a.left>=b.left-1&&a.right<=b.right+1;
    }));
    expect(fits).toBe(true);
    await shot(page,"crowd-"+size.width);
  }
});
test("system and explicit reduced motion preserve the complete silhouette and clear transient reactions",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});await page.goto(preview);
  await expect(page.locator("#ss-motion")).toHaveAttribute("aria-pressed","true");
  await page.locator("#ss-to-square").click();
  await expect(actor(page)).toHaveClass(/sprite-square/);
  await expect(body(page)).toHaveCSS("animation-name","none");
  await expect(body(page)).toHaveCSS("border-top-left-radius","7px");
  await page.locator("#ss-duck").click();
  await expect(page.locator("#ss-reaction-status")).toHaveText("Duck · motion reduced");
  await page.locator("#ss-motion").click();
  await expect(body(page)).toHaveCSS("animation-name","square-creature-wiggle");
  await page.locator("#ss-duck").click();
  await expect(page.locator("#ss-reaction-stage .sprite-reaction-shell")).toHaveCSS("animation-name","sprite-duck");
  await page.locator("#ss-rest").click();
  await expect(page.locator("#ss-reaction-stage .sprite")).not.toHaveClass(/sprite-reacting/);
  await expect(page.locator("#ss-reaction-status")).toHaveText("Idle");
  await page.locator("#ss-motion").click();
  await expect(page.locator("#ss-square .sprite-motion")).toHaveCSS("animation-name","none");
  await shot(page,"reduced-motion");
});
test("the existing in-room mixed-root prototype uses the same square art at game scale",async({page})=>{
  await page.goto("/?preview=resident");
  await page.locator("#level-select").selectOption("9");
  const room=page.locator("#left-items");
  await expect(room.locator(".sprite-square")).toHaveCount(4);
  await expect(room.locator(".sprite-black")).toHaveCount(12);
  await expect(room.locator(".sprite-square .sprite-body").first()).toHaveCSS("border-top-left-radius","7px");
  await expect(room.locator(".square-symbol")).toHaveCount(0);
  await shot(page,"actual-mixed-root");
});
