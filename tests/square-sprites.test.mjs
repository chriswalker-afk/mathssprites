import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {SPRITE_APPEARANCE,spriteCreatureMarkup,heldSpriteMarkup,miniSpriteMarkup,areaSpriteMarkup,setSquarePreviewShape} from "../src/square-sprites.mjs";
import {spriteMotionProfile,spriteMotionStyle} from "../src/sprite-motion.mjs";
import {pickSpriteHandReaction} from "../src/sprite-reactions.mjs";

test("all sprite kinds share the same physical actor layers and independent motion identity",()=>{
  for(const [kind,appearance] of Object.entries(SPRITE_APPEARANCE)){
    const actor=spriteCreatureMarkup("square-art-test","left",kind,0);
    assert.match(actor,new RegExp('class="token sprite '+appearance+'"'));
    assert.equal((actor.match(/class="token sprite /g)||[]).length,1);
    for(const layer of ["sprite-ground-shadow","sprite-reaction-shell","sprite-motion","sprite-feet","sprite-body","sprite-eyes"])
      assert.ok(actor.includes('class="'+layer+'"'),kind+" "+layer);
    assert.match(actor,/<span class="sprite-eyes"><i><\/i><i><\/i><\/span>/);
    assert.ok(actor.includes(spriteMotionStyle(spriteMotionProfile("square-art-test","left",kind,0))));
    assert.doesNotMatch(actor,/square-symbol|✦/);
    assert.equal(actor,spriteCreatureMarkup("square-art-test","left",kind,0));
    assert.notEqual(actor,spriteCreatureMarkup("square-art-test","left",kind,1));
  }
  assert.throws(()=>spriteCreatureMarkup("test","left","posOne",0));
});
test("square sprites have matching hand, area and comic markup with no extra counted actors",()=>{
  assert.equal(heldSpriteMarkup("posX2"),'<span class="held-sprite held-sprite-square"><i></i><i></i></span>');
  assert.equal(areaSpriteMarkup("posX2"),'<span class="box-actor box-actor-x2"></span>');
  assert.equal(miniSpriteMarkup("posX2"),'<span class="mini-token posX2" aria-hidden="true"></span>');
  assert.throws(()=>heldSpriteMarkup("posOne"));
  assert.throws(()=>areaSpriteMarkup("negX"));
  const remove={op:"remove",kind:"posX2",count:1};
  assert.equal(pickSpriteHandReaction(remove,.1),"duck");
  assert.equal(pickSpriteHandReaction(remove,.4),"dodge");
  assert.equal(pickSpriteHandReaction(remove,.9),null);
  assert.equal(pickSpriteHandReaction({...remove,op:"add"},.1),null);
});
test("preview reverses the same actor rather than making another sprite",()=>{
  const classes=new Set(["token","sprite","sprite-black"]),attributes=new Map();
  const body={getBoundingClientRect:()=>({width:43,height:41})};
  const actor={classList:{contains:k=>classes.has(k),toggle(k,value){if(value)classes.add(k);else classes.delete(k);}},
    removeAttribute:k=>attributes.delete(k),setAttribute:(k,v)=>attributes.set(k,v),
    querySelector:()=>body};
  assert.equal(setSquarePreviewShape(actor,"posX2"),true);
  assert.equal(classes.has("sprite-square"),true);
  assert.equal(classes.has("sprite-black"),false);
  assert.equal(attributes.get("data-square-morph"),"square");
  assert.equal(setSquarePreviewShape(actor,"posX",{animate:false}),true);
  assert.equal(classes.has("sprite-black"),true);
  assert.equal(classes.has("sprite-square"),false);
  assert.equal(attributes.has("data-square-morph"),false);
  assert.equal(setSquarePreviewShape(actor,"posX"),false);
  assert.throws(()=>setSquarePreviewShape(actor,"posOne"));
});
test("the two fur polygons have matching topology and genuinely different silhouettes",()=>{
  const css=readFileSync(new URL("../src/square-sprites.css",import.meta.url),"utf8");
  const vertices=name=>css.match(new RegExp("--sq-fur-"+name+":polygon\\(([^)]+)\\)"))[1].split(",").map(p=>p.trim().split(/\s+/).map(n=>parseFloat(n)));
  const round=vertices("round"),square=vertices("square");
  assert.equal(round.length,64);assert.equal(square.length,64);
  assert.ok([...round,...square].every(p=>p.length===2&&p.every(v=>v>=0&&v<=100)));
  assert.notDeepEqual(round,square);
  const corner=8;assert.ok(square[corner][0]>round[corner][0]);
  assert.ok(square[corner][1]<round[corner][1]);
  assert.match(css,/@keyframes square-creature-hop/);
  assert.match(css,/@keyframes square-fur-form/);
  assert.match(css,/\.reduce-motion \.sprite-body:before/);
  assert.match(css,/\.group-basket \.sprite-square \.sprite-motion/);
});
