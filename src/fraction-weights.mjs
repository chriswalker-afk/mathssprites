/** PR61 — weight artwork derived from the existing .weight CSS silhouette.
 * Every slice has equal polygon area; cut widths vary because the weight
 * tapers towards its shoulders. Geometry never determines algebraic mass.
 */
import {rational,radd,rsub,rmul,req,rtext} from "./rational.mjs";
import {FRACTION_DENOMINATORS,FRACTION_CAPACITY,fractionParts,fractionPieceCount} from "./fraction-engine.mjs";
import {weightPilePosition,WEIGHT_COUNT_LABEL_THRESHOLD} from "./weight-piles.mjs";

export const WEIGHT_BODY=Object.freeze([[29,17],[72,17],[90,88],[84,97],[13,97],[8,88]].map(Object.freeze));
export const WEIGHT_SLICE_GAP=4;
const allowed=d=>FRACTION_DENOMINATORS.includes(d);
export function polygonArea(points){
  return Math.abs(points.reduce((sum,p,i)=>{
    const q=points[(i+1)%points.length];
    return sum+p[0]*q[1]-q[0]*p[1];
  },0))/2;
}
// Clip a convex polygon against a vertical half plane.
function clipAt(points,x,keepLeft){
  const inside=p=>keepLeft?p[0]<=x:p[0]>=x;
  const out=[];
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],ai=inside(a),bi=inside(b);
    if(ai)out.push(a);
    if(ai!==bi){
      const t=(x-a[0])/(b[0]-a[0]);
      out.push([x,a[1]+t*(b[1]-a[1])]);
    }
  }
  return out;
}
const area=polygonArea(WEIGHT_BODY);
const left=Math.min(...WEIGHT_BODY.map(p=>p[0])),right=Math.max(...WEIGHT_BODY.map(p=>p[0]));
const cache=new Map();
export function weightPartition(denominator,{trial=false}={}){
  if(!allowed(denominator)&&!(trial&&Number.isInteger(denominator)&&denominator>1&&denominator<=120))throw new RangeError("Unsupported weight denominator");
  if(cache.has(denominator))return cache.get(denominator);
  const cuts=[left];
  for(let i=1;i<denominator;i++){
    let lo=left,hi=right;
    for(let j=0;j<50;j++){
      const mid=(lo+hi)/2;
      if(polygonArea(clipAt(WEIGHT_BODY,mid,true))<area*i/denominator)lo=mid;
      else hi=mid;
    }
    cuts.push((lo+hi)/2);
  }
  cuts.push(right);
  const pieces=Object.freeze(Array.from({length:denominator},(_,index)=>{
    const points=clipAt(clipAt(WEIGHT_BODY,cuts[index],false),cuts[index+1],true)
      .map(p=>Object.freeze(p));
    return Object.freeze({index,denominator,value:rational(1,denominator),
      polygon:Object.freeze(points),left:cuts[index],right:cuts[index+1]});
  }));
  cache.set(denominator,pieces);
  return pieces;
}
export function weightInventoryPlan(value){
  const q=rational(value),parts=fractionParts(q);
  if(!allowed(q.d)||fractionPieceCount(q)>FRACTION_CAPACITY)
    throw new RangeError("Unsupported or oversized weight inventory");
  const piles=[];
  for(let index=0;index<parts.whole;index++){
    const position=weightPilePosition(index,parts.whole);
    (piles[position.pile]??=[]).push(position);
  }
  const pieces=weightPartition(parts.denominator).slice(0,parts.pieces);
  return Object.freeze({value:q,whole:parts.whole,denominator:parts.denominator,
    pieces:Object.freeze(pieces),piles:Object.freeze(piles.map(Object.freeze)),
    countPlaque:parts.whole>WEIGHT_COUNT_LABEL_THRESHOLD?parts.whole:null});
}
/** Expand an exact quantity on an allowed common grid without inventing value.
 * A whole stays whole; residual pieces use the requested grid, even if the
 * rational pair itself reduces (e.g. 3/6 remains three sixth-pieces here).
 */
export function weightGrid(value,denominator){
  const q=rational(value);
  if(q.n<0||!allowed(denominator)||denominator%q.d!==0)
    throw new RangeError("Quantity cannot be represented on this weight grid");
  const whole=Math.floor(q.n/q.d);
  const units=(q.n%q.d)*(denominator/q.d);
  return Object.freeze({value:q,whole,units,denominator});
}
/** Consume the engine's own constant plan. These are presentation-only
 * before/common-grid/after stages, not extra equation transactions.
 */
export function weightChangeStages(plan,operation){
  if(plan?.kind!=="posOne"||!["add","remove"].includes(operation))
    throw new TypeError("Expected an add/remove weight plan");
  const {before,after,amount,grid}=plan;
  const expected=operation==="add"?radd(before,amount):rsub(before,amount);
  if(!req(expected,after))throw new Error("Weight change must conserve exact value");
  const b=weightGrid(before,grid),a=weightGrid(amount,grid);
  let whole=b.whole,units=b.units,borrowed=0;
  if(operation==="remove"&&units<a.units){
    whole--;units+=grid;borrowed=1;
  }
  if(whole<a.whole&&operation==="remove")throw new Error("Insufficient whole weights");
  const rawWhole=operation==="add"?whole+a.whole:whole-a.whole;
  const rawUnits=operation==="add"?units+a.units:units-a.units;
  if(!req(radd(rawWhole,rational(rawUnits,grid)),after))
    throw new Error("Visual regrouping must preserve exact value");
  return Object.freeze({operation,before:b,amount:a,grid,
    prepared:Object.freeze({whole,units,denominator:grid,borrowed}),
    raw:Object.freeze({whole:rawWhole,units:rawUnits,denominator:grid}),
    after:weightInventoryPlan(after)});
}
let svgSerial=0;
const coords=points=>points.map(p=>p.map(n=>n.toFixed(6)).join(",")).join(" ");
const body=coords(WEIGHT_BODY);
/** One reusable SVG assembly. Every fragment is one real equal-value polygon,
 * never a scaled-down whole. The ghost outline is a reference, not a token.
 */
