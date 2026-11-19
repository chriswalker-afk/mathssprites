/**
 * Transparent crates: a genuine group model, not a decorative sprite stack.
 *
 * Each crate is ONE movable, sealed object containing whole tokens.
 * Its algebraic value is the sum of its contents, so c identical crates
 * represent c(ax+b). Unpacking changes only the representation, never mass.
 *
 * The function is pure and World 2-ready: negX and negOne can later be
 * contained in groups without changing the invariant.
 */
export const CRATE_KINDS=Object.freeze(["posX","negX","posX2","posOne","negOne"]);
export function cloneCrate(raw){
  if(!raw||!Number.isInteger(raw.count)||raw.count<1||raw.count>12||
     !raw.contents||typeof raw.contents!=="object")
    throw new RangeError("A crate requires 1–12 identical, whole-object groups.");
  const contents=Object.fromEntries(CRATE_KINDS.map(kind=>{
    const n=raw.contents[kind]??0;
    if(!Number.isInteger(n)||n<0||n>12)
      throw new RangeError("A crate can contain only whole objects.");
    return [kind,n];
  }));
  if(!CRATE_KINDS.some(k=>contents[k]>0))
    throw new RangeError("A crate may not be empty.");
  return {count:raw.count,contents};
}
export const crateCount=value=>value?.crates?.count||0;
export function crateContentsTotal(value,kind){
  return crateCount(value)*(value.crates.contents[kind]||0);
}
export function crateAlgebra(value){
  const c=crateCount(value);
  if(!c)return {x2:0,x:0,constant:0};
  const k=value.crates.contents;
  return {x2:c*k.posX2,x:c*(k.posX-k.negX),
    constant:c*(k.posOne-k.negOne)};
}
export function looseAfterUnpack(value){
  if(!crateCount(value))return null;
  const result={...value};
  for(const kind of CRATE_KINDS)
    result[kind]=(result[kind]||0)+crateContentsTotal(value,kind);
  delete result.crates;
  return result;
}
export function crateLabel(contents){
  const x=contents.posX-contents.negX;
  const n=contents.posOne-contents.negOne;
  const parts=[];
  if(x)parts.push((x===-1?"−":x===1?"":String(x))+"x");
  if(n)parts.push(parts.length
    ?(n<0?" − ":" + ")+Math.abs(n)
    :String(n));
  return parts.join("")||"0";
}
/** A safe, predefined SVG-free representation; contents are visual examples
 * and NEVER counted by sprite collision or basket selectors. */
export function crateMarkup(value){
  const count=crateCount(value);
  if(!count)return "";
  const {contents}=value.crates;
  const sprites=Array.from({length:Math.min(4,contents.posX)},()=>
    '<span class="crate-mini-sprite" aria-hidden="true"><i></i><i></i></span>').join("");
  const weights=Array.from({length:Math.min(5,contents.posOne)},()=>
    '<span class="crate-mini-weight" aria-hidden="true"></span>').join("");
  const label=crateLabel(contents);
  const pieces=sprites+weights;
  return Array.from({length:count},(_,index)=>
    '<span class="token sealed-crate" data-crate-index="'+index+
    '" role="img" aria-label="Sealed crate '+(index+1)+
    ': one sprite and three weights" title="Sealed bracket group ('+label+')">'+
      '<span class="crate-lid" aria-hidden="true"></span>'+
      '<span class="crate-window" aria-hidden="true">'+pieces+'</span>'+
      '<span class="crate-name" aria-hidden="true">'+label+'</span>'+
      '<span class="crate-hinge" aria-hidden="true"></span>'+
    '</span>').join("");
}
