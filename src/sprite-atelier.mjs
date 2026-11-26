/** Student-facing Atelier. The real sprite renderer supplies every ready
 * preview, scoped independently from the saved appearance on document.body. */
import {COSMETIC_REWARDS,findCosmeticReward,findCosmeticItem,COSMETIC_SLOTS} from "./cosmetic-catalog.mjs";
import {spriteCreatureMarkup} from "./square-sprites.mjs?v=88";
import {applySpriteAppearance} from "./sprite-cosmetics.mjs?v=89";
import {ATELIER_FILTERS,ATELIER_SLOT_LABELS,rewardArtReady,atelierRewardState,
  atelierCollection,atelierPreview,atelierDescription,equipAtelierReward} from "./atelier-model.mjs?v=89";

const icons=Object.freeze({fur:"✳",eyes:"◉",headwear:"⌂",eyewear:"∞",neckwear:"◇",
  movement:"↟",effect:"✦",set:"♛"});
const statusCopy=Object.freeze({equipped:"Equipped",available:"Unlocked",
  "owned-coming":"Unlocked · art coming soon",locked:"Locked","locked-coming":"Locked · art coming soon"});
export function mountSpriteAtelier({root,homeSummary,store}){
  const $=id=>root.querySelector("#"+id);
  const list=$("atelier-collection"),scope=$("atelier-preview");
  const filter=$("atelier-filter"),ownedOnly=$("atelier-owned-only");
  const cards=new Map();
  let active=false,selected=null;
  for(const {id,label} of ATELIER_FILTERS){
    const option=document.createElement("option");option.value=id;option.textContent=label;filter.append(option);
  }
  for(const [kind,side] of [["posX","black"],["negX","white"]])
    $("atelier-"+side).innerHTML=spriteCreatureMarkup("atelier-preview",side,kind,0);
  for(const reward of COSMETIC_REWARDS){
    const button=document.createElement("button");button.type="button";
    button.className="atelier-reward";button.dataset.rewardId=reward.id;
    if(reward.category==="set")button.classList.add("atelier-finale");
    button.setAttribute("aria-pressed","false");
    const thumb=document.createElement("span");thumb.className="atelier-thumb";thumb.setAttribute("aria-hidden","true");
    if(rewardArtReady(reward)){
      applySpriteAppearance(thumb,reward.slot?{[reward.slot]:reward.id}:reward.loadout);
      thumb.innerHTML=spriteCreatureMarkup("atelier-thumbnail",reward.id,"posX",0);
      if(reward.slot==="movement")thumb.dataset.motionPreview=reward.id;
    }else{
      thumb.classList.add("atelier-thumb-placeholder");thumb.textContent=icons[reward.slot??"set"];
    }
    const name=document.createElement("span");name.className="atelier-reward-name";name.textContent=reward.name;
    const threshold=document.createElement("span");threshold.className="atelier-threshold";threshold.textContent=reward.stars+" ★";
    const status=document.createElement("span");status.className="atelier-reward-status";
    button.append(thumb,name,threshold,status);list.append(button);
    cards.set(reward.id,{button,status});
  }
  function updateHome(snapshot){
    homeSummary.textContent=snapshot.earnedStars+" / "+snapshot.availableStars+" ★";
  }
  function announce(text){$("atelier-announcement").textContent=text;}
  function render(){
    const snapshot=store.getSnapshot();updateHome(snapshot);
    if(!active)return;
    $("atelier-stars").textContent=snapshot.earnedStars+" / "+snapshot.availableStars+" ★";
    $("atelier-owned").textContent=snapshot.unlockedCount+" / "+snapshot.rewardCount+" unlocked";
    const next=snapshot.nextReward,meter=$("atelier-next-progress");
    $("atelier-next-name").textContent=next?next.name:"Collection complete";
    $("atelier-next-copy").textContent=next?snapshot.starsToNext+" more ★ · "+next.stars+" ★ milestone":"All rewards unlocked";
    meter.max=next?next.stars:Math.max(1,snapshot.availableStars);
    meter.value=next?Math.min(snapshot.earnedStars,next.stars):meter.max;
    const visible=new Set(atelierCollection(snapshot,{filter:filter.value,ownedOnly:ownedOnly.checked}).map(r=>r.id));
    if(selected&&!visible.has(selected))selected=null;
    $("atelier-result-count").textContent=visible.size+" reward"+(visible.size===1?"":"s");
    $("atelier-empty").hidden=visible.size>0;
    for(const reward of COSMETIC_REWARDS){
      const {button,status}=cards.get(reward.id),state=atelierRewardState(snapshot,reward);
      button.hidden=!visible.has(reward.id);button.dataset.status=state.status;
      button.setAttribute("aria-pressed",String(selected===reward.id));
      status.textContent=statusCopy[state.status];
      button.setAttribute("aria-label",reward.name+", "+reward.stars+" stars, "+statusCopy[state.status]);
    }
    const reward=findCosmeticReward(selected);
    const state=reward?atelierRewardState(snapshot,reward):null;
    applySpriteAppearance(scope,atelierPreview(snapshot,selected));
    const names=COSMETIC_SLOTS.map(slot=>findCosmeticItem(snapshot.equipped[slot])?.name).filter(Boolean);
    const fullSet=findCosmeticReward("grand-alchemist");
    const wearingSet=Object.entries(fullSet.loadout).every(([slot,id])=>snapshot.equipped[slot]===id);
    $("atelier-equipped").textContent=wearingSet?"The Grand Alchemist · complete set":names.length?names.join(" · "):"Original appearance";
    $("atelier-preview-label").textContent=state?.ready&&!state.equipped?"Trying on · not saved":"Equipped appearance";
    $("atelier-detail-title").textContent=reward?reward.name:"Your sprite";
    $("atelier-detail-copy").textContent=!reward?"Select a reward to try it on.":!state.ready?
      atelierDescription(reward)+" Artwork coming soon; it cannot be equipped yet.":atelierDescription(reward);
    $("atelier-detail-status").textContent=!reward?"":state.owned?
      (state.equipped?"Equipped":state.ready?"Unlocked — ready to equip":"Unlocked — art coming soon"):
      state.starsNeeded+" more stars to unlock · "+reward.stars+" ★";
    $("atelier-equip").disabled=!state?.canEquip;
    $("atelier-equip").textContent=!reward?"Equip":state.equipped?"Equipped":!state.ready?"Art coming soon":!state.owned?"Locked":reward.category==="set"?"Equip full set":"Equip";
    $("atelier-remove").hidden=!state?.canRemove;
    $("atelier-cancel-preview").disabled=!reward;
    $("atelier-restore").disabled=!names.length;
  }
  list.addEventListener("click",event=>{
    const button=event.target.closest("button[data-reward-id]");
    if(!button||!list.contains(button)||button.hidden)return;
    selected=button.dataset.rewardId;announce("");render();
    // On phones the shelf sits below the fitting room. Bring the preview
    // into view after a deliberate selection; a Browse button returns to
    // that exact card. Do not jump the desktop shelf or reset its scroll.
    if(matchMedia("(max-width:899px)").matches){
      $("atelier-detail-title").focus({preventScroll:true});
      scope.closest(".atelier-dressing").scrollIntoView({block:"start",behavior:"instant"});
    }
  });
  filter.addEventListener("change",()=>{selected=null;list.scrollTop=0;announce("");render();});
  ownedOnly.addEventListener("change",()=>{selected=null;list.scrollTop=0;announce("");render();});
  $("atelier-browse").addEventListener("click",()=>{
    const card=cards.get(selected)?.button;
    const target=card&&!card.hidden?card:filter;
    target.focus({preventScroll:true});target.scrollIntoView({block:"center",behavior:"instant"});
  });
  $("atelier-equip").addEventListener("click",()=>{
    const reward=findCosmeticReward(selected);
    const result=equipAtelierReward(store,selected);
    if(result.ok){announce(reward.name+" equipped.");render();
      if(matchMedia("(max-width:899px)").matches)$("atelier-detail-title").focus({preventScroll:true});
      else cards.get(selected)?.button.focus({preventScroll:true});}
  });
  $("atelier-remove").addEventListener("click",()=>{
    const reward=findCosmeticReward(selected);
    if(!reward||!atelierRewardState(store.getSnapshot(),reward).canRemove)return;
    const result=store.equip(reward.slot,null);
    if(result.ok){selected=null;render();announce(reward.name+" removed.");$("atelier-detail-title").focus({preventScroll:true});}
  });
  $("atelier-cancel-preview").addEventListener("click",()=>{
    selected=null;render();announce("Showing your saved appearance.");$("atelier-detail-title").focus({preventScroll:true});
  });
  $("atelier-restore").addEventListener("click",()=>{
    store.restoreOriginal();selected=null;render();announce("Original appearance restored. Your rewards and stars are unchanged.");$("atelier-detail-title").focus({preventScroll:true});
  });
  const unsubscribe=store.subscribe(()=>render());
  updateHome(store.getSnapshot());
  return Object.freeze({
    setActive(value){
      if(active===value)return;
      active=value;
      if(active){
        selected=null;filter.value="all";ownedOnly.checked=false;list.scrollTop=0;announce("");render();
      }else{
        selected=null;applySpriteAppearance(scope,store.getSnapshot().equipped);announce("");
      }
    },
    refresh:render,destroy:unsubscribe
  });
}
