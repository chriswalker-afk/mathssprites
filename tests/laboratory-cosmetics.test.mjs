import test from "node:test";
import assert from "node:assert/strict";
import {applyLaboratoryAppearance,resolveLaboratoryAppearance,IMPLEMENTED_LABORATORY_COSMETICS} from "../src/laboratory-cosmetics.mjs";
test("future lab art scopes default safely while existing sprite appearance still applies",()=>{
  const attrs=new Map(),scope={getAttribute:k=>attrs.get(k),setAttribute:(k,v)=>attrs.set(k,v)};
  const selected={fur:"extra-fluffy","weight-shape":"dumbbell","weight-material":"copper","weight-effect":"soft-glow","chamber-theme":"clockmakers-workshop"};
  assert.deepEqual(IMPLEMENTED_LABORATORY_COSMETICS,[]);
  assert.deepEqual(resolveLaboratoryAppearance(selected),{"weight-shape":"original","weight-material":"original","weight-effect":"original","chamber-theme":"original"});
  applyLaboratoryAppearance(scope,selected);
  assert.equal(attrs.get("data-sprite-fur"),"extra-fluffy");
  for(const slot of ["weight-shape","weight-material","weight-effect","chamber-theme"])assert.equal(attrs.get("data-"+slot),"original");
});