export function weightAssemblyMarkup(denominator,indices,{outline=true,label=true,separated=false,trial=false}={}){
  const partition=weightPartition(denominator,{trial});
  if(!Array.isArray(indices)||!indices.length||new Set(indices).size!==indices.length||
    indices.some(i=>!Number.isInteger(i)||i<0||i>=denominator))
    throw new RangeError("Select distinct pieces of the original weight");
  const ordered=[...indices].sort((a,b)=>a-b);
  const id="fw-art-"+(++svgSerial);
  const full=ordered.length===denominator;
  const gap=denominator===1?0:Math.min(WEIGHT_SLICE_GAP,36/(denominator-1));
  const caption=denominator===1?"1":ordered.length+"/"+denominator;
  const description=denominator===1?"One whole weight":caption+" of one weight ("+ordered.length+" equal pieces)";
  const art=ordered.map(index=>{
    const p=partition[index],spread=(index-(denominator-1)/2)*gap;
    const clip=id+"-p"+index;
    return '<g class="fw-piece" data-piece-index="'+index+'" data-denominator="'+denominator+
      '" data-value="1/'+denominator+'" style="--fw-spread:'+spread+'px">'+
      '<clipPath id="'+clip+'"><polygon points="'+coords(p.polygon)+'"/></clipPath>'+
      '<g clip-path="url(#'+clip+')"><polygon points="'+body+'" fill="url(#'+id+')"/>'+
      '<path class="fw-material-rim" d="M12 89H88 M13 94H86" fill="none" stroke="#d8b77b" stroke-width="2.5"/>'+
      '<path class="fw-material-shine" d="M36 31L31 72" stroke="#ffefb8" stroke-opacity=".30" stroke-width="8" stroke-linecap="round"/>'+
      '</g><polygon class="fw-cut-edge" points="'+coords(p.polygon)+'" fill="none" stroke="#694921" stroke-width=".75" stroke-linejoin="round"/></g>';
  }).join("");
  return '<span class="fw-assembly'+(separated?' is-separated':'')+'" data-complete="'+full+'" role="img" aria-label="'+description+'">'+
    '<svg aria-hidden="true" viewBox="-18 0 136 103" xmlns="http://www.w3.org/2000/svg">'+
    '<defs><linearGradient id="'+id+'" x1="8" y1="15" x2="90" y2="97" gradientUnits="userSpaceOnUse">'+
    '<stop class="fw-material-dark" stop-color="#7b592f"/><stop class="fw-material-light" offset=".32" stop-color="#d5b17c"/><stop class="fw-material-mid" offset=".70" stop-color="#8f6a3e"/><stop class="fw-material-deep" offset="1" stop-color="#5b412b"/>'+
    '</linearGradient></defs>'+
    (outline&&denominator>1?'<polygon class="fw-whole-outline" points="'+body+'" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="3 3"/>':"")+
    art+(full?'<polygon class="fw-joined-edge" points="'+body+'" fill="none" stroke="#694921" stroke-width=".75" stroke-linejoin="round"/>':"")+'</svg>'+(label?'<span class="fw-label" aria-hidden="true">'+caption+'</span>':"")+'</span>';
}
function pileMarkup(positions){
  return '<span class="fw-pile" data-pile-size="'+positions.length+'">'+positions.map(pos=>
    '<span class="fw-pile-weight" data-slot="'+pos.slot+'">'+
    weightAssemblyMarkup(1,[0],{outline:false,label:false})+'</span>').join("")+'</span>';
}
export function weightInventoryMarkup(value){
  const plan=weightInventoryPlan(value);
  const pile=plan.piles.map(pileMarkup).join("");
  const partial=plan.pieces.length?weightAssemblyMarkup(plan.denominator,plan.pieces.map(p=>p.index)):"";
  return '<div class="fw-inventory" role="img" aria-label="'+rtext(plan.value)+' weights">'+
    '<div class="fw-inventory-objects" aria-hidden="true">'+
    (plan.countPlaque?'<span class="fw-count-plaque">'+plan.countPlaque+' whole weights</span>':"")+
    pile+partial+(!plan.whole&&!plan.pieces.length?'<span class="fw-empty">No weights</span>':"")+'</div></div>';
}
/** Show a temporary unreduced grid, including borrowed whole weights and
 * uncombined pieces. A full group of d pieces retains its seams here.
 */
export function weightGridMarkup({whole,units,denominator}){
  if(!Number.isInteger(whole)||whole<0||!Number.isInteger(units)||units<0||
    !allowed(denominator)||whole+units>FRACTION_CAPACITY*2)
    throw new RangeError("Invalid demonstration inventory");
  const wholes=weightInventoryMarkup(whole);
  const groups=[];
  for(let i=0;i<units;i+=denominator){
    groups.push(weightAssemblyMarkup(denominator,
      Array.from({length:Math.min(denominator,units-i)},(_,j)=>j),{separated:true}));
  }
  return '<div class="fw-grid-inventory">'+(whole?wholes:"")+groups.join("")+
    (!whole&&!units?'<span class="fw-empty">No weights</span>':"")+'</div>';
}
