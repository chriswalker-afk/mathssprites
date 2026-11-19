/**
 * PR22 Equation Workshop: turn a user-written World 1 linear equation into
 * two REAL chambers. No eval, no string-to-code conversion, no campaign writes.
 *
 * The parser is shared with Algebra Apprentice: only nonnegative whole x and
 * weight terms. We additionally prove that the user's equation can be reduced
 * to one sprite using the actual physical game operations.
 */
import {parseNotebookEquation} from "./notebook-engine.mjs";
import {
  initialState,isSolved,perform,equation,room,validInitialLevel
} from "./engine.mjs";
import {WORLD1_OPERATIONS} from "./worlds.mjs";

export const WORKSHOP_EXAMPLES=Object.freeze([
  "x + 3 = 8",
  "3x + 5 = 20",
  "2x + 3 = x + 7",
  "19 = 2x + 9",
  "3x + 6 = 18"
]);

function fail(code,message){
  return {ok:false,code,message};
}

function applyAction(state,action){
  const move=perform(state,action,"auto");
  return move.ok?move.state:null;
}

/**
 * Solve by removing common sprite/weight counts, then sharing whole groups.
 * This is a REPRESENTABILITY PROOF only; it is never supplied to the player
 * or used to force a particular route during free play.
 */
export function proveWorkshopRoute(level){
  if(!validInitialLevel(level))return null;
  let state=initialState(level);
  if(isSolved(state))return [];
  const actions=[];
  for(const kind of ["posX","posOne"]){
    while(Math.min(state.left[kind],state.right[kind])>0){
      const count=Math.min(12,state.left[kind],state.right[kind]);
      const action={op:"remove",kind,count};
      const next=applyAction(state,action);
      if(!next)return null;
      actions.push(action);
      state=next;
    }
  }
  // The remaining x difference must factor into 2, 3 and/or 5.
  let coefficient=Math.abs(state.left.posX-state.right.posX);
  if(coefficient===0)return null;
  for(const factor of [5,3,2]){
    while(coefficient%factor===0){
      const action={op:"divide",factor};
      const next=applyAction(state,action);
      if(!next)return null;
      actions.push(action);
      state=next;
      coefficient/=factor;
    }
  }
  if(coefficient!==1||!isSolved(state))return null;
  return actions;
}

/** Return either a safe, playable level or a specific student-facing reason. */
export function createWorkshopEquation(input){
  const parsed=parseNotebookEquation(input);
  if(!parsed.ok)return fail(parsed.code,parsed.message);
  const left=parsed.left,right=parsed.right;
  const difference=left.x-right.x;
  const constantDifference=right.constant-left.constant;

  if(difference===0){
    return constantDifference===0
      ? fail("infinitely-many","Both sides have the same amount of x and the same weight difference. There is no single mystery value to discover.")
      : fail("no-solution","Both sides contain the same number of sprites but incompatible weights. The scale cannot balance for any x.");
  }
  const value=constantDifference/difference;
  if(!Number.isFinite(value))return fail("invalid-solution","This equation has no usable whole-number solution.");
  if(value<0)return fail("negative-solution","This equation needs a negative sprite value. Negative numbers belong to a later world.");
  if(value===0)return fail("zero-solution","This equation gives x = 0. The first workshop works with positive whole-number sprite values.");
  if(!Number.isInteger(value))return fail("fraction-solution","The mystery sprite would need a fractional value. Fractions belong to a later world.");
  if(value>48)return fail("solution-overflow","The solved room would need more than 48 weights. Try a smaller whole-number solution.");

  const level={
    id:"workshop-custom",title:"Your own balance · "+equation({
      left:room({posX:left.x,posOne:left.constant}),
      right:room({posX:right.x,posOne:right.constant})
    }),
    chapter:"FREE PLAY · EQUATION WORKSHOP",
    prompt:"Your equation has become two rooms. Use the hand to isolate one dark sprite. Your actual moves will appear in the algebra comic.",
    left:{posX:left.x,posOne:left.constant},
    right:{posX:right.x,posOne:right.constant},
    solution:value,quantityMode:"positive",lockPositive:true,
    allowedOperations:WORLD1_OPERATIONS,startingOperation:"remove",
    startingKind:"posOne",startingAmount:1,startingFactor:2,
    suggested:"Look for matching weights or sprites in BOTH rooms. Remove equal amounts, then divide into complete groups to isolate one sprite."
  };
  if(!validInitialLevel(level))return fail("invalid-scene","Those objects cannot start in a valid whole-number balance.");
  if(isSolved(initialState(level)))
    return fail("already-solved","That equation already leaves one sprite facing its weights. Add a balancing challenge before generating the scene.");
  const route=proveWorkshopRoute(level);
  if(!route)
    return fail("unrepresentable","This equation has a whole-number answer, but the current hand cannot reach it using groups of two to five and complete objects. Try a different sprite coefficient.");
  // Never return the route or numerical answer as UI hints. The route proof
  // remains callable only by mathematical tests and other developer tooling.
  return {ok:true,level,normalizedEquation:equation({left:room(level.left),right:room(level.right)})};
}
