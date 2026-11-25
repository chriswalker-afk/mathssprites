/** PR71 — real in-room construction, driven by the exact area geometry.
 * Edges are dimensional guides. Only the interior cells describe the
 * output inventory. The controller never changes an engine room/history.
 */
import {inRoomBoxPlan} from "./area-layout.mjs";
import {areaSpriteMarkup} from "./square-sprites.mjs";
const KINDS=Object.freeze(["posX2","posX","posOne"]);
const SELECTORS={posX2:".sprite-square",posX:".sprite-black",posOne:".weight"};
const CELL_KIND={"square-sprite":"posX2","round-sprite":"posX","weight":"posOne"};
const REGIONS=["quadratic","mixed-top","mixed-bottom","units"];
const art=k=>k==="posOne"?'<span class="box-actor box-actor-weight"></span>':areaSpriteMarkup(k);
export function squareConstructionPlan(area){
  if(area?.op!=="square")throw new TypeError("A square construction needs the square operation");
  const box=inRoomBoxPlan(area);
  const order={posX2:0,posX:0,posOne:0};
  const cells=box.cells.map(c=>{
    const kind=CELL_KIND[c.type];
    return Object.freeze({...c,kind,outputIndex:order[kind]++});
  });
  const edges=box.horizontal.map(({type,index})=>Object.freeze({
    index,kind:type==="sprite"?"posX":"posOne",
    inputIndex:type==="sprite"?index:index-box.spriteSide
  }));
  const stages=["frame","edge","column",...REGIONS.filter(region=>cells.some(c=>c.region===region))];
  return Object.freeze({...box,cells:Object.freeze(cells),edges:Object.freeze(edges),
    stages:Object.freeze(stages)});
}
export function squareConstructionMarkup(plan){
  const tracks=plan.tracks.map(x=>x+"fr").join(" ");
  const ruler=axis=>plan.edges.map(edge=>
    '<span class="box-edge-token edge-'+(edge.kind==="posX"?"sprite":"weight")+
    '" data-segment="'+edge.index+'" data-input-kind="'+edge.kind+'" data-input-index="'+edge.inputIndex+
    '" data-non-counting="true" aria-hidden="true"><span class="square-edge-actor">'+art(edge.kind)+'</span></span>').join("");
  const tiles=plan.cells.map(c=>'<span class="box-cell region-'+c.region+' stage-'+c.stage+
    '" data-kind="'+c.kind+'" data-row="'+c.row+'" data-col="'+c.col+'" data-cell-index="'+c.index+
    '" data-output-index="'+c.outputIndex+'" aria-hidden="true" style="--place-delay:'+Math.min(126,(c.row+c.col)*14)+'ms">'+art(c.kind)+'</span>').join("");
  return '<div class="box-workshop square-construction-workshop">'+
    '<div class="square-frame-base" aria-hidden="true"></div>'+
    ["top","left","right","bottom"].map(side=>'<span class="square-frame-wall wall-'+side+'" aria-hidden="true"></span>').join("")+
    '<div class="box-edge box-edge-top" data-non-counting="true" style="grid-template-columns:'+tracks+'">'+ruler("top")+'</div>'+
    '<div class="box-edge box-edge-left" data-non-counting="true" style="grid-template-rows:'+tracks+'">'+ruler("left")+'</div>'+
    '<div class="box-grid" style="grid-template-columns:'+tracks+';grid-template-rows:'+tracks+'">'+tiles+'</div></div>';
}
export const centre=el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};};
// Convert screen-space displacement into the element's parent coordinate
// system. The scale track and the tilting room may both be transformed.
function localDelta(el,dx,dy){
  try{
    let matrix=new DOMMatrix();
    for(let p=el.parentElement;p;p=p.parentElement){
      const transform=getComputedStyle(p).transform;
      if(transform&&transform!=="none")matrix=new DOMMatrix(transform).multiply(matrix);
    }
    const inverse=matrix.inverse();
    const p0=new DOMPoint(0,0).matrixTransform(inverse),p1=new DOMPoint(dx,dy).matrixTransform(inverse);
    if(Number.isFinite(p1.x-p0.x)&&Number.isFinite(p1.y-p0.y))return [p1.x-p0.x,p1.y-p0.y];
  }catch{}
  return [dx,dy];
}
export function fromPoint(el,point,animations,{duration=390,delay=0,bounce=false}={}){
  if(!point||typeof el.animate!=="function")return;
  const end=centre(el),[dx,dy]=localDelta(el,point.x-end.x,point.y-end.y);
  if(!Number.isFinite(dx)||!Number.isFinite(dy))return;
  const frames=bounce?[
    {translate:dx+"px "+dy+"px",scale:".72",offset:0},
    {translate:(dx*.48)+"px "+(dy*.48-12)+"px",scale:"1.04",offset:.46},
    {translate:"0px 3px",scale:"1.1 .85",offset:.80},
    {translate:"0px -3px",scale:".99 1.04",offset:.91},
    {translate:"0px 0px",scale:"1",offset:1}
  ]:[
    {translate:dx+"px "+dy+"px",scale:".9"},
    {translate:"0px 0px",scale:"1"}
  ];
  const animation=el.animate(frames,{duration,delay,easing:"cubic-bezier(.22,.72,.28,1)",fill:"both"});
  animations.push(animation);
  // Natural completion restores the exact normal CSS and floor geometry.
  animation.finished.then(()=>animation.cancel(),()=>{});
}
export const currentTokens=(items,kind)=>[...items.querySelectorAll(".floor-track > "+SELECTORS[kind])];
export function mountSquareConstruction(node,items,area,{reduced=false}={}){
  const plan=squareConstructionPlan(area),chamber=items.closest(".chamber"),animations=[];
  // The original row is visible until the edge stage. No extra visible copy
  // is left on the floor once it has been transferred to its side guide.
  const source=Object.fromEntries(["posX","posOne"].map(k=>[k,currentTokens(items,k)]));
  let stepIndex=0,origins=null,dead=false;
  node.innerHTML=squareConstructionMarkup(plan);
  node.dataset.construction="square";node.dataset.step="frame";
  node.dataset.visibleCells="0";
  node.dataset.operation="square";node.dataset.layout="in-room";
  node.dataset.spriteSide=plan.spriteSide;node.dataset.weightSide=plan.weightSide;
  node.dataset.cells=plan.cells.length;
  node.hidden=false;
  chamber.classList.add("square-construction-active","area-active","square-source-visible");
  const fit=()=>{
    if(dead)return;
    const size=Math.max(1,Math.min(246,node.clientWidth,node.clientHeight));
    node.style.setProperty("--square-frame-size",size+"px");
  };
  fit();
  const observer=typeof ResizeObserver==="function"?new ResizeObserver(fit):null;
  observer?.observe(node);
  const top=node.querySelector(".box-edge-top"),left=node.querySelector(".box-edge-left");
  const cells=[...node.querySelectorAll(".box-cell")];
  function advance(step){
    if(dead||plan.stages[stepIndex+1]!==step)throw new Error("Square construction stages must follow their physical order");
    stepIndex++;
    node.dataset.step=step;
    if(step==="edge"){
      const points=plan.edges.map(e=>source[e.kind][e.inputIndex]?centre(source[e.kind][e.inputIndex]):null);
      top.classList.add("built","source-arranged");
      chamber.classList.remove("square-source-visible");
      chamber.classList.add("square-source-transferred");
      if(!reduced)for(const [i,marker] of [...top.querySelectorAll(".square-edge-actor")].entries())
        fromPoint(marker,points[i],animations,{duration:370,delay:i*13});
    }else if(step==="column"){
      top.classList.remove("source-arranged");
      left.classList.add("built");
    }else{
      for(const cell of cells.filter(el=>el.classList.contains("region-"+step)))cell.classList.add("placed");
    }
    node.dataset.visibleCells=String(cells.filter(c=>c.classList.contains("placed")).length);
  }
  function capture(){
    if(stepIndex!==plan.stages.length-1||cells.some(c=>!c.classList.contains("placed")))
      throw new Error("Cannot release an incomplete square construction");
    origins=Object.fromEntries(KINDS.map(k=>[k,[]]));
    for(const cell of cells){
      const kind=cell.dataset.kind,index=Number(cell.dataset.outputIndex);
      origins[kind][index]=centre(cell.querySelector(".box-actor"));
    }
  }
  function release(){
    if(dead||!origins)return false;
    const output=Object.fromEntries(KINDS.map(k=>[k,currentTokens(items,k)]));
    const matches=KINDS.every(k=>output[k].length===plan.counts[k]);
    // The engine callback has rendered the actual result. Replace the area
    // actors with those same counted floor actors in the same paint; never
    // show two copies. If a visual trial rendered no result, don't invent it.
    node.dataset.step="result";node.dataset.released=String(matches);
    chamber.classList.remove("square-source-transferred","square-source-visible");
    chamber.classList.add("area-after-square");
    if(matches&&!reduced){
      for(const k of KINDS)output[k].forEach((token,index)=>{
        // Weight slots and sprite outer tokens keep their final flex position;
        // only this temporary displacement is animated. Pile 3+2 stays intact.
        fromPoint(token,origins[k][index],animations,{duration:620,delay:(index%6)*18,bounce:k!=="posOne"});
      });
    }
    return matches;
  }
  return {plan,advance,capture,release,destroy(){
    if(dead)return;dead=true;observer?.disconnect();
    for(const animation of animations)animation.cancel();
    chamber.classList.remove("square-construction-active","square-source-visible","square-source-transferred");
    node.style.removeProperty("--square-frame-size");
    for(const name of ["construction","visibleCells","released"])delete node.dataset[name];
  }};
}
/** Bounded visual trial: the arithmetic engine reports the full requested
 * area and exact overflow. Draw only a 7x7-or-smaller sample and at most
 * twelve actual excess-object props. Nothing here is an engine token. */
