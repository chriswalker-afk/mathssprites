/** Public release adapter. The 60 immutable author fixtures retain
 * their IDs and reference routes; all three stage projections are public.
 */
import {SQUARE_CAMPAIGN_STAGES as PLAN} from "./square-level-plan.mjs";
import {SQUARE_OPTIMAL_MOVES} from "./square-star-benchmarks.mjs";
const copy={
  guided:{tagline:"Build, open and complete squares.",
    menuIntro:"Build squares, recover one side, then complete missing corners.",
    finale:"You have mastered the Guided Square Laboratory. Try matching each move yourself in Independent Squares."},
  independent:{tagline:"Match each square transformation yourself.",
    menuIntro:"Choose and match each operation yourself in both chambers.",
    finale:"You have mastered Independent Squares. Try writing your own checked algebra in Square Algebra Apprentice."},
  notebook:{tagline:"Write the algebra, then watch the squares.",
    menuIntro:"Record each operation on both sides before the sprites replay it.",
    finale:"Your Square Laboratory algebra came to life. Review your stars on the experiment board."}
};
export const SQUARE_CAMPAIGN_STAGES=Object.freeze(PLAN.map(stage=>{
  const available=Object.hasOwn(SQUARE_OPTIMAL_MOVES,stage.id);
  return Object.freeze({...stage,...copy[stage.id],available,
    levels:Object.freeze(stage.levels.map(slot=>Object.freeze({...slot,available}))),
    optimalMoves:Object.freeze(available?Object.fromEntries(stage.levels.map(slot=>
      [slot.id,SQUARE_OPTIMAL_MOVES[stage.id][slot.number-1]])):{})});
}));
