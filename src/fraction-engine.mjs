/** Pure World 3 transaction engine. The legacy whole-object renderer is not yet enabled for this mode. */
import {rational,radd,rsub,rmul,rdiv,rcompare,req,rtext} from "./rational.mjs";
export const FRACTION_MODE="fractions";
export const FRACTION_DENOMINATORS=Object.freeze([1,2,3,4,5,6,8,10,12]);
export const FRACTION_FACTORS=Object.freeze([2,3,4,5]);
export const FRACTION_KINDS=Object.freeze(["posX","posOne"]);
export const FRACTION_OPERATIONS=Object.freeze(["add","remove","multiply","divide"]);
export const FRACTION_CAPACITY=48;
const ZERO=rational(0);
function failure(code,reason,details={}){return {ok:false,code,reason,...details};}
function supported(value){return FRACTION_DENOMINATORS.includes(rational(value).d);}
function lcm(a,b){let x=a,y=b;while(y){[x,y]=[y,x%y];}return a/x*b;}
function sameFractionAction(a,b){
  return a.op===b.op&&(a.kind?b.kind===a.kind&&req(a.count,b.count):a.factor===b.factor);
}
function fractionCommit(state,action,pair,mode){
  const before={left:state.left,right:state.right},after={left:pair.left.after,right:pair.right.after};
  if(!req(fractionEvaluate(after.left,state.solution),fractionEvaluate(after.right,state.solution)))
    throw new Error("A committed fraction move must preserve equality");
  const transaction={action,mode,before,after,cancellations:{left:pair.left.cancellations,right:pair.right.cancellations},
    cancellationEvents:{left:[],right:[]},fractionPlans:{left:pair.left.fractionPlans,right:pair.right.fractionPlans}};
  return {ok:true,committed:true,state:{...state,...after,pending:null,history:[...state.history,transaction]}};
}
export function fractionParts(value){
  const q=rational(value);
  if(q.n<0)throw new RangeError("Physical objects cannot have negative counts");
  const whole=Math.floor(q.n/q.d),pieces=q.n%q.d;
  return Object.freeze({whole,pieces,denominator:q.d});
}
export function fractionPieceCount(value){const p=fractionParts(value);return p.whole+p.pieces;}
export function fractionRoom(input={}){
  if(!input||typeof input!=="object"||Array.isArray(input))throw new TypeError("Invalid fraction room");
  for(const key of ["negX","negOne","posX2"]){
    if(input[key]!==undefined&&!req(input[key],0))throw new RangeError("Signed and square objects are not part of this fraction workshop");
  }
  if(input.crates!=null)throw new RangeError("Sealed groups are not part of this fraction workshop");
  const out={quantityMode:FRACTION_MODE};
  for(const kind of FRACTION_KINDS){
    const q=rational(input[kind]===undefined?0:input[kind]);
    if(q.n<0||!supported(q))throw new RangeError("Unsupported physical fraction");
    out[kind]=q;
  }
  return Object.freeze(out);
}
export function fractionRoomCount(room){return FRACTION_KINDS.reduce((sum,kind)=>sum+fractionPieceCount(room[kind]),0);}
export function fractionCanonical(room){return {x2:ZERO,x:room.posX,constant:room.posOne};}
export function fractionEvaluate(room,x){return radd(rmul(room.posX,x),room.posOne);}
export function fractionExpression(room){
  const variable=room.posX,constant=room.posOne;
  const terms=[];
  if(variable.n)terms.push(req(variable,1)?"x":(variable.d===1?rtext(variable):`(${rtext(variable)})`)+"x");
  if(constant.n)terms.push(rtext(constant));
  return terms.join(" + ")||"0";
}
export function fractionAction(action){
  if(!FRACTION_OPERATIONS.includes(action?.op))return failure("locked-operation","That tool belongs to another workshop.");
  const op=action.op;
  if(op==="add"||op==="remove"){
    if(!FRACTION_KINDS.includes(action.kind))return failure("locked-kind","Use dark sprites or weights in this workshop.");
    let count;
    try{count=rational(action.count);}catch{return failure("invalid","Choose an exact fraction or whole number.");}
    if(count.n<=0||rcompare(count,12)>0)return failure("invalid","Choose a positive amount of at most twelve objects.");
    if(!supported(count))return failure("unsupported-denominator","Those pieces are outside this workshop's fraction set.",{denominator:count.d});
    return {ok:true,action:Object.freeze({op,kind:action.kind,count})};
  }
  if(!FRACTION_FACTORS.includes(action.factor))return failure("invalid","Choose two, three, four or five groups.");
  return {ok:true,action:Object.freeze({op,factor:action.factor})};
}
export function fractionLevelAction(state,action){
  const checked=fractionAction(action);
  if(!checked.ok)return checked;
  const a=checked.action;
  if(state.allowedOperations&&!state.allowedOperations.includes(a.op))return failure("locked-operation","That tool is not available in this experiment.");
  if(a.kind&&state.allowedKinds&&!state.allowedKinds.includes(a.kind))return failure("locked-kind","That object is not available in this experiment.");
  return checked;
}
export function fractionTransform(room,action){
  const checked=fractionAction(action);if(!checked.ok)return checked;
  const a=checked.action,before=fractionRoom(room),next={},pieces=[];
  for(const kind of FRACTION_KINDS){
    const value=before[kind];
    let after=value;
    if(a.op==="multiply")after=rmul(value,a.factor);
    else if(a.op==="divide")after=rdiv(value,a.factor);
    else if(a.kind===kind)after=a.op==="add"?radd(value,a.count):rsub(value,a.count);
    if(after.n<0)return failure("missing","There is not enough of that object in this room.",{kind,needed:a.count,available:value});
    // Common physical grid only when combining / subtracting pieces; integer
    // copies do not need a finer grid. Equal shares keep their original grid
    // when possible (e.g. two thirds split into two individual thirds).
    const grid=a.op==="divide"?lcm(value.d,after.d):
      (a.kind===kind?lcm(value.d,a.count.d):value.d);
    if(!supported(after)||!FRACTION_DENOMINATORS.includes(grid))
      return failure("unsupported-denominator","Those pieces would get too small for this workshop. Try another route.",
        {kind,denominator:!supported(after)?after.d:grid,attempted:after});
    next[kind]=after;
    const plan={kind,before:value,after,grid,beforeParts:fractionParts(value),afterParts:fractionParts(after)};
    if(a.op==="divide"){
      const wholePerGroup=plan.afterParts.whole;
      const unitsPerGroup=Number(BigInt(plan.afterParts.pieces)*BigInt(grid)/BigInt(after.d));
      plan.groups=Object.freeze({count:a.factor,wholePerGroup,unitsPerGroup,denominator:grid});
    }
    if(a.op==="multiply")plan.copies=a.factor;
    if(a.kind===kind)plan.amount=a.count;
    pieces.push(Object.freeze(plan));
  }
  const after=fractionRoom(next),total=fractionRoomCount(after);
  if(total>FRACTION_CAPACITY)return failure("overflow","There would be too many objects and pieces in the rooms.",{total,capacity:FRACTION_CAPACITY,excess:total-FRACTION_CAPACITY});
  return {ok:true,after,raw:after,beforeGroups:a.op==="divide"?before:null,
    cancellations:{sprites:0,constants:0},cancellationEvents:[],
    fractionPlans:Object.freeze(pieces)};
}
export function validFractionLevel(level){
  try{
    if(level?.quantityMode!==FRACTION_MODE)return false;
    if(level.goal!==undefined&&level.goal!=="isolate")return false;
    const left=fractionRoom(level.left),right=fractionRoom(level.right),solution=rational(level.solution);
    return !!level.left&&!!level.right&&solution.n>0&&supported(solution)&&
      fractionRoomCount(left)<=FRACTION_CAPACITY&&fractionRoomCount(right)<=FRACTION_CAPACITY&&
      !req(left.posX,right.posX)&&req(fractionEvaluate(left,solution),fractionEvaluate(right,solution));
  }catch{return false;}
}
export function initialFractionState(level){
  if(!validFractionLevel(level))throw new RangeError("Invalid fraction workshop level");
  return {levelId:level.id,quantityMode:FRACTION_MODE,
    allowedKinds:Object.freeze([...(level.allowedKinds||FRACTION_KINDS)]),
    allowedOperations:Object.freeze([...(level.allowedOperations||FRACTION_OPERATIONS)]),
    lockPositive:false,goal:"isolate",solution:rational(level.solution),
    left:fractionRoom(level.left),right:fractionRoom(level.right),history:[],pending:null};
}
export function fractionVisibleRooms(state){
  const p=state.pending;
  return {left:p?.first==="left"?p.pair.left.after:state.left,
    right:p?.first==="right"?p.pair.right.after:state.right};
}
export function fractionBalanceDifference(state){
  const {left,right}=fractionVisibleRooms(state);
  return rsub(fractionEvaluate(left,state.solution),fractionEvaluate(right,state.solution));
}
export function fractionIsSolved(state){
  if(state.pending)return false;
  const one=r=>req(r.posX,1)&&req(r.posOne,0);
  const weights=r=>req(r.posX,0)&&req(r.posOne,state.solution);
  return one(state.left)&&weights(state.right)||one(state.right)&&weights(state.left);
}
export function fractionPrepare(state,action){
  if(state.pending)return failure("pending","Finish the matching move, or undo the first one.");
  const checked=fractionLevelAction(state,action);if(!checked.ok)return checked;
  const a=checked.action,left=fractionTransform(state.left,a),right=fractionTransform(state.right,a);
  if(!left.ok)return {...left,side:"left"};
  if(!right.ok)return {...right,side:"right"};
  return {ok:true,action:a,pair:{left,right}};
}
export function fractionPerform(state,action,mode="auto",side){
  const checked=fractionLevelAction(state,action);if(!checked.ok)return checked;
  const a=checked.action;
  if(mode!=="auto"&&mode!=="manual")return failure("invalid","Choose mirrored or independent hand control.");
  if(state.pending){
    const p=state.pending,other=p.first==="left"?"right":"left";
    if(mode!=="manual"||side!==other)return failure("wrong-side","Now make the matching move in the other room.");
    if(!sameFractionAction(p.action,a))return failure("mismatch","The other room needs the same operation, object and amount.");
    if(!p.pair[other].ok)return {...p.pair[other],side:other};
    return fractionCommit(state,p.action,p.pair,"manual");
  }
  if(mode==="manual"){
    if(side!=="left"&&side!=="right")return failure("wrong-side","Choose a room.");
    const left=fractionTransform(state.left,a),right=fractionTransform(state.right,a),pair={left,right};
    if(!pair[side].ok)return {...pair[side],side};
    return {ok:true,committed:false,state:{...state,pending:{first:side,action:a,pair}}};
  }
  const p=fractionPrepare(state,a);if(!p.ok)return p;
  return fractionCommit(state,p.action,p.pair,"auto");
}
export function fractionUndo(state){
  if(state.pending)return {...state,pending:null};
  if(!state.history.length)return state;
  const last=state.history.at(-1);
  return {...state,...last.before,history:state.history.slice(0,-1),pending:null};
}
export function fractionOperationText(action){
  const a=fractionAction(action);if(!a.ok)throw new RangeError(a.reason);
  const value=a.action;
  if(value.op==="multiply"||value.op==="divide")return `${value.op==="multiply"?"×":"÷"} ${value.factor} on both sides`;
  const count=rtext(value.count),term=value.kind==="posX"?(req(value.count,1)?"x":(value.count.d===1?count:`(${count})`)+"x"):count;
  return `${value.op==="remove"?"−":"+"} ${term} on both sides`;
}
