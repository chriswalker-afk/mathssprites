/** Custom whole-object Square Laboratory challenges. A deliberately
 * small grammar, bounded search and actual-engine witness. Neither the
 * computed route nor the weight is returned as a hint or displayed.
 */
import {initialState,validInitialLevel,isSolved,perform,equation,room} from "./engine.mjs";
import {SQUARE_KINDS,SQUARE_OPERATIONS,SQUARE_CAPACITY,squareBuildTarget,uniqueNonnegativeSquareSolution} from "./square-rules.mjs";
import {shortestSquareRoute} from "./square-route-search.mjs";
import {NOTEBOOK_MAX_STEPS} from "./notebook-engine.mjs";
export const SQUARE_WORKSHOP_EXAMPLES=Object.freeze([
  "x² = 25","x² + 4x = 21","x² + 6x + 4 = 20","2x² + 5x + 1 = x² + x + 22"
]);
export const SQUARE_BUILD_EXAMPLES=Object.freeze([
  "x = 4","x + 1 = 4","2x + 1 = 5","x + 2 = 2x"
]);
export const SQUARE_WORKSHOP_ROUTE_BUDGET=50000;
const fail=(code,message)=>({ok:false,code,message});
const syntax="Use nonnegative whole terms such as x², 2x, 3 and +. Write x² or x^2 for square sprites.";
export function parseSquareWorkshopSide(input){
  if(typeof input!=="string"||!input.trim())return fail("syntax",syntax);
  if(/[-−–—]/.test(input))return fail("negative","Negative objects are not available in the Square Laboratory. Put positive terms on either side.");
  if(/\d\s+\d/.test(input))return fail("syntax",syntax);
  const result={posX2:0,posX:0,posOne:0};
  for(const part of input.split("+")){
    const text=part.replace(/\s+/g,"").toLowerCase();
    const term=/^(?:(0|[1-9]\d{0,2})?(x)(²|\^2)?|(0|[1-9]\d{0,2}))$/.exec(text);
    if(!term)return fail("syntax",syntax);
    const kind=term[2]?(term[3]?"posX2":"posX"):"posOne";
    const amount=Number(term[2]?(term[1]??1):term[4]);
    result[kind]+=amount;
    if(SQUARE_KINDS.reduce((n,k)=>n+result[k],0)>SQUARE_CAPACITY)
      return fail("capacity","A chamber can hold at most 48 whole objects.");
  }
  return {ok:true,room:result};
}
export function parseSquareWorkshopEquation(input){
  if(typeof input!=="string"||input.length>80)return fail("length","Keep your equation within 80 characters.");
  const sides=input.split("=");
  if(sides.length!==2)return fail("equation","Write exactly one equals sign.");
  const left=parseSquareWorkshopSide(sides[0]);if(!left.ok)return left;
  const right=parseSquareWorkshopSide(sides[1]);if(!right.ok)return right;
  return {ok:true,left:left.room,right:right.room};
}
export function proveSquareWorkshopRoute(level,{maxVisited=SQUARE_WORKSHOP_ROUTE_BUDGET}={}){
  if(!validInitialLevel(level))return null;
  const start=initialState(level);
  if(isSolved(start))return [];
  // Area construction has a direct one-operation witness.
  const candidate=level.goal==="area"?[{op:"square"}]:
    shortestSquareRoute(level,NOTEBOOK_MAX_STEPS,{maxVisited})?.route;
  if(!candidate?.length||candidate.length>NOTEBOOK_MAX_STEPS)return null;
  let state=start;
  for(const action of candidate){
    const next=perform(state,action,"auto");
    if(!next.ok||!next.committed)return null;
    state=next.state;
  }
  return isSolved(state)?candidate:null;
}
export function createSquareWorkshopEquation(input,{goal="isolate"}={}){
  if(!["isolate","area"].includes(goal))return fail("goal","Choose Solve the equation or Build both square areas.");
  const parsed=parseSquareWorkshopEquation(input);
  if(!parsed.ok)return parsed;
  const {left,right}=parsed;
  const [A,B,C]=SQUARE_KINDS.map(k=>left[k]-right[k]);
  if(!A&&!B)return C?fail("no-solution","These expressions never balance."):
    fail("infinitely-many","Both expressions are the same; there is no unique mystery weight.");
  if(goal==="area"&&(left.posX2||right.posX2))
    return fail("build-linear","Build-square challenges begin with round sprites and weights, not existing square sprites.");
  if(goal==="isolate"&&!A)
    return fail("linear","Choose a genuine quadratic balance with different x² counts, or use Whole numbers or the square-building goal for a linear equation.");
  if(A&&B*B-4*A*C<0)return fail("no-solution","This equation has no real sprite weight.");
  // Search only the exact bounded positive integer domain. Vieta checks
  // the other root without floating-point approximation, including zero
  // or a second positive noninteger root. A repeated root is one value.
  const solutions=Array.from({length:SQUARE_CAPACITY},(_,i)=>i+1).filter(x=>A*x*x+B*x+C===0);
  if(!solutions.length)
    return fail("solution","Choose an equation with a positive whole-number sprite weight from 1 to 48.");
  const solution=solutions[0];
  if(solutions.length!==1||!uniqueNonnegativeSquareSolution(left,right,solution))
    return fail("multiple-solutions","There must be just one possible weight on the nonnegative sprite domain, including zero.");
  let target;
  if(goal==="area"){
    const L=squareBuildTarget(left),R=squareBuildTarget(right);
    if(!L||!R)return fail("area-capacity","Squaring those side lengths would need more than 48 objects in a chamber. Use at most six whole side markers per room.");
    target={left:L,right:R};
  }
  const normalizedEquation=equation({left:room(left),right:room(right)});
  const level={
    id:"workshop-custom",title:"Your own square balance",
    chapter:"FREE PLAY · EQUATION WORKSHOP",
    squareLaboratory:true,quantityMode:"positive",lockPositive:true,
    allowedKinds:SQUARE_KINDS,allowedOperations:SQUARE_OPERATIONS,
    goal,solution,left,right,
    ...(goal==="area"?{target}:{squareInspection:"free"}),
    prompt:goal==="area"?"Build a complete square from each chamber.":"Leave one round sprite facing only weights."
  };
  if(!validInitialLevel(level))return fail("invalid-scene","Those terms do not make a valid Square Laboratory challenge.");
  if(isSolved(initialState(level)))return fail("already-solved","That goal is already complete. Try a different balance.");
  if(!proveSquareWorkshopRoute(level))
    return fail("unverified-route","The workshop could not verify a legal whole-object route within 16 moves and its search limit. Try a smaller or simpler balance.");
  return {ok:true,level,normalizedEquation};
}
