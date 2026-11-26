/**
 * Free play in Opposite Chambers. Parse signed linear terms into actual
 * loose objects, preserving explicit zero pairs. No eval or implicit
 * expression evaluation. The unknown's value remains positive in World 2.
 */
import {room,canonical,normalize,equation,initialState,isSolved,perform,validInitialLevel} from "./engine.mjs";
import {OPPOSITE_KINDS,OPPOSITE_OPERATIONS} from "./opposite-levels.mjs";

export const SIGNED_WORKSHOP_EXAMPLES=Object.freeze([
  "x − 3 = 5","2x − 3 = x + 4","7 − x = 2","−2x + 9 = −x + 4"
]);
const fail=(code,message)=>({ok:false,code,message});
const sides=["left","right"];
const kinds=OPPOSITE_KINDS;
const limit=48,maxSteps=16;

// A signed term is a whole number or a whole-number multiple of x;
// parentheses around a single signed operand are allowed (x - (-3)).
function parseSide(text){
  if(/[0-9]\s+[0-9]/.test(text))return fail("syntax","Write each whole number without internal spaces.");
  const source=text.replace(/[−–]/g,"-").replace(/\s+/g,"").toLowerCase();
  if(!source)return fail("syntax","Each side needs an expression.");
  if(/[./÷^²]/.test(source))return fail("number-system","Use signed whole-number linear terms. Choose Fractions or Squares for other objects.");
  const result=room();
  const term=/^([+-]?)(?:\(([+-]?)([0-9]*x|[0-9]+)\)|([0-9]*x|[0-9]+))/;
  let rest=source,first=true;
  while(rest){
    const match=term.exec(rest);
    if(!match||(!first&&!match[1]))
      return fail("syntax","Use signed whole terms such as −2x + 7, x − 3 or x − (−3). Expand grouped brackets first.");
    const operand=match[3]??match[4];
    const variable=operand.endsWith("x");
    const digits=variable?operand.slice(0,-1):operand;
    const count=digits===""?1:Number(digits);
    if(!Number.isSafeInteger(count)||count>limit)
      return fail("capacity","Each chamber can contain at most 48 objects, including opposite pairs.");
    const sign=(match[1]==="-"?-1:1)*(match[2]==="-"?-1:1);
    const kind=variable?(sign<0?"negX":"posX"):(sign<0?"negOne":"posOne");
    result[kind]+=count;
    if(kinds.reduce((sum,k)=>sum+result[k],0)>limit)
      return fail("capacity","Each chamber can contain at most 48 objects, including opposite pairs.");
    rest=rest.slice(match[0].length);first=false;
  }
  return {ok:true,room:result};
}
export function parseSignedWorkshopEquation(input){
  if(typeof input!=="string"||input.length>80)return fail("length","Keep your equation within 80 characters.");
  const parts=input.split("=");
  if(parts.length!==2)return fail("equation","Write one equation with exactly one equals sign.");
  const left=parseSide(parts[0]);if(!left.ok)return left;
  const right=parseSide(parts[1]);if(!right.ok)return right;
  return {ok:true,left:left.room,right:right.room};
}
function smooth(n){
  for(const factor of [2,3,5])while(n>1&&n%factor===0)n/=factor;
  return n===1;
}
const stateKey=state=>sides.map(side=>kinds.map(k=>state[side][k]).join(",")).join("|");
// Bounded, monotone search: eliminate the smaller x coefficient, clear
// constants from the sprite chamber, and share exact groups. Try either
// order and every legal chunk up to 12, including division before clearing
// when it is possible. Each candidate is checked by the actual engine.
export function proveSignedWorkshopRoute(level){
  if(!validInitialLevel(level)||level.quantityMode!=="signed"||level.solution<1)return null;
  const first=initialState(level);
  const difference=canonical(first.left).x-canonical(first.right).x;
  if(!smooth(Math.abs(difference)))return null;
  const spriteSide=difference>0?"left":"right",other=spriteSide==="left"?"right":"left";
  const visited=new Map();
  function visit(state,budget){
    if(isSolved(state))return [];
    if(budget===0)return null;
    const key=stateKey(state);
    if((visited.get(key)??-1)>=budget)return null;
    visited.set(key,budget);
    const candidates=[];
    for(const factor of [5,4,3,2])candidates.push({op:"divide",factor});
    const targets=[
      {value:canonical(state[other]).x,pos:"posX",neg:"negX"},
      {value:canonical(state[spriteSide]).constant,pos:"posOne",neg:"negOne"}
    ];
    for(const {value,pos,neg} of targets){
      if(!value)continue;
      const remove=value>0?pos:neg,add=value>0?neg:pos;
      for(let count=Math.min(12,Math.abs(value));count>=1;count--){
        if(sides.every(s=>state[s][remove]>=count))candidates.push({op:"remove",kind:remove,count});
        candidates.push({op:"add",kind:add,count});
      }
    }
    // A starting expression can already simplify to x = n, but still have
    // genuine visible pairs. A two-move balanced rewrite is available to
    // the paper-first mode as well as local cancellation in physical play.
    if(!targets.some(t=>t.value)&&isSolved({...state,left:normalize(state.left).after,right:normalize(state.right).after})){
      for(const kind of ["posOne","negOne","posX","negX"]){
        const action={op:"add",kind,count:1};
        const move=perform(state,action,"auto");
        if(!move.ok)continue;
        for(const undo of [{op:"remove",kind,count:1},{op:"add",kind:({posOne:"negOne",negOne:"posOne",posX:"negX",negX:"posX"})[kind],count:1}]){
          const back=perform(move.state,undo,"auto");
          if(budget>=2&&back.ok&&isSolved(back.state))return [action,undo];
        }
      }
      return null;
    }
    for(const action of candidates){
      const next=perform(state,action,"auto");
      if(!next.ok)continue;
      const route=visit(next.state,budget-1);
      if(route!==null)return [action,...route];
    }
    return null;
  }
  return visit(first,maxSteps);
}
export function createSignedWorkshopEquation(input){
  const parsed=parseSignedWorkshopEquation(input);
  if(!parsed.ok)return parsed;
  const {left,right}=parsed;
  const a=canonical(left),b=canonical(right);
  const difference=a.x-b.x,constant=b.constant-a.constant;
  if(difference===0)return constant===0
    ?fail("infinitely-many","Both sides are equivalent. There is no single mystery value.")
    :fail("no-solution","These expressions cannot balance for any x.");
  const solution=constant/difference;
  if(solution<=0)return fail(solution===0?"zero-solution":"negative-solution","Opposite Chambers uses negative terms, but the dark sprite must have a positive mystery weight. Choose an equation with x > 0.");
  if(!Number.isInteger(solution))return fail("fraction-solution","The mystery value is fractional. Signed fractions are not supported in Opposite Chambers.");
  if(solution>limit)return fail("solution-overflow","The final room would require more than 48 weights.");
  const level={id:"workshop-custom",title:"Your own balance · "+equation({left,right}),
    chapter:"FREE PLAY · OPPOSITE CHAMBERS",left,right,solution,quantityMode:"signed",
    allowedKinds:OPPOSITE_KINDS,allowedOperations:OPPOSITE_OPERATIONS,
    prompt:"Use black and white sprites, weights and balloons to isolate one dark sprite.",
    suggested:"Look for opposite pairs, then make matching moves in both rooms and share complete groups."};
  if(!validInitialLevel(level))return fail("invalid-scene","That equation cannot form a valid signed balance.");
  if(isSolved(initialState(level)))return fail("already-solved","That equation already leaves one dark sprite facing its weights. Add a balancing challenge.");
  if(!proveSignedWorkshopRoute(level))return fail("unrepresentable","This equation needs a route the whole-object hand cannot complete in 16 moves. Try smaller coefficients or groups of two to five.");
  return {ok:true,level,normalizedEquation:equation({left,right})};
}
