import test from "node:test";
import assert from "node:assert/strict";
import {CAMPAIGN_REGISTRY,findCampaignLevel} from "../src/campaign-registry.mjs";
import {notebookOperationJustification,notebookFailureMessage,notebookThinkingPrompt,notebookWritingPrompt} from "../src/notebook-advice.mjs";
import {routeGuideCues} from "../src/route-guide.mjs";
import {startNotebook} from "../src/notebook-engine.mjs";
import {previewNotebookOperation,tryNotebookOperation} from "../src/notebook-maths-editor.mjs";
import {startFractionNotebook,previewFractionNotebookOperation} from "../src/fraction-notebook-engine.mjs";
const physical=/\b(?:chambers?|sprites?|weights?|balloons?|crates?|baskets?|objects?|hand|rooms?)\b/i;
const level=(w,n)=>findCampaignLevel(w,"notebook",n).level;
test("all notebook guides, current hints, goals and displayed scaffolds are mathematical",()=>{
  for(const world of CAMPAIGN_REGISTRY){
    for(const cue of routeGuideCues(world.id,"notebook"))assert.doesNotMatch(cue.text,physical);
    for(const slot of world.stages.find(s=>s.id==="notebook").levels){
      const session=world.id==="fractions"?startFractionNotebook(slot.level):startNotebook(slot.level);
      const hint=notebookThinkingPrompt(session);
      assert.ok(hint.length>0);
      assert.doesNotMatch(hint,physical);
      assert.doesNotMatch(notebookWritingPrompt(slot.level),physical);
      const support=slot.level.scaffold;
      if(support&&support.kind!=="none")assert.doesNotMatch(support.text,physical);
    }
  }
  assert.match(routeGuideCues("opposites","guided")[0].text,/sprites|balloons/);
});
test("mathematical justifications cover the operations without exposing the physical replay",()=>{
  const examples=[
    [{op:"remove",kind:"posOne",count:8},/Subtracting 8.*additive inverse.*preserves equality/],
    [{op:"remove",kind:"negOne",count:4},/Subtracting −4.*adding 4/],
    [{op:"add",kind:"negX",count:1},/Adding −x.*subtracting x/],
    [{op:"remove",kind:"posX",count:{n:1,d:2}},/Subtracting \(1\/2\)x/],
    [{op:"divide",factor:2},/nonzero.*every term/],
    [{op:"multiply",factor:3},/nonzero.*every term/],
    [{op:"unpack",side:"left"},/distributive law.*other side/],
    [{op:"square"},/nonnegative.*a² \+ 2ab \+ b²/],
    [{op:"sqrt"},/principal square root.*u ≥ 0/]
  ];
  for(const [action,pattern] of examples){
    const reason=notebookOperationJustification(action);
    assert.match(reason,pattern);
    assert.doesNotMatch(reason,physical);
  }
});
test("thinking prompts follow the current equation without supplying the numerical solution",()=>{
  let s=startNotebook(level("opposites",5));
  assert.match(notebookThinkingPrompt(s),/Both sides contain x-terms/);
  const result=tryNotebookOperation(s,"−x");assert.ok(result.ok);
  s=result.session;
  assert.match(notebookThinkingPrompt(s),/additive inverse/);
  assert.doesNotMatch(notebookThinkingPrompt(s),/x = 5/);
  const f=startFractionNotebook(level("fractions",6));
  assert.match(notebookThinkingPrompt(f),/fractional coefficient.*denominator/);
  const q=startNotebook(level("squares",10));
  assert.match(notebookThinkingPrompt(q),/completing the square/);
  assert.match(notebookThinkingPrompt(tryNotebookOperation(q,"+4").session),/perfect squares.*principal square root/);
});
test("unsupported mathematics is explained as model restrictions, not invalid algebra",()=>{
  const whole=startNotebook(level("workshop",1));
  const missing=previewNotebookOperation(whole,"−5"),division=previewNotebookOperation(whole,"÷2");
  assert.match(missing.message,/negative constant term.*valid algebra/);
  assert.match(division.message,/integer.*valid algebra.*World 3/);
  const unsupported=previewFractionNotebookOperation(startFractionNotebook(level("fractions",9)),"−1/7");
  assert.match(unsupported.message,/denominator 7.*valid mathematics/);
  const root=previewNotebookOperation(startNotebook(level("squares",10)),"√");
  assert.match(root.message,/a²x² \+ 2abx \+ b²/);
  for(const result of [missing,division,unsupported,root])assert.doesNotMatch(result.message,physical);
  for(const code of ["overflow","locked-crate","crate-split","no-crates","locked-negative","locked-operation","locked-kind","invalid","unknown"])
    assert.doesNotMatch(notebookFailureMessage({code,reason:"There are too many sprites in that chamber.",side:"left"},whole.state,{op:"divide",factor:2}),physical);
});
