import {spriteCreatureMarkup,setSquarePreviewShape,heldSpriteMarkup,miniSpriteMarkup,areaSpriteMarkup} from "./square-sprites.mjs";
const $=id=>document.getElementById(id),studio=$("square-studio");
const actor=(kind,side,i=0)=>spriteCreatureMarkup("square-art-preview",side,kind,i);
$("ss-round").innerHTML=actor("posX","comparison-round");
$("ss-square").innerHTML=actor("posX2","comparison-square");
$("ss-morph-stage").innerHTML=actor("posX","morph");
$("ss-reaction-stage").innerHTML=actor("posX2","reaction");
$("ss-held").innerHTML=heldSpriteMarkup("posX2");
$("ss-cell").innerHTML='<span class="box-cell region-quadratic">'+areaSpriteMarkup("posX2")+'</span>';
$("ss-mini").innerHTML=miniSpriteMarkup("posX2");
const morph=$("ss-morph-stage").firstElementChild,reaction=$("ss-reaction-stage").firstElementChild;
const preference=matchMedia("(prefers-reduced-motion: reduce)");
let reduced=preference.matches,override=false,paused=false,morphKind="posX";
function clearReaction(){
  reaction.classList.remove("sprite-reacting");delete reaction.dataset.reaction;
  delete reaction.dataset.reactPhase;
  $("ss-reaction-stage").classList.remove("hand-target");
}
function setMotion(value){
  reduced=value;studio.classList.toggle("reduce-motion",value);
  studio.dataset.reduced=String(value);
  $("ss-motion").setAttribute("aria-pressed",String(value));
  $("ss-motion").textContent=value?"Motion: reduced":"Motion: on";
  if(value){morph.removeAttribute("data-square-morph");clearReaction();$("ss-reaction-status").textContent="Idle · reduced motion";}
  else $("ss-reaction-status").textContent="Idle";
}
$("ss-motion").addEventListener("click",()=>{override=true;setMotion(!reduced);});
preference.addEventListener("change",e=>{if(!override)setMotion(e.matches);});
function form(kind){
  morphKind=kind;
  setSquarePreviewShape(morph,kind,{animate:!reduced});
  $("ss-form-status").textContent=kind==="posX2"?"Square form":"Round form";
  $("ss-to-square").disabled=kind==="posX2";$("ss-to-round").disabled=kind==="posX";
}
morph.querySelector(".sprite-body").addEventListener("animationend",e=>{
  if(e.target===morph.querySelector(".sprite-body")&&["square-form","round-form"].includes(e.animationName))
    morph.removeAttribute("data-square-morph");
});
$("ss-to-square").addEventListener("click",()=>form("posX2"));
$("ss-to-round").addEventListener("click",()=>form("posX"));
function renderRoom(){
  const n=Number($("ss-quantity").value);
  $("ss-room").innerHTML=Array.from({length:3},(_,i)=>actor("posX","mixed",i)).join("")+
    Array.from({length:n},(_,i)=>actor("posX2","mixed",i)).join("");
  $("ss-room").setAttribute("aria-label","Three round sprites and "+n+" square sprites");
}
$("ss-quantity").addEventListener("change",renderRoom);
$("ss-pause").addEventListener("click",()=>{
  paused=!paused;$("ss-room").classList.toggle("hand-target",paused);
  $("ss-pause").setAttribute("aria-pressed",String(paused));$("ss-pause").textContent=paused?"Hand leaves":"Hand approaches";
});
function showReaction(kind){
  clearReaction();
  const label={duck:"Duck",dodge:"Dodge",caught:"Caught"}[kind];
  if(reduced){$("ss-reaction-status").textContent=label+" · motion reduced";return;}
  $("ss-reaction-stage").classList.add("hand-target");
  reaction.dataset.reaction=kind==="caught"?"duck":kind;
  reaction.dataset.reactPhase=kind==="caught"?"caught":"start";
  reaction.style.setProperty("--dodge-shift","20px");
  reaction.querySelector(".sprite-reaction-shell").getBoundingClientRect();
  reaction.classList.add("sprite-reacting");
  $("ss-reaction-status").textContent=label;
}
for(const [id,kind] of [["ss-duck","duck"],["ss-dodge","dodge"],["ss-catch","caught"]])$(id).addEventListener("click",()=>showReaction(kind));
$("ss-rest").addEventListener("click",()=>{clearReaction();$("ss-reaction-status").textContent="Idle";});
reaction.querySelector(".sprite-reaction-shell").addEventListener("animationend",e=>{
  if(e.target===reaction.querySelector(".sprite-reaction-shell")&&["sprite-duck","sprite-dodge","sprite-caught"].includes(e.animationName)){
    clearReaction();$("ss-reaction-status").textContent="Idle";
  }
});
renderRoom();form(morphKind);setMotion(reduced);
