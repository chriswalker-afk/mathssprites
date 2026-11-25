/** Exact physical frame plans for fractional hand actions.
 * The engine is authoritative. A temporary grid is not a committed room.
 * Whole objects and residual units always have an exact rational value.
 */
import {rational,radd,rmul,rsub,req,rtext} from "./rational.mjs";
import {FRACTION_KINDS,FRACTION_DENOMINATORS,fractionRoom,fractionRoomCount,fractionParts} from "./fraction-engine.mjs";
import {weightGrid,weightChangeStages} from "./fraction-weights.mjs";
import {spriteGrid,spriteChangeStages} from "./fraction-sprites.mjs";

const gridFor=(kind,value,d)=>(kind==="posX"?spriteGrid:weightGrid)(value,d);
export function gridValue(grid){
  if(!Number.isInteger(grid.whole)||grid.whole<0||!Number.isInteger(grid.units)||grid.units<0||
    !FRACTION_DENOMINATORS.includes(grid.denominator))throw new RangeError("Invalid physical grid");
  return radd(grid.whole,rational(grid.units,grid.denominator));
}
export function canonicalGrid(room){
  const r=fractionRoom(room);
  return Object.fromEntries(FRACTION_KINDS.map(kind=>[kind,gridFor(kind,r[kind],r[kind].d)]));
}
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
export function gridRoom(grid){
  return fractionRoom(Object.fromEntries(FRACTION_KINDS.map(k=>[k,gridValue(grid[k])])));
}
const zeros=()=>({whole:0,units:0,denominator:1});
export function roomChoreography(action,preview){
  if(!preview?.ok||!Array.isArray(preview.fractionPlans)||preview.fractionPlans.length!==2)
    throw new TypeError("A successful exact room preview is required");
  const plans=Object.fromEntries(preview.fractionPlans.map(p=>[p.kind,p]));
  const before=fractionRoom(Object.fromEntries(FRACTION_KINDS.map(k=>[k,plans[k].before])));
  const after=fractionRoom(preview.after);
  const prepared={},raw={},amount={},group={};
  let borrowed=false,changedGrid=false;
  for(const kind of FRACTION_KINDS){
    const p=plans[kind];
    assert(req(p.after,after[kind]),"Room preview has inconsistent result");
    const b=gridFor(kind,p.before,p.grid);
    prepared[kind]=b;raw[kind]=b;amount[kind]=zeros();
    if(action.op==="divide"){
      const g=p.groups;
      assert(g?.count===action.factor,"Wrong number of equal baskets");
      group[kind]={whole:g.wholePerGroup,units:g.unitsPerGroup,denominator:g.denominator};
      prepared[kind]={whole:g.wholePerGroup*action.factor,units:g.unitsPerGroup*action.factor,denominator:g.denominator};
      raw[kind]=group[kind];
      assert(req(gridValue(prepared[kind]),p.before)&&req(gridValue(group[kind]),p.after),"Equal shares do not conserve the source");
      borrowed||=prepared[kind].whole<b.whole;
    }else if(action.op==="multiply"){
      group[kind]=b;
      raw[kind]={whole:b.whole*action.factor,units:b.units*action.factor,denominator:b.denominator};
      assert(p.copies===action.factor&&req(gridValue(raw[kind]),p.after),"Copying does not conserve the exact operation");
    }else if(action.kind===kind){
      const stages=(kind==="posX"?spriteChangeStages:weightChangeStages)(p,action.op);
      prepared[kind]=stages.prepared;raw[kind]=stages.raw;amount[kind]=stages.amount;
      borrowed||=!!stages.prepared.borrowed;
    }
    changedGrid||=p.before.d!==p.grid&&p.before.n%p.before.d!==0;
    assert(req(gridValue(prepared[kind]),p.before),"Preparation must conserve the room");
    assert(req(gridValue(raw[kind]),p.after),"Raw result must equal committed result");
  }
  return Object.freeze({op:action.op,before,after,prepared,raw,amount,
    group:action.op==="divide"||action.op==="multiply"?group:null,
    groups:action.factor||0,borrowed,changedGrid});
}
export function failureSpeech(failure){
  if(failure.code==="unsupported-denominator")return "Those pieces are too small for this workshop. Fractions like these are valid, but I'll put everything back.";
  if(failure.code==="overflow")return "There isn't enough space for all those objects. I'll put everything back.";
  if(failure.code==="missing")return "There isn't enough of that object in this room. I'll put everything back.";
  if(failure.code==="mismatch")return "The rooms need the same operation and amount. I'll undo those visits.";
  return failure.reason||"I can't make that move. I'll put everything back.";
}
export function failureDiagram(failure){
  if(failure.code==="unsupported-denominator"&&Number.isInteger(failure.denominator)&&failure.denominator>1&&failure.denominator<=120)
    return {type:"grid",denominator:failure.denominator};
  if(failure.code==="overflow")return {type:"overflow",excess:Math.max(1,Number(failure.excess)||1)};
  return {type:"shake"};
}
