/**
 * World 1 is a curriculum of representations, not just increasing equations.
 * The existing twenty puzzle IDs and math stay in WORLD1_LEVELS untouched.
 *
 * PR18 only activates Stage 1. Stage 2 (PR19), Stage 3 (PR20-21), and the
 * custom Equation Workshop (PR22) are deliberately unavailable, including
 * under Teacher access. Do not mistake a card for implemented content.
 */
import { WORLD1_LEVELS } from "./worlds.mjs";

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
    description:"Make a move on one side, observe the balance, then make the matching move on the other. Sixteen new puzzles arrive next.",
    method:"manual",count:16,available:false,unlockAfter:"guided",
    icon:"↔",status:"planned"
  }),
  Object.freeze({
    id:"notebook",number:3,title:"Algebra Apprentice",
    tagline:"Write the maths before the sprites move.",
    description:"Solve twelve equations using the notebook. Your working will be replayed as physical sprite movements afterwards.",
    method:"notebook",count:12,available:false,unlockAfter:"independent",
    icon:"✎",status:"planned"
  })
]);
export const EQUATION_WORKSHOP = Object.freeze({
  id:"equation-workshop",title:"Equation Workshop",
  tagline:"Bring your own balance",
  description:"Enter a positive whole-number equation, turn it into sprites, and choose how to solve it.",
  available:false,status:"planned",icon:"✦"
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
export function stageOneComplete(completed=[]) {
  const allowed=new Set(WORLD1_LEVELS.map(slot=>slot.number));
  return allowed.size === WORLD1_LEVELS.length &&
    [...allowed].every(number=>completed.includes(number));
}
