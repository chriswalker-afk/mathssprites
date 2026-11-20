/**
 * PR39 — On-scene counting stage for the distributive law.
 *
 * This is VISUAL ONLY. It never mutates a room, creates a history entry, or
 * changes the balance. The caller commits the engine's prevalidated 'unpack'
 * identity once every crate has been opened and both term groups released.
 *
 * Loose actors live outside #left-items/#right-items until final commit.
 * Ordinary sprite, basket and zero-pair selectors therefore never mistake a
 * partially demonstrated term for a physical, committed game object.
 */
const waitUntilVisible=()=>new Promise(resolve=>{
  if(!document.hidden)return resolve();
  document.addEventListener("visibilitychange",function resumed(){
    if(document.hidden)return;
    document.removeEventListener("visibilitychange",resumed);
    resolve();
  });
});
export function createCrateExpansionView({
  side,chamber,items,plan,tokenMarkup,sleep,reducedMotion=false
}){
  if(!chamber||!items||!plan||typeof tokenMarkup!=="function")
    throw new TypeError("The crate counting stage requires a room, plan and token artwork.");
  const crateElements=[...items.querySelectorAll(".sealed-crate")];
  if(crateElements.length!==plan.count)
    throw new RangeError("The visible crates must match the authored algebraic groups.");
  const minimal=!!reducedMotion||
    (typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches);
  const stage=document.createElement("div");
  stage.id=side+"-crate-expansion";
  stage.className="crate-expansion-stage";
  stage.dataset.phase="opening";
  stage.setAttribute("role","group");
  stage.setAttribute("aria-label","Physical expansion of the sealed brackets");
  stage.innerHTML='<div class="crate-expansion-step" role="status" aria-live="polite">'+
    '<div class="crate-expansion-message"></div><strong class="crate-expansion-math"></strong></div>'+
    '<div class="crate-expansion-collection" aria-label="Objects released from the crates"></div>';
  const status=stage.querySelector(".crate-expansion-step");
  const message=status.querySelector(".crate-expansion-message");
  const maths=status.querySelector(".crate-expansion-math");
  const collection=stage.querySelector(".crate-expansion-collection");
  const groups=[];
  for(let i=0;i<plan.count;i++){
    const group=document.createElement("div");
    group.className="crate-release-group";
    group.dataset.sourceCrate=String(i);
    group.setAttribute("aria-label","Contents released from crate "+(i+1));
    group.innerHTML='<div class="crate-release-source">Crate '+(i+1)+'</div>'+
      '<div class="crate-release-sprites"></div><div class="crate-release-weights"></div>';
    const sprites=group.querySelector(".crate-release-sprites");
    const weights=group.querySelector(".crate-release-weights");
    for(let n=0;n<plan.spritesPerCrate;n++){
      const wrapper=document.createElement("span");
      wrapper.className="crate-release-actor crate-release-sprite";
      wrapper.dataset.kind="sprite";
      wrapper.innerHTML=tokenMarkup("posX",n,false,side);
      sprites.append(wrapper);
    }
    for(let n=0;n<plan.weightsPerCrate;n++){
      const wrapper=document.createElement("span");
      wrapper.className="crate-release-actor crate-release-weight";
      wrapper.dataset.kind="weight";
      wrapper.innerHTML=tokenMarkup("posOne",n,false,side);
      weights.append(wrapper);
    }
    collection.append(group);
    groups.push(group);
  }
  chamber.append(stage);
  const nextBeat=async(ms)=>{
    await waitUntilVisible();
    await sleep(ms);
    await waitUntilVisible();
  };
  const announce=(phase,description,math="")=>{
    stage.dataset.phase=phase;
    message.textContent=description;
    maths.textContent=math;
    maths.hidden=!math;
    stage.dataset.math=math;
  };

  function openCrate(index){
    const crate=crateElements[index];
    if(!crate)throw new RangeError("Crate index out of range.");
    crate.dataset.crateState="opened";
    crate.classList.add("crate-opened");
    announce("opening","Crowbar: crate "+(index+1)+" of "+plan.count+" is open.");
  }

  async function flyActor(source,target,delay=0){
    const from=(source||crateElements[Number(target.closest("[data-source-crate]")?.dataset.sourceCrate)||0])
      .getBoundingClientRect();
    // The destination exists in a temporary counting tray, not in the
    // authoritative token row. All objects still count as sealed in the engine.
    target.classList.add("released");
    const to=target.getBoundingClientRect();
    if(source)source.classList.add("crate-content-extracted");
    if(!minimal&&target.animate){
      const x=from.left+from.width/2-to.left-to.width/2;
      const y=from.top+from.height/2-to.top-to.height/2;
      const animation=target.animate([
        {transform:`translate(${x}px,${y}px) scale(.62)`,opacity:.85,offset:0},
        {transform:`translate(${x*.44}px,${y*.44-31}px) scale(1.07)`,opacity:1,offset:.55},
        {transform:"translate(0,0) scale(1)",opacity:1,offset:1}
      ],{duration:660,delay,easing:"cubic-bezier(.24,.76,.32,1)",fill:"both"});
      try{await animation.finished;}catch{}
      animation.cancel();
    }else await nextBeat(180+delay);
  }

  async function release(step){
    const kind=step.phase==="sprites"?"sprite":"weight";
    const crate=crateElements[step.crateIndex];
    const group=groups[step.crateIndex];
    const sourceSelector=kind==="sprite"?".crate-mini-sprite":".crate-mini-weight";
    const targetSelector=kind==="sprite"?".crate-release-sprite":".crate-release-weight";
    const sources=[...crate.querySelectorAll(sourceSelector)];
    const targets=[...group.querySelectorAll(targetSelector)];
    if(targets.length!==step.count)
      throw new RangeError("The visual objects must equal the contents of one crate.");
    group.classList.add("active");
    announce(kind==="sprite"?"sprites":"weights",step.description);
    if(kind==="sprite"){
      // First show one whole sprite per crate, then interpret the multiplier.
      for(let i=0;i<targets.length;i++)
        await flyActor(sources[i]||null,targets[i]);
    }else{
      // Three weights form ONE visible packet from each source crate.
      // The packets are released from crate 1, then crate 2.
      await Promise.all(targets.map((target,i)=>
        flyActor(sources[i]||null,target,minimal?i*35:i*95)));
    }
    await nextBeat(minimal?270:450);
  }
  async function showTotal(step){
    const sprites=step.phase==="sprite-total";
    announce(sprites?"sprite-total":"weight-total",
      sprites?"All sprites have come out.":"Now count the groups of weights.",
      step.math);
    await nextBeat(minimal?640:1250);
  }
  async function settle(){
    announce("settle","The crates are empty. The loose objects are ready.");
    for(const crate of crateElements)crate.classList.add("crate-empty");
    await nextBeat(minimal?340:650);
  }

  async function playReleaseSteps(){
    // Called after the hand has opened every crate, and NOT before.
    for(const step of plan.steps){
      if(step.phase==="open")continue;
      if(step.phase==="sprites"||step.phase==="weights")await release(step);
      else if(step.phase==="sprite-total"||step.phase==="weight-total")
        await showTotal(step);
      else if(step.phase==="settle")await settle();
    }
  }
  function destroy(){
    stage.remove();
    // The DOM model might still be the original sealed model following
    // an interrupted animation, so restore every miniature actor too.
    for(const crate of crateElements){
      delete crate.dataset.crateState;
      crate.classList.remove("crate-opened","crate-empty");
      for(const actor of crate.querySelectorAll(".crate-content-extracted"))
        actor.classList.remove("crate-content-extracted");
    }
  }
  return Object.freeze({stage,openCrate,playReleaseSteps,announce,destroy,
    crateElements,plan});
}
