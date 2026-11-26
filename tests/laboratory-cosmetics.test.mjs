import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {applyLaboratoryAppearance,resolveLaboratoryAppearance,IMPLEMENTED_LABORATORY_COSMETICS} from "../src/laboratory-cosmetics.mjs";
import {COSMETIC_REWARDS} from "../src/cosmetic-catalog.mjs";
import {weightAssemblyMarkup,weightPartition,polygonArea,WEIGHT_BODY} from "../src/fraction-weights.mjs";
import {ALTERNATIVE_WEIGHT_SHAPES} from "../src/weight-shapes.mjs";
const effects=["soft-glow","frost-shimmer","ember-glow","pearlescent-shimmer","golden-halo"];
const materials=["polished-steel","copper","blue-enamel","gold","jade-enamel","cast-iron","violet-enamel"];
test("seven weight materials are ready while other future lab art defaults safely",()=>{
  const attrs=new Map(),scope={getAttribute:k=>attrs.get(k),setAttribute:(k,v)=>attrs.set(k,v)};
  const selected={fur:"extra-fluffy","weight-shape":"dumbbell","weight-material":"copper","weight-effect":"soft-glow","chamber-theme":"clockmakers-workshop"};
  assert.deepEqual(IMPLEMENTED_LABORATORY_COSMETICS,[...ALTERNATIVE_WEIGHT_SHAPES,...materials,...effects]);
  assert.deepEqual(resolveLaboratoryAppearance(selected),{"weight-shape":"dumbbell","weight-material":"copper","weight-effect":"soft-glow","chamber-theme":"original"});
  applyLaboratoryAppearance(scope,selected);
  assert.equal(attrs.get("data-sprite-fur"),"extra-fluffy");
  assert.equal(attrs.get("data-weight-material"),"copper");
  assert.equal(attrs.get("data-weight-shape"),"dumbbell");
  assert.equal(attrs.get("data-weight-effect"),"soft-glow");
  for(const slot of ["chamber-theme"])assert.equal(attrs.get("data-"+slot),"original");
  applyLaboratoryAppearance(scope,{"weight-material":"unknown"});
  assert.equal(attrs.get("data-weight-material"),"original");
  assert.equal(attrs.get("data-weight-effect"),"original");
});
test("all seven finishes have distinct complete paint palettes; no layout or animation properties",()=>{
  const css=readFileSync(new URL("../src/weight-materials.css",import.meta.url),"utf8");
  const light=[];
  for(const id of materials){
    assert.equal(COSMETIC_REWARDS.find(r=>r.id===id).slot,"weight-material");
    const palette=css.split('[data-weight-material="'+id+'"]{')[1].split("}")[0];
    for(const name of ["dark","light","mid","deep","rim","seam","shine","shine-soft"])assert.match(palette,new RegExp("--wm-"+name+":#[0-9a-f]{6,8};"));
    light.push(palette.match(/--wm-light:(#[0-9a-f]+);/)[1]);
    assert.equal(resolveLaboratoryAppearance({"weight-material":id})["weight-material"],id);
  }
  assert.equal(new Set(light).size,7);
  assert.doesNotMatch(css,/(?:^|[;{]\s*)(?:width|height|margin|padding|transform|animation|clip-path|position|inset|z-index)\s*:/m);
  for(const name of [".weight",".hero-weight",".crate-bay-weight",".box-actor-weight",".fb-mini-weight",".fw-material-light",".fw-cut-edge"])assert.ok(css.includes(name));
  assert.match(css,/--wm-light:initial/);
});
test("SVG paint hooks preserve exact fractional values, partition areas and outlines",()=>{
  const art=weightAssemblyMarkup(3,[0,1]);
  assert.match(art,/class="fw-material-light" offset=".32" stop-color="#d5b17c"/);
  assert.match(art,/class="fw-material-rim"/);
  assert.match(art,/class="fw-material-shine"/);
  assert.equal((art.match(/class="fw-piece"/g)||[]).length,2);
  const target=polygonArea(WEIGHT_BODY)/3;
  for(const part of weightPartition(3))assert.ok(Math.abs(polygonArea(part.polygon)-target)<.00001);
  assert.match(art,/aria-label="2\/3 of one weight/);
});
