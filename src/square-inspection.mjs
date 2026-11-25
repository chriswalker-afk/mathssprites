/** PR73: an optional, read-only carpenter's inspection frame.
 * The learner can inspect a candidate square without selecting an
 * operation. Counts, history, stars, room value and hidden x are untouched.
 */
import {validSquareRoom,SQUARE_KINDS} from "./square-rules.mjs";
import {squareArrangementForSide} from "./square-root-construction.mjs";
import {squareConstructionMarkup} from "./square-construction.mjs";
import {areaSpriteMarkup} from "./square-sprites.mjs";

export const INSPECTION_SIDE_LIMIT=6;
const art=k=>k==="posOne"?'<span class="box-actor box-actor-weight"></span>':areaSpriteMarkup(k);
/** Explicit curriculum policy. No inspection in the notebook, build
 * chapters, other worlds, or paper-first replay. */
export function squareInspectionPolicy(level,{mode="auto",notebook=false}={}){
  if(notebook||level?.squareLaboratory!==true||level.goal!=="isolate")return null;
  if(level.id==="workshop-custom"&&level.squareInspection==="free")
    return mode==="auto"?"guided":mode==="manual"?"independent":null;
  if(level.squareInspection==="guided"&&mode==="auto")return "guided";
  if(level.squareInspection==="independent"&&mode==="manual")return "independent";
  return null;
}
/** Fit ONLY the existing quadratic and linear regions, never using
 * the room's constant, other chamber, solution, or reference route.
 * An incomplete quadratic corner or nonintegral cross-region has no
 * automatic fit. The learner may still choose a trial side manually.
 */
export function guidedInspectionSide(source){
  if(!validSquareRoom(source))return null;
  const a=Math.sqrt(source.posX2??0);
  if(!Number.isInteger(a)||a<1)return null;
  const b=(source.posX??0)/(2*a);
  if(!Number.isInteger(b)||b<0||a+b>INSPECTION_SIDE_LIMIT)return null;
  return Object.freeze({a,b});
}
export function inspectionSideStep(side,kind,delta){
  const a=side?.a,b=side?.b;
  if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a+b>INSPECTION_SIDE_LIMIT||
     !["a","b"].includes(kind)||![-1,1].includes(delta))throw new TypeError("Choose a whole side increment");
  const current=kind==="a"?a:b,other=kind==="a"?b:a;
  const value=Math.max(0,Math.min(INSPECTION_SIDE_LIMIT-other,current+delta));
  return Object.freeze(kind==="a"?{a:value,b}:{a,b:value});
}
export function squareInspectionPlan(source,side){
  return squareArrangementForSide(source,side?.a,side?.b);
}
const nouns={posX2:"square sprite",posX:"round sprite",posOne:"weight"};
const words=(n,k)=>n+" "+nouns[k]+(n===1?"":"s");
function countsSummary(counts){
  return SQUARE_KINDS.filter(k=>counts[k]).map(k=>words(counts[k],k)).join(", ");
}
/** This accessible description reports only what is drawn, not a move
 * suggestion or the hidden answer. Independent players must choose
 * their own candidate side before any gap is drawn. */
export function inspectionDescription(plan){
  const missing=countsSummary(plan.missing),excess=countsSummary(plan.excess);
  return "Inspection only. Side markers are guides, not additional objects. "+
    "Each side has "+plan.spriteSide+" round sprite markers and "+plan.weightSide+" weight markers. "+
    (missing?"Empty slots: "+missing+". ":"No empty slots. ")+
    (excess?"Objects outside the frame: "+excess+".":"No objects outside the frame.");
}
export function mountSquareInspection(node,items,plan,{scaffold=false}={}){
  const chamber=items.closest(".chamber");
  if(!chamber||!plan)throw new TypeError("Choose a chamber and candidate frame");
  const priorAria=items.getAttribute("aria-hidden");
  let dead=false;
  node.innerHTML='<div class="root-trial-frame-zone">'+squareConstructionMarkup(plan)+'</div>'+
    '<div class="root-trial-surplus" aria-hidden="true">'+plan.leftovers.map(p=>
      '<span class="root-trial-extra" data-kind="'+p.kind+'" data-source-index="'+p.sourceIndex+'">'+art(p.kind)+'</span>').join("")+'</div>';
  node.dataset.inspection="true";node.dataset.scaffold=String(scaffold);
  node.dataset.present=String(plan.cells.filter(c=>c.present).length);
  node.dataset.gaps=String(plan.cells.filter(c=>!c.present).length);
  node.dataset.excess=String(plan.leftovers.length);
  node.setAttribute("aria-label",inspectionDescription(plan));
  for(const edge of node.querySelectorAll(".box-edge"))edge.classList.add("built");
  const cells=[...node.querySelectorAll(".box-cell")];
  cells.forEach((el,i)=>{
    const c=plan.cells[i];
    el.classList.add("placed");
    if(c.present)el.dataset.sourceIndex=String(c.sourceIndex);
    else{
      el.classList.add("root-gap");
      el.querySelector(".box-actor").remove();
      if(scaffold&&c.region==="units")el.classList.add("inspection-corner-gap");
    }
  });
  node.hidden=false;chamber.classList.add("square-inspecting");
  // The actual inventory remains untouched behind its one-for-one
  // illustration; suppress duplicate accessible and visible content.
  items.setAttribute("aria-hidden","true");
  const zone=node.querySelector(".root-trial-frame-zone"),workshop=zone.firstElementChild;
  function fit(){
    if(dead)return;
    const size=Math.max(1,Math.min(246,zone.clientWidth,zone.clientHeight));
    workshop.style.setProperty("--square-frame-size",size+"px");
  }
  fit();
  const observer=typeof ResizeObserver==="function"?new ResizeObserver(fit):null;
  observer?.observe(zone);
  return {plan,destroy(){
    if(dead)return;dead=true;observer?.disconnect();
    chamber.classList.remove("square-inspecting");
    if(priorAria===null)items.removeAttribute("aria-hidden");
    else items.setAttribute("aria-hidden",priorAria);
    node.hidden=true;node.innerHTML="";
    node.removeAttribute("aria-label");
    for(const key of ["inspection","scaffold","present","gaps","excess"])delete node.dataset[key];
  }};
}
