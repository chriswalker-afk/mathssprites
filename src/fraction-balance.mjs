/** Reusable fractional balance controller. It mounts on the real lab markup
 * without involving the legacy whole-token renderer. PR63 exposes a direct
 * integration preview only; PR64 will mount it through campaign navigation.
 * No storage, unlocks, star ratings or teacher reference routes in controls.
 */
import {initialState,visibleRooms,prepare,perform,undo,isSolved,equation,algebraOperation,evaluate,previewRoomAction} from "./engine.mjs";
import {rational,radd,rsub,rcompare,rtext} from "./rational.mjs";
import {FRACTION_DENOMINATORS,FRACTION_FACTORS,fractionAction,fractionRoom} from "./fraction-engine.mjs";
import {weightInventoryMarkup,weightGridMarkup} from "./fraction-weights.mjs";
import {spriteInventoryMarkup,spriteGridMarkup} from "./fraction-sprites.mjs";
import {divisionBasketMarkup,resetHand} from "./division-baskets.mjs";
import {gridRoom,roomChoreography,failureSpeech,failureDiagram} from "./fraction-choreography.mjs";
const SIDES=["left","right"];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
const roomMarkup=room=>'<div class="fb-room-floor">'+spriteInventoryMarkup(room.posX)+weightInventoryMarkup(room.posOne)+'</div>';
const gridMarkup=grid=>'<div class="fb-room-floor">'+spriteGridMarkup(grid.posX)+weightGridMarkup(grid.posOne)+'</div>';
const summary=room=>rtext(room.posX)+" sprites, "+rtext(room.posOne)+" weights";
const options=values=>values.map(v=>'<option value="'+v+'">'+v+'</option>').join("");

