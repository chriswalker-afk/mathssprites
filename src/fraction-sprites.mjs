/** PR62: magical fragments of one dark sprite, never miniature creatures.
 * The mathematical silhouette is a disk. Equal angles partition it into
 * genuinely equal areas. Face, fur and dust are artwork, not extra mass.
 * All algebraic quantities are exact rational pairs; SVG angles/positions
 * are presentation only. This module does not enable World 3.
 */
import {rational,radd,rsub,rmul,req,rtext} from "./rational.mjs";
import {FRACTION_DENOMINATORS,FRACTION_CAPACITY,fractionParts,fractionPieceCount} from "./fraction-engine.mjs";

export const SPRITE_RADIUS=32;
export const SPRITE_CENTER=Object.freeze([64,60]);
export const SPRITE_SPREAD=15;
const allowed=d=>FRACTION_DENOMINATORS.includes(d);
const tau=2*Math.PI;
const fmt=n=>Number(n.toFixed(6));
const point=(angle,r=SPRITE_RADIUS)=>[fmt(SPRITE_CENTER[0]+r*Math.cos(angle)),fmt(SPRITE_CENTER[1]+r*Math.sin(angle))];
const xy=p=>p.join(" ");
const cache=new Map();
export function spritePartition(denominator,{trial=false}={}){
  if(!allowed(denominator)&&!(trial&&Number.isInteger(denominator)&&denominator>1&&denominator<=120))throw new RangeError("Unsupported sprite denominator");
  if(cache.has(denominator))return cache.get(denominator);
  const start=-Math.PI/2,step=tau/denominator;
  const pieces=Object.freeze(Array.from({length:denominator},(_,index)=>{
    const from=start+step*index,to=start+step*(index+1),mid=(from+to)/2;
    const first=point(from),last=point(to);
    const path=denominator===1
      ? "M "+xy(first)+" A 32 32 0 1 1 "+xy(point(from+Math.PI))+" A 32 32 0 1 1 "+xy(first)+" Z"
      : "M "+xy(SPRITE_CENTER)+" L "+xy(first)+" A 32 32 0 0 1 "+xy(last)+" Z";
    return Object.freeze({index,denominator,value:rational(1,denominator),from,to,
      area:SPRITE_RADIUS**2*(to-from)/2,path,
      start:Object.freeze(first),end:Object.freeze(last),
      spreadX:denominator===1?0:fmt(SPRITE_SPREAD*Math.cos(mid)),
      spreadY:denominator===1?0:fmt(SPRITE_SPREAD*Math.sin(mid))});
  }));
  cache.set(denominator,pieces);
  return pieces;
}
export function spriteInventoryPlan(value){
  const q=rational(value),p=fractionParts(q);
  if(!allowed(q.d)||fractionPieceCount(q)>FRACTION_CAPACITY)
    throw new RangeError("Unsupported or oversized sprite inventory");
  return Object.freeze({value:q,whole:p.whole,denominator:p.denominator,
    pieces:Object.freeze(spritePartition(p.denominator).slice(0,p.pieces))});
}
/** Preserve an unreduced physical grid for equivalent-fraction animation. */
export function spriteGrid(value,denominator){
  const q=rational(value);
  if(q.n<0||!allowed(denominator)||denominator%q.d!==0)
    throw new RangeError("Quantity cannot be represented on this sprite grid");
  return Object.freeze({value:q,whole:Math.floor(q.n/q.d),
    units:(q.n%q.d)*(denominator/q.d),denominator});
}
/** Presentation-only stages for addition/removal or making integer copies.
 * They are driven by the exact engine plan, not a second math engine.
 */
