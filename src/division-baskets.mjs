/** PR25: physical division baskets. Presentation only: the engine owns all maths. */
const TOKEN_KIND_CLASSES = Object.freeze([
  ["sprite-black", "posX"], ["sprite-white", "negX"],
  ["sprite-square", "posX2"], ["weight", "posOne"], ["balloon", "negOne"],
  ["sealed-crate","crate"]
]);
const NAMES = Object.freeze({
  posX:"dark sprites", negX:"pale sprites",posX2:"square sprites",
  posOne:"weights",negOne:"balloons",crate:"sealed crates"
});
export function divisionBasketTiming(factor, reduced=false) {
  if (!Number.isInteger(factor) || factor < 2 || factor > 32)
    throw new RangeError("A division requires 2–32 equal baskets");
  const dropGap = factor <= 3 ? 175 : factor <= 5 ? 125 : factor <= 8 ? 90 : 65;
  const throwMs = factor <= 3 ? 370 : factor <= 5 ? 260 : factor <= 8 ? 190 : 125;
  return Object.freeze({
    factor,
    dropGap: reduced ? 0 : dropGap,
    dropMs: reduced ? 0 : 530,
    shareMs: reduced ? 0 : 470,
    shareGap: reduced ? 0 : factor <= 5 ? 23 : 12,
    sharePause: reduced ? 500 : 850,
    reachMs: reduced ? 0 : factor <= 3 ? 240 : 170,
    gripMs: reduced ? 0 : 110,
    liftMs: reduced ? 0 : factor <= 3 ? 210 : 135,
    throwMs: reduced ? 0 : throwMs,
    betweenMs: reduced ? 65 : factor <= 3 ? 120 : 65,
    keepMs: reduced ? 360 : 560,
    finishMs: reduced ? 140 : 230
  });
}
/** Every kind is distributed round-robin independently; no invented tokens. */
export function divisionBasketSlots(kinds, factor) {
  if (!Number.isInteger(factor) || factor < 2) throw new RangeError("Invalid grouping factor");
  const byKind = new Map();
  return kinds.map(kind => {
    const used = byKind.get(kind) || 0;
    byKind.set(kind, used + 1);
    return used % factor;
  });
}
export function divisionBasketMarkup(factor) {
  if (!Number.isInteger(factor) || factor < 2 || factor > 32)
    throw new RangeError("Invalid basket count");
  return Array.from({length:factor},(_,i) =>
    '<div class="group-basket" data-basket-index="'+i+'" data-state="waiting" role="group" '+
      'aria-label="Basket '+(i+1)+' of '+factor+'">'+
      '<div class="basket-contents"></div><span class="basket-lip" aria-hidden="true"></span>'+
    '</div>').join("");
}
function kindOf(token) {
  return TOKEN_KIND_CLASSES.find(([css])=>token.classList.contains(css))?.[1] || "unknown";
}
export function announceBasketContents(baskets, factor) {
  baskets.forEach((basket,i)=>{
    const contents=[...basket.querySelectorAll(".basket-contents > .token")];
    const counts=new Map();
    contents.forEach(token=>{
      const kind=kindOf(token);
      counts.set(kind,(counts.get(kind)||0)+1);
    });
    const description=[...counts].map(([kind,count])=>count+" "+(NAMES[kind]||"objects")).join(", ");
    basket.setAttribute("aria-label","Basket "+(i+1)+" of "+factor+": "+(description||"empty"));
  });
}
async function aFrame() {
  await new Promise(resolve=>requestAnimationFrame(()=>resolve()));
}
export function resetHand(hand, cargo, target, caption) {
  hand.classList.remove("approaching","reaching","grasping","lifting","acting","basket-throwing");
  hand.dataset.phase="rest";
  target.classList.remove("hand-target","hand-contact");
  cargo.replaceChildren();
  cargo.hidden=true;
  caption.hidden=true;
}
export async function aimHandAtBasket({hand,scene,target,basket,cargo,caption,sleep,ms,final=false}) {
  const sceneRect=scene.getBoundingClientRect();
  const rect=basket.getBoundingClientRect();
  const fingertipOffset=hand.offsetWidth*.10;
  hand.style.left=(rect.left+rect.width/2-sceneRect.left+fingertipOffset)+"px";
  const restingTip=hand.offsetTop+hand.offsetHeight*.90;
  const targetTip=rect.top-sceneRect.top+Math.min(25,rect.height*.2);
  hand.style.setProperty("--hand-reach",Math.max(85,targetTip-restingTip)+"px");
  hand.classList.remove("lifting","reaching","grasping","basket-throwing");
  cargo.replaceChildren();
  cargo.hidden=true;
  hand.dataset.phase="aim";
  hand.classList.add("acting","approaching");
  target.classList.add("hand-target");
  caption.textContent=final?"One equal basket remains. Keep this group!":"The hand picks up a complete unwanted basket.";
  caption.hidden=false;
  await aFrame();
  await sleep(Math.round(ms*.48));
  hand.classList.remove("approaching");
  hand.classList.add("reaching");
  hand.dataset.phase="reach";
  await sleep(Math.round(ms*.52));
  hand.classList.add("grasping");
  hand.dataset.phase="grip";
}
export function attachBasketToHand(basket,cargo) {
  const from=basket.getBoundingClientRect();
  basket.classList.add("basket-in-hand");
  cargo.hidden=false;
  cargo.appendChild(basket);
  const to=basket.getBoundingClientRect();
  basket.style.setProperty("--basket-grab-x",Math.round(from.left-to.left)+"px");
  basket.style.setProperty("--basket-grab-y",Math.round(from.top-to.top)+"px");
  basket.style.setProperty("--basket-grab-scale",String(Math.max(.5,Math.min(1.8,from.width/Math.max(1,to.width)))));
  basket.classList.add("basket-grabbed");
}
/**
 * Run one room's visual partition. applyAtContact() is called ONCE, after the
 * last basket is retained and while the hand touches it; other grabs have no
 * algebraic side effects. A caller's final render replaces the temporary stage.
 */
