/** Public release adapter. The 60 immutable author fixtures retain
 * their IDs and reference routes; only the Guided projection is public.
 * Keep other stage metadata visible but locked until their own releases.
 */
import {SQUARE_CAMPAIGN_STAGES as PLAN} from "./square-level-plan.mjs";
import {SQUARE_GUIDED_OPTIMAL_MOVES} from "./square-star-benchmarks.mjs";
const copy={
  guided:{tagline:"Build, open and complete squares.",
    menuIntro:"Build squares, recover one side, then complete missing corners.",
    finale:"You have mastered the Guided Square Laboratory. Independent Squares is still in development."},
  independent:{tagline:"Match each square transformation yourself.",
    menuIntro:"Choose and match the same operation in both chambers."},
  notebook:{tagline:"Write the algebra, then watch the squares.",
    menuIntro:"Record the operation on both sides before the sprites replay it."}
};
export const SQUARE_CAMPAIGN_STAGES=Object.freeze(PLAN.map(stage=>{
  const available=stage.id==="guided";
  return Object.freeze({...stage,...copy[stage.id],available,
    levels:Object.freeze(stage.levels.map(slot=>Object.freeze({...slot,available}))),
    optimalMoves:Object.freeze(available?Object.fromEntries(stage.levels.map(slot=>
      [slot.id,SQUARE_GUIDED_OPTIMAL_MOVES[slot.number-1]])):{})});
}));
