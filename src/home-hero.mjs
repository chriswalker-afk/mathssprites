import {
  HERO_SCENES,HERO_STEP_MS,HERO_LANDING_MS,HERO_HOLD_MS,
  HERO_CHANGE_MS,emptyHeroCounts,heroMass,heroAngle
} from "./home-hero-scenes.mjs";

/**
 * One lightweight controller for the home illustration. Never touches the
 * mathematical game engine, saved progress, or scene controls.
 * Animation time comes from ONE requestAnimationFrame loop; pausing freezes
 * both the physics and the sprite/weight landing animations.
 */
export class HomeHeroAnimator{
  constructor(root){
    if(!root)throw new Error("Home hero artwork not found.");
    this.root=root;
    this.figure=root.querySelector(".hero-illustration");
    this.caption=root.querySelector("#hero-scene-caption");
    this.button=root.querySelector("#hero-playback");
    this.motionNote=root.querySelector("#hero-motion-note");
    this.items={
      left:root.querySelector("#hero-left-items"),
      right:root.querySelector("#hero-right-items")
    };
    if(!this.figure||!this.caption||!this.button||!this.motionNote||
       !this.items.left||!this.items.right)
      throw new Error("Home hero illustration markup is incomplete.");
    this.media=window.matchMedia("(prefers-reduced-motion: reduce)");
    this.motionOverride=document.body.classList.contains("reduce-motion");
    this.active=false;
    this.userPaused=false;
    // Explicit Play remains available even when the device or game setting
    // prefers less motion. Never auto-play against that preference.
    this.manualPlay=false;
    this.started=false;
    this.frameId=0;
    this.lastTime=null;
    this.counts=emptyHeroCounts();
    this.pending=[];
    this.angle=0;
    this.velocity=0;
    this.target=0;
    this.sceneIndex=0;
    this.stepIndex=0;
    this.phase="steps";
    this.wait=0;
    this.onFrame=time=>this.frame(time);
    this.onPageVisibility=()=>this.syncPlayback();
    this.onMedia=()=>this.updateMotion();
    this.onButton=()=>{
      if(this.isReduced()&&!this.manualPlay){
        this.manualPlay=true;
        this.userPaused=false;
        this.beginSequence();
      }else{
        this.userPaused=!this.userPaused;
      }
      this.syncPlayback();
    };
    document.addEventListener("visibilitychange",this.onPageVisibility);
    this.button.addEventListener("click",this.onButton);
    this.media.addEventListener?.("change",this.onMedia);
    this.showStatic();
    this.syncPlayback();
  }
  isReduced(){
    return this.motionOverride||this.media.matches;
  }
  /** Called for the app's persistent Motion setting, not local hero storage. */
  setMotionOverride(reduced){
    if(this.motionOverride===!!reduced)return;
    this.motionOverride=!!reduced;
    this.manualPlay=false;
    this.userPaused=false;
    this.updateMotion();
  }
  updateMotion(){
    // A changed accessibility setting restores the safe default, while the
    // Play control still lets the user explicitly opt in on this page.
    this.manualPlay=false;
    this.userPaused=false;
    if(this.isReduced()){
      this.cancelFrame();
      this.showStatic();
    }else{
      this.beginSequence();
    }
    this.syncPlayback();
  }
  setActive(active){
    if(this.active===!!active)return;
    this.active=!!active;
    if(this.active&&!this.started&&!this.isReduced())this.beginSequence();
    this.syncPlayback();
  }
  cancelFrame(){
    if(this.frameId)cancelAnimationFrame(this.frameId);
    this.frameId=0;
    this.lastTime=null;
  }
  isStaticPreference(){
    return this.isReduced()&&!this.manualPlay;
  }
  canAnimate(){
    return this.active&&!this.userPaused&&!this.isStaticPreference()&&!document.hidden;
  }
  syncPlayback(){
    const reduced=this.isStaticPreference();
    // The former implementation HID Play whenever animations were reduced.
    // On a school device with a saved preference, the hero was permanently
    // static with no visible explanation or way to start it.
    this.button.hidden=false;
    this.button.textContent=reduced?"Play animation":
      this.userPaused?"Resume animation":"Pause animation";
    this.button.setAttribute("aria-pressed",String(this.userPaused));
    this.motionNote.hidden=!reduced;
    if(reduced){
      this.motionNote.textContent=this.motionOverride
        ?"Motion is reduced in Settings. Choose Play animation to watch the scale."
        :"Your device prefers reduced motion. Choose Play animation to watch the scale.";
    }
    this.root.dataset.playback=reduced?"reduced":this.userPaused?"paused":
      this.canAnimate()?"playing":"inactive";
    this.figure.classList.toggle("hero-is-paused",!this.canAnimate());
    if(this.canAnimate()){
      if(!this.frameId){
        this.lastTime=null;
        this.frameId=requestAnimationFrame(this.onFrame);
      }
    }else this.cancelFrame();
  }
  setAngle(angle){
    this.angle=angle;
    this.figure.style.setProperty("--hero-angle",angle.toFixed(3)+"deg");
    this.figure.style.setProperty("--hero-counter-angle",(-angle).toFixed(3)+"deg");
  }
  setMassAndBalance(){
    const left=heroMass(this.counts.left),right=heroMass(this.counts.right);
    this.target=heroAngle(left,right);
    this.root.dataset.leftMass=String(left);
    this.root.dataset.rightMass=String(right);
    this.root.dataset.balance=left===right?"level":left>right?"left-heavy":"right-heavy";
  }
  createItem(kind,animated=false,drift=0){
    const item=document.createElement("span");
    item.className="hero-item "+(kind==="sprite"?"hero-creature":"hero-weight")+
      (animated?" hero-arriving":"");
    item.dataset.kind=kind;
    item.setAttribute("aria-hidden","true");
    if(animated){
      item.style.setProperty("--hero-drop-x",drift+"px");
      item.style.setProperty("--hero-flight",HERO_LANDING_MS+"ms");
    }
    if(kind==="sprite"){
      const eyes=document.createElement("span");
      eyes.className="hero-eyes";
      eyes.append(document.createElement("i"),document.createElement("i"));
      item.appendChild(eyes);
    }else{
      const handle=document.createElement("i");
      handle.className="hero-weight-handle";
      item.appendChild(handle);
    }
    return item;
  }
  putItem(side,kind,animated=false,drift=0){
    this.items[side].appendChild(this.createItem(kind,animated,drift));
  }
  clearItems(){
    this.items.left.replaceChildren();
    this.items.right.replaceChildren();
    this.pending=[];
    this.counts=emptyHeroCounts();
    this.setMassAndBalance();
  }
  showStatic(){
    this.started=false;
    this.figure.classList.remove("hero-changing");
    this.clearItems();
    this.putItem("left","sprite");
    for(let n=0;n<3;n++)this.putItem("right","weight");
    this.counts.left.sprite=1;
    this.counts.right.weight=3;
    this.setMassAndBalance();
    this.setAngle(0);
    this.velocity=0;
    this.root.dataset.scene="still";
    this.root.dataset.phase="still";
    this.caption.textContent="What could make the two sides balance?";
  }
  beginSequence(){
    this.cancelFrame();
    this.started=true;
    this.figure.classList.remove("hero-changing");
    this.clearItems();
    this.angle=0;
    this.velocity=0;
    this.setAngle(0);
    this.sceneIndex=0;
    this.stepIndex=0;
    this.phase="steps";
    this.wait=0;
    this.applySceneLabel();
  }
  applySceneLabel(){
    const scene=HERO_SCENES[this.sceneIndex];
    this.root.dataset.scene=scene.id;
    this.root.dataset.phase=this.phase;
    this.caption.textContent=scene.caption;
  }
  emit(step){
    this.putItem(step.side,step.kind,true,step.drift);
    // Do not change the mass until the new object has actually landed.
    this.pending.push({side:step.side,kind:step.kind,remaining:HERO_LANDING_MS});
  }
  updateLandings(dt){
    for(const landing of this.pending)landing.remaining-=dt;
    const ready=this.pending.filter(landing=>landing.remaining<=0);
    this.pending=this.pending.filter(landing=>landing.remaining>0);
    if(!ready.length)return;
    for(const landing of ready)this.counts[landing.side][landing.kind]++;
    this.setMassAndBalance();
    // Small pan bounce is synced with the actual landing, not the scheduled
    // appearance of a sprite still falling through the air.
    for(const side of new Set(ready.map(landing=>landing.side))){
      const pan=this.root.querySelector(".hero-hanger-"+side+" .hero-pan");
      pan.classList.remove("hero-pan-impact");
      void pan.offsetWidth;
      pan.classList.add("hero-pan-impact");
    }
  }
  nextBeat(){
    const scene=HERO_SCENES[this.sceneIndex];
    if(this.phase==="steps"){
      if(this.stepIndex<scene.steps.length){
        const step=scene.steps[this.stepIndex++];
        this.emit(step);
        this.wait=step.gapMs??HERO_STEP_MS;
      }else{
        this.phase="hold";
        this.root.dataset.phase="hold";
        this.wait=HERO_HOLD_MS;
      }
      return;
    }
    if(this.phase==="hold"){
      const following=HERO_SCENES[(this.sceneIndex+1)%HERO_SCENES.length];
      if(following.continuePrevious){
        this.sceneIndex=(this.sceneIndex+1)%HERO_SCENES.length;
        this.stepIndex=0;
        this.phase="steps";
        this.wait=200;
        this.applySceneLabel();
      }else{
        this.phase="transition";
        this.root.dataset.phase="transition";
        this.figure.classList.add("hero-changing");
        this.target=0;
        this.wait=HERO_CHANGE_MS;
      }
      return;
    }
    // Cross-fade the old contents before removing them. No sudden teleport
    // or visible snap between unrelated equations.
    this.figure.classList.remove("hero-changing");
    this.clearItems();
    this.sceneIndex=(this.sceneIndex+1)%HERO_SCENES.length;
    this.stepIndex=0;
    this.phase="steps";
    this.wait=140;
    this.applySceneLabel();
  }
  integrate(dt){
    if(dt<=0)return;
    const seconds=dt/1000;
    // Spring + damping: slight overshoot, then genuine mechanical settling.
    const acceleration=(this.target-this.angle)*62-this.velocity*13;
    this.velocity+=acceleration*seconds;
    const newAngle=Math.max(-10.5,Math.min(10.5,this.angle+this.velocity*seconds));
    if(Math.abs(newAngle-this.target)<.018&&Math.abs(this.velocity)<.035){
      this.velocity=0;
      this.setAngle(this.target);
    }else this.setAngle(newAngle);
  }
  frame(time){
    this.frameId=0;
    if(!this.canAnimate())return;
    const dt=this.lastTime===null?0:Math.min(50,Math.max(0,time-this.lastTime));
    this.lastTime=time;
    this.updateLandings(dt);
    this.wait-=dt;
    if(this.wait<=0)this.nextBeat();
    this.integrate(dt);
    this.frameId=requestAnimationFrame(this.onFrame);
  }
  destroy(){
    this.cancelFrame();
    document.removeEventListener("visibilitychange",this.onPageVisibility);
    this.media.removeEventListener?.("change",this.onMedia);
    this.button.removeEventListener("click",this.onButton);
    this.active=false;
  }
}
export function createHomeHero(root=document.getElementById("home-hero-art")){
  return new HomeHeroAnimator(root);
}
