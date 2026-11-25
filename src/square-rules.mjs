/** World 4 capability and level contract.
 * A square-laboratory room contains only nonnegative integer counts of
 * x² sprites, x sprites, and unit weights. World 4 is not a new numeric
 * type: it uses the whole-object engine with an explicitly scoped capability.
 * No signed objects, fractional pieces, crates, or higher powers.
 */
export const SQUARE_KINDS=Object.freeze(["posX2","posX","posOne"]);
export const SQUARE_OPERATIONS=Object.freeze(["add","remove","divide","multiply","square","sqrt"]);
export const SQUARE_CAPACITY=48;
export const SQUARE_FACTORS=Object.freeze([2,3,4,5]);
const permittedKeys=new Set([...SQUARE_KINDS,"negX","negOne"]);
const count=(r,k)=>r[k]??0;
const permittedList=(list,choices)=>Array.isArray(list)&&list.length>0&&new Set(list).size===list.length&&list.every(x=>choices.includes(x));
const fail=(code,reason)=>({ok:false,code,reason});
export function validSquareRoom(r){
  if(!r||typeof r!=="object"||Array.isArray(r))return false;
  if(Object.keys(r).some(k=>!permittedKeys.has(k)||!Number.isSafeInteger(r[k])||r[k]<0))return false;
  if(count(r,"negX")!==0||count(r,"negOne")!==0)return false;
  return SQUARE_KINDS.every(k=>Number.isSafeInteger(count(r,k))&&count(r,k)>=0)
    &&SQUARE_KINDS.reduce((sum,k)=>sum+count(r,k),0)<=SQUARE_CAPACITY;
}
/** Integer side length ax+b -> area a²x²+2abx+b².
 * This provides an independent authoring/target contract, not a second
 * gameplay transform. The engine's areaArrangement owns actual moves.
 */
export function squareBuildTarget(r){
  if(!validSquareRoom(r)||count(r,"posX2")!==0)return null;
  const a=count(r,"posX"),b=count(r,"posOne");
  if((a+b)**2>SQUARE_CAPACITY)return null;
  return {posX2:a*a,posX:2*a*b,posOne:b*b};
}
const equalRoom=(a,b)=>SQUARE_KINDS.every(k=>count(a,k)===count(b,k));
/** For a known exact integer root, check uniqueness on x >= 0 without
 * computing a floating-point discriminant. If quadratic, Vieta gives
 * the other root (-B-A*x)/A. A repeated root is not a distinct solution.
 */
export function uniqueNonnegativeSquareSolution(left,right,x){
  if(!validSquareRoom(left)||!validSquareRoom(right)||!Number.isSafeInteger(x)||x<1||x>SQUARE_CAPACITY)return false;
  const [A,B,C]=SQUARE_KINDS.map(k=>count(left,k)-count(right,k));
  if(A*x*x+B*x+C!==0)return false;
  if(A===0)return B!==0;
  const otherNumerator=-B-A*x;
  return otherNumerator===A*x||otherNumerator*A<0;
}
export function validSquareLaboratoryLevel(level){
  if(level?.squareLaboratory!==true||level.quantityMode!=="positive"||level.lockPositive!==true)return false;
  if(!permittedList(level.allowedKinds,SQUARE_KINDS)||!permittedList(level.allowedOperations,SQUARE_OPERATIONS))return false;
  if(!uniqueNonnegativeSquareSolution(level.left,level.right,level.solution))return false;
  const goal=level.goal??"isolate";
  if(goal==="area"){
    const left=squareBuildTarget(level.left),right=squareBuildTarget(level.right);
    return !!left&&!!right&&level.allowedOperations.includes("square")&&
      validSquareRoom(level.target?.left)&&validSquareRoom(level.target?.right)&&
      equalRoom(left,level.target.left)&&equalRoom(right,level.target.right)&&
      !(equalRoom(level.left,left)&&equalRoom(level.right,right));
  }
  if(goal!=="isolate"||level.target!==undefined)return false;
  // A solve level starts with a genuine quadratic term and an unresolved
  // balance. Linear build levels use the explicit area objective instead.
  return count(level.left,"posX2")!==count(level.right,"posX2")&&
    level.allowedOperations.includes("sqrt");
}
export function squareLaboratoryPermission(state,action){
  if(state.quantityMode!=="positive"||state.lockPositive!==true||
    !validSquareRoom(state.left)||!validSquareRoom(state.right))
    return fail("locked-world","The Square Laboratory uses whole positive objects only.");
  if(!SQUARE_OPERATIONS.includes(action?.op)||!state.allowedOperations?.includes(action.op))
    return fail("locked-operation","That tool is not available in the Square Laboratory.");
  if((action.op==="add"||action.op==="remove")&&
      (!SQUARE_KINDS.includes(action.kind)||!state.allowedKinds?.includes(action.kind)))
    return fail("locked-kind","Use round sprites, square sprites or whole weights in this laboratory.");
  return {ok:true};
}
