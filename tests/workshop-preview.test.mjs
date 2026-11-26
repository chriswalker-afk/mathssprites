import test from "node:test";
import assert from "node:assert/strict";
import {workshopPreview,workshopInventoryMarkup} from "../src/workshop-preview.mjs";

test("empty drafts show explicitly identified world examples",()=>{
  for(const mode of ["positive","signed","fractions","squares"]){
    const result=workshopPreview("",mode);
    assert.equal(result.status,"example");
    assert.ok(result.left.length&&result.right.length);
  }
  assert.ok(!workshopPreview("","squares","area").left.some(i=>i.kind==="posX2"));
});
test("preview preserves the written chambers, including explicit opposite pairs",()=>{
  const whole=workshopPreview("3x+5=20","positive");
  assert.equal(whole.status,"draft");
  assert.deepEqual(whole.left.map(i=>[i.kind,i.whole]),[["posX",3],["posOne",5]]);
  assert.equal(whole.right[0].whole,20);
  const signed=workshopPreview("2x−x−3=x+4","signed");
  assert.deepEqual(signed.left.map(i=>[i.kind,i.whole]),[["posX",2],["negX",1],["negOne",3]]);
  const square=workshopPreview("x²+4x=21","squares");
  assert.deepEqual(square.left.map(i=>[i.kind,i.whole]),[["posX2",1],["posX",4]]);
});
test("fraction previews represent exact pieces and never reveal a solution",()=>{
  const result=workshopPreview("(2/3)x+1/2=4","fractions");
  assert.equal(result.status,"draft");
  assert.deepEqual(result.left.map(i=>[i.kind,i.whole,i.pieces,i.denominator]),[["posX",0,2,3],["posOne",0,1,2]]);
  const markup=workshopInventoryMarkup(result.left);
  assert.match(markup,/data-numerator="2" data-denominator="3"/);
  assert.match(markup,/data-numerator="1" data-denominator="2"/);
  assert.equal(Object.hasOwn(result,"solution"),false);
});
test("invalid drafts cannot retain stale room contents; no route search is needed",()=>{
  for(const [mode,input] of [["positive","x+"],["signed","x−"],["fractions","x+1/0=4"],["squares","x³=27"],["positive","x+99=100"]]){
    assert.deepEqual(workshopPreview(input,mode),{status:"incomplete",left:[],right:[]});
  }
  // Syntactically representable is not the same as a validated playable equation.
  assert.equal(workshopPreview("x=x","positive").status,"draft");
});
test("large inventories are compact without hiding the exact count",()=>{
  const result=workshopPreview("x+40=48","positive");
  const markup=workshopInventoryMarkup(result.right);
  assert.match(markup,/data-whole="48"/);
  assert.match(markup,/×48/);
  assert.equal((markup.match(/class="mini-token/g)||[]).length,1);
});
