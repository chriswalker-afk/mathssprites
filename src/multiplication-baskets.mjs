/**
 * PR29 — Physical multiplication, the visual inverse of division.
 * The first wicker basket receives the ACTUAL source actors. The hand brings
 * in (factor-1) full baskets, each containing one complete new copy of those
 * actors, then pours every basket onto the floor and throws the empty wicker
 * props away one at a time. The engine commits ONCE, at the last pour.
 *
 * Shares all real wicker/hand code with division. Visual actors in the extra
 * baskets are temporary representations of the incoming copies, not engine
 * objects; their final numbers are supplied by the existing engine.
 */
import {
  divisionBasketMarkup,announceBasketContents,resetHand,
  aimHandAtBasket,attachBasketToHand
} from "./division-baskets.mjs";

export function multiplicationBasketTiming(factor,reduced=false) {
  if(!Number.isInteger(factor)||factor<2||factor>5)
    throw new RangeError("Multiplication uses two to five equal baskets");
  const fast=factor>=4;
  return Object.freeze({
    factor,
    dropMs:reduced?0:530,
    shareMs:reduced?0:470,
    shareGap:reduced?0:fast?8:22,
    settleMs:reduced?500:fast?370:610,
    deliverMs:reduced?0:fast?120:195,
    placeMs:reduced?0:fast?175:260,
    reachMs:reduced?0:fast?130:205,
    gripMs:reduced?0:fast?55:85,
    pourMs:reduced?0:fast?305:445,
    throwMs:reduced?0:fast?195:290,
    betweenMs:reduced?32:fast?38:80
  });
}
export function multiplicationBasketMarkup(factor) {
  if(!Number.isInteger(factor)||factor<2||factor>5)
    throw new RangeError("Multiplication uses two to five equal baskets");
  return divisionBasketMarkup(factor);
}
/** Factor groups, ALL of the kinds in each group, not just one coefficient. */
export function multiplicationGroupCopies(kinds,factor) {
  if(!Number.isInteger(factor)||factor<2||factor>5)
    throw new RangeError("Multiplication uses two to five equal baskets");
  return Array.from({length:factor},()=>[...kinds]);
}
/** Physical wicker prop in the fallback failed-operation hand animation. */
export function multiplicationHandProp() {
  return '<div class="group-basket basket-in-hand" role="img" '+
    'aria-label="Wicker basket holding a complete group">'+
    '<div class="basket-contents"></div>'+
    '<span class="basket-lip" aria-hidden="true"></span></div>';
}
function nextFrame(){
  return new Promise(resolve=>requestAnimationFrame(()=>resolve()));
}
function setHandReach({hand,scene,basket}){
  const sceneRect=scene.getBoundingClientRect();
  const rect=basket.getBoundingClientRect();
  const fingertipOffset=hand.offsetWidth*.10;
  hand.style.left=(rect.left+rect.width/2-sceneRect.left+fingertipOffset)+"px";
  const restingTip=hand.offsetTop+hand.offsetHeight*.90;
  const targetTip=rect.top-sceneRect.top+Math.min(25,rect.height*.2);
  hand.style.setProperty("--hand-reach",Math.max(85,targetTip-restingTip)+"px");
}
function clearTokenFlight(token,prefix,name) {
  token.classList.remove(name);
  token.style.removeProperty("--"+prefix+"-x");
  token.style.removeProperty("--"+prefix+"-y");
  token.style.removeProperty("--"+prefix+"-delay");
}
async function moveOriginalGroup({tokens,basket,timing,reduced,sleep}) {
  const starts=tokens.map(node=>node.getBoundingClientRect());
  const contents=basket.querySelector(".basket-contents");
  tokens.forEach(node=>contents.appendChild(node));
  if(reduced){await sleep(130);return;}
  const gap=Math.min(timing.shareGap,Math.floor(600/Math.max(1,tokens.length)));
  tokens.forEach((node,i)=>{
    const end=node.getBoundingClientRect();
    node.style.setProperty("--basket-share-x",Math.round(starts[i].left-end.left)+"px");
    node.style.setProperty("--basket-share-y",Math.round(starts[i].top-end.top)+"px");
    node.style.setProperty("--basket-share-delay",i*gap+"ms");
    node.classList.add("basket-sharing-token");
  });
  await sleep(timing.shareMs+Math.max(0,tokens.length-1)*gap+35);
  tokens.forEach(node=>clearTokenFlight(node,"basket-share","basket-sharing-token"));
}
async function deliverCopy({basket,index,factor,hand,cargo,scene,row,target,caption,sleep,timing,reduced}) {
  // The full new basket travels WITH the articulated hand; unlike the old
  // icon, this is the same actual DOM basket subsequently left in the room.
  setHandReach({hand,scene,basket});
  basket.classList.add("basket-in-hand");
  cargo.replaceChildren(basket);
  cargo.hidden=false;
  target.classList.add("hand-target");
  caption.textContent="The hand brings in identical basket "+(index+1)+" of "+factor+".";
  caption.hidden=false;
  hand.classList.remove("approaching","reaching","lifting","basket-throwing");
  hand.classList.add("acting");
  hand.dataset.phase="carry";
  await nextFrame();
  if(!reduced){
    hand.classList.add("approaching");
    await sleep(timing.deliverMs);
    hand.classList.remove("approaching");
    hand.classList.add("reaching");
    await sleep(timing.deliverMs);
  }else await sleep(130);
  const from=basket.getBoundingClientRect();
  const next=[...row.children].find(other=>
    Number(other.dataset.basketIndex)>index);
  row.insertBefore(basket,next||null); // preserve L-to-R mathematical group order
  basket.classList.remove("basket-in-hand");
  basket.dataset.state=reduced?"landed":"placing";
  if(!reduced){
    const to=basket.getBoundingClientRect();
    basket.style.setProperty("--multiply-place-x",Math.round(from.left-to.left)+"px");
    basket.style.setProperty("--multiply-place-y",Math.round(from.top-to.top)+"px");
    await sleep(timing.placeMs);
    basket.dataset.state="landed";
    basket.style.removeProperty("--multiply-place-x");
    basket.style.removeProperty("--multiply-place-y");
  }
  hand.dataset.phase="release";
  await sleep(reduced?70:90);
  resetHand(hand,cargo,target,caption);
}
async function pourGroup({basket,source,resizeFloor,timing,reduced,sleep}) {
  const contents=basket.querySelector(".basket-contents");
  const nodes=[...contents.children].filter(el=>el.classList.contains("token"));
  const starts=nodes.map(node=>node.getBoundingClientRect());
  nodes.forEach(node=>source.appendChild(node));
  resizeFloor();
  if(reduced){await sleep(115);return;}
  const gap=Math.min(14,Math.floor(280/Math.max(1,nodes.length)));
  nodes.forEach((node,i)=>{
    const end=node.getBoundingClientRect();
    node.style.setProperty("--multiply-pour-x",Math.round(starts[i].left-end.left)+"px");
    node.style.setProperty("--multiply-pour-y",Math.round(starts[i].top-end.top)+"px");
    node.style.setProperty("--multiply-pour-delay",i*gap+"ms");
    node.classList.add("multiplication-poured-token");
  });
  await sleep(timing.pourMs+Math.max(0,nodes.length-1)*gap+20);
  nodes.forEach(node=>clearTokenFlight(node,"multiply-pour","multiplication-poured-token"));
}
export async function playMultiplicationBaskets({
  side,factor,reduced=false,applyAtContact,sleep,resizeFloor=()=>{}
}) {
  if(!Number.isInteger(factor)||factor<2||factor>5)
    throw new RangeError("Invalid multiplication factor");
  const root=document.getElementById(side+"-items");
  const stage=root?.querySelector(".multiplication-stage");
  const row=stage?.querySelector(".basket-row");
  if(!stage||!row)throw new Error("A real multiplication basket stage is missing");
  const baskets=[...row.querySelectorAll(":scope > .group-basket")];
  if(baskets.length!==factor)throw new Error("Multiplication basket count disagrees with the factor");
  const hand=document.getElementById("hand");
  const cargo=document.getElementById("hand-cargo");
  const scene=document.getElementById("scene");
  const target=document.getElementById(side+"-chamber");
  const caption=document.getElementById("action-caption");
  if(!hand||!cargo||!scene||!target||!caption)
    throw new Error("The articulated hand is missing");
  const source=stage.querySelector(".division-source .floor-track");
  if(!source)throw new Error("The original physical objects are missing");
  const originals=[...source.children].filter(node=>node.classList.contains("token"));
  const timing=multiplicationBasketTiming(factor,reduced);
  let applied=false;
  try{
    // Basket zero is not a ghost copy — it receives the originals.
    stage.dataset.phase="dropping";
    baskets[0].dataset.state=reduced?"landed":"dropping";
    await sleep(reduced?180:timing.dropMs+80);
    baskets[0].dataset.state="landed";
    stage.dataset.phase="grouping";
    await moveOriginalGroup({tokens:originals,basket:baskets[0],timing,reduced,sleep});
    baskets[0].setAttribute("aria-label","Basket 1 of "+factor+": original objects");
    stage.dataset.phase="copying";
    for(let index=1;index<factor;index++){
      const basket=baskets[index];
      const contents=basket.querySelector(".basket-contents");
      // One complete same-kind copy of every original object is delivered.
      originals.forEach(node=>contents.appendChild(node.cloneNode(true)));
      await deliverCopy({basket,index,factor,hand,cargo,scene,row,target,caption,
        sleep,timing,reduced});
      await sleep(timing.betweenMs);
    }
    announceBasketContents(baskets,factor);
    stage.dataset.phase="ready";
    caption.textContent=factor+" complete, identical baskets: "+
      "one original group and "+(factor-1)+" new "+
      (factor===2?"group":"groups")+".";
    caption.hidden=false;
    await sleep(timing.settleMs);
    stage.dataset.phase="pouring";
    // Empty and dispose of baskets one at a time. Only the FINAL pour changes
    // the underlying mathematical state (once) at the physical hand contact.
    for(let index=factor-1;index>=0;index--){
      const basket=baskets[index];
      if(!reduced){
        await aimHandAtBasket({hand,scene,target,basket,cargo,caption,sleep,
          ms:timing.reachMs});
        await sleep(timing.gripMs);
        attachBasketToHand(basket,cargo);
        target.classList.add("hand-contact");
        hand.dataset.phase="grip";
        await sleep(70);
      }else{
        caption.textContent="Pouring basket "+(factor-index)+" of "+factor+".";
        caption.hidden=false;
        await sleep(120);
      }
      stage.dataset.phase="pouring";
      await pourGroup({basket,source,resizeFloor,timing,reduced,sleep});
      if(index===0){
        const result=applyAtContact();
        if(result&&typeof result.then==="function")await result;
        applied=true;
      }
      if(!reduced){
        basket.classList.remove("basket-grabbed");
        hand.classList.remove("reaching");
        hand.classList.add("lifting");
        hand.dataset.phase="lift";
        await sleep(75);
        basket.style.setProperty("--basket-throw-x",
          (side==="left"?-1:1)*Math.round(scene.clientWidth*.29+70)+"px");
        basket.style.setProperty("--basket-throw-ms",timing.throwMs+"ms");
        basket.dataset.state="thrown";
        hand.classList.add("basket-throwing");
        hand.dataset.phase="release";
        await sleep(timing.throwMs);
      }else basket.remove();
      resetHand(hand,cargo,target,caption);
      await sleep(timing.betweenMs);
    }
  }finally{
    resetHand(hand,cargo,target,caption);
  }
  if(!applied)throw new Error("Multiplication stopped before its final basket was poured");
}
