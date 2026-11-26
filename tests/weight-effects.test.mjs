import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LABORATORY_VISUAL_VARIANTS,resolveLaboratoryAppearance} from "../src/laboratory-cosmetics.mjs";
import {COSMETIC_REWARDS} from "../src/cosmetic-catalog.mjs";
import {WEIGHT_SHAPES} from "../src/weight-shapes.mjs";
import {weightAssemblyMarkup,weightPartition} from "../src/fraction-weights.mjs";
const ids=["soft-glow","frost-shimmer","ember-glow","pearlescent-shimmer","golden-halo"];
test("all five effect milestones are ready, unique, bounded and slow",()=>{
  const css=readFileSync(new URL("../src/weight-effects.css",import.meta.url),"utf8");
  assert.deepEqual(LABORATORY_VISUAL_VARIANTS["weight-effect"],ids);
  assert.deepEqual(ids.map(id=>COSMETIC_REWARDS.find(r=>r.id===id).stars),[81,345,495,645,705]);
  const palettes=[];
  for(const id of ids){
    const rule=css.split('[data-weight-effect="'+id+'"]{')[1].split("}")[0];
    assert.match(rule,/--we-animation:weight-effect-glimmer/);
    assert.ok(Number(rule.match(/--we-period:([\d.]+)s/)[1])>=4);
    for(const name of ["a","b","c","rim"])assert.match(rule,new RegExp("--we-"+name+":#[a-f0-9]{6};"));
    palettes.push(rule.match(/--we-a:(#[a-f0-9]{6});/)[1]);
    assert.equal(resolveLaboratoryAppearance({"weight-effect":id,"weight-shape":"dumbbell","weight-material":"copper"})["weight-effect"],id);
  }
  assert.equal(new Set(palettes).size,5);
  assert.equal(resolveLaboratoryAppearance({"weight-effect":"invalid"})["weight-effect"],"original");
  assert.match(css,/--we-content:none/);
  assert.match(css,/--we-display:none/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/\.fb-lab\[data-reduced="true"\] \.fw-weight-effect/);
  assert.match(css,/\.atelier-thumb/);
  assert.doesNotMatch(css,/(?:^|[;{]\s*)(?:transform|translate|filter|width|height|margin|clip-path)\s*:/m);
  const keyframes=css.split("@keyframes weight-effect-glimmer")[1].split("/*")[0];
  assert.doesNotMatch(keyframes,/(?:transform|filter|translate|scale)\s*:/);
});
test("each decorative fractional layer stays inside its piece's real clip and is not an extra piece",()=>{
  for(const shape of Object.keys(WEIGHT_SHAPES)){
    const art=weightAssemblyMarkup(3,[0,1],{shape});
    assert.equal((art.match(/class="fw-piece"/g)||[]).length,2);
    assert.equal((art.match(/class="fw-weight-effect"/g)||[]).length,2);
    assert.equal((art.match(/class="fw-effect-fill"/g)||[]).length,2);
    assert.equal((art.match(/class="fw-effect-rim"/g)||[]).length,2);
    assert.match(art,/aria-label="2\/3 of one weight/);
    assert.match(art,/class="fw-effect-fill" fill="url\(#fw-art-\d+-effect\)" fill-opacity="0"/);
    assert.match(art,/class="fw-effect-rim" fill="none" stroke="transparent"/);
    assert.equal(weightPartition(3,{shape}).length,3);
    const groups=art.split('<g class="fw-piece"').slice(1);
    for(const group of groups){
      assert.ok(group.indexOf('<g clip-path=')<group.indexOf('class="fw-weight-effect"'));
      assert.ok(group.indexOf('class="fw-weight-effect"')<group.indexOf('class="fw-cut-edge"'));
    }
  }
});
