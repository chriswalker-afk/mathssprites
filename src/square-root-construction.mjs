/** PR72: principal square roots use the same frame and physical geometry
 * as squaring. Source tokens are represented once, first on the floor,
 * then in their respective cells. Only the engine contact may change
 * counts. Neither a missing corner nor an illustrative trial is a move.
 */
import {areaArrangement} from "./engine.mjs";
import {validSquareRoom} from "./square-rules.mjs";
import {squareConstructionPlan,squareConstructionMarkup,centre,fromPoint,currentTokens} from "./square-construction.mjs";
import {areaSpriteMarkup} from "./square-sprites.mjs";
const KINDS=Object.freeze(["posX2","posX","posOne"]);
const REGIONS=["units","mixed-bottom","mixed-top","quadratic"];
const emptyCounts=()=>Object.fromEntries(KINDS.map(k=>[k,0]));
const count=(r,k)=>r[k]??0;
const art=k=>k==="posOne"?'<span class="box-actor box-actor-weight"></span>':areaSpriteMarkup(k);
export function squareRootPlan(area){
  if(area?.op!=="sqrt"||area.side<1)throw new TypeError("A nonempty complete square is required");
  const box=squareConstructionPlan({...area,op:"square"});
  const stages=["frame","arrange",...REGIONS.filter(region=>box.cells.some(c=>c.region===region)),"column","edge"];
  return Object.freeze({...box,op:"sqrt",stages:Object.freeze(stages),
    output:Object.freeze({posX2:0,posX:box.spriteSide,posOne:box.weightSide})});
}
function descriptor(a,b){
  const n=a+b;
  return {op:"sqrt",kind:a&&b?"mixed":a?"posX2":"posOne",symbolic:a>0,
    side:n,cells:n*n,...(a&&b?{spriteSide:a,weightSide:b}:{} )};
}
const nearestRoot=n=>Math.min(6,Math.max(1,Math.round(Math.sqrt(n))));
/** Construct a bounded, representative whole-object trial, NOT a solution
 * search. Prefer a genuine existing quadratic corner; when the unit corner
 * is not a complete square, infer a plausible side from the cross-region.
 * Positive perfect-square corners are retained where feasible. An odd cross
 * coefficient is apportioned alternately to transposed cells, making the
 * unequal regions visible. Every existing object belongs to a slot or the
 * leftover tray, even for 37–48 pure units.
 */
export function squareRootTrialPlan(source){
  if(!source||source.negX||source.negOne||source.crates||source.quantityMode==="fractions"||
     KINDS.some(k=>!Number.isSafeInteger(count(source,k))||count(source,k)<0))return null;
  const [A,C,B]=KINDS.map(k=>count(source,k));
  if(A+C+B===0||A+C+B>48||areaArrangement(source,"sqrt"))return null;
  let a=0,b=0;
  if(!A&&!C)b=nearestRoot(B);
  else if(!B&&!C)a=nearestRoot(A);
  else {
    a=Math.min(5,nearestRoot(A));
    const r=Math.sqrt(B);
    const suggested=B>0&&Number.isInteger(r)?r:C>0?Math.max(1,Math.round(C/(2*a))):nearestRoot(B);
    b=Math.max(1,Math.min(6-a,suggested));
  }
  return squareArrangementForSide(source,a,b);
}
/** Shared exact allocation for refusal and freely chosen inspection sides.
 * A frame is purely illustrative: present cells plus the tray account for
 * the original room; gaps do not add a single object to the engine. */
