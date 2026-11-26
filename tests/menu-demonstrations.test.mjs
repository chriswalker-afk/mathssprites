import test from "node:test";
import assert from "node:assert/strict";
import {WORLD_DEMOS,METHOD_DEMOS,worldDemoMarkup,methodDemoMarkup} from "../src/menu-demonstrations.mjs";
import {CAMPAIGN_REGISTRY} from "../src/campaign-registry.mjs";

test("every released world and method has a local, labelled preview",()=>{
  for(const world of CAMPAIGN_REGISTRY){
    assert.ok(WORLD_DEMOS[world.id]);
    const art=worldDemoMarkup(world.id);
    assert.ok(art.includes('data-menu-demo="'+world.id+'"'));
    assert.ok(art.includes('aria-label="'+WORLD_DEMOS[world.id]+'"'));
    for(const stage of world.stages){
      const method=methodDemoMarkup(stage.id);
      assert.ok(METHOD_DEMOS[stage.id]);
      assert.ok(method.includes('data-menu-demo="'+stage.id+'"'));
      assert.ok(method.includes('aria-label="'+METHOD_DEMOS[stage.id]+'"'));
    }
  }
  assert.equal(worldDemoMarkup("future"),"");
  assert.equal(methodDemoMarkup("future"),"");
});
test("the three learning methods show the same physical example and distinct controls",()=>{
  const guided=methodDemoMarkup("guided"),independent=methodDemoMarkup("independent"),notebook=methodDemoMarkup("notebook");
  for(const art of [guided,independent,notebook]){
    assert.equal((art.match(/class="md-weight"/g)||[]).length,5);
    assert.equal((art.match(/class="md-sprite"/g)||[]).length,1);
    assert.ok(art.includes("md-remove-left")&&art.includes("md-remove-right"));
  }
  assert.ok(guided.includes("md-command-both"));
  assert.ok(!guided.includes("md-command-left"));
  assert.ok(independent.includes("md-command-left")&&independent.includes("md-command-right"));
  assert.ok(notebook.includes("x + 1 = 4")&&notebook.includes("x = 3"));
});
test("world art represents genuine zero pairs, equal halves and nine square units",()=>{
  const opposite=worldDemoMarkup("opposites"),fraction=worldDemoMarkup("fractions"),square=worldDemoMarkup("squares");
  assert.equal((opposite.match(/class="md-weight"/g)||[]).length,2);
  assert.ok(opposite.includes("md-balloon")&&opposite.includes("md-zero-pair"));
  assert.equal((fraction.match(/width="56" height="47"/g)||[]).length,2);
  assert.ok(fraction.includes('width="112" height="47"'));
  assert.equal((square.match(/class="md-square-unit"/g)||[]).length,9);
});
