/** New entitlements are queued only from real campaign completions.
 * A review-ready signal drains them once; startup migration, repeated
 * solves, previews and appearance changes never create a celebration. */
import {COSMETIC_REWARDS} from "./cosmetic-catalog.mjs?v=91";
import {atelierRewardState,equipAtelierReward} from "./atelier-model.mjs?v=96";
export function createRewardCelebrationQueue(){
  const pending=new Set(),seen=new Set();
  return Object.freeze({
    enqueue(ids){
      for(const reward of COSMETIC_REWARDS)
        if(ids?.includes(reward.id)&&!seen.has(reward.id))pending.add(reward.id);
      return pending.size;
    },
    take(){
      const rewards=COSMETIC_REWARDS.filter(r=>pending.has(r.id));
      for(const r of rewards)seen.add(r.id);
      pending.clear();return rewards;
    },
    get size(){return pending.size;}
  });
}
/** Use exactly the Atelier's ownership, art-readiness and equip checks.
 * The celebration is not a second source of entitlement or appearance. */
export function rewardApplyState(store,reward){
  if(!store)return {canApply:false,label:"Apply in Atelier"};
  const state=atelierRewardState(store.getSnapshot(),reward);
  return {canApply:state.canEquip,label:state.equipped&&state.ready?"Applied ✓":
    !state.owned?"Locked":!state.ready?"Art coming soon":"Apply cosmetic now"};
}
export function mountRewardCelebration({document:doc=globalThis.document,store,duration=6500}={}){
  const queue=createRewardCelebrationQueue();
  const notice=doc.createElement("aside");
  notice.id="reward-celebration";notice.className="reward-celebration";notice.hidden=true;
  notice.setAttribute("aria-labelledby","reward-celebration-title");
  const emblem=doc.createElement("span");emblem.className="reward-celebration-emblem";emblem.textContent="✦";emblem.setAttribute("aria-hidden","true");
  const content=doc.createElement("div");content.className="reward-celebration-copy";
  const title=doc.createElement("strong"),names=doc.createElement("div"),detail=doc.createElement("small");
  title.id="reward-celebration-title";names.id="reward-celebration-names";detail.id="reward-celebration-detail";
  const announcement=doc.createElement("span");announcement.className="sr-only";announcement.setAttribute("role","status");announcement.setAttribute("aria-live","polite");announcement.setAttribute("aria-atomic","true");
  const dismiss=doc.createElement("button");dismiss.type="button";dismiss.id="reward-celebration-dismiss";dismiss.className="reward-celebration-dismiss";dismiss.textContent="Not now";
  const footer=doc.createElement("div");footer.className="reward-celebration-footer";footer.append(detail,dismiss);
  content.append(title,names,footer,announcement);notice.append(emblem,content);doc.body.append(notice);
  let timer=null,active=[],previousFocus=null;
  const buttons=new Map();
  function restoreFocus(){
    if(!notice.contains(doc.activeElement))return;
    const target=previousFocus?.isConnected&&!notice.contains(previousFocus)&&previousFocus.getClientRects().length?previousFocus:
      notice.parentElement?.querySelector(".replay-exit");
    target?.focus({preventScroll:true});
  }
  function hide(){
    clearTimeout(timer);timer=null;restoreFocus();
    notice.hidden=true;notice.classList.remove("reward-celebration-enter");
    active=[];buttons.clear();names.replaceChildren();announcement.textContent="";
  }
  function reflect(){
    let anyApplicable=false,allApplied=active.length>0;
    for(const reward of active){
      const button=buttons.get(reward.id),state=rewardApplyState(store,reward);
      if(!button)continue;
      button.textContent=state.label;
      // Keep a focused button focusable after applying; repeat activation is
      // guarded below. This also permits a screen reader to read the status.
      button.setAttribute("aria-disabled",String(!state.canApply));
      button.setAttribute("aria-label",state.label+" — "+reward.name);
      button.dataset.applied=String(state.label==="Applied ✓");
      anyApplicable||=state.canApply;
      allApplied&&=state.label==="Applied ✓";
    }
    dismiss.textContent=allApplied?"Done":"Not now";
    return anyApplicable;
  }
  function apply(reward){
    if(notice.hidden||!active.some(r=>r.id===reward.id)||!rewardApplyState(store,reward).canApply)return;
    const result=equipAtelierReward(store,reward.id);
    reflect();
    if(result.ok){
      detail.textContent=reward.name+" applied!";
      announcement.textContent=reward.name+" applied. Your appearance has been updated.";
    }else if(result.code==="already-equipped"){
      detail.textContent=reward.name+" is already applied.";
      announcement.textContent=detail.textContent;
    }else{
      detail.textContent="Could not apply "+reward.name+". You can try in the Atelier.";
      announcement.textContent=detail.textContent;
    }
  }
  function renderRows(){
    buttons.clear();
    names.replaceChildren(...active.map(reward=>{
      const row=doc.createElement("div");row.className="reward-celebration-row";
      const name=doc.createElement("span");name.textContent=reward.name+" · "+reward.stars+" ★";
      row.append(name);
      if(store){
        const button=doc.createElement("button");button.type="button";button.className="reward-celebration-apply";
        button.dataset.applyReward=reward.id;button.addEventListener("click",()=>apply(reward));
        buttons.set(reward.id,button);row.append(button);
      }
      return row;
    }));
    return reflect();
  }
  notice.addEventListener("focusin",event=>{
    if(event.relatedTarget&&!notice.contains(event.relatedTarget))previousFocus=event.relatedTarget;
  });
  dismiss.addEventListener("click",hide);
  store?.subscribe(()=>{if(!notice.hidden)reflect();});
  function reveal({anchor=doc.body}={}){
    const rewards=queue.take();
    if(!rewards.length){
      // A previously announced, undecided reward follows the learner and
      // remains in the active review's stacking context.
      if(!notice.hidden&&notice.parentNode!==anchor)anchor.append(notice);
      return false;
    }
    clearTimeout(timer);timer=null;
    // Preserve existing choices if a second milestone arrives before the
    // learner dismisses the first. The queue has already deduplicated IDs.
    active=[...active,...rewards].sort((a,b)=>a.stars-b.stars);
    anchor.append(notice);
    title.textContent=active.length===1?"New cosmetic unlocked!":active.length+" cosmetics unlocked!";
    detail.textContent=store?"Use it now or keep it for later in the Atelier.":"Find your rewards in the Atelier.";
    const actionable=renderRows();
    notice.hidden=false;
    notice.classList.remove("reward-celebration-enter");notice.getBoundingClientRect();
    notice.classList.add("reward-celebration-enter");
    announcement.textContent=title.textContent+" "+rewards.map(r=>r.name).join(", ")+".";
    // Never time out an opportunity to apply a reward. Unavailable art and
    // legacy read-only notices keep the original lightweight timeout.
    if(!actionable)timer=setTimeout(()=>{if(!notice.contains(doc.activeElement))hide();},duration);
    return true;
  }
  function leaveReview(){
    // Early close/advance still acknowledges a queued reward; already
    // visible choices remain available outside the comic.
    if(notice.parentNode!==doc.body)doc.body.append(notice);
    return reveal();
  }
  return Object.freeze({enqueue:queue.enqueue,reveal,leaveReview,hide});
}