export function squareArrangementForSide(source,a,b){
  if(!validSquareRoom(source)||!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||
    a<0||b<0||a+b<1||a+b>6)return null;
  const box=squareRootPlan(descriptor(a,b)),used=emptyCounts();
  // Alternating transposed mixed cells means any odd leftover or missing
  // round sprite appears as a genuine asymmetry, not an arbitrary pile.
  const pairs=box.cells.filter(c=>c.region==="mixed-top").flatMap(c=>[c,
    box.cells.find(d=>d.row===c.col&&d.col===c.row)]);
  const ordered=[...box.cells.filter(c=>c.kind==="posX2"),...pairs,...box.cells.filter(c=>c.kind==="posOne")];
  const byIndex=new Map();
  for(const c of ordered){
    const present=used[c.kind]<count(source,c.kind);
    byIndex.set(c.index,Object.freeze({...c,present,sourceIndex:present?used[c.kind]++:null}));
  }
  const cells=box.cells.map(c=>byIndex.get(c.index));
  const missing=Object.fromEntries(KINDS.map(k=>[k,cells.filter(c=>c.kind===k&&!c.present).length]));
  const excess=Object.fromEntries(KINDS.map(k=>[k,count(source,k)-used[k]]));
  const leftovers=KINDS.flatMap(k=>Array.from({length:excess[k]},(_,i)=>Object.freeze({kind:k,sourceIndex:used[k]+i})));
  return Object.freeze({...box,cells:Object.freeze(cells),missing:Object.freeze(missing),excess:Object.freeze(excess),
    leftovers:Object.freeze(leftovers),source:Object.freeze(Object.fromEntries(KINDS.map(k=>[k,count(source,k)])))});
}
const names={posX2:"square sprite",posX:"round sprite",posOne:"weight"};
function words(n,k){return n+" "+names[k]+(n===1?"":"s");}
const describe=r=>KINDS.filter(k=>r[k]>0).map(k=>words(r[k],k)).join(", ");
export function squareRootTrialMessage(plan){
  if(!plan)return null;
  const missing=describe(plan.missing),excess=describe(plan.excess);
  const detail=[missing?"This arrangement is missing "+missing+".":"",excess?"I have "+excess+" left over.":""].filter(Boolean).join(" ");
  return "I need a complete square to keep one whole side. "+detail+
    " These pieces do not make a complete square of whole objects in this laboratory. I'll undo the attempt and put everything back.";
}
function fitFrame(zone,workshop){
  const fit=()=>{const size=Math.max(1,Math.min(246,zone.clientWidth,zone.clientHeight));
    workshop.style.setProperty("--square-frame-size",size+"px");};
  fit();
  const observer=typeof ResizeObserver==="function"?new ResizeObserver(fit):null;
  observer?.observe(zone);
  return ()=>observer?.disconnect();
}
function inventory(items){return Object.fromEntries(KINDS.map(k=>[k,currentTokens(items,k)]));}
export function mountSquareRoot(node,items,area,{reduced=false}={}){
  const plan=squareRootPlan(area),chamber=items.closest(".chamber"),animations=[];
  const source=inventory(items);
  let stepIndex=0,origins=null,dead=false;
  node.innerHTML=squareConstructionMarkup(plan);
  Object.assign(node.dataset,{construction:"root",step:"frame",visibleCells:"0",
    operation:"sqrt",layout:"in-room",spriteSide:String(plan.spriteSide),weightSide:String(plan.weightSide),
    cells:String(plan.cells.length)});
  node.hidden=false;
  chamber.classList.add("square-root-active","area-active","square-source-visible");
  const disposeFit=fitFrame(node,node);
  const top=node.querySelector(".box-edge-top"),left=node.querySelector(".box-edge-left");
  const cells=[...node.querySelectorAll(".box-cell")];
  function advance(step){
    if(dead||plan.stages[stepIndex+1]!==step)throw new Error("Square root stages must follow their physical order");
    stepIndex++;node.dataset.step=step;
    if(step==="arrange"){
      // The cell actors take the places of the actual inventory. Capture
      // their starting points before hiding the original physical row.
      const points=cells.map(c=>{
        const token=source[c.dataset.kind][Number(c.dataset.outputIndex)];
        return token?centre(token):null;
      });
      top.classList.add("built");left.classList.add("built");
      for(const c of cells)c.classList.add("placed");
      chamber.classList.remove("square-source-visible");
      chamber.classList.add("square-source-transferred");
      if(!reduced)cells.forEach((c,i)=>fromPoint(c.querySelector(".box-actor"),points[i],animations,
        {duration:450,delay:Math.min(130,i*8)}));
    }else if(REGIONS.includes(step)){
      for(const c of cells.filter(c=>c.classList.contains("region-"+step)))c.classList.add("removed");
    }else if(step==="column")left.classList.add("retired");
    else if(step==="edge")top.classList.add("kept");
    node.dataset.visibleCells=String(cells.filter(c=>c.classList.contains("placed")&&!c.classList.contains("removed")).length);
  }
  function capture(){
    if(stepIndex!==plan.stages.length-1||!top.classList.contains("kept")||
      !left.classList.contains("retired")||cells.some(c=>!c.classList.contains("removed")))
      throw new Error("Cannot recover a side before the complete square has been dismantled");
    origins=Object.fromEntries(KINDS.map(k=>[k,[]]));
    for(const marker of top.querySelectorAll(".box-edge-token"))
      origins[marker.dataset.inputKind][Number(marker.dataset.inputIndex)]=centre(marker.querySelector(".square-edge-actor"));
  }
  function release(){
    if(dead||!origins)return false;
    const output=inventory(items),matches=KINDS.every(k=>output[k].length===plan.output[k]);
    node.dataset.step="result";node.dataset.released=String(matches);
    chamber.classList.remove("square-source-visible","square-source-transferred");
    chamber.classList.add("area-after-sqrt");
    if(matches&&!reduced)for(const k of KINDS)
      output[k].forEach((token,i)=>fromPoint(token,origins[k][i],animations,
        {duration:560,delay:i*15,bounce:k==="posX"}));
    return matches;
  }
  return {plan,advance,capture,release,destroy(){
    if(dead)return;dead=true;disposeFit();for(const a of animations)a.cancel();
    chamber.classList.remove("square-root-active","square-source-visible","square-source-transferred");
    node.style.removeProperty("--square-frame-size");
    for(const name of ["construction","visibleCells","released"])delete node.dataset[name];
  }};
}
/** A refused operation arranges only the original tokens: empty slots
 * are empty, surplus props correspond one-to-one with unplaced tokens.
 * No engine state or history, no artificial whole-object square. */
