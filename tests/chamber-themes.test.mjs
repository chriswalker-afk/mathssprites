import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CHAMBER_THEMES,IMPLEMENTED_CHAMBER_THEMES} from "../src/chamber-themes.mjs";
import {resolveLaboratoryAppearance} from "../src/laboratory-cosmetics.mjs";
import {COSMETIC_REWARDS} from "../src/cosmetic-catalog.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("ten chamber architectures have separate local SVG artwork and agreed milestones",()=>{
  assert.deepEqual(IMPLEMENTED_CHAMBER_THEMES,["clockmakers-workshop","scholars-library","midnight-observatory","botanical-laboratory","clockwork-foundry","frostbound-vault","ember-forge","royal-treasury","arcane-laboratory","astral-sanctuary"]);
  assert.deepEqual(CHAMBER_THEMES.map(t=>t.stars),[24,66,105,195,285,375,465,525,585,675]);
  const css=read("src/chamber-themes.css"),art=[];
  for(const t of CHAMBER_THEMES){
    const reward=COSMETIC_REWARDS.find(r=>r.id===t.id);
    assert.equal(reward.slot,"chamber-theme");assert.equal(reward.name,t.name);assert.equal(reward.stars,t.stars);
    const rule=css.split('[data-chamber-theme="'+t.id+'"]{')[1].split("}")[0];
    assert.ok(rule.includes("assets/chambers/"+t.id+".svg?v=96"));
    for(const key of ["frame","top","trim","floor","deep","ambient"])assert.match(rule,new RegExp("--ct-"+key+":#[a-f0-9]{6};"));
    const svg=read("assets/chambers/"+t.id+".svg");
    assert.match(svg,/viewBox="0 0 480 320" preserveAspectRatio="none"/);
    assert.match(svg,/<rect y="155" width="480" height="100" fill="url\(#fade\)"\/>/);
    assert.doesNotMatch(svg,/<(?:script|foreignObject|animate|image)\b/);
    assert.doesNotMatch(svg,/\b(?:href|onload|onclick)\s*=/);
    const definitions=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(definitions).size,definitions.length,t.id+" duplicate SVG IDs");
    for(const match of svg.matchAll(/url\(#([^)]+)\)/g))assert.ok(definitions.includes(match[1]),t.id+" unresolved paint "+match[1]);
    art.push(svg);
    assert.equal(resolveLaboratoryAppearance({"chamber-theme":t.id})["chamber-theme"],t.id);
  }
  assert.equal(new Set(art).size,10);
  assert.equal(resolveLaboratoryAppearance({"chamber-theme":"unrecognised-vault"})["chamber-theme"],"original");
  assert.equal(resolveLaboratoryAppearance({"chamber-theme":"astral-sanctuary"})["chamber-theme"],"astral-sanctuary");
  assert.equal(resolveLaboratoryAppearance({"chamber-theme":"__proto__"})["chamber-theme"],"original");
  assert.match(css,/--ct-wall:initial/);
  assert.match(css,/\.atelier-chamber-thumbnail/);
  // This stylesheet only paints existing architecture, including border
  // colours; no changes to physical room or hand geometry.
  assert.doesNotMatch(css,/(?:^|[;{]\s*)(?:width|height|top|bottom|left|right|position|transform|translate|padding|margin|border-width|border-radius|animation|z-index|overflow)\s*:/m);
  assert.doesNotMatch(css,/\.room-items|\.giant-hand|\.hand-cargo/);
  assert.match(read("index.html"),/chamber-themes\.css\?v=97/);
  assert.match(read("src/fraction-campaign.mjs"),/"chamber-themes\.css"/);
});
