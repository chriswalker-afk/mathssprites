/** New entitlements are queued only from real campaign completions.
 * A review-ready signal drains them once; startup migration, repeated
 * solves, previews and appearance changes never create a celebration. */
import {COSMETIC_REWARDS} from "./cosmetic-catalog.mjs";
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
export function mountRewardCelebration({document:doc=globalThis.document,duration=6500}={}){
  const queue=createRewardCelebrationQueue();
  const notice=doc.createElement("aside");
  notice.id="reward-celebration";notice.className="reward-celebration";notice.hidden=true;
  notice.setAttribute("role","status");notice.setAttribute("aria-live","polite");notice.setAttribute("aria-atomic","true");
  const emblem=doc.createElement("span");emblem.className="reward-celebration-emblem";emblem.textContent="✦";emblem.setAttribute("aria-hidden","true");
  const content=doc.createElement("div");content.className="reward-celebration-copy";
  const title=doc.createElement("strong"),names=doc.createElement("span"),detail=doc.createElement("small");
  title.id="reward-celebration-title";names.id="reward-celebration-names";detail.id="reward-celebration-detail";
  content.append(title,names,detail);notice.append(emblem,content);doc.body.append(notice);
  let timer=null;
  function hide(){clearTimeout(timer);timer=null;notice.hidden=true;notice.classList.remove("reward-celebration-enter");}
  function reveal({anchor=doc.body}={}){
    const rewards=queue.take();
    if(!rewards.length)return false;
    hide();anchor.append(notice);
    title.textContent=rewards.length===1?"New cosmetic unlocked!":rewards.length+" cosmetics unlocked!";
    names.textContent=rewards.map(r=>r.name+" · "+r.stars+" ★").join("  •  ");
    detail.textContent="Find your rewards in the Sprite Atelier.";
    notice.hidden=false;notice.getBoundingClientRect();
    notice.classList.add("reward-celebration-enter");
    timer=setTimeout(hide,duration);
    return true;
  }
  function leaveReview(){
    // On early close/advance acknowledge an earned unlock without holding
    // the learner in a dialog. A visible toast follows the learner.
    if(notice.parentNode!==doc.body)doc.body.append(notice);
    return reveal();
  }
  return Object.freeze({enqueue:queue.enqueue,reveal,leaveReview,hide});
}