export function mountFractionBalance(root,{level,mode="auto",reduced=false,onComplete=()=>{},onState=()=>{}}={}){
  const $=id=>root.querySelector("#"+id);
  const scene=$("scene"),hand=$("hand"),cargo=$("hand-cargo"),speech=$("speech"),caption=$("action-caption");
  const abort=new AbortController();
  const listen=(el,type,fn)=>el.addEventListener(type,fn,{signal:abort.signal});
  let state=initialState(level),busy=false,dead=false,activeSide=null,selection={op:null,kind:null,factor:null},completeNotified=false;
  let shown=visibleRooms(state);
  const q=()=>({n:Number($("fb-whole").value)*Number($("fb-denominator").value)+Number($("fb-numerator").value),d:Number($("fb-denominator").value)});
  function selectedAction(){
    const {op,kind,factor}=selection;
    if(!op)return null;
    const a=op==="add"||op==="remove"?{op,kind,count:q()}:{op,factor};
    const checked=fractionAction(a);return checked.ok?checked.action:null;
  }
  const feedback=text=>{$("fb-feedback").textContent=text};
  function clearSpeech(){speech.hidden=true;speech.textContent="";speech.classList.remove("trial-speech");}
  function tell(text){speech.textContent=text;speech.classList.add("trial-speech");speech.hidden=false;}
  function checkLive(){if(dead)throw new Error("Fraction view closed");}
  async function pause(ms){await sleep(reduced?Math.min(80,ms):ms);checkLive();}
  function fitAll(){
    for(const floor of root.querySelectorAll(".fb-room-floor")){
      const parent=floor.parentElement;
      if(!parent)continue;
      const width=floor.scrollWidth||floor.offsetWidth,height=floor.offsetHeight;
      const availableW=parent.clientWidth||width,availableH=parent.clientHeight||height;
      const scale=Math.min(1,availableW/Math.max(1,width),availableH/Math.max(1,height));
      floor.style.setProperty("--fb-fit",Math.max(.04,scale).toFixed(4));
    }
  }
  function draw(side,room,grid=null){
    const el=$(side+"-items");
    el.innerHTML=grid?gridMarkup(grid):roomMarkup(room);
    el.setAttribute("aria-label",(side==="left"?"West":"East")+" chamber: "+summary(room));
    el.dataset.phase=grid?"regrouping":"settled";fitAll();
  }
  function tilt(){
    const diff=rsub(evaluate(shown.left,state.solution),evaluate(shown.right,state.solution));
    const sign=rcompare(diff,0),angle=sign===0?0:sign<0?3.5:-3.5;
    $("rooms-row").style.transform="rotate("+angle+"deg)";
    $("scale-beam").style.transform="rotate("+angle+"deg)";
    $("dial-needle").style.transform="translateX(-50%) rotate("+(-7*angle)+"deg)";
    scene.dataset.balance=sign===0?"level":sign>0?"left-heavy":"right-heavy";
    $("balance-caption").textContent=sign===0?"Balance level":sign>0?"West chamber heavier":"East chamber heavier";
  }
  function settled(){
    shown=visibleRooms(state);
    for(const side of SIDES)draw(side,shown[side]);
    tilt();
  }
  function controls(){
    const solved=isSolved(state),disabled=busy||solved,op=selection.op;
    const addRemove=op==="add"||op==="remove",factor=op==="multiply"||op==="divide";
    $("fb-kind-tools").hidden=!addRemove;$("fb-amount-tools").hidden=!addRemove||!selection.kind;$("fb-factor-tools").hidden=!factor;
    for(const btn of root.querySelectorAll("[data-fb-op],[data-fb-kind],[data-fb-factor]")){
      const picked=btn.dataset.fbOp?btn.dataset.fbOp===op:btn.dataset.fbKind?btn.dataset.fbKind===selection.kind:Number(btn.dataset.fbFactor)===selection.factor;
      btn.setAttribute("aria-pressed",String(picked));btn.disabled=disabled;
    }
    for(const id of ["fb-whole","fb-numerator","fb-denominator"])$(id).disabled=disabled;
    for(const side of SIDES){
      const btn=$(side+"-action");btn.hidden=mode!=="manual";
      btn.disabled=disabled||!selectedAction()||state.pending?.first===side;
      btn.textContent=state.pending&&state.pending.first!==side?"Match move":"Use hand here";
      btn.setAttribute("aria-label",(state.pending&&state.pending.first!==side?"Match move in ":"Use hand in ")+(side==="left"?"west":"east")+" chamber");
      $(side+"-chamber").classList.toggle("needs-match",!!state.pending&&state.pending.first!==side);
      $(side+"-chamber").classList.toggle("already-moved",state.pending?.first===side);
    }
    $("fb-apply").hidden=mode!=="auto";$("fb-apply").disabled=disabled||!selectedAction()||!!state.pending;
    $("fb-undo").disabled=busy||(!state.pending&&!state.history.length);
    $("fb-reset").disabled=busy;
    for(const id of ["fb-level","fb-mode","fb-reduced"])if($(id))$(id).disabled=busy||id==="fb-mode"&&!!state.pending;
    $("fb-moves").textContent=state.history.length+" move"+(state.history.length===1?"":"s");
    scene.classList.toggle("solved-scene",solved);
    $("level-clear").hidden=true;
    $("fb-review").hidden=!solved;
    if(solved){
      const items=[equation(state.history[0]?.before||state)];
      for(const tx of state.history)items.push(algebraOperation(tx.action)+" → "+equation(tx.after));
      const list=$("fb-history");list.replaceChildren(...items.map(t=>{const li=document.createElement("li");li.textContent=t;return li}));
    }
    root.dataset.mode=mode;
    root.dataset.busy=String(busy);root.dataset.pending=state.pending?.first||"";
    root.dataset.solved=String(solved);
  }
  function notifyState(){
    controls();onState(state);
    if(isSolved(state)&&!completeNotified){completeNotified=true;feedback("One whole sprite. Balance restored!");onComplete(state);}
  }
  function resetSelection(){
    selection={op:null,kind:null,factor:null};
    $("fb-whole").value="0";$("fb-denominator").value="2";updateNumerators(0);
  }
  function updateNumerators(preferred){
    const d=Number($("fb-denominator").value);
    $("fb-numerator").innerHTML=options(Array.from({length:d},(_,i)=>i));
    $("fb-numerator").value=String(Math.min(d-1,Math.max(0,preferred)));
  }
  function clearHand(side){
    resetHand(hand,cargo,$(side+"-chamber"),caption);
    hand.style.removeProperty("--hand-reach");
    hand.dataset.phase="rest";
    activeSide=null;
  }
  async function reach(side,target,carried=null){
    const chamber=$(side+"-chamber"),rect=target.getBoundingClientRect(),sceneRect=scene.getBoundingClientRect();
    activeSide=side;
    hand.style.left=(rect.left+rect.width/2-sceneRect.left)+"px";
    const rest=hand.offsetTop+hand.offsetHeight*.9;
    const tip=rect.top-sceneRect.top+Math.min(rect.height*.8,Math.max(10,rect.height-20));
    hand.style.setProperty("--hand-reach",Math.max(35,tip-rest)+"px");
    hand.classList.remove("lifting","reaching","grasping");
    hand.classList.add("acting","approaching");hand.dataset.phase="aim";chamber.classList.add("hand-target");
    cargo.replaceChildren();if(carried)cargo.append(carried);cargo.hidden=!carried;fitAll();
    await frame();await pause(250);
    hand.classList.remove("approaching");hand.classList.add("reaching");hand.dataset.phase="reach";await pause(260);
    hand.classList.add("grasping");hand.dataset.phase="grip";
  }
  async function lift(side,carried=null){
    if(carried){cargo.replaceChildren(carried);cargo.hidden=false;fitAll();}
    hand.classList.remove("reaching");hand.classList.add("lifting");hand.dataset.phase="lift";await pause(270);
    clearHand(side);await pause(130);
  }
  function cargoFor(grid){
    const node=document.createElement("div");node.className="fb-cargo-art";node.innerHTML=gridMarkup(grid);return node;
  }
  function basketNode(index,group,filled=true){
    const template=document.createElement("template");
    template.innerHTML=divisionBasketMarkup(2);
    const basket=template.content.firstElementChild;basket.dataset.basketIndex=String(index);basket.dataset.state="ready";
    basket.setAttribute("aria-label","Basket "+(index+1)+(filled?": "+summary(gridRoom(group)):" empty"));
    if(filled)basket.querySelector(".basket-contents").innerHTML=gridMarkup(group);
    return basket;
  }
  async function share(side,plan){
    const el=$(side+"-items");
    if(plan.borrowed||plan.changedGrid){draw(side,plan.before,plan.prepared);await pause(580);}
    // Each visible group consists of exact equal parts of the original
    // room. Move the SAME nodes into their waiting wicker baskets.
    el.innerHTML='<div class="fb-share-source"></div><div class="fb-baskets" data-phase="sharing"></div>';
    const source=el.firstElementChild,row=el.lastElementChild;
    for(let i=0;i<plan.groups;i++){
      const basket=basketNode(i,plan.group,false);
      const group=document.createElement("div");group.className="fb-share-group";
      group.innerHTML=gridMarkup(plan.group);source.append(group);row.append(basket);
    }
    el.dataset.phase="partition";fitAll();await pause(430);
    const originalGroups=[...source.children];
    for(const [i,group] of originalGroups.entries()){
      const basket=row.children[i],before=group.getBoundingClientRect();
      basket.querySelector(".basket-contents").append(group);
      basket.setAttribute("aria-label","Equal basket "+(i+1)+" of "+plan.groups+": "+summary(gridRoom(plan.group)));
      fitAll();
      if(!reduced&&group.animate){
        const after=group.getBoundingClientRect();
        group.animate([{transform:"translate("+Math.round(before.left-after.left)+"px,"+Math.round(before.top-after.top)+"px)"},{transform:"translate(0,0)"}],{duration:370,easing:"ease-out"});
      }
    }
    source.remove();el.dataset.phase="sharing";fitAll();await pause(650);
    for(const basket of [...row.children].slice(1).reverse()){
      await reach(side,basket);basket.classList.add("basket-in-hand");await lift(side,basket);fitAll();
    }
    el.dataset.phase="remaining";await pause(230);
    draw(side,plan.after,plan.raw);await pause(380);
  }
  async function copy(side,plan){
    const el=$(side+"-items");el.innerHTML='<div class="fb-baskets" data-phase="copying"></div>';
    const row=el.firstElementChild;
    row.append(basketNode(0,plan.group));fitAll();await pause(300);
    for(let i=1;i<plan.groups;i++){
      const basket=basketNode(i,plan.group);basket.classList.add("basket-in-hand");
      await reach(side,el,basket);
      basket.classList.remove("basket-in-hand");row.append(basket);cargo.hidden=true;fitAll();
      await lift(side);
    }
    el.dataset.phase="copies";await pause(520);
    // Pour each existing basket group onto the floor. Only then regroup
    // the total into the equivalent raw grid and final canonical inventory.
    const poured=document.createElement("div");poured.className="fb-poured";el.append(poured);
    for(const basket of [...row.children]){
      await reach(side,basket);
      const floor=basket.querySelector(".fb-room-floor");
      const group=document.createElement("div");group.className="fb-share-group";
      group.append(floor);poured.append(group);basket.remove();fitAll();await lift(side);
    }
    row.remove();el.dataset.phase="poured";await pause(230);
    draw(side,plan.after,plan.raw);await pause(500);
  }
  async function change(side,plan){
    const el=$(side+"-items"),prop=cargoFor(plan.amount);
    if(plan.borrowed||plan.changedGrid){draw(side,plan.before,plan.prepared);await pause(570);}
    if(plan.op==="add"){
      await reach(side,el,prop);
      draw(side,plan.after,plan.raw);cargo.hidden=true;hand.dataset.phase="release";await pause(220);await lift(side);
    }else{
      await reach(side,el);
      draw(side,plan.after,plan.raw);await lift(side,prop);
    }
    await pause(360);
  }
  async function animate(side,action,preview){
    const plan=roomChoreography(action,preview);
    const el=$(side+"-items");el.dataset.operation=action.op;
    if(action.op==="divide")await share(side,plan);
    else if(action.op==="multiply")await copy(side,plan);
    else await change(side,plan);
    // Join physical pieces first, then settle the same total into its
    // reduced representation. The conversion is not a separate move.
    for(const pieceGroup of el.querySelectorAll(".fw-assembly.is-separated,.fs-assembly.is-separated"))
      pieceGroup.classList.remove("is-separated");
    await pause(500);
    shown={...shown,[side]:plan.after};draw(side,plan.after);tilt();
    delete el.dataset.operation;await pause(120);
  }
  async function refusal(failure,side,rollback){
    const el=$(side+"-items"),diagram=failureDiagram(failure);
    if(diagram.type==="grid"){
      const grid=document.createElement("div");grid.className="fb-failure-grid";grid.setAttribute("aria-label","Attempted "+diagram.denominator+" equal parts; too small for this workshop");
      for(let i=0;i<diagram.denominator;i++)grid.append(document.createElement("i"));
      el.append(grid);
    }else if(diagram.type==="overflow"){
      const mark=document.createElement("span");mark.className="fb-failure-overflow";mark.textContent="+"+diagram.excess+" too many pieces";el.append(mark);
    }else el.classList.add("fb-failure-shake");
    el.dataset.refusal=failure.code||"invalid";await pause(620);
    tell(failureSpeech(failure));await pause(1150);
    if(rollback&&state.pending)state=undo(state);
    delete el.dataset.refusal;el.classList.remove("fb-failure-shake");settled();
    if(mode==="manual")resetSelection();
    feedback("Move undone. Try another operation.");
  }
  async function play(side,explicitAction=null){
    if(busy||dead||isSolved(state))return;
    const checked=explicitAction?fractionAction(explicitAction):null;
    const action=explicitAction?(checked.ok?checked.action:null):selectedAction();if(!action)return;
    busy=true;clearSpeech();controls();
    try{
      const prior=state;
      if(mode==="auto"){
        const prepared=prepare(prior,action);
        if(!prepared.ok){await refusal(prepared,prepared.side||"left",false);return;}
        const result=perform(prior,action,"auto");
        if(!result.ok){await refusal(result,result.side||"left",false);return;}
        for(const visit of SIDES)await animate(visit,action,prepared.pair[visit]);
        state=result.state;feedback("Both rooms balanced.");
      }else{
        if(!SIDES.includes(side))return;
        const result=perform(prior,action,"manual",side);
        if(!result.ok){
          // If a different second action is physically possible, demonstrate
          // the attempt on the remaining chamber, then undo both visits.
          if(prior.pending&&result.code==="mismatch"){
            const trial=previewRoomAction(prior[side],action,"fractions",side);
            if(trial.ok)await animate(side,action,trial);
          }
          await refusal(result,side,!!prior.pending);return;
        }
        const preview=prior.pending?prior.pending.pair[side]:result.state.pending.pair[side];
        await animate(side,action,preview);state=result.state;
        // Each manual visit is independently chosen. The first action is
        // recorded in exact engine state, not copied into the next controls.
        resetSelection();
        feedback(state.pending?"Choose a matching move for the "+(state.pending.first==="left"?"east":"west")+" chamber.":"Both rooms balanced.");
      }
      settled();
    }catch(error){
      if(!dead){console.error(error);if(state.pending)state=undo(state);settled();feedback("That animation could not finish. The balance was restored.");}
    }finally{
      if(activeSide)clearHand(activeSide);
      busy=false;
      if(!dead){settled();notifyState();}
    }
  }
  function restart(next=level,nextMode=mode){
    if(busy||dead)return false;
    level=next;mode=nextMode;state=initialState(level);completeNotified=false;
    resetSelection();clearSpeech();settled();feedback("Choose an operation.");notifyState();return true;
  }
  function setMode(next){if(busy||state.pending||!["auto","manual"].includes(next))return false;mode=next;controls();return true;}
  function setReduced(next){if(busy)return false;reduced=!!next;root.dataset.reduced=String(reduced);return true;}
  $("fb-whole").innerHTML=options(Array.from({length:13},(_,i)=>i));
  $("fb-denominator").innerHTML=options(FRACTION_DENOMINATORS.filter(d=>d>1));
  for(const btn of root.querySelectorAll("[data-fb-op]"))listen(btn,"click",()=>{selection={op:btn.dataset.fbOp,kind:null,factor:null};controls();});
  for(const btn of root.querySelectorAll("[data-fb-kind]"))listen(btn,"click",()=>{selection.kind=btn.dataset.fbKind;controls();});
  for(const btn of root.querySelectorAll("[data-fb-factor]"))listen(btn,"click",()=>{selection.factor=Number(btn.dataset.fbFactor);controls();});
  for(const id of ["fb-whole","fb-numerator"])listen($(id),"change",controls);
  listen($("fb-denominator"),"change",()=>{updateNumerators(Number($("fb-numerator").value));controls();});
  listen($("fb-apply"),"click",()=>play());
  for(const side of SIDES)listen($(side+"-action"),"click",()=>play(side));
  listen($("fb-reset"),"click",()=>restart());
  listen($("fb-undo"),"click",()=>{if(busy)return;const wasPending=!!state.pending;state=undo(state);completeNotified=false;if(mode==="manual")resetSelection();clearSpeech();settled();feedback(wasPending?"First visit undone.":"Last move undone.");notifyState();});
  listen(window,"resize",fitAll);
  const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(fitAll):null;
  for(const side of SIDES)observer?.observe($(side+"-items"));
  setReduced(reduced);restart(level,mode);
  return {load:restart,setMode,setReduced,getState:()=>state,play,refit:fitAll,
    async playAction(action){
      // Used only for checked notebook replay, never for uncommitted paper.
      if(mode!=="auto"||busy||dead||isSolved(state))return false;
      const count=state.history.length;
      await play(undefined,action);
      return !dead&&state.history.length===count+1;
    },
    destroy(){dead=true;abort.abort();observer?.disconnect();if(activeSide)clearHand(activeSide);}};
}