export function mountSquareRootTrial(stage,items,plan,{reduced=false}={}){
  const chamber=items.closest(".chamber"),source=inventory(items),animations=[];
  stage.classList.add("square-root-trial-stage");
  stage.innerHTML='<div class="root-trial-frame-zone">'+squareConstructionMarkup(plan)+'</div>'+
    '<div class="root-trial-surplus" aria-hidden="true">'+plan.leftovers.map(p=>
      '<span class="root-trial-extra" data-kind="'+p.kind+'" data-source-index="'+p.sourceIndex+'">'+art(p.kind)+'</span>').join("")+'</div>';
  stage.dataset.rootTrial="true";
  stage.dataset.rootMissing=String(Object.values(plan.missing).reduce((n,x)=>n+x,0));
  stage.dataset.rootExcess=String(plan.leftovers.length);
  stage.hidden=false;
  chamber.classList.add("square-root-refusal-active");
  const zone=stage.querySelector(".root-trial-frame-zone"),workshop=zone.firstElementChild;
  const disposeFit=fitFrame(zone,workshop);
  const cells=[...stage.querySelectorAll(".box-cell")],markers=stage.querySelectorAll(".box-edge");
  for(const marker of markers)marker.classList.add("built");
  for(const [i,el] of cells.entries()){
    const cell=plan.cells[i];el.classList.add("placed");
    if(!cell.present){el.classList.add("root-gap");el.querySelector(".box-actor").remove();}
    else{
      el.dataset.sourceIndex=String(cell.sourceIndex);
      const original=source[cell.kind][cell.sourceIndex];
      if(!reduced&&original)fromPoint(el.querySelector(".box-actor"),centre(original),animations,{duration:440,delay:Math.min(i*9,135)});
    }
  }
  for(const el of stage.querySelectorAll(".root-trial-extra")){
    const original=source[el.dataset.kind][Number(el.dataset.sourceIndex)];
    if(!reduced&&original)fromPoint(el.querySelector(".box-actor"),centre(original),animations,{duration:420,bounce:true});
  }
  const details=squareRootTrialMessage(plan);
  stage.setAttribute("aria-label",details.replace(/ I'll undo.*$/,""));
  return {plan,destroy(){
    disposeFit();for(const a of animations)a.cancel();
    chamber.classList.remove("square-root-refusal-active");
    stage.classList.remove("square-root-trial-stage");
    for(const key of ["rootTrial","rootMissing","rootExcess"])delete stage.dataset[key];
  }};
}
