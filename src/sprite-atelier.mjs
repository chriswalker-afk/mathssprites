/** Student-facing Atelier. The real sprite renderer supplies every ready
 * preview, scoped independently from the saved appearance on document.body. */
import {COSMETIC_REWARDS,findCosmeticReward,findCosmeticItem,COSMETIC_COLLECTIONS,cosmeticCollection} from "./cosmetic-catalog.mjs?v=91";
import {spriteCreatureMarkup} from "./square-sprites.mjs?v=88";
import {weightAssemblyMarkup} from "./fraction-weights.mjs?v=94";
import {applyLaboratoryAppearance} from "./laboratory-cosmetics.mjs?v=95";
import {atelierFilters,rewardArtReady,atelierRewardState,
  atelierCollection,atelierPreview,atelierDescription,equipAtelierReward} from "./atelier-model.mjs?v=95";

const icons=Object.freeze({fur:"✳",eyes:"◉",headwear:"⌂",eyewear:"∞",neckwear:"◇",
  movement:"↟",effect:"✦",set:"♛","weight-shape":"◆","weight-material":"▧","weight-effect":"✧","chamber-theme":"⌂"});
const statusCopy=Object.freeze({equipped:"Equipped",available:"Unlocked",
  "owned-coming":"Unlocked · art coming soon",locked:"Locked","locked-coming":"Locked · art coming soon"});
