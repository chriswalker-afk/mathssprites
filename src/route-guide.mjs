/** PR103 — per-route first visit, independent of progress and resume.
 * The original four physical introductions keep their established storage keys.
 * Other routes use the same setting but their own completion state.
 */
import {readGuideSeen,writeGuideSeen,readIndependentGuideSeen,writeIndependentGuideSeen} from "./onboarding.mjs";
import {readOppositesGuideSeen,writeOppositesGuideSeen} from "./opposite-onboarding.mjs";
const genericKey=(world,stage)=>"mathssprites.route-guide."+world+"."+stage+".v1";
export function usesPhysicalFirstLesson(world,stage,number){
  return number===1&&["workshop","opposites"].includes(world)&&["guided","independent"].includes(stage);
}
export function routeGuideSeen(world,stage,storage){
  if(world==="workshop"&&stage==="guided")return readGuideSeen(storage);
  if(world==="workshop"&&stage==="independent")return readIndependentGuideSeen(storage);
  if(world==="opposites"&&["guided","independent"].includes(stage))return readOppositesGuideSeen(stage,storage);
  try{return (storage??globalThis.localStorage)?.getItem(genericKey(world,stage))==="yes";}catch{return false;}
}
export function setRouteGuideSeen(world,stage,seen,storage){
  if(world==="workshop"&&stage==="guided")return writeGuideSeen(seen,storage);
  if(world==="workshop"&&stage==="independent")return writeIndependentGuideSeen(seen,storage);
  if(world==="opposites"&&["guided","independent"].includes(stage))return writeOppositesGuideSeen(stage,seen,storage);
  try{(storage??globalThis.localStorage)?.setItem(genericKey(world,stage),seen?"yes":"no");}catch{}
  return !!seen;
}
export function resetFirstVisitGuides(registry,storage){
  for(const world of registry)for(const stage of world.stages)
    setRouteGuideSeen(world.id,stage.id,false,storage);
}
export function routeGuideCues(world,stage){
  if(stage==="notebook")return [
    {title:"Meet the maths",text:({
      workshop:"An equation states that two expressions are equal. Use nonnegative integer coefficients and constants in this world.",
      opposites:"Negative coefficients and constants are allowed. Adding a term and its additive inverse gives zero, e.g. x + (−x) = 0.",
      fractions:"Use exact fractions for coefficients and constants. Combine fractions using a common denominator.",
      squares:"Squaring applies to the entire expression: (a + b)² = a² + 2ab + b². For principal roots, use x ≥ 0."
    })[world]||"Equivalent equations have the same solutions."},
    {title:"Preserve equality",text:"Apply the same addition, subtraction or nonzero numerical multiplication/division to both sides. Expanding brackets is an equivalent rewrite of one expression."},
    {title:"Justify each line",text:"Choose an operation, preview the equivalent equation and confirm it. Aim to isolate x, or perform the requested square transformation."}
  ];
  const idea={
    workshop:"A dark sprite has a mystery value. Each whole weight counts as one.",
    opposites:"Black and white sprites are opposites, as are weights and balloons. An opposite pair makes zero.",
    fractions:"Sprites and weights can be split into equal parts. The denominator tells you the number of equal pieces.",
    squares:"Round sprites represent a side length; square sprites represent its square. Inspect or build square areas as the experiment requires."
  }[world]||"Look at the objects and the goal of your experiment.";
  const choose=world==="fractions"?"Choose an operation, then an object and an exact whole/fraction amount, or a number of groups.":world==="squares"?"Choose the operation that fits the goal. Square and square root act on the whole expression.":"Choose an operation, an object and an amount, or a number of equal groups.";
  return [
    {title:"Meet this world",text:idea},
    {title:"Choose your tools",text:choose},
    stage==="independent"?{title:"Match your moves",text:"Use the hand in one chamber, then make the matching change in the other. The scale settles once the moves match."}
      :{title:"Let the hand mirror",text:"Press Do it to both rooms. The hand carries out the same change on both sides; look at the result before choosing another operation."}
  ];
}
/** Lightweight non-modal guide in the existing mission or notebook intro.
 * No clicks are intercepted and no physical layout coordinates are changed.
 * Only an explicit dismissal, finish or solved experiment marks it seen. */
export function mountRouteGuide(root,{worldId,stageId,enabled,notebook=false,fraction=false}){
  const parent=root.querySelector(notebook?(fraction?"#fb-notebook .notebook-guide-slot":"#notebook-workspace .notebook-guide-slot"):(fraction?".fb-mission":".mission"));
  if(!parent)return null;
  const doc=parent.ownerDocument,wrapper=doc.createElement("aside");
  wrapper.className="route-guide";wrapper.dataset.routeGuide=worldId+"/"+stageId;
  wrapper.setAttribute("aria-label","Learning guide");
  wrapper.innerHTML='<button type="button" class="route-guide-reopen" aria-expanded="false">? Guide</button><div class="route-guide-content" hidden><div class="route-guide-heading"><strong class="route-guide-title"></strong><span class="route-guide-step"></span></div><p class="route-guide-message" aria-live="polite"></p><div class="route-guide-actions"><button type="button" data-guide-action="back">Back</button><button type="button" data-guide-action="skip">Skip</button><button type="button" data-guide-action="next">Next</button></div></div>';
  parent.append(wrapper);
  const $=s=>wrapper.querySelector(s),content=$(".route-guide-content"),reopen=$(".route-guide-reopen"),cues=routeGuideCues(worldId,stageId);
  const back=$('[data-guide-action="back"]'),next=$('[data-guide-action="next"]'),skip=$('[data-guide-action="skip"]');
  let index=0,open=enabled&&!routeGuideSeen(worldId,stageId),wasOpened=open;
  function render(){
    content.hidden=!open;reopen.hidden=open;reopen.setAttribute("aria-expanded",String(open));
    $(".route-guide-title").textContent=cues[index].title;
    $(".route-guide-step").textContent=(index+1)+" of "+cues.length;
    $(".route-guide-message").textContent=cues[index].text;
    back.hidden=index===0;next.textContent=index===cues.length-1?"Done":"Next";
  }
  function dismiss(focus=false){
    if(wasOpened){
      setRouteGuideSeen(worldId,stageId,true);
      doc.defaultView.dispatchEvent(new CustomEvent("mathssprites:route-guide-seen",{detail:{worldId,stageId,seen:true}}));
    }
    open=false;render();if(focus)reopen.focus();
  }
  reopen.addEventListener("click",()=>{index=0;open=true;wasOpened=true;render();next.focus();});
  back.addEventListener("click",()=>{if(index>0)index--;render();if(back.hidden)next.focus();});
  skip.addEventListener("click",()=>dismiss(true));
  next.addEventListener("click",()=>{if(index===cues.length-1)dismiss(true);else {index++;render();}});
  render();
  return {complete(){if(open)dismiss();},destroy(){wrapper.remove();}};
}