export function spriteChangeStages(plan,operation){
  if(plan?.kind!=="posX"||!["add","remove","multiply"].includes(operation))
    throw new TypeError("Expected a fractional sprite add/remove/copy plan");
  const {before,after,grid}=plan,b=spriteGrid(before,grid);
  if(operation==="multiply"){
    const copies=plan.copies;
    if(!Number.isInteger(copies)||copies<2||copies>5||!req(rmul(before,copies),after))
      throw new Error("Sprite copies must conserve the exact multiplication");
    const raw=Object.freeze({whole:b.whole*copies,units:b.units*copies,denominator:grid});
    return Object.freeze({operation,before:b,copies,grid,raw,after:spriteInventoryPlan(after)});
  }
  const a=spriteGrid(plan.amount,grid);
  if(!req(operation==="add"?radd(before,plan.amount):rsub(before,plan.amount),after))
    throw new Error("Sprite change must conserve exact value");
  let whole=b.whole,units=b.units,borrowed=0;
  if(operation==="remove"&&units<a.units){whole--;units+=grid;borrowed=1;}
  if(operation==="remove"&&whole<a.whole)throw new Error("Insufficient whole sprites");
  const raw=Object.freeze({whole:operation==="add"?whole+a.whole:whole-a.whole,
    units:operation==="add"?units+a.units:units-a.units,denominator:grid});
  if(!req(radd(raw.whole,rational(raw.units,grid)),after))
    throw new Error("Visual regrouping must preserve exact sprite value");
  return Object.freeze({operation,before:b,amount:a,grid,
    prepared:Object.freeze({whole,units,denominator:grid,borrowed}),raw,after:spriteInventoryPlan(after)});
}
let serial=0;
// Fur texture stays within the measured disk. Its dark-green-grey palette,
// cream eyes and little feet echo the existing sprite-black CSS.
function furTexture(){
  return Array.from({length:42},(_,i)=>{
    const a=tau*i/42;
    const tip=point(a,31.6),base1=point(a-.045,27),base2=point(a+.045,27);
    return '<path d="M '+xy(base1)+' L '+xy(tip)+' L '+xy(base2)+' Z" fill="#182022" opacity=".86"/>';
  }).join("");
}
const fur=furTexture();
function spriteArt(id){
  return '<defs><radialGradient id="'+id+'-body" cx=".32" cy=".24" r=".8">'+
    '<stop stop-color="#56615c"/><stop offset=".78" stop-color="#121719"/><stop offset="1" stop-color="#0d1315"/></radialGradient>'+
    '<g id="'+id+'-art"><circle cx="64" cy="60" r="32" fill="url(#'+id+'-body)"/>'+fur+
    '<path d="M39 74Q45 77 42 82M89 74Q83 77 86 82" fill="none" stroke="#151a1c" stroke-width="2.5" stroke-linecap="round"/>'+
    '<path d="M53 83l-1 7m24-7 1 7" stroke="#0c1011" stroke-width="4.5" stroke-linecap="round"/>'+
    '<ellipse class="fs-eye" cx="53" cy="54" rx="5.3" ry="8" fill="#fff6dd"/>'+
    '<ellipse class="fs-eye" cx="75" cy="54" rx="5.3" ry="8" fill="#fff6dd"/>'+
    '<ellipse class="fs-pupil" cx="55" cy="56" rx="1.9" ry="2.7" fill="#1c2726"/>'+
    '<ellipse class="fs-pupil" cx="77" cy="56" rx="1.9" ry="2.7" fill="#1c2726"/></g></defs>';
}
export function spriteAssemblyMarkup(denominator,indices,{outline=true,label=true,separated=false,trial=false}={}){
  const partition=spritePartition(denominator,{trial});
  if(!Array.isArray(indices)||!indices.length||new Set(indices).size!==indices.length||
    indices.some(i=>!Number.isInteger(i)||i<0||i>=denominator))
    throw new RangeError("Select distinct pieces of one sprite");
  const ordered=[...indices].sort((a,b)=>a-b),complete=ordered.length===denominator;
  const id="fs-art-"+(++serial);
  const caption=denominator===1?"1":ordered.length+"/"+denominator;
  const description=denominator===1?"One whole dark sprite":caption+" of one dark sprite ("+ordered.length+" equal pieces)";
  const art=ordered.map(index=>{
    const p=partition[index],clip=id+"-p"+index;
    return '<g class="fs-piece" data-piece-index="'+index+'" data-denominator="'+denominator+
      '" data-value="1/'+denominator+'" style="--fs-dx:'+p.spreadX+'px;--fs-dy:'+p.spreadY+
      'px;--fs-delay:'+(index%5*46)+'ms">'+
      '<clipPath id="'+clip+'"><path d="'+p.path+'"/></clipPath>'+
      '<g class="fs-fragment-motion"><g clip-path="url(#'+clip+')"><use href="#'+id+'-art"/></g>'+
      '<path class="fs-cut-edge" d="'+p.path+'" fill="none" stroke="#9db4a0" stroke-width=".9" stroke-linejoin="round"/></g></g>';
  }).join("");
  // The overlay is a seam-free redraw of the SAME assembled creature,
  // never an additional token. Only one face is drawn in the original art.
  return '<span class="fs-assembly'+(separated?' is-separated':'')+'" data-complete="'+complete+
    '" data-denominator="'+denominator+'" role="img" aria-label="'+description+'">'+
    '<svg aria-hidden="true" viewBox="0 0 128 120" xmlns="http://www.w3.org/2000/svg">'+spriteArt(id)+
    '<ellipse class="fs-shadow" cx="64" cy="108" rx="30" ry="5" fill="#080f0e" opacity=".52"/>'+
    (outline&&denominator>1?'<circle class="fs-whole-outline" cx="64" cy="60" r="32" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="3 3"/>':"")+
    art+(complete?'<g class="fs-joined-art"><use href="#'+id+'-art"/><circle cx="64" cy="60" r="32" fill="none" stroke="#a5b9a5" stroke-width=".9"/></g>':"")+
    '</svg>'+(denominator===1?'<span class="fs-whole-actor token sprite sprite-black" aria-hidden="true" style="--hop-delay:'+(-serial*173%1600)+'ms;--wiggle-delay:'+(-serial*193%1100)+'ms;--blink-delay:'+(-serial*331%6000)+'ms"><span class="sprite-ground-shadow"></span><span class="sprite-reaction-shell"><span class="sprite-motion"><span class="sprite-feet"></span><span class="sprite-body"><span class="sprite-eyes"><i></i><i></i></span></span></span></span></span>':"")+
    (label?'<span class="fs-label" aria-hidden="true">'+caption+'</span>':"")+'</span>';
}
export function spriteInventoryMarkup(value){
  const plan=spriteInventoryPlan(value);
  const whole=Array.from({length:plan.whole},()=>spriteAssemblyMarkup(1,[0],{outline:false,label:false})).join("");
  const partial=plan.pieces.length?spriteAssemblyMarkup(plan.denominator,plan.pieces.map(p=>p.index)):"";
  return '<div class="fs-inventory" role="img" aria-label="'+rtext(plan.value)+' sprites"><div class="fs-inventory-objects" aria-hidden="true">'+
    whole+partial+(!plan.whole&&!plan.pieces.length?'<span class="fs-empty">No sprites</span>':"")+'</div></div>';
}
/** A temporary physical grid retains actual unreduced pieces. No extra
 * full sprite is rendered when a group contains d pieces. */
export function spriteGridMarkup({whole,units,denominator}){
  if(!Number.isInteger(whole)||whole<0||!Number.isInteger(units)||units<0||
    !allowed(denominator)||whole+units>FRACTION_CAPACITY*2||whole>FRACTION_CAPACITY)
    throw new RangeError("Invalid sprite demonstration inventory");
  const wholes=whole?spriteInventoryMarkup(whole):"";
  const groups=[];
  for(let i=0;i<units;i+=denominator){
    groups.push(spriteAssemblyMarkup(denominator,
      Array.from({length:Math.min(denominator,units-i)},(_,j)=>j),{separated:true}));
  }
  return '<div class="fs-grid-inventory">'+wholes+groups.join("")+
    (!whole&&!units?'<span class="fs-empty">No sprites</span>':"")+'</div>';
}