export function squareOverflowPlan(source,failure){
  const a=source?.posX??0,b=source?.posOne??0,n=a+b;
  if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a<0||b<0||n<=6||n>48||
    source.posX2||source.negX||source.negOne||source.crates||
    failure?.code!=="overflow"||failure.total!==n*n||failure.capacity!==48)
    return null;
  const type=(r,c)=>r<a&&c<a?"posX2":r<a||c<a?"posX":"posOne";
  const sampleSide=Math.min(7,n),cells=[];
  for(let r=0;r<sampleSide;r++)for(let c=0;c<sampleSide;c++)
    if(cells.length<48)cells.push(type(r,c));
  const spill=Array.from({length:Math.min(12,n*n-48)},(_,i)=>{
    const index=48+i;return type(Math.floor(index/n),index%n);
  });
  return {side:n,total:n*n,capacity:48,excess:n*n-48,sampleSide,cells,spill};
}
export function squareOverflowMarkup(plan){
  if(!plan)return "";
  return '<div class="square-overflow-trial" data-square-side="'+plan.side+'" data-total="'+plan.total+
    '" data-excess="'+plan.excess+'" role="img" aria-label="Illustrative oversized square: '+plan.side+
    ' side segments, '+plan.total+' requested objects, '+plan.excess+' more than the room can hold">'+
    '<div class="square-overflow-board" style="--trial-side:'+plan.sampleSide+'">'+
    plan.cells.map(k=>'<span class="square-overflow-cell" data-kind="'+k+'">'+art(k)+'</span>').join("")+'</div>'+
    '<div class="square-overflow-spill">'+plan.spill.map((k,i)=>'<span class="square-overflow-prop" data-kind="'+k+
      '" style="--trial-index:'+i+'">'+art(k)+'</span>').join("")+'</div></div>';
}
