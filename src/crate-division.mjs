/**
 * PR43: remove unnecessary whole crates directly, without teaching crates as
 * loose objects that have to be redistributed into baskets.
 *
 * This is strictly PRESENTATION: the existing engine still proves that each
 * chamber divides exactly by the same factor and commits one operation.
 */
const LOOSE_KINDS=Object.freeze(["posX","negX","posX2","posOne","negOne"]);

export function isCrateOnlyDivisionRoom(room){
  if(!room || !Number.isInteger(room.crates?.count) || room.crates.count<1)
    return false;
  return LOOSE_KINDS.every(kind=>!room[kind]);
}

/** Keep a contiguous section of the original stack including the ONE crate
 * displaying the contents sign. Discard the others without duplicating its
 * contents or stripping the pictogram from the surviving crate. */
export function crateDiscardPlan(count,factor){
  if(!Number.isInteger(count)||count<2||count>12||
     !Number.isInteger(factor)||factor<2||factor>32||count%factor!==0)
    throw new RangeError("A stack can only be divided into whole, identical crates");
  const retained=count/factor;
  const pictureIndex=Math.floor(count/2);
  const first=Math.max(0,Math.min(count-retained,
    pictureIndex-Math.floor(retained/2)));
  const keep=Array.from({length:retained},(_,i)=>first+i);
  const keepSet=new Set(keep);
  const discard=Array.from({length:count},(_,i)=>i).filter(i=>!keepSet.has(i));
  return Object.freeze({
    count,factor,retained,pictureIndex,
    keep:Object.freeze(keep),discard:Object.freeze(discard)
  });
}

function frame(){
  return new Promise(resolve=>requestAnimationFrame(()=>resolve()));
}

/**
 * Visually lift and THROW the unwanted crates from the original stack.
 * No new basket, crate copy, mathematical object, or explanatory subtitle.
 * The caller calls applyAtContact once, after the last discard, keeping the
 * engine transaction/Undo/stars exactly as they were.
 */
export async function playCrateDivision({
  side,factor,reduced=false,applyAtContact,sleep,resetHand
}){
  const root=document.getElementById(side+"-items");
  const stage=root?.querySelector(".crate-division-stage");
  const track=stage?.querySelector(".floor-track");
  const hand=document.getElementById("hand");
  const cargo=document.getElementById("hand-cargo");
  const scene=document.getElementById("scene");
  const chamber=document.getElementById(side+"-chamber");
  const caption=document.getElementById("action-caption");
  if(!stage||!track||!hand||!cargo||!scene||!chamber||!caption)
    throw new Error("Crate-only division needs the original room and articulated hand");
  const crates=[...track.querySelectorAll(":scope > .sealed-crate")];
  const plan=crateDiscardPlan(crates.length,factor);
  if(crates.length!==plan.count||track.querySelectorAll(":scope > .token").length!==plan.count)
    throw new Error("Crate division must not swallow other loose objects");
  const badge=track.querySelector(":scope > .crate-stack-count");
  if(!badge||track.querySelectorAll(".crate-picture-sign").length!==1||
     !crates[plan.pictureIndex].querySelector(".crate-picture-sign"))
    throw new Error("The surviving stack must retain the original contents picture");
  const ms=(standard,quiet)=>reduced?quiet:standard;
  let applied=false;
  try{
    stage.dataset.phase="taking";
    caption.hidden=true;
    cargo.hidden=true;
    hand.classList.remove("approaching","reaching","grasping","lifting","basket-throwing");
    hand.classList.add("acting");
    hand.dataset.phase="rest";
    for(const index of plan.discard){
      const crate=crates[index];
      stage.dataset.crateIndex=String(index);
      const rect=crate.getBoundingClientRect();
      const sceneRect=scene.getBoundingClientRect();
      const reachTip=rect.top-sceneRect.top+Math.min(rect.height*.34,18);
      const restTip=hand.offsetTop+hand.offsetHeight*.9;
      hand.style.left=(rect.left+rect.width/2-sceneRect.left+hand.offsetWidth*.10)+"px";
      hand.style.setProperty("--hand-reach",Math.max(85,reachTip-restTip)+"px");
      hand.classList.remove("lifting","reaching","grasping","crate-throwing");
      hand.classList.add("approaching");
      hand.dataset.phase="aim";
      chamber.classList.add("hand-target");
      await frame();
      await sleep(ms(190,75));
      hand.classList.remove("approaching");
      hand.classList.add("reaching");
      hand.dataset.phase="reach";
      await sleep(ms(230,110));
      hand.classList.add("grasping");
      hand.dataset.phase="grip";
      chamber.classList.add("hand-contact");
      await sleep(ms(150,90));
      // Take the ORIGINAL crate token, never a recreated or miniature crate.
      // The sole labelled crate is among the retained tokens.
      const style=getComputedStyle(track);
      crate.style.setProperty("--crate-w",style.getPropertyValue("--crate-w"));
      crate.style.setProperty("--crate-h",style.getPropertyValue("--crate-h"));
      crate.classList.add("hand-held-crate");
      crate.dataset.crateState="carried";
      cargo.replaceChildren(crate);
      cargo.hidden=false;
      stage.dataset.phase="lifting";
      await frame();
      hand.classList.remove("reaching");
      hand.classList.add("lifting");
      hand.dataset.phase="lift";
      await sleep(ms(270,140));
      stage.dataset.phase="throwing";
      const width=scene.getBoundingClientRect().width;
      crate.style.setProperty("--crate-throw-x",
        (side==="left"?-1:1)*(Math.round(width*.28)+85)+"px");
      crate.style.setProperty("--crate-throw-ms",ms(720,50)+"ms");
      crate.dataset.crateState="thrown";
      hand.dataset.phase="release";
      hand.classList.add("crate-throwing");
      hand.classList.remove("grasping");
      await sleep(ms(750,150));
      crate.remove();
      cargo.hidden=true;
      hand.classList.remove("crate-throwing","lifting","acting");
      chamber.classList.remove("hand-contact","hand-target");
      hand.dataset.phase="rest";
      const count=track.querySelectorAll(":scope > .sealed-crate").length;
      track.dataset.crateCount=String(count);
      badge.firstChild.textContent=count+" "+(count===1?"crate":"crates");
      badge.setAttribute("aria-label",count+" sealed "+(count===1?"crate":"crates"));
      stage.dataset.remaining=String(count);
      await sleep(ms(180,100));
    }
    if(track.querySelectorAll(":scope > .sealed-crate").length!==plan.retained||
       track.querySelectorAll(".crate-picture-sign").length!==1)
      throw new Error("Crate discard did not preserve the intended sealed group");
    stage.dataset.phase="remaining";
    await sleep(ms(400,280)); // The one retained, labelled crate remains in view.
    await applyAtContact();
    applied=true;
  } finally {
    if(typeof resetHand==="function")resetHand(hand,cargo,chamber,caption);
    else {
      hand.classList.remove("approaching","reaching","grasping","lifting","acting","crate-throwing");
      chamber.classList.remove("hand-contact","hand-target");
      cargo.replaceChildren();cargo.hidden=true;caption.hidden=true;
    }
    // If an interruption happened before the single engine commit, the
    // caller's final room repaint will restore the original sealed stack.
    if(!applied)delete root.dataset.signature;
  }
  if(!applied)throw new Error("Crate division ended before engine contact");
}
