/** Shared creature markup for floor, baskets and the standalone art study.
 * Animation and silhouette are presentation only: the engine owns every
 * object count. Keep the round and pale sprite structure unchanged.
 */
import {spriteMotionProfile,spriteMotionStyle} from "./sprite-motion.mjs";
export const SPRITE_APPEARANCE=Object.freeze({posX:"sprite-black",negX:"sprite-white",posX2:"sprite-square"});
const titles=Object.freeze({posX:"A little dark sprite",negX:"A little pale sprite",posX2:"A square x² sprite"});
export function spriteCreatureMarkup(levelId,side,kind,index){
  const profile=spriteMotionProfile(levelId,side,kind,index);
  return '<span class="token sprite '+SPRITE_APPEARANCE[kind]+
    '" style="'+spriteMotionStyle(profile)+'" title="'+titles[kind]+'">'+
    '<span class="sprite-ground-shadow"></span>'+
    '<span class="sprite-reaction-shell"><span class="sprite-motion">'+
    '<span class="sprite-feet"></span><span class="sprite-body">'+
    '<span class="sprite-eyes"><i></i><i></i></span><span class="sprite-wear sprite-wear-headwear" aria-hidden="true"></span><span class="sprite-wear sprite-wear-eyewear" aria-hidden="true"></span><span class="sprite-wear sprite-wear-neckwear" aria-hidden="true"></span><span class="sprite-cosmetic-effect" aria-hidden="true"></span></span>'+
    '</span></span></span>';
}
/** The isolated art preview can morph a single actor in place. This does
 * NOT model x -> x² as a balance operation, spawn tokens or award credit.
 * Production square/root animations are triggered by committed engine
 * area transformations, not this preview helper.
 */
export function setSquarePreviewShape(actor,kind,{animate=true}={}){
  if(!actor?.classList||!["posX","posX2"].includes(kind)||
    !actor.classList.contains("sprite")||actor.classList.contains("sprite-white"))
    throw new TypeError("Choose a round or square dark sprite actor");
  const square=kind==="posX2",already=actor.classList.contains("sprite-square")===square;
  actor.removeAttribute("data-square-morph");
  if(already)return false;
  actor.classList.toggle("sprite-black",!square);
  actor.classList.toggle("sprite-square",square);
  actor.setAttribute("title",titles[kind]);
  if(animate){
    // Restart the morph even after a rapid reversal. The actor's stable
    // slot, eyes, and shadow are retained; idle animations resume on finish.
    actor.querySelector(".sprite-body")?.getBoundingClientRect();
    actor.setAttribute("data-square-morph",square?"square":"round");
  }
  return true;
}
export function heldSpriteMarkup(kind){
  if(!Object.hasOwn(SPRITE_APPEARANCE,kind))throw new TypeError("Unknown held sprite");
  const variant=kind==="negX"?" held-sprite-pale":kind==="posX2"?" held-sprite-square":"";
  return '<span class="held-sprite'+variant+'"><i></i><i></i></span>';
}
export function miniSpriteMarkup(kind){
  if(!Object.hasOwn(SPRITE_APPEARANCE,kind))throw new TypeError("Unknown mini sprite");
  return '<span class="mini-token '+kind+'" aria-hidden="true"></span>';
}
export function areaSpriteMarkup(kind){
  if(!["posX","posX2"].includes(kind))throw new TypeError("Unknown area sprite");
  return '<span class="box-actor '+(kind==="posX2"?"box-actor-x2":"box-actor-x")+'"></span>';
}
