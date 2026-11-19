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
    this.items={
      left:root.querySelector("#hero-left-items"),
      right:root.querySelector("#hero-right-items")
    };
    if(!this.figure||!this.caption||!this.button||!this.items.left||!this.items.right)
      throw new Error("Home hero illustration markup is incomplete.");
    this.media=window.matchMedia("(prefers-reduced-motion: reduce)");
    this.motionOverride=document.body.classList.contains("reduce-motion");
    this.active=false;
    this.userPaused=false;
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
      if(this.isReduced())return;
      this.userPaused=!this.userPaused;
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
    const was=this.isReduced();
    this.motionOverride=!!reduced;
    if(was!==this.isReduced())this.updateMotion();
  }
  updateMotion(){
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
  canAnimate(){
    return this.active&&!this.userPaused&&!this.isReduced()&&!document.hidden;
  }
  syncPlayback(){
    const reduced=this.isReduced();
    this.button.hidden=reduced;
    this.button.textContent=this.userPaused?"Play animation":"Pause animation";
    this.button.setAttribute("aria-pressed",String(this.userPaused));
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
  createItem(kind,animated=false){
    const item=document.createElement("span");
    item.className="hero-item "+(kind==="sprite"?"hero-creature":"hero-weight")+
      (animated?" hero-arriving":"");
    item.dataset.kind=kind;
    item.setAttribute("aria-hidden","true");
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
  putItem(side,kind,animated=false){
    this.items[side].appendChild(this.createItem(kind,animated));
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
    this.caption.textContent="One mysterious sprite. Three brass weights. A perfect balance.";
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
    this.putItem(step.side,step.kind,true);
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
  }
  nextBeat(){
    const scene=HERO_SCENES[this.sceneIndex];
    if(this.phase==="steps"){
      if(this.stepIndex<scene.steps.length){
        this.emit(scene.steps[this.stepIndex++]);
        this.wait=HERO_STEP_MS;
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