export function mountSpriteAtelier({root,homeSummary,store}){
  const $=id=>root.querySelector("#"+id);
  const list=$("atelier-collection"),scope=$("atelier-preview");
  const filter=$("atelier-filter"),ownedOnly=$("atelier-owned-only");
  const cards=new Map();
  let active=false,selected=null,collection="sprites";
  const tabs=[...root.querySelectorAll("[data-atelier-collection]")],panels=[...scope.querySelectorAll("[data-preview-collection]")];
  const labels={sprites:{name:"Sprites",preview:"Fitting room",detail:"Your sprite"},weights:{name:"Weights",preview:"Weight workbench",detail:"Your weights"},chambers:{name:"Chambers",preview:"Chamber gallery",detail:"Your chambers"}};
  function setCollection(value){
    if(!Object.hasOwn(COSMETIC_COLLECTIONS,value))return;
    collection=value;selected=null;
    for(const tab of tabs)tab.setAttribute("aria-pressed",String(tab.dataset.atelierCollection===collection));
    for(const panel of panels)panel.hidden=panel.dataset.previewCollection!==collection;
    scope.dataset.previewType=collection;
    filter.replaceChildren();
    for(const {id,label} of atelierFilters(collection)){
      const option=document.createElement("option");option.value=id;option.textContent=label;filter.append(option);
    }
    $("atelier-preview-heading").textContent=labels[collection].preview;
    $("atelier-collection-heading").textContent=labels[collection].name+" collection";
    list.scrollTop=0;
  }
  setCollection("sprites");
  let previewShape=null;
  function updateWeightPreview(appearance){
    const shape=appearance["weight-shape"]||"original";
    if(previewShape!==shape){$("atelier-weight-fraction").innerHTML=weightAssemblyMarkup(3,[0,1],{label:true,shape});previewShape=shape;}
  }
  for(const [kind,side] of [["posX","black"],["negX","white"]])
    $("atelier-"+side).innerHTML=spriteCreatureMarkup("atelier-preview",side,kind,0);
  for(const [side,kind] of [["west","posX"],["east","negX"]]){
    $("atelier-chamber-"+side).innerHTML=spriteCreatureMarkup("atelier-chamber-sample",side,kind,0)+'<span class="token weight"><i class="weight-handle"></i><i class="weight-shine"></i></span>';
  }
  for(const reward of COSMETIC_REWARDS){
    const button=document.createElement("button");button.type="button";
    button.className="atelier-reward";button.dataset.rewardId=reward.id;
    if(reward.category==="set")button.classList.add("atelier-finale");
    button.setAttribute("aria-pressed","false");
    const thumb=document.createElement("span");thumb.className="atelier-thumb";thumb.setAttribute("aria-hidden","true");
    if(cosmeticCollection(reward)==="sprites"&&rewardArtReady(reward)){
      applyLaboratoryAppearance(thumb,reward.slot?{[reward.slot]:reward.id}:reward.loadout);
      thumb.innerHTML=spriteCreatureMarkup("atelier-thumbnail",reward.id,"posX",0);
      if(reward.slot==="movement")thumb.dataset.motionPreview=reward.id;
    }else if(cosmeticCollection(reward)==="weights"&&rewardArtReady(reward)){
      applyLaboratoryAppearance(thumb,{[reward.slot]:reward.id});
      thumb.innerHTML='<span class="token weight"><i class="weight-handle"></i><i class="weight-shine"></i></span>';
    }else if(cosmeticCollection(reward)==="chambers"&&rewardArtReady(reward)){
      applyLaboratoryAppearance(thumb,{[reward.slot]:reward.id});
      thumb.innerHTML='<span class="atelier-chamber-thumbnail"></span>';
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
    $("atelier-next-copy").textContent=next?snapshot.starsToNext+" more ★ · "+next.stars+" ★ milestone"+(rewardArtReady(next)?"":" · art coming soon"):"All rewards unlocked";
    meter.max=next?next.stars:Math.max(1,snapshot.availableStars);
    meter.value=next?Math.min(snapshot.earnedStars,next.stars):meter.max;
    const visible=new Set(atelierCollection(snapshot,{collection,filter:filter.value,ownedOnly:ownedOnly.checked}).map(r=>r.id));
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
    const preview=atelierPreview(snapshot,selected);
    const appearance=applyLaboratoryAppearance(scope,preview);
    updateWeightPreview(appearance);
    $("atelier-chamber-name").textContent=findCosmeticItem(appearance["chamber-theme"])?.name||"Original laboratory";
    $("atelier-weight-finish").textContent=[findCosmeticItem(preview["weight-shape"])?.name||"Traditional weight",findCosmeticItem(preview["weight-material"])?.name||"Original brass",findCosmeticItem(preview["weight-effect"])?.name].filter(Boolean).join(" · ");
    const names=COSMETIC_COLLECTIONS[collection].map(slot=>findCosmeticItem(snapshot.equipped[slot])?.name).filter(Boolean);
    const fullSet=findCosmeticReward("grand-alchemist");
    const wearingSet=collection==="sprites"&&Object.entries(fullSet.loadout).every(([slot,id])=>snapshot.equipped[slot]===id);
    $("atelier-equipped").textContent=wearingSet?"The Grand Alchemist · complete set":names.length?names.join(" · "):"Original appearance";
    $("atelier-preview-label").textContent=state?.ready&&!state.equipped?"Trying on · not saved":"Equipped appearance";
    $("atelier-detail-title").textContent=reward?reward.name:labels[collection].detail;
    $("atelier-detail-copy").textContent=!reward?"Select a reward to try it on.":!state.ready?
      atelierDescription(reward)+" Artwork coming soon; it cannot be equipped yet.":atelierDescription(reward);
    $("atelier-detail-status").textContent=!reward?"":state.owned?
      (state.equipped?"Equipped":state.ready?"Unlocked — ready to equip":"Unlocked — art coming soon"):
      state.starsNeeded+" more star"+(state.starsNeeded===1?"":"s")+" to unlock · "+reward.stars+" ★";
    $("atelier-equip").disabled=!state?.canEquip;
    $("atelier-equip").textContent=!reward?"Equip":state.equipped?"Equipped":!state.ready?"Art coming soon":!state.owned?"Locked":reward.category==="set"?"Equip full set":"Equip";
    $("atelier-remove").hidden=!state?.canRemove;
    $("atelier-cancel-preview").disabled=!reward;
    $("atelier-restore").disabled=!names.length;
    $("atelier-restore").title="Restore original "+labels[collection].name.toLowerCase()+" only";
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
  for(const tab of tabs)tab.addEventListener("click",()=>{setCollection(tab.dataset.atelierCollection);announce("");render();});
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
    store.restoreOriginal(collection);selected=null;render();announce("Original "+labels[collection].name.toLowerCase()+" restored. Other collections and stars are unchanged.");$("atelier-detail-title").focus({preventScroll:true});
  });
  const unsubscribe=store.subscribe(()=>render());
  updateHome(store.getSnapshot());
  return Object.freeze({
    setActive(value){
      if(active===value)return;
      active=value;
      if(active){
        setCollection("sprites");ownedOnly.checked=false;announce("");render();
      }else{
        selected=null;applyLaboratoryAppearance(scope,store.getSnapshot().equipped);announce("");
      }
    },
    refresh:render,destroy:unsubscribe
  });
}
