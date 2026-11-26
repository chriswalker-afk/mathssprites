/** Mount the paper-first editor and verified physical replay on the
 * shared fraction campaign scene. No campaign reference actions are read.
 * All accepted actions originate from the learner's own confirmed lines. */
import {startFractionNotebook,previewFractionNotebookOperation,tryFractionNotebookOperation,
  parseFractionNotebookOperation,undoFractionNotebook,fractionNotebookReplayScript} from "./fraction-notebook-engine.mjs?v=108";
import {req} from "./rational.mjs";
import {isSolved} from "./engine.mjs";

const paperMarkup=`<section class="fb-notebook" id="fb-notebook" aria-label="Fractional algebra notebook">
<div class="fb-notebook-paper notebook-paper">
<div class="notebook-paper-head"><span>THE WORKSHOP JOURNAL</span><span aria-hidden="true">✎</span></div>
<div class="fb-paper-header"><h2>My algebra notebook</h2></div>
<ol id="fb-nb-lines" class="fb-paper-lines" tabindex="0" aria-label="Checked algebra lines"></ol>
<div class="notebook-journal-footer"><output id="fb-nb-count">0 moves</output><span>Checked working</span></div>
</div>
<div class="fb-notebook-controls notebook-control-panel" aria-label="Algebra controls">
<div class="notebook-control-heading"><h3>Choose your next move</h3><p>Choose one operation for both sides. Preview, then confirm.</p></div>
<div class="notebook-tools-scroll">
<div class="notebook-guide-slot"></div>
<div class="fb-editor" id="fb-nb-editor">
<div class="fb-editor-row">
<div class="fb-editor-keys" role="group" aria-label="Operation">
<button type="button" data-nb-sign="+" aria-label="Add">+</button><button type="button" data-nb-sign="−" aria-label="Subtract">−</button>
<button type="button" data-nb-sign="×" aria-label="Multiply">×</button><button type="button" data-nb-sign="÷" aria-label="Divide">÷</button></div>
<div class="fb-operand" id="fb-nb-operand" hidden>
<button type="button" id="fb-nb-fraction-toggle" aria-pressed="false">Fraction</button>
<div class="fb-notebook-fraction" id="fb-nb-fraction" data-whole="true"><input id="fb-nb-num" inputmode="numeric" maxlength="6" aria-label="Numerator or whole number" placeholder="1"><span aria-hidden="true"></span><input id="fb-nb-den" inputmode="numeric" maxlength="6" aria-label="Denominator" value="2"></div>
<button type="button" id="fb-nb-variable" aria-label="Include x" aria-pressed="false">x</button>
</div><div class="fb-editor-preview" id="fb-nb-operation-preview" aria-label="Operation notation"></div></div>
<details class="fb-editor-details" id="fb-nb-type-details"><summary>Type an operation instead</summary><label>Operation<input id="fb-nb-typed" maxlength="48" autocomplete="off" spellcheck="false" placeholder="−1/2x"></label></details>
<div class="fb-paper-result" id="fb-nb-result" hidden aria-label="Proposed equation"></div>
<p id="fb-nb-feedback" class="fb-paper-feedback" role="status" aria-live="polite">Choose an operation.</p>
<div class="fb-paper-actions"><button type="button" id="fb-nb-preview" disabled>Preview line</button><button type="button" id="fb-nb-confirm" disabled>Confirm line</button></div>
</div>
<div class="notebook-support" aria-label="Optional learning support"></div>
</div>
<div class="fb-paper-actions"><button type="button" id="fb-nb-undo" disabled>↶ Undo line</button><button type="button" id="fb-nb-restart">Start again</button><button type="button" id="fb-nb-watch" hidden>Watch your sprites →</button></div>
</div>
</section>
<section class="fb-nb-replay-status" id="fb-nb-replay-status" hidden aria-label="Physical replay"><span id="fb-nb-replay-message" role="status" aria-live="polite"></span><span id="fb-nb-replay-operation"></span><button type="button" id="fb-nb-again" hidden>Replay again</button><button type="button" id="fb-nb-back" hidden>Back to notebook</button></section>`;

