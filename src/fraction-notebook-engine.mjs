/** World 3 paper-first notebook. The exact physical engine, not a second
 * symbolic solver, decides which single operations are legal. */
import {initialState,validInitialLevel,perform,undo,isSolved,equation} from "./engine.mjs";
import {rational,rtext} from "./rational.mjs";
import {fractionAction,FRACTION_MODE} from "./fraction-engine.mjs";
import {NOTEBOOK_MAX_STEPS,notebookFailureMessage} from "./notebook-engine.mjs?v=108";

const failure=(code,message)=>({ok:false,code,message});
const syntax="Write one operation, e.g. −1/2, −2x/3, ×4 or ÷2.";
export function parseFractionNotebookOperation(input){
  if(typeof input!=="string"||input.length>48)return failure("syntax",syntax);
  const normalized=input.trim().replace(/[−–—]/g,"-").replace(/[⋅·*]/g,"×").replace(/X/g,"x");
  // A space between digits is never silently stripped: it may represent
  // a mixed number. Preserve its written form and evaluate it exactly.
  const mixed=/^([+-])\s*(\d{1,5})\s+(\d{1,5})\s*\/\s*(\d{1,5})\s*(x)?$/.exec(normalized)
    ||/^([+-])\s*\(\s*(\d{1,5})\s+(\d{1,5})\s*\/\s*(\d{1,5})\s*\)\s*(x)?$/.exec(normalized);
  if(mixed){
    const [,sign,w,num,den,x]=mixed,whole=Number(w),n=Number(num),d=Number(den),variable=!!x;
    if(whole<1||n<1||d<1||n>=d)return failure("number","Write a mixed number with a positive whole and a proper fractional part.");
    const checked=fractionAction({op:sign==="+"?"add":"remove",kind:variable?"posX":"posOne",count:rational(whole*d+n,d)});
    if(!checked.ok)return failure(checked.code,checked.reason);
    return {ok:true,action:checked.action,written:Object.freeze({whole,n,d,variable})};
  }
  if(/\d\s+\d/.test(normalized))return failure("syntax","Use a single number or a mixed number such as 1 1/2.");
  const text=normalized.replace(/\s+/g,"");
  if(!text||/^[+\-×÷/]$/.test(text))return failure("incomplete","Choose an operation and its amount.");
  const sign=text[0],operand=text.slice(1);
  if(["×","÷","/"].includes(sign)){
    if(!/^[2-5]$/.test(operand))return failure("factor","Multiply or divide by a whole-number factor from 2 to 5.");
    return {ok:true,action:{op:sign==="×"?"multiply":"divide",factor:Number(operand)},written:null};
  }
  if(!["+", "-"].includes(sign))return failure("syntax",syntax);
  // Both conventional (2/3)x and x/3 forms are supported. No arbitrary
  // expressions, decimals, signed quantities, powers, or evaluation.
  let term=operand;
  if(term.startsWith("(")&&term.endsWith(")"))term=term.slice(1,-1);
  const bracketed=/^\((\d{1,6}\/\d{1,6})\)x$/.exec(term);
  if(bracketed)term=bracketed[1]+"x";
  const coefficient=/^(\d{0,6})x\/(\d{1,6})$/.exec(term);
  if(coefficient)term=(coefficient[1]||"1")+"/"+coefficient[2]+"x";
  const variable=term.endsWith("x");
  if(variable)term=term.slice(0,-1)||"1";
  const match=/^(\d{1,6})(?:\/(\d{1,6}))?$/.exec(term);
  if(!match)return failure("syntax",syntax);
  const n=Number(match[1]),d=match[2]===undefined?1:Number(match[2]);
  if(d===0)return failure("denominator","The denominator cannot be zero.");
  if(n===0)return failure("number","Choose a positive quantity, not zero.");
  const count=rational(n,d);
  const checked=fractionAction({op:sign==="+"?"add":"remove",kind:variable?"posX":"posOne",count});
  if(!checked.ok)return failure(checked.code,checked.reason);
  return {ok:true,action:checked.action,written:Object.freeze({n,d,variable})};
}
export function fractionNotebookOperationText(action){
  if(action.op==="multiply"||action.op==="divide")return (action.op==="multiply"?"×":"÷")+action.factor;
  return (action.op==="add"?"+":"−")+rtext(action.count)+(action.kind==="posX"?"x":"");
}
export function startFractionNotebook(level){
  if(level?.quantityMode!==FRACTION_MODE||!validInitialLevel(level))
    throw new RangeError("Choose a valid Fraction Workshop equation.");
  const state=initialState(level);
  if(isSolved(state))throw new RangeError("This equation is already solved.");
  return {level,state,steps:[]};
}
export function previewFractionNotebookOperation(session,input){
  if(!session?.state||session.level?.quantityMode!==FRACTION_MODE||!Array.isArray(session.steps))
    return failure("session","Start a fractional notebook.");
  if(isSolved(session.state))return failure("complete","Your solution is complete.");
  if(session.steps.length>=NOTEBOOK_MAX_STEPS)return failure("step-limit","Undo a step or try a shorter route (16 moves maximum).");
  const parsed=parseFractionNotebookOperation(input);
  if(!parsed.ok)return parsed;
  const result=perform(session.state,parsed.action,"auto");
  if(!result.ok)return failure(result.code,notebookFailureMessage(result,session.state,parsed.action));
  return {...parsed,state:result.state,line:equation(result.state),solved:isSolved(result.state)};
}
export function tryFractionNotebookOperation(session,input){
  const preview=previewFractionNotebookOperation(session,input);
  if(!preview.ok)return preview;
  const step=Object.freeze({action:preview.action,written:preview.written,line:preview.line});
  return {...preview,session:{level:session.level,state:preview.state,steps:[...session.steps,step]}};
}
export function undoFractionNotebook(session){
  if(!session?.steps?.length)return session;
  return {level:session.level,state:undo(session.state),steps:session.steps.slice(0,-1)};
}
export function fractionNotebookReplayScript(session){
  if(!session||!isSolved(session.state)||session.steps.length!==session.state.history.length)
    throw new RangeError("Finish the checked algebra before the hand replays it.");
  return session.state.history.map((tx,i)=>({...tx,written:session.steps[i].written,line:session.steps[i].line}));
}
