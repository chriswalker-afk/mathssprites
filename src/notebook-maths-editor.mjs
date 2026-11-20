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
    return failure("syntax","Write an operation such as −3, +(−x), ×2 or ÷3.");
  const compact=expression.replace(/\s+/g,"")
    .replace(/[−–—]/g,"-").replace(/[⋅·*]/g,"×").replace(/\//g,"÷");
  // Opening one sealed expression is an identity rewrite, not an
  // operation on both sides. An editor selection never executes by itself.
  const opened=/^(?:expand|open)(left|right|west|east)$/i.exec(compact);
  if(opened){
    const side=["left","west"].includes(opened[1].toLowerCase())?"left":"right";
    return {ok:true,action:{op:"unpack",side},
      display:"Expand "+(side==="left"?"west":"east")};
  }
  if(!compact||/^[+\-×÷]$/.test(compact))
    return failure("incomplete","Choose +, −, × or ÷, then an object or a factor.");
  // Explicit brackets preserve the physical difference between subtracting
  // a negative object and subtracting a positive object.
  const match=/^([+\-×÷])(?:\(-(\d{1,3}x?|x)\)|(\d{1,3}x?|x))$/.exec(compact);
  if(!match)
    return failure("syntax","Use one operation, such as +3, −x, +(−x), −(−2) or ÷3.");
  const [,sign,negativeOperand,positiveOperand]=match;
  const signed=negativeOperand!==undefined,operand=negativeOperand||positiveOperand;
  if(sign==="+"||sign==="-"){
    const sprite=operand.endsWith("x");
    const digits=sprite?operand.slice(0,-1):operand;
    if(/^0\d/.test(digits)||digits==="0"||/[^0-9]/.test(digits))
      return failure("number","Use whole objects with no leading zeros.");
    const count=digits===""&&sprite?1:Number(digits);
    if(!Number.isInteger(count)||count<1||count>12)
      return failure("range","Choose 1–12 sprites or weights.");
    const kind=sprite?(signed?"negX":"posX"):(signed?"negOne":"posOne");
    const action={op:sign==="+"?"add":"remove",kind,count};
    const term=(count===1&&sprite?"":count)+(sprite?"x":"");
    return {ok:true,action,display:sign+(signed?"(−"+term+")":term)};
  }
  if(signed||operand.endsWith("x"))
    return failure("factor","Multiplication and division need a positive whole-number factor (2–5).");
  const factor=Number(operand);
  if(!/^[2-5]$/.test(operand)||!Number.isInteger(factor))
    return failure("factor","Choose a whole-number factor from 2 to 5.");
  return {ok:true,action:{op:sign==="×"?"multiply":"divide",factor},
    display:sign+factor};
}
function expressionMarkup(room){
  // Keep actual crates grouped on the paper: canonical() alone would
  // visually expand the brackets *before* the learner chooses to do so.
  if(room.crates?.count){
    const n=room.crates.count;
    const group=(n===1?"":"<mn>"+n+"</mn>")+
      "<mo>(</mo>"+expressionMarkup(room.crates.contents)+"<mo>)</mo>";
    const hasLoose=["posX","negX","posX2","posOne","negOne"]
      .some(kind=>(room[kind]||0)!==0);
    return group+(hasLoose?"<mo>+</mo>"+expressionMarkup({...room,crates:null}):"");
  }
  const c=canonical(room),terms=[];
  const push=(amount,body)=>{
    if(!amount)return;
    if(terms.length||amount<0)terms.push("<mo>"+(amount<0?"−":"+")+"</mo>");
    terms.push(body(Math.abs(amount)));
  };
  push(c.x2,n=>(n===1?"":"<mn>"+n+"</mn>")+
    "<msup><mi>x</mi><mn>2</mn></msup>");
  push(c.x,n=>(n===1?"":"<mn>"+n+"</mn>")+"<mi>x</mi>");
  push(c.constant,n=>"<mn>"+n+"</mn>");
  return terms.length?terms.join(""):"<mn>0</mn>";
}
export function notebookEquationMathML(state){
  if(!state?.left||!state?.right)throw new TypeError("An equation needs two rooms");
  return '<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">'+
    "<mrow>"+expressionMarkup(state.left)+"<mo>=</mo>"+
    expressionMarkup(state.right)+"</mrow></math>";
}
export function notebookOperationMathML(action){
  if(action?.op==="unpack"){
    if(!["left","right"].includes(action.side))
      throw new RangeError("Choose which side contains the sealed groups.");
    return '<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">'+
      '<mrow><mtext>Expand '+(action.side==="left"?"west":"east")+
      ' expression</mtext></mrow></math>';
  }
  if(!action||!Object.hasOwn(OP_SYMBOLS,action.op))
    throw new TypeError("Only one of the four World 1 operations can be typeset");
  const symbol=OP_SYMBOLS[action.op];
  const n=action.factor??action.count;
  if(!Number.isInteger(n)||n<1||n>12)
    throw new RangeError("Invalid operation operand");
  const variable=action.kind==="posX"||action.kind==="negX";
  const negative=action.kind==="negX"||action.kind==="negOne";
  const term=variable?(n===1?"":"<mn>"+n+"</mn>")+"<mi>x</mi>":"<mn>"+n+"</mn>";
  const signedTerm=negative?"<mo>(</mo><mo>−</mo>"+term+"<mo>)</mo>":term;
  return '<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">'+
    "<mrow><mo>"+symbol+"</mo>"+signedTerm+"</mrow></math>";
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
  if((parsed.action.kind==="negX"||parsed.action.kind==="negOne") &&
      session.level.quantityMode!=="signed")
    return failure("locked-negative","White sprites and balloons belong to the Opposite Chambers.");
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
