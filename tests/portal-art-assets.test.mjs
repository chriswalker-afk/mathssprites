import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const portal=new URL("../assets/portal/",import.meta.url);
const names=[
  "foyer-ambient.svg","door-balance.svg","door-opposites.svg",
  "door-fractions.svg","door-squares.svg",
  "stage-guided.svg","stage-independent.svg","stage-notebook.svg",
  "board-etching.svg","inventors-desk.svg"
];
test("all PR33 original artwork is local SVG with intrinsic bounds and no embedded content",()=>{
  assert.equal(names.length,10);
  for(const name of names){
    const source=readFileSync(new URL(name,portal),"utf8");
    assert.match(source,/<svg\s[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(source,/viewBox="0 0 \d+ \d+"/);
    assert.match(source,/<\/svg>\s*$/);
    assert.doesNotMatch(source,/<(?:script|foreignObject|image)\b/i);
    assert.doesNotMatch(source,/(?:xlink:href|href)=["']https?:\/\//i);
    assert.doesNotMatch(source,/<style[^>]*@import/i);
    assert.ok(source.length>600,"Artwork must be a real illustration, not a placeholder: "+name);
  }
});
test("four door compositions and three stage medallions have independent sources",()=>{
  const doors=names.filter(name=>name.startsWith("door-")).map(name=>
    readFileSync(new URL(name,portal),"utf8"));
  assert.equal(new Set(doors).size,4);
  const stages=names.filter(name=>name.startsWith("stage-")).map(name=>
    readFileSync(new URL(name,portal),"utf8"));
  assert.equal(new Set(stages).size,3);
});
test("menu artwork is separated from the engine and its required controls",()=>{
  const source=readFileSync(new URL("../src/site.mjs",import.meta.url),"utf8");
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const css=readFileSync(new URL("../src/portal-art.css",import.meta.url),"utf8");
  assert.match(source,/const PORTAL_DOOR_ART=/);
  assert.match(source,/portalStageArt\(/);
  assert.match(source,/alt="" loading="lazy"/);
  assert.match(html,/portal-art\.css\?v=33/);
  assert.match(html,/id="home-play"/);
  assert.match(html,/id="home-choose-level"/);
  assert.match(html,/id="world-cards"/);
  assert.match(html,/id="world1-stage-cards"/);
  assert.match(html,/id="workshop-equation"/);
  for(const name of ["foyer-ambient","board-etching"])
    assert.match(css,new RegExp(name+"\\.svg"));
  // PR107 replaces the static desk illustration with a live chamber preview.
  assert.match(html,/workshop-builder\.css\?v=107/);
  for(const id of ["workshop-west-inventory","workshop-east-inventory","workshop-create"])
    assert.ok(html.includes('id="'+id+'"'),"Workshop preview and build controls remain present");
  const builderCss=readFileSync(new URL("../src/workshop-builder.css",import.meta.url),"utf8");
  assert.doesNotMatch(builderCss,/#(?:scene|rooms-row|scale-beam|left-action|right-action)\b/);
  assert.doesNotMatch(css,/#(?:scene|rooms-row|scale-beam|left-action|right-action)\b/);
});
