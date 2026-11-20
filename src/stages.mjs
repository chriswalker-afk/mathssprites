/**
 * World 1 is a curriculum of representations, not just increasing equations.
 * The existing twenty puzzle IDs and math stay in WORLD1_LEVELS untouched.
 *
 * PR21 activates Stage 3 on Stage 2 mastery (or teacher access).
 * PR22 makes the separate Equation Workshop available as non-campaign free play.
 */
import { WORLD1_LEVELS } from "./worlds.mjs";
import { INDEPENDENT_LEVELS } from "./independent-levels.mjs";
import { APPRENTICE_LEVELS } from "./apprentice-levels.mjs";

export const WORLD1_STAGES = Object.freeze([
  Object.freeze({
    id:"guided",number:1,title:"Guided Balance",
    tagline:"Choose the move. The hand mirrors it.",
    description:"Learn why the rooms must stay balanced. Choose what happens; the hand makes the same change in both rooms.",
    method:"auto",count:WORLD1_LEVELS.length,available:true,unlockAfter:null,
    icon:"⚖",status:"playable"
  }),
  Object.freeze({
    id:"independent",number:2,title:"Independent Balance",
    tagline:"You control each room.",
    description:"Make a move in one room, watch the scale tip, then restore the balance with a matching move in the other. Twenty puzzles across five chapters.",
    method:"manual",count:INDEPENDENT_LEVELS.length,available:true,unlockAfter:"guided",
    icon:"↔",status:"playable"
  }),
  Object.freeze({
    id:"notebook",number:3,title:"Algebra Apprentice",
    tagline:"Choose the maths before the sprites move.",
    description:"Use the maths editor to choose each operation. The next equation is calculated, and your steps replay as sprite movements.",
    method:"notebook",count:APPRENTICE_LEVELS.length,available:true,unlockAfter:"independent",
    icon:"✎",status:"playable"
  })
]);
export const EQUATION_WORKSHOP = Object.freeze({
  id:"equation-workshop",title:"Equation Workshop",
  tagline:"Bring your own balance",
  description:"Enter a positive whole-number equation, generate real sprite-and-weight chambers, and solve using either hand mode. Free play: no campaign progress.",
  available:true,status:"playable",icon:"✦"
});
export function findWorld1Stage(id) {
  return WORLD1_STAGES.find(stage=>stage.id===id) || null;
}
export function canOpenWorld1Stage(id,{teacher=false,stage1Completed=false,stage2Completed=false}={}) {
  const stage=findWorld1Stage(id);
  if (!stage?.available) return false;
  // No completion-based gates among the three fully implemented stages.
  return true;
}
export function stageThreeComplete(completed=[]) {
  return APPRENTICE_LEVELS.every(slot=>completed.includes(slot.number));
}
export function stageTwoComplete(completed=[]) {
  return INDEPENDENT_LEVELS.every(slot=>completed.includes(slot.number));
}
export function stageOneComplete(completed=[]) {
  const allowed=new Set(WORLD1_LEVELS.map(slot=>slot.number));
  return allowed.size === WORLD1_LEVELS.length &&
    [...allowed].every(number=>completed.includes(number));
}
