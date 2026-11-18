/**
 * World 1 is a curriculum of representations, not just increasing equations.
 * The existing twenty puzzle IDs and math stay in WORLD1_LEVELS untouched.
 *
 * PR21 activates Stage 3 on Stage 2 mastery (or teacher access).
 * The separate Equation Workshop (PR22) remains unavailable.
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
    description:"Make a move in one room, watch the scale tip, then restore the balance with a matching move in the other. Sixteen puzzles across four chapters.",
    method:"manual",count:INDEPENDENT_LEVELS.length,available:true,unlockAfter:"guided",
    icon:"↔",status:"playable"
  }),
  Object.freeze({
    id:"notebook",number:3,title:"Algebra Apprentice",
    tagline:"Write the maths before the sprites move.",
    description:"Solve twelve equations using the notebook. Your working will be replayed as physical sprite movements afterwards.",
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
  if (stage.id==="guided") return true;
  if (teacher) return true;
  if (stage.id==="independent") return stage1Completed;
  return stage2Completed;
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
