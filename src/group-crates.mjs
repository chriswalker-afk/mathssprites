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
  return crateCount(value)*(value?.crates?.contents?.[kind]||0);
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
/**
 * A stack is an illustrated arrangement of SEPARATE, WHOLE crate tokens.
 * Each direct child with class "token sealed-crate" remains assignable to a
 * different wicker basket during division. No virtual stacked super-token.
 *
 * Only ONE crate wears the hanging contents picture, while the entire group
 * has ONE count sign. Neither label nor picture represents loose objects.
 * The hidden inventory supplies counts for PR39's staged release; it does
 * not contribute any extra DOM tokens or actual physical weight.
 */
export function crateMarkup(value){
  const count=crateCount(value);
  if(!count)return "";
  const {contents}=value.crates;
  const sprites=Array.from({length:Math.min(4,contents.posX)},()=>
    '<span class="crate-mini-sprite" aria-hidden="true"><i></i><i></i></span>').join("");
  const weights=Array.from({length:Math.min(5,contents.posOne)},()=>
    '<span class="crate-mini-weight" aria-hidden="true"></span>').join("");
  const description=[
    contents.posX&&contents.posX+" dark "+(contents.posX===1?"sprite":"sprites"),
    contents.posOne&&contents.posOne+" brass "+(contents.posOne===1?"weight":"weights"),
    contents.negX&&contents.negX+" white "+(contents.negX===1?"sprite":"sprites"),
    contents.negOne&&contents.negOne+" "+(contents.negOne===1?"balloon":"balloons")
  ].filter(Boolean).join(" and ");
  // The hanging picture is a SIGN of what one crate contains, not a window
  // showing live objects. Its icons therefore stay visible until the empty
  // crate disappears. Only one sign may exist regardless of stack height.
  const pictureSprites=Array.from({length:Math.min(3,contents.posX||0)},()=>
    '<span class="crate-sign-sprite" aria-hidden="true"><i></i><i></i></span>').join("");
  const pictureWhite=Array.from({length:Math.min(3,contents.negX||0)},()=>
    '<span class="crate-sign-sprite crate-sign-white" aria-hidden="true"><i></i><i></i></span>').join("");
  const pictureWeights=Array.from({length:Math.min(5,contents.posOne||0)},()=>
    '<span class="crate-sign-weight" aria-hidden="true"></span>').join("");
  const pictureBalloons=Array.from({length:Math.min(5,contents.negOne||0)},()=>
    '<span class="crate-sign-balloon" aria-hidden="true"></span>').join("");
  const picture='<span class="crate-picture-sign" aria-hidden="true">'+
    '<span class="crate-sign-hooks"><i></i><i></i></span>'+
    '<span class="crate-sign-face"><span class="crate-sign-icons">'+
      pictureSprites+pictureWhite+pictureWeights+pictureBalloons+
    '</span></span>'+
    '<i class="crate-sign-stud crate-stud-one"></i>'+
    '<i class="crate-sign-stud crate-stud-two"></i>'+
    '<i class="crate-sign-stud crate-stud-three"></i>'+
    '<i class="crate-sign-stud crate-stud-four"></i></span>';
  const pictureIndex=Math.floor(count/2);
  const tokens=Array.from({length:count},(_,index)=>
    '<span class="token sealed-crate" data-crate-index="'+index+
    '" data-crate-state="sealed" role="img" aria-label="Sealed crate '+(index+1)+
    ' of '+count+', containing '+description+'" title="Sealed wooden crate: '+description+'">'+
      '<span class="crate-wood-face" aria-hidden="true">'+
        '<span class="crate-wood-grain"></span>'+
        '<span class="crate-diagonal-brace"></span>'+
        '<span class="crate-wood-rail crate-wood-rail-top"></span>'+
        '<span class="crate-wood-rail crate-wood-rail-bottom"></span>'+
        '<span class="crate-wood-rail crate-wood-rail-left"></span>'+
        '<span class="crate-wood-rail crate-wood-rail-right"></span>'+
        '<i class="crate-corner-stud stud-tl"></i>'+
        '<i class="crate-corner-stud stud-tr"></i>'+
        '<i class="crate-corner-stud stud-bl"></i>'+
        '<i class="crate-corner-stud stud-br"></i>'+
      '</span>'+
      '<span class="crate-lid" aria-hidden="true"></span>'+
      (index===pictureIndex?picture:"")+
      '<span class="crate-hidden-contents" aria-hidden="true">'+sprites+weights+'</span>'+
    '</span>').join("");
  const label='<span class="crate-stack-count" role="text" aria-label="'+count+
    ' sealed '+(count===1?'crate':'crates')+'">'+count+
    ' '+(count===1?'crate':'crates')+
    '<span class="crate-count-connector" aria-hidden="true"></span></span>';
  return tokens+label;
}