function sameRooms(a,b){
  return ["left","right"].every(side=>["posX","posOne"].every(kind=>req(a[side][kind],b[side][kind])));
}
export function fractionWrittenOperationMarkup(entry,operationMarkup){
  if(!entry.written)return operationMarkup(entry.action);
  const {whole,n,d,variable}=entry.written;
  const sign=entry.action.op==="add"?"+":"−";
  const part=d===1?(variable&&n===1?"":"<mn>"+n+"</mn>"):"<mfrac><mn>"+n+"</mn><mn>"+d+"</mn></mfrac>";
  const number=whole?"<mn>"+whole+"</mn>"+part:part;
  const term=whole&&variable?"<mo>(</mo>"+number+"<mo>)</mo>":number;
  return '<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mo>'+sign+'</mo>'+term+(variable?"<mi>x</mi>":"")+'</mrow></math>';
}
export function mountFractionNotebook(root,{level,controller,equationMarkup,operationMarkup,onComplete=()=>{}}){
  const $=id=>root.querySelector("#"+id);
  (root.querySelector(".fb-board")||$("scene")).insertAdjacentHTML("beforebegin",paperMarkup);
  const abort=new AbortController(),listen=(el,type,fn)=>el.addEventListener(type,fn,{signal:abort.signal});
  let session=startFractionNotebook(level),sign="",fraction=false,variable=false,source="builder",preview=null,dead=false,playing=false;
  const factor=()=>sign==="×"||sign==="÷";
  const builderText=()=>{
    if(!sign)return "";
    const n=$("fb-nb-num").value.trim();
    if(factor())return sign+n;
    if(fraction)return sign+n+"/"+$("fb-nb-den").value.trim()+(variable?"x":"");
    return sign+(n|| (variable?"1":""))+(variable?"x":"");
  };
  const draft=()=>source==="typed"?$("fb-nb-typed").value:builderText();
  const message=(text,error=false)=>{$("fb-nb-feedback").textContent=text;$("fb-nb-feedback").dataset.error=String(error);};
  const math=entry=>fractionWrittenOperationMarkup(entry,operationMarkup);
  function invalidate(){
    preview=null;$("fb-nb-result").hidden=true;$("fb-nb-result").replaceChildren();
    $("fb-nb-confirm").disabled=true;
  }
  function refreshDraft(){
    invalidate();
    for(const b of root.querySelectorAll("[data-nb-sign]"))b.setAttribute("aria-pressed",String(source==="builder"&&b.dataset.nbSign===sign));
    $("fb-nb-operand").hidden=source==="typed"||!sign;
    $("fb-nb-fraction-toggle").hidden=factor();
    $("fb-nb-variable").hidden=factor();
    $("fb-nb-fraction-toggle").setAttribute("aria-pressed",String(fraction&&!factor()));
    $("fb-nb-variable").setAttribute("aria-pressed",String(variable&&!factor()));
    $("fb-nb-fraction").dataset.whole=String(!fraction||factor());
    const parsed=parseFractionNotebookOperation(draft());
    $("fb-nb-operation-preview").innerHTML=parsed.ok?math(parsed):"";
    $("fb-nb-preview").disabled=!draft()||isSolved(session.state);
    message(draft()?"Preview your operation.":"Choose an operation.");
  }
  function resetDraft(){
    sign="";fraction=false;variable=false;source="builder";
    $("fb-nb-num").value="";$("fb-nb-den").value="2";$("fb-nb-typed").value="";
    $("fb-nb-type-details").open=false;
    refreshDraft();
  }
  function renderPaper(){
    const rows=[{state:session.state.history[0]?.before||session.state,step:null},...session.state.history.map((tx,i)=>({state:tx.after,step:session.steps[i]}))];
    $("fb-nb-lines").innerHTML=rows.map(({state,step},i)=>'<li'+(i===rows.length-1?' class="fb-paper-current"':'')+'><span class="fb-paper-index">'+(i===0?"Start":i)+'</span><span>'+equationMarkup(state)+'</span><span class="fb-paper-op">'+(step?math(step):"")+'</span></li>').join("");
    const lines=$("fb-nb-lines");
    requestAnimationFrame(()=>{if(lines.clientHeight&&lines.scrollHeight>lines.clientHeight)lines.scrollTop=lines.scrollHeight;});
    $("fb-nb-count").textContent=session.steps.length+" move"+(session.steps.length===1?"":"s");
    const solved=isSolved(session.state);
    $("fb-nb-editor").hidden=solved;$("fb-nb-watch").hidden=!solved;
    $("fb-nb-undo").disabled=!session.steps.length;
    root.dataset.notebookSolved=String(solved);
  }
  function showPreview(){
    const result=previewFractionNotebookOperation(session,draft());
    invalidate();
    if(!result.ok){message(result.message,true);return;}
    preview={text:draft(),result};
    $("fb-nb-result").innerHTML='<span>Next line</span>'+equationMarkup(result.state);
    $("fb-nb-result").hidden=false;$("fb-nb-confirm").disabled=false;message("Check the new line, then confirm.");
  }
  function confirm(){
    if(!preview||preview.text!==draft()||playing)return;
    const result=tryFractionNotebookOperation(session,preview.text);
    if(!result.ok){invalidate();message(result.message,true);return;}
    session=result.session;resetDraft();renderPaper();
    if(isSolved(session.state))$("fb-nb-watch").focus();
  }
  function paper(){
    root.dataset.notebookPhase="paper";$("scene").hidden=true;root.querySelector(".fb-tools").hidden=true;$("fb-notebook").hidden=false;$("fb-nb-replay-status").hidden=true;
    $("fb-nb-again").hidden=true;$("fb-nb-back").hidden=true;renderPaper();
  }
  async function replay(){
    if(playing||dead||!isSolved(session.state))return;
    const script=fractionNotebookReplayScript(session);
    playing=true;root.dataset.notebookPlaying="true";
    root.dataset.notebookPhase="replaying";$("scene").hidden=false;$("fb-notebook").hidden=true;$("fb-nb-replay-status").hidden=false;
    $("fb-nb-again").hidden=true;$("fb-nb-back").hidden=true;
    $("fb-nb-replay-message").textContent="Your checked operations are coming to life.";
    $("fb-nb-replay-operation").replaceChildren();
    try{
      if(!controller.load(level,"auto"))throw new Error("The scene could not reset.");
      await new Promise(resolve=>requestAnimationFrame(resolve));
      if(dead)return;
      controller.refit();
      for(const [i,tx] of script.entries()){
        if(dead)return;
        if(!sameRooms(controller.getState(),tx.before))throw new Error("Replay source differs from checked line.");
        $("fb-nb-replay-message").textContent="Move "+(i+1)+" of "+script.length;
        $("fb-nb-replay-operation").innerHTML=math(tx);
        if(!await controller.playAction(tx.action))throw new Error("Checked operation did not replay.");
        if(dead)return;
        if(!sameRooms(controller.getState(),tx.after)||controller.getState().history.length!==i+1)
          throw new Error("Replay result differs from checked line.");
      }
      const final=controller.getState();
      if(!isSolved(final)||!sameRooms(final,session.state))throw new Error("Replay did not reach the checked solution.");
      root.dataset.notebookPhase="replay";
      $("fb-nb-replay-message").textContent="Your "+script.length+" checked move"+(script.length===1?"":"s")+" came to life.";
      $("fb-nb-replay-operation").innerHTML=equationMarkup(final);
      $("fb-nb-again").hidden=false;$("fb-nb-back").hidden=false;
      // Campaign completion is idempotent; replaying again refreshes its rating.
      onComplete(final);
    }catch(error){
      if(!dead){console.error(error);paper();message("The animation could not finish. Your checked working is safe; try the replay again.",true);
        // A solved paper hides the editor, so give the replay error a visible status.
        $("fb-nb-replay-status").hidden=false;$("fb-nb-replay-message").textContent="Replay interrupted. Your checked working is safe. Try Watch your sprites again.";}
    }finally{
      playing=false;if(!dead)root.dataset.notebookPlaying="false";
    }
  }
  for(const b of root.querySelectorAll("[data-nb-sign]"))listen(b,"click",()=>{
    source="builder";$("fb-nb-typed").value="";$("fb-nb-type-details").open=false;sign=b.dataset.nbSign;
    if(factor()){fraction=false;variable=false;}refreshDraft();$("fb-nb-num").focus();
  });
  listen($("fb-nb-fraction-toggle"),"click",()=>{source="builder";fraction=!fraction;refreshDraft();});
  listen($("fb-nb-variable"),"click",()=>{source="builder";variable=!variable;refreshDraft();});
  for(const id of ["fb-nb-num","fb-nb-den"])listen($(id),"input",()=>{source="builder";refreshDraft();});
  listen($("fb-nb-typed"),"input",()=>{source="typed";refreshDraft();});
  listen($("fb-nb-typed"),"keydown",event=>{if(event.key==="Enter"){event.preventDefault();showPreview();}});
  listen($("fb-nb-preview"),"click",showPreview);listen($("fb-nb-confirm"),"click",confirm);
  listen($("fb-nb-undo"),"click",()=>{session=undoFractionNotebook(session);resetDraft();renderPaper();});
  listen($("fb-nb-restart"),"click",()=>{session=startFractionNotebook(level);resetDraft();renderPaper();});
  listen($("fb-nb-watch"),"click",replay);listen($("fb-nb-again"),"click",replay);
  listen($("fb-nb-back"),"click",()=>{if(!playing)paper();});
  root.dataset.notebookPlaying="false";resetDraft();paper();
  return {destroy(){dead=true;abort.abort();}};
}
