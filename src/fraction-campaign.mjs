/** PR64: mount the fractional controller on a campaign-owned scene.
 * A shadow root isolates legacy app IDs, SVG clip IDs and event listeners.
 * Navigation and progress remain owned by site.mjs, not the physics renderer.
 */
import {mountFractionBalance} from "./fraction-balance.mjs?v=93";
import {mountFractionNotebook} from "./fraction-notebook.mjs";
import {FRACTION_CAMPAIGN_SCENE} from "./fraction-campaign-scene.mjs";
import {spriteInventoryMarkup} from "./fraction-sprites.mjs?v=89";
import {weightInventoryMarkup} from "./fraction-weights.mjs?v=93";
import {rational,req,rtext} from "./rational.mjs";
import {isSolved} from "./engine.mjs";

// Keep the separately fetched shadow-root assets on the same presentation
// revision as their markup, including on a returning student's warm cache.
// Bump this revision and the site entry/import URLs when presentation assets change.
import {applyLaboratoryAppearance} from "./laboratory-cosmetics.mjs?v=93";
export const FRACTION_PRESENTATION_REVISION="93";
const STYLE_FILES=["styles.css","scene-polish.css","fraction-weights.css","fraction-sprites.css","fraction-balance.css","fraction-campaign.css","fraction-notebook.css","sprite-cosmetics.css","sprite-wearables.css","sprite-effects.css","weight-materials.css","weight-shapes.css"];
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
function comicRoom(r,shape){
  return '<div class="fb-comic-room">'+spriteInventoryMarkup(r.posX,{animatedWhole:true})+weightInventoryMarkup(r.posOne,{shape})+'</div>';
}
function comicPanel(pair,title,shape){
  return '<article class="fb-comic-panel"><h3>'+escape(title)+'</h3><div class="fb-comic-scale">'+
    comicRoom(pair.left,shape)+'<span aria-hidden="true">⚖</span>'+comicRoom(pair.right,shape)+
    '</div><div class="fb-equation">'+fractionEquationMarkup(pair)+'</div></article>';
}
export function fractionComicMarkup(transaction,index,{shape="original"}={}){
  return '<div class="fb-comic-spread">'+comicPanel(transaction.before,"Before",shape)+
    '<div class="fb-comic-action"><span>Move '+(index+1)+'</span>'+fractionOperationMarkup(transaction.action)+'<span>on both rooms</span></div>'+
    comicPanel(transaction.after,"After",shape)+'</div>';
}
export function createFractionCampaignView({slot,context,onLeave,onAdvance,onComplete,onReviewReady=()=>{},appearance={}}){
  const host=document.createElement("div");host.id="fraction-game-host";
  const shadow=host.attachShadow({mode:"open"});
  const links=STYLE_FILES.map(path=>{
    const link=document.createElement("link");link.rel="stylesheet";
    const url=new URL("./"+path,import.meta.url);
    url.searchParams.set("v",FRACTION_PRESENTATION_REVISION);
    link.href=url.href;return link;
  });
  // Shadow-root links are not render blocking. Never reveal the legacy
  // preview layout, even on a slow connection or a partial asset failure.
  const stylesReady=Promise.all(links.map(link=>new Promise((resolve,reject)=>{
    link.addEventListener("load",resolve,{once:true});
    link.addEventListener("error",()=>reject(new Error("Could not load "+link.href)),{once:true});
  })));
  const loading=document.createElement("p");
  loading.setAttribute("role","status");
  loading.style.cssText="padding:20px;text-align:center;font:1rem Georgia,serif;color:#eee6d5";
  loading.textContent="Preparing the balance chambers…";
  host.dataset.presentationRevision=FRACTION_PRESENTATION_REVISION;
  host.dataset.styles="loading";
  const root=document.createElement("main");root.className="fb-lab fb-campaign";root.id="fraction-lab";root.hidden=true;
  applyLaboratoryAppearance(root,appearance);
  root.innerHTML='<header class="fb-header fb-campaign-header"><div class="identity fb-identity">'+
    '<button type="button" id="fb-brand-home" class="game-sprite-home" aria-label="Return to Maths Sprites home" title="Home"><span class="brand-sprite-frame" aria-hidden="true"><span class="brand-sprite-actor token sprite sprite-black"><span class="sprite-ground-shadow"></span><span class="sprite-reaction-shell"><span class="sprite-motion"><span class="sprite-feet"></span><span class="sprite-body"><span class="sprite-eyes"><i></i><i></i></span><span class="sprite-wear sprite-wear-headwear" aria-hidden="true"></span><span class="sprite-wear sprite-wear-eyewear" aria-hidden="true"></span><span class="sprite-wear sprite-wear-neckwear" aria-hidden="true"></span><span class="sprite-cosmetic-effect" aria-hidden="true"></span></span></span></span></span></span></button>'+
    '<h1>Maths Sprites<span class="title-dot">.</span></h1></div><div class="fb-game-meta">'+
    '<button type="button" id="fb-game-home" aria-label="Maths Sprites home">⌂ Home</button>'+
    '<button type="button" id="fb-game-levels">▦ Levels</button>'+
    '<span class="fb-mode-badge"></span><button type="button" id="fb-motion-toggle" aria-pressed="false">Motion: on</button></div></header>'+
    '<div class="fb-chapter-strip"><div class="fb-chapter-info"><p id="fb-chapter-name" class="eyebrow"></p><h2 id="fb-level-title" tabindex="-1"></h2><p id="fb-chapter-status" class="eyebrow"></p></div><span id="fb-chapter-dots" aria-label="Chapter experiments"></span></div>'+FRACTION_CAMPAIGN_SCENE;
  // The preview retains its simple standalone layout; the campaign uses
  // the same left scene/right controls composition as the other worlds.
  const board=document.createElement("div");board.className="fb-board";
  const scene=root.querySelector("#scene"),tools=root.querySelector(".fb-tools");
  scene.before(board);board.append(scene,tools);
  const mission=document.createElement("div");mission.className="fb-mission";
  mission.innerHTML='<span class="eyebrow">Your experiment</span><p id="fb-mission-prompt"></p><p class="fb-mission-brief" id="fb-mission-brief"></p>';
  tools.prepend(mission);
  const bottom=tools.querySelector(".fb-actions");
  const feedback=bottom.querySelector("#fb-feedback");
  mission.append(feedback);
  const actions=document.createElement("div");actions.className="fb-small-actions";
  actions.append(bottom.querySelector("#fb-undo"),bottom.querySelector("#fb-reset"));
  bottom.prepend(actions);
  bottom.querySelector("#fb-reset").textContent="Reset";
  bottom.querySelector("#fb-apply").textContent="Do it to both rooms →";
  const review=document.createElement("button");review.id="fb-review-link";review.type="button";review.textContent="Review your algebra →";review.hidden=true;bottom.append(review);
  review.addEventListener("click",()=>root.querySelector("#fb-review").scrollIntoView({block:"start",behavior:"instant"}));
  shadow.append(...links,loading,root);document.body.append(host);
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
  $("fb-chapter-name").textContent=freePlay?context.chapterTitle:String((context.chapterIndex??0)+1).padStart(2,"0")+" · "+context.chapterTitle;
  $("fb-mission-prompt").textContent=slot.level.prompt||"Leave one whole sprite facing only weights.";
  $("fb-mission-brief").textContent=freePlay?"Exact fractional objects. No campaign progress.":context.chapterDescription||"Work with whole objects and equal pieces.";
  if(freePlay){$("fb-game-levels").textContent="← Workshop";$("fb-chapter-dots").hidden=true;}
  root.querySelector(".fb-mode-badge").textContent=paperFirst?"Algebra Apprentice":context.method==="manual"?"Your Turn":"Guided Mirror";
  $("fb-chapter-dots").replaceChildren(...context.chapterLevels.map(l=>{
    const dot=document.createElement("span");
    dot.className="progress-dot"+(l.number<=slot.number?" lit":"")+(l.number===slot.number?" current":"");
    dot.title=l.title;return dot;
  }));
  $("fb-next-level").textContent=freePlay?"Build another equation →":slot.number===context.stageLength?"Return to levels →":"Next level →";
  function showComic(){
    if(!completed?.history.length)return;
    step=Math.max(0,Math.min(step,completed.history.length-1));
    $("fb-comic-page").innerHTML=fractionComicMarkup(completed.history[step],step,{shape:root.dataset.weightShape});
    $("fb-replay-step").textContent=(step+1)+" / "+completed.history.length;
    $("fb-replay-prev").disabled=step===0;
    $("fb-replay-next").disabled=step===completed.history.length-1;
    if(!paperFirst&&!freePlay&&step===completed.history.length-1)onReviewReady();
  }
  function refresh(state){
    $("fb-review-link").hidden=!isSolved(state);
    if(isSolved(state)){
      completed=state;step=0;showComic();
    }else{
      completed=null;$("fb-comic-page").replaceChildren();$("fb-rating").textContent="";
    }
  }
  let reduced;
  try{
    const saved=localStorage.getItem("mathssprites.motion-preference.v1");
    // Same default and persistent explicit preference as the main renderer.
    reduced=saved==="reduced";
  }catch{reduced=document.body.classList.contains("reduce-motion");}
  function completeReviewed(state){
    onComplete(state);
    // Notebook callback is after checked physical playback. Guided and
    // independent reviews are static panels; signal at the last panel.
    if(!freePlay&&(paperFirst||step===state.history.length-1))onReviewReady();
  }
  const controller=mountFractionBalance(root,{level:slot.level,mode:paperFirst?"auto":context.method,reduced,
    onState:refresh,onComplete:paperFirst?()=>{}:completeReviewed});
  if(paperFirst)notebook=mountFractionNotebook(root,{level:slot.level,controller,
    equationMarkup:fractionEquationMarkup,operationMarkup:fractionOperationMarkup,onComplete:completeReviewed});
  const canLeave=()=>root.dataset.busy!=="true"&&root.dataset.notebookPlaying!=="true";
  const motionButton=$("fb-motion-toggle");
  function reflectMotion(){motionButton.setAttribute("aria-pressed",String(reduced));motionButton.textContent=reduced?"Motion: reduced":"Motion: on";}
  reflectMotion();
  listen(motionButton,"click",()=>{
    if(!canLeave())return;
    if(controller.setReduced(!reduced)){
      reduced=!reduced;reflectMotion();
      try{localStorage.setItem("mathssprites.motion-preference.v1",reduced?"reduced":"on");}catch{}
      window.dispatchEvent(new CustomEvent("mathssprites:motion-change",{detail:{reduced}}));
    }
  });
  listen($("fb-game-home"),"click",()=>{if(canLeave())onLeave("home")});
  listen($("fb-brand-home"),"click",()=>{if(canLeave())onLeave("home")});
  listen($("fb-game-levels"),"click",()=>{if(canLeave())onLeave("levels")});
  listen($("fb-next-level"),"click",()=>{if(completed&&canLeave())onAdvance()});
  listen($("fb-replay-prev"),"click",()=>{step--;showComic()});
  listen($("fb-replay-next"),"click",()=>{step++;showComic()});
  const observer=new MutationObserver(()=>{
    const busy=!canLeave();
    $("fb-game-home").disabled=busy;$("fb-brand-home").disabled=busy;$("fb-game-levels").disabled=busy;motionButton.disabled=busy;
  });
  observer.observe(root,{attributes:true,attributeFilter:["data-busy","data-notebook-playing"]});
  stylesReady.then(()=>{
    if(!host.isConnected)return;
    host.dataset.styles="ready";loading.remove();root.hidden=false;
    controller.refit();
    requestAnimationFrame(()=>{if(host.isConnected){controller.refit();$("fb-level-title").focus({preventScroll:true});}});
  }).catch(()=>{
    if(!host.isConnected)return;
    host.dataset.styles="error";
    loading.textContent="The chamber artwork could not load. ";
    const back=document.createElement("button");back.type="button";back.textContent="Return to levels";
    back.addEventListener("click",()=>onLeave("levels"),{once:true});loading.append(back);
  });
  return {controller,host,setAppearance(equipped){const prior=root.dataset.weightShape;applyLaboratoryAppearance(root,equipped);if(prior!==root.dataset.weightShape){controller.refreshAppearance();if(completed)showComic();}},setRating(message){$("fb-rating").textContent=message;},
    destroy(){observer.disconnect();abort.abort();notebook?.destroy();controller.destroy();host.remove();}};
}
