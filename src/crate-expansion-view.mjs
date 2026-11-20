import {
  crateFloorLandingPlan,spriteEscapeKeyframes,weightEscapeKeyframes
} from "./crate-physical-layout.mjs";

/**
 * PR41: one continuous physical event INSIDE the existing chamber.
 * No cards, equation captions, multiplication tray or unrelated stage.
 *
 * Every moving actor uses the game's real sprite/weight art. These temporary
 * actors are visual-only, outside #left-items/#right-items, until the engine
 * commits a single value-preserving rewrite at the end. Thus a failed or
 * interrupted sequence never leaves half-open maths in saved state.
 */
export function createCrateExpansionView({
  side,chamber,items,plan,tokenMarkup,reducedMotion=false
}){
  if(!chamber||!items||!plan||typeof tokenMarkup!=="function")
    throw new TypeError("Opening crates requires a chamber, objects and a valid group plan.");
  const crates=[...items.querySelectorAll(".sealed-crate")];
  if(crates.length!==plan.count)
    throw new RangeError("The displayed crates do not match the room's contents.");
  const minimal=!!reducedMotion||
    (typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches);
  const floor=chamber.querySelector(".room-floor");
  if(!floor)throw new TypeError("Crates must open onto the actual chamber floor.");
  const stage=document.createElement("div");
  stage.id=side+"-crate-expansion";
  stage.className="crate-expansion-stage crate-physical-scene";
  stage.dataset.phase="opening";
  stage.setAttribute("role","group");
  stage.setAttribute("aria-label","Crates opening in the chamber");
  chamber.append(stage);

  const bounds=stage.getBoundingClientRect();
  const floorY=floor.getBoundingClientRect().top-bounds.top;
  const destinations=crateFloorLandingPlan(bounds.width,floorY,
    plan.totalSprites,plan.totalWeights);
  const spriteActors=[],weightActors=[];
  let paused=false,destroyed=false,frame=null;
  const animations=new Set();
  const pausedExternal=new Set();
  const pendingHolds=new Set();
  const isStopped=()=>paused||document.hidden;
  const setPlayback=()=>{
    for(const animation of animations){
      if(isStopped())animation.pause();
      else animation.play();
    }
    stage.dataset.paused=String(isStopped());
  };
  const visibility=()=>setPlayback();
  document.addEventListener("visibilitychange",visibility);

  function hold(ms){
    return new Promise((resolve,reject)=>{
      let previous=null,elapsed=0;
      const record={reject};
      pendingHolds.add(record);
      const tick=time=>{
        if(destroyed){pendingHolds.delete(record);
          reject(new Error("Crate scene was interrupted"));return;}
        if(previous!==null&&!isStopped())
          elapsed+=Math.min(45,time-previous);
        previous=time;
        if(elapsed>=ms){pendingHolds.delete(record);frame=null;resolve();return;}
        frame=requestAnimationFrame(tick);
      };
      frame=requestAnimationFrame(tick);
    });
  }
  function announce(phase){
    stage.dataset.phase=phase;
  }

  function addActor(kind,sourceCrate,index,landing){
    const actor=document.createElement("span");
    actor.className="crate-escaped-actor crate-escaped-"+kind;
    actor.dataset.sourceCrate=String(sourceCrate);
    actor.dataset.kind=kind;
    actor.dataset.landed="false";
    actor.style.left=landing.left+"px";
    actor.style.top=landing.top+"px";
    actor.style.width=landing.width+"px";
    actor.style.height=landing.height+"px";
    actor.style.setProperty("--escape-scale",String(landing.scale));
    actor.innerHTML=tokenMarkup(kind==="sprite"?"posX":"posOne",index,false,side);
    stage.append(actor);
    return actor;
  }
  for(let i=0;i<plan.totalSprites;i++){
    const sourceCrate=Math.floor(i/plan.spritesPerCrate);
    spriteActors.push({sourceCrate,
      element:addActor("sprite",sourceCrate,i,destinations.sprites[i])});
  }
  for(let i=0;i<plan.totalWeights;i++){
    const sourceCrate=Math.floor(i/plan.weightsPerCrate);
    weightActors.push({sourceCrate,
      indexInCrate:i%plan.weightsPerCrate,
      element:addActor("weight",sourceCrate,i,destinations.weights[i])});
  }

  function openCrate(index){
    if(destroyed||!crates[index])throw new RangeError("Invalid crate lid.");
    const crate=crates[index];
    crate.dataset.crateState="opened";
    crate.classList.add("crate-opened");
    stage.dataset.phase="opening";
    stage.dataset.crateIndex=String(index);
  }

  async function animateOut(record,index,kind,delay=0){
    const crate=crates[record.sourceCrate];
    const source=kind==="sprite"
      ?crate.querySelector(".crate-lid")
      :crate.querySelector('.crate-bay-weight[data-weight-index="'+record.indexInCrate+'"]');
    const from=source?.getBoundingClientRect()||crate.getBoundingClientRect();
    const actor=record.element;
    actor.classList.add("released");
    // Source and target are measured in the same physical chamber coordinate
    // space. No intermediate 2D "counting tray" is ever rendered.
    const to=actor.getBoundingClientRect();
    const dx=from.left+from.width/2-to.left-to.width/2;
    const dy=from.top+from.height/2-to.top-to.height/2;
    const keyframes=kind==="sprite"
      ?spriteEscapeKeyframes(dx,dy,index,minimal)
      :weightEscapeKeyframes(dx,dy,index,minimal);
    const duration=minimal?(kind==="sprite"?250:190):
      kind==="sprite"?940:670;
    const animation=actor.animate(keyframes,{
      duration,delay,easing:"cubic-bezier(.22,.69,.29,1)",fill:"both"
    });
    animations.add(animation);
    if(isStopped())animation.pause();
    try{await animation.finished;}finally{
      animation.cancel();
      animations.delete(animation);
    }
    if(destroyed)return;
    actor.classList.add("landed");
    actor.dataset.landed="true";
    if(kind==="weight")source?.classList.add("crate-weight-taken");
  }
  async function spritesBounceTogether(){
    announce("sprites-bouncing");
    // Crucially, every sprite starts at once. They do not appear one per
    // explanatory line or wait for another sprite's movement to finish.
    await Promise.all(spriteActors.map((record,index)=>
      animateOut(record,index,"sprite",minimal?0:index*45)));
    announce("sprites-landed");
    await hold(minimal?470:840);
  }
  async function panelsFall(){
    announce("panels-falling");
    for(const crate of crates){
      crate.classList.add("crate-panels-down");
      crate.dataset.crateState="panels-down";
    }
    await hold(minimal?390:780);
    announce("weights-revealed");
    // The individual three-weight groups are NOW visible behind the fallen
    // wooden fronts; keep the room still long enough to recognize them.
    await hold(minimal?680:1090);
  }
  async function weightsTumble(){
    for(let crateIndex=0;crateIndex<plan.count;crateIndex++){
      announce("weights-tumbling");
      stage.dataset.crateIndex=String(crateIndex);
      const packet=weightActors.filter(r=>r.sourceCrate===crateIndex);
      await Promise.all(packet.map((record,index)=>
        animateOut(record,index,"weight",minimal?index*25:index*75)));
      await hold(minimal?190:340);
    }
    // Leave the last tumbling packet visible in motion before all objects
    // settle. This pause also makes the physical group origins observable.
    await hold(minimal?420:570);
    announce("weights-landed");
    await hold(minimal?380:570);
  }
  async function settle(){
    announce("settle");
    for(const crate of crates)crate.classList.add("crate-empty");
    await hold(minimal?230:610);
  }
  async function playReleaseSteps(){
    if(crates.some(crate=>!crate.classList.contains("crate-opened")))
      throw new Error("All lids must open before sprites can escape.");
    await spritesBounceTogether();
    await panelsFall();
    await weightsTumble();
    await settle();
  }
  function pause(){
    paused=true;
    setPlayback();
    // Freeze the real articulated hand and the wooden lid/panel CSS
    // transitions as well, not just the airborne token animations.
    const hand=document.getElementById("hand");
    for(const element of [hand,...crates]){
      if(!element)continue;
      for(const animation of element.getAnimations({subtree:true})){
        if(animation.playState!=="running")continue;
        animation.pause();
        pausedExternal.add(animation);
      }
    }
  }
  function resume(){
    paused=false;
    for(const animation of pausedExternal){
      if(animation.playState==="paused")animation.play();
    }
    pausedExternal.clear();
    setPlayback();
  }
  function destroy(){
    if(destroyed)return;
    destroyed=true;
    paused=false;
    document.removeEventListener("visibilitychange",visibility);
    if(frame!==null)cancelAnimationFrame(frame);
    for(const record of pendingHolds)
      record.reject(new Error("Crate scene was interrupted"));
    pendingHolds.clear();
    for(const animation of pausedExternal){
      if(animation.playState==="paused")animation.play();
    }
    pausedExternal.clear();
    for(const animation of animations)animation.cancel();
    animations.clear();
    stage.remove();
    for(const crate of crates){
      delete crate.dataset.crateState;
      crate.classList.remove("crate-opened","crate-panels-down","crate-empty");
      for(const weight of crate.querySelectorAll(".crate-weight-taken"))
        weight.classList.remove("crate-weight-taken");
    }
  }
  return Object.freeze({
    stage,crateElements:crates,plan,announce,openCrate,playReleaseSteps,
    pause,resume,hold,destroy,get paused(){return paused;}
  });
}
