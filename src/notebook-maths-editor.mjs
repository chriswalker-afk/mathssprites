/**
 * PR31 — Algebra Apprentice operation-first maths editor.
 * A learner writes WHAT to do (+3, -x, ÷2), never a guessed final equation.
 * Pure helpers render real MathML, preview the unchanged engine and commit
 * one mathematically legal, two-sided action only when the learner applies it.
 *
 * No eval, dynamic math parser, CDN, guessed shortcuts or changed game rules.
 */
import {canonical,equation,perform,isSolved,algebraOperation} from "./engine.mjs";
import {NOTEBOOK_MAX_STEPS} from "./notebook-engine.mjs";

function failure(code,message){return {ok:false,code,message};}
const OP_SYMBOLS=Object.freeze({add:"+",remove:"−",multiply:"×",divide:"÷"});
export function parseNotebookOperation(expression){
  if(typeof expression!=="string"||expression.length>24)
    return failure("syntax","Write an operation such as −3, +x, ×2 or ÷3.");
  const compact=expression.replace(/\s+/g,"")
    .replace(/[−–—]/g,"-").replace(/[⋅·*]/g,"×").replace(/\//g,"÷");
  if(!compact||/^[+\-×÷]$/.test(compact))
    return failure("incomplete","Choose +, −, × or ÷, then enter a number or x.");
  const match=/^([+\-×÷])(\d{1,3}x?|x)$/.exec(compact);
  if(!match)
    return failure("syntax","Use one operation: +3, −2x, ×3 or ÷2 (not a whole equation).");
  const [,sign,operand]=match;
  if(sign==="+"||sign==="-"){
    const sprite=operand.endsWith("x");
    const digits=sprite?operand.slice(0,-1):operand;
    if(/^0\d/.test(digits)||digits==="0"||/[^0-9]/.test(digits))
      return failure("number","Use positive whole objects with no leading zeros.");
    const count=digits===""&&sprite?1:Number(digits);
    if(!Number.isInteger(count)||count<1||count>12)
      return failure("range","Choose 1–12 sprites or weights for + and −.");
    const action={op:sign==="+"?"add":"remove",kind:sprite?"posX":"posOne",count};
    return {ok:true,action,display:sign+(count===1&&sprite?"":count)+(sprite?"x":"")};
  }
  if(operand.endsWith("x"))
    return failure("factor","Multiplication and division need a whole-number factor (2–5), not x.");
  const factor=Number(operand);
  if(!/^[2-5]$/.test(operand)||!Number.isInteger(factor))
    return failure("factor","Choose a whole-number factor from 2 to 5.");
  return {ok:true,action:{op:sign==="×"?"multiply":"divide",factor},
    display:sign+factor};
}
function expressionMarkup(room){
  const c=canonical(room);
  const terms=[];
  if(c.x2){
    if(c.x2!==1)terms.push("<mn>"+c.x2+"</mn>");
    terms.push("<msup><mi>x</mi><mn>2</mn></msup>");
  }
  if(c.x){
    if(terms.length)terms.push("<mo>+</mo>");
    if(c.x!==1)terms.push("<mn>"+c.x+"</mn>");
    terms.push("<mi>x</mi>");
  }
  if(c.constant||!terms.length){
    if(terms.length)terms.push("<mo>+</mo>");
    terms.push("<mn>"+c.constant+"</mn>");
  }
  return terms.join("");
}
export function notebookEquationMathML(state){
  if(!state?.left||!state?.right)throw new TypeError("An equation needs two rooms");
  return '<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">'+
    "<mrow>"+expressionMarkup(state.left)+"<mo>=</mo>"+
    expressionMarkup(state.right)+"</mrow></math>";
}
export function notebookOperationMathML(action){
  if(!action||!Object.hasOwn(OP_SYMBOLS,action.op))
    throw new TypeError("Only one of the four World 1 operations can be typeset");
  const symbol=OP_SYMBOLS[action.op];
  const n=action.factor??action.count;
  if(!Number.isInteger(n)||n<1||n>12)
    throw new RangeError("Invalid operation operand");
  const variable=action.kind==="posX";
  const term=(variable?(n===1?"":"<mn>"+n+"</mn>")+"<mi>x</mi>":"<mn>"+n+"</mn>");
  return '<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">'+
    "<mrow><mo>"+symbol+"</mo>"+term+"</mrow></math>";
}
export function previewNotebookOperation(session,expression){
  if(!session?.level||!session.state||!Array.isArray(session.steps))
    return failure("session","Start an Algebra Apprentice level first.");
  if(isSolved(session.state))
    return failure("complete","Your solution is finished. Replay your checked steps.");
  if(session.steps.length>=NOTEBOOK_MAX_STEPS)
    return failure("step-limit","You have used all 16 steps. Undo or start again.");
  const parsed=parseNotebookOperation(expression);
  if(!parsed.ok)return parsed;
  const changed=perform(session.state,parsed.action,"auto");
  if(!changed.ok)
    return failure(changed.code||"illegal",changed.reason||
      "That cannot be done with whole objects on both sides right now.");
  const action=parsed.action;
  return {ok:true,action,display:parsed.display,
    line:equation(changed.state),state:changed.state,
    explanation:algebraOperation(action),solved:isSolved(changed.state)};
}
export function tryNotebookOperation(session,expression){
  const preview=previewNotebookOperation(session,expression);
  if(!preview.ok)return preview;
  const step={line:preview.line,action:{...preview.action},
    explanation:preview.explanation};
  return {...preview,session:{level:session.level,state:preview.state,
    steps:[...session.steps,step]}};
}
