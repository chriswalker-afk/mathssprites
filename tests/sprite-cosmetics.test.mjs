import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {IMPLEMENTED_SPRITE_COSMETICS,resolveSpriteAppearance,applySpriteAppearance} from "../src/sprite-cosmetics.mjs";
import {findCosmeticItem,COSMETIC_REWARDS} from "../src/cosmetic-catalog.mjs";
import {spriteAssemblyMarkup,spritePartition} from "../src/fraction-sprites.mjs";
import {spriteCreatureMarkup} from "../src/square-sprites.mjs";
const wearSlots=["headwear","eyewear","neckwear"];
const wearableRewards=COSMETIC_REWARDS.filter(r=>wearSlots.includes(r.slot));
const original={fur:"original",eyes:"original",headwear:"original",eyewear:"original",neckwear:"original"};
test("all eighteen visual rewards match their catalogue slots and unavailable art falls back to original",()=>{
  assert.equal(wearableRewards.length,14);
  assert.deepEqual([...IMPLEMENTED_SPRITE_COSMETICS].sort(),["curious-eyes","extra-fluffy","sleepy-eyes","spiky-fur",...wearableRewards.map(r=>r.id)].sort());
  for(const id of IMPLEMENTED_SPRITE_COSMETICS){
    const item=findCosmeticItem(id);assert.equal(resolveSpriteAppearance({[item.slot]:id})[item.slot],id);
  }
  assert.deepEqual(resolveSpriteAppearance({fur:"curious-eyes",eyes:"injected",headwear:"knitted-beanie",color:"red"}),{...original,headwear:"knitted-beanie"});
  assert.deepEqual(resolveSpriteAppearance({fur:"grand-alchemist-fur",eyes:"mischievous-eyes"}),original);
});
test("appearance updates are local, idempotent and never recreate or resize native actor markup",()=>{
  const attributes=new Map(),calls=[];
  const scope={getAttribute:k=>attributes.get(k),setAttribute(k,v){calls.push(k);attributes.set(k,v);}};
  const before=spriteCreatureMarkup("test","left","negX",0);
  const equipped={fur:"extra-fluffy",eyes:"curious-eyes"};
  assert.deepEqual(applySpriteAppearance(scope,equipped),{...original,...equipped});
  assert.deepEqual(applySpriteAppearance(scope,equipped),{...original,...equipped});
  assert.equal(calls.length,5);
  assert.equal(spriteCreatureMarkup("test","left","negX",0),before);
  applySpriteAppearance(scope,{});
  assert.deepEqual([...attributes],Object.keys(original).map(slot=>["data-sprite-"+slot,"original"]));
});
test("fraction cosmetics are clipped by the same exact partition and a whole is just one native actor",()=>{
  const sectors=spritePartition(3),art=spriteAssemblyMarkup(3,[0,1]);
  for(const p of sectors.slice(0,2))assert.ok(art.includes('d="'+p.path+'"'));
  for(const kind of ["original","fluffy","spiky"])assert.ok(art.includes('class="fs-fur-'+kind+'"'));
  assert.equal((art.match(/class="fs-eye"/g)||[]).length,2);
  assert.equal((art.match(/<clipPath /g)||[]).length,2);
  assert.ok(art.includes('data-value="1/3"'));assert.ok(art.includes(">2/3</span>"));
  const whole=spriteAssemblyMarkup(1,[0],{animatedWhole:true});
  assert.equal((whole.match(/fs-whole-actor/g)||[]).length,1);
  for(const layer of ["sprite-body","sprite-motion","sprite-eyes","sprite-feet"])assert.ok(whole.includes(layer));
  assert.ok(!whole.includes("<svg"));
});
test("cosmetic CSS is scoped to decorative fur and eyes, not token or motion geometry",()=>{
  const css=readFileSync(new URL("../src/sprite-cosmetics.css",import.meta.url),"utf8");
  assert.doesNotMatch(css,/\b(?:animation|transform|margin|padding|inset|z-index|position|pointer-events)\s*:/);
  assert.doesNotMatch(css,/\.token\s*\{/);
  assert.doesNotMatch(css,/\.sprite-body\s*\{/);
});

test("each wearable has distinct decorative vector art, an isolated scope and a native layer on all signs",()=>{
  const css=readFileSync(new URL("../src/sprite-wearables.css",import.meta.url),"utf8");
  const encoded=[...css.matchAll(/url\("data:image\/svg\+xml,([^"]+)"\)/g)].map(m=>decodeURIComponent(m[1]));
  assert.equal(encoded.length,14);assert.equal(new Set(encoded).size,14);
  for(const svg of encoded){assert.match(svg,/<svg[^>]*viewBox="0 0 (?:44 14|36 18)"/);assert.match(svg,/<\/svg>$/);}
  for(const r of wearableRewards)assert.ok(css.includes('[data-sprite-'+r.slot+'="'+r.id+'"]'));
  for(const kind of ["posX","negX","posX2"]){
    const actor=spriteCreatureMarkup("test","left",kind,0);
    for(const slot of wearSlots){
      assert.equal(actor.split('class="sprite-wear sprite-wear-'+slot+'" aria-hidden="true"').length,2);
    }
    assert.equal(actor.split('class="sprite-eyes"').length,2);
  }
  assert.doesNotMatch(spriteAssemblyMarkup(3,[0,1]),/sprite-wear-/);
  assert.match(spriteAssemblyMarkup(1,[0],{animatedWhole:true}),/sprite-wear-headwear/);
  assert.doesNotMatch(css,/\.token\s*\{|\.sprite-body\s*\{|\.sprite-motion\s*\{/);
  assert.match(css,/pointer-events:none/);
});