export async function playDivisionBaskets({
  side,factor,reduced=false,applyAtContact,sleep
}) {
  const root=document.getElementById(side+"-items");
  const stage=root?.querySelector(".division-stage");
  const row=stage?.querySelector(".basket-row");
  if(!stage||!row) throw new Error("Physical basket stage is missing");
  const baskets=[...row.querySelectorAll(":scope > .group-basket")];
  if(baskets.length!==factor)throw new Error("Basket count disagrees with division factor");
  const timing=divisionBasketTiming(factor,reduced);
  const hand=document.getElementById("hand");
  const cargo=document.getElementById("hand-cargo");
  const scene=document.getElementById("scene");
  const target=document.getElementById(side+"-chamber");
  const caption=document.getElementById("action-caption");
  if(!hand||!cargo||!scene||!target||!caption)
    throw new Error("The articulated hand is missing");
  let applied=false;
  try {
    stage.dataset.phase="dropping";
    baskets.forEach((basket,i)=>{
      basket.dataset.state=reduced?"landed":"dropping";
      if(!reduced)basket.style.animationDelay=(i*timing.dropGap)+"ms";
    });
    await sleep(reduced?180:timing.dropMs+(factor-1)*timing.dropGap+80);
    baskets.forEach(basket=>{
      basket.dataset.state="landed";
      basket.style.removeProperty("animation-delay");
    });
    stage.dataset.phase="sharing";
    const source=stage.querySelector(".division-source .floor-track");
    const tokens=[...source.children].filter(token=>token.classList.contains("token"));
    const slots=divisionBasketSlots(tokens.map(kindOf),factor);
    const start=tokens.map(token=>token.getBoundingClientRect());
    tokens.forEach((token,i)=>baskets[slots[i]].querySelector(".basket-contents").appendChild(token));
    if(!reduced){
      const delay=Math.min(timing.shareGap,Math.floor(850/Math.max(1,tokens.length)));
      tokens.forEach((token,i)=>{
        const end=token.getBoundingClientRect();
        token.style.setProperty("--basket-share-x",Math.round(start[i].left-end.left)+"px");
        token.style.setProperty("--basket-share-y",Math.round(start[i].top-end.top)+"px");
        token.style.setProperty("--basket-share-delay",(i*delay)+"ms");
        token.classList.add("basket-sharing-token");
      });
      await sleep(timing.shareMs+Math.max(0,tokens.length-1)*delay+30);
      tokens.forEach(token=>{
        token.classList.remove("basket-sharing-token");
        token.style.removeProperty("--basket-share-delay");
        token.style.removeProperty("--basket-share-x");
        token.style.removeProperty("--basket-share-y");
      });
    }
    announceBasketContents(baskets,factor);
    stage.dataset.phase="ready";
    await sleep(timing.sharePause);
    stage.dataset.phase="discarding";
    for(let index=factor-1;index>=1;index--){
      const basket=baskets[index];
      if(reduced){
        basket.remove();
        await sleep(timing.betweenMs);
        continue;
      }
      await aimHandAtBasket({hand,scene,target,basket,cargo,caption,sleep,ms:timing.reachMs});
      await sleep(timing.gripMs);
      attachBasketToHand(basket,cargo);
      target.classList.add("hand-contact");
      await sleep(140);
      basket.classList.remove("basket-grabbed");
      hand.classList.remove("reaching");
      hand.classList.add("lifting");
      hand.dataset.phase="lift";
      await sleep(timing.liftMs);
      basket.style.setProperty("--basket-throw-x",(side==="left"?-1:1)*Math.round(scene.clientWidth*.29+70)+"px");
      basket.style.setProperty("--basket-throw-ms",timing.throwMs+"ms");
      basket.dataset.state="thrown";
      hand.dataset.phase="release";
      hand.classList.add("basket-throwing");
      await sleep(timing.throwMs);
      resetHand(hand,cargo,target,caption);
      await sleep(timing.betweenMs);
    }
    stage.dataset.phase="remaining";
    caption.textContent="One complete equal group remains.";
    caption.hidden=false;
    await sleep(timing.keepMs);
    if(!reduced) {
      await aimHandAtBasket({hand,scene,target,basket:baskets[0],cargo,caption,sleep,
        ms:timing.reachMs,final:true});
      await sleep(timing.gripMs);
      // Empty the retained basket as its contents return to the main floor.
      baskets[0].querySelector(".basket-contents").replaceChildren();
      attachBasketToHand(baskets[0],cargo);
      target.classList.add("hand-contact");
    }
    await applyAtContact();
    applied=true;
    if(!reduced){
      await sleep(timing.finishMs);
      hand.classList.remove("reaching");
      hand.classList.add("lifting");
      hand.dataset.phase="lift";
      await sleep(timing.finishMs);
    } else {
      await sleep(timing.finishMs);
    }
  } finally {
    resetHand(hand,cargo,target,caption);
  }
  if(!applied)throw new Error("Division was interrupted before the final hand contact");
}
