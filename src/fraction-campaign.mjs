/** PR64: mount the fractional controller on a campaign-owned scene.
 * A shadow root isolates legacy app IDs, SVG clip IDs and event listeners.
 * Navigation and progress remain owned by site.mjs, not the physics renderer.
 */
import {mountFractionBalance} from "./fraction-balance.mjs";
import {mountFractionNotebook} from "./fraction-notebook.mjs";
import {FRACTION_CAMPAIGN_SCENE} from "./fraction-campaign-scene.mjs";
import {spriteInventoryMarkup} from "./fraction-sprites.mjs";
import {weightInventoryMarkup} from "./fraction-weights.mjs";
import {rational,req,rtext} from "./rational.mjs";
import {isSolved} from "./engine.mjs";

const STYLE_FILES=["styles.css","fraction-weights.css","fraction-sprites.css","fraction-balance.css","fraction-campaign.css","fraction-notebook.css"];
const escape=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const mn=n=>"<mn>"+n+"</mn>";
const mo=s=>"<mo>"+s+"</mo>";
const mi=s=>"<mi>"+s+"</mi>";
export function fractionNumberMath(value){
  const q=rational(value);
  return q.d===1?mn(q.n):"<mfrac>"+mn(q.n)+mn(q.d)+"</mfrac>";
}
function term(value,kind){
  if(kind==="posX")return (req(value,1)?"":fractionNumberMath(value))+mi("x");
  return fractionNumberMath(value);
}
function expression(room){
  const parts=[];
  if(room.posX.n)parts.push(term(room.posX,"posX"));
  if(room.posOne.n)parts.push(term(room.posOne,"posOne"));
  return parts.join(mo("+"))||mn(0);
}
function math(body){return '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow>'+body+'</mrow></math>';}
export function fractionEquationMarkup(pair){return math(expression(pair.left)+mo("=")+expression(pair.right));}
export function fractionOperationMarkup(action){
  const s=action.op==="add"?"+":action.op==="remove"?"−":action.op==="multiply"?"×":"÷";
  return math(mo(s)+(action.kind?term(action.count,action.kind):mn(action.factor)));
}
function comicRoom(r){
  return '<div class="fb-comic-room">'+spriteInventoryMarkup(r.posX)+weightInventoryMarkup(r.posOne)+'</div>';
}
function comicPanel(pair,title){
  return '<article class="fb-comic-panel"><h3>'+escape(title)+'</h3><div class="fb-comic-scale">'+
    comicRoom(pair.left)+'<span aria-hidden="true">⚖</span>'+comicRoom(pair.right)+
    '</div><div class="fb-equation">'+fractionEquationMarkup(pair)+'</div></article>';
}
export function fractionComicMarkup(transaction,index){
  return '<div class="fb-comic-spread">'+comicPanel(transaction.before,"Before")+
    '<div class="fb-comic-action"><span>Move '+(index+1)+'</span>'+fractionOperationMarkup(transaction.action)+'<span>on both rooms</span></div>'+
    comicPanel(transaction.after,"After")+'</div>';
}
export function createFractionCampaignView({slot,context,onLeave,onAdvance,onComplete}){
  const host=document.createElement("div");host.id="fraction-game-host";
  const shadow=host.attachShadow({mode:"open"});
  const links=STYLE_FILES.map(path=>{
    const link=document.createElement("link");link.rel="stylesheet";link.href=new URL("./"+path,import.meta.url).href;return link;
  });
  const root=document.createElement("main");root.className="fb-lab fb-campaign";root.id="fraction-lab";
  root.innerHTML='<header class="fb-header fb-campaign-header"><div><div class="fb-game-nav">'+
    '<button type="button" id="fb-game-home" aria-label="Maths Sprites home">⌂ Home</button>'+
    '<button type="button" id="fb-game-levels">← Levels</button></div>'+
    '<p id="fb-chapter-status" class="eyebrow"></p><h1 id="fb-level-title" tabindex="-1"></h1><p id="fb-chapter-name" class="fb-preview-note"></p></div>'+
    '<div class="fb-game-meta"><span id="fb-chapter-dots"></span><span class="fb-mode-badge"></span></div></header>'+FRACTION_CAMPAIGN_SCENE;
  shadow.append(...links,root);document.body.append(host);
  const $=id=>root.querySelector("#"+id);
  const abort=new AbortController();
  const listen=(el,type,fn)=>el.addEventListener(type,fn,{signal:abort.signal});
  let completed=null,step=0,notebook=null;
  const paperFirst=context.method==="notebook",freePlay=context.freePlay===true;
  root.dataset.freePlay=String(freePlay);
  if(paperFirst)root.dataset.notebookPhase="paper";
  $("fb-chapter-status").textContent=freePlay?"FREE PLAY · FRACTIONS · NO CAMPAIGN PROGRESS":"WORLD "+context.worldNumber+" · STAGE "+context.stageNumber+" · LEVEL "+
    String(slot.number).padStart(2,"0")+" / "+context.stageLength;
  $("fb-level-title").textContent=slot.title;
  $("fb-chapter-name").textContent=context.chapterTitle;
  if(freePlay){$("fb-game-levels").textContent="← Equation Workshop";$("fb-chapter-dots").hidden=true;}
  root.querySelector(".fb-mode-badge").textContent=paperFirst?"Algebra Apprentice":context.method==="manual"?"Independent Balance":"Guided Balance";
  $("fb-chapter-dots").replaceChildren(...context.chapterLevels.map(l=>{
    const dot=document.createElement("span");
    dot.className="progress-dot"+(l.number<=slot.number?" lit":"")+(l.number===slot.number?" current":"");
    dot.title=l.title;return dot;
  }));
  $("fb-next-level").textContent=freePlay?"Build another equation →":slot.number===context.stageLength?"Return to levels →":"Next level →";
  function showComic(){
    if(!completed?.history.length)return;
    step=Math.max(0,Math.min(step,completed.history.length-1));
    $("fb-comic-page").innerHTML=fractionComicMarkup(completed.history[step],step);
    $("fb-replay-step").textContent=(step+1)+" / "+completed.history.length;
    $("fb-replay-prev").disabled=step===0;
    $("fb-replay-next").disabled=step===completed.history.length-1;
  }
  function refresh(state){
    if(isSolved(state)){
      completed=state;step=0;showComic();
    }else{
      completed=null;$("fb-comic-page").replaceChildren();$("fb-rating").textContent="";
    }
  }
  let reduced;
  try{
    const saved=localStorage.getItem("mathssprites.motion-preference.v1");
    reduced=saved==="reduced"||(saved!=="on"&&matchMedia("(prefers-reduced-motion: reduce)").matches);
  }catch{reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;}
  const controller=mountFractionBalance(root,{level:slot.level,mode:paperFirst?"auto":context.method,reduced,
    onState:refresh,onComplete:paperFirst?()=>{}:onComplete});
  if(paperFirst)notebook=mountFractionNotebook(root,{level:slot.level,controller,
    equationMarkup:fractionEquationMarkup,operationMarkup:fractionOperationMarkup,onComplete});
  const canLeave=()=>root.dataset.busy!=="true"&&root.dataset.notebookPlaying!=="true";
  listen($("fb-game-home"),"click",()=>{if(canLeave())onLeave("home")});
  listen($("fb-game-levels"),"click",()=>{if(canLeave())onLeave("levels")});
  listen($("fb-next-level"),"click",()=>{if(completed&&canLeave())onAdvance()});
  listen($("fb-replay-prev"),"click",()=>{step--;showComic()});
  listen($("fb-replay-next"),"click",()=>{step++;showComic()});
  const observer=new MutationObserver(()=>{
    const busy=!canLeave();
    $("fb-game-home").disabled=busy;$("fb-game-levels").disabled=busy;
  });
  observer.observe(root,{attributes:true,attributeFilter:["data-busy","data-notebook-playing"]});
  $("fb-level-title").focus({preventScroll:true});
  return {controller,host,setRating(message){$("fb-rating").textContent=message;},
    destroy(){observer.disconnect();abort.abort();notebook?.destroy();controller.destroy();host.remove();}};
}
