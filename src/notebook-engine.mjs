/**
 * Algebra Apprentice (PR20) — pure notebook-first step checker.
 *
 * The notebook NEVER trusts an answer solely because it has the same solution.
 * Each written equation must exactly match ONE physically legal, two-sided
 * transaction in the existing balance engine. This retains alternate valid
 * methods without introducing fractions, negative objects, or fake sprite
 * movements. No eval, MathML parser, or user-supplied executable expressions.
 */
import {
  initialState, perform, isSolved, undo, canonical,
  equation, validInitialLevel, algebraOperation
} from "./engine.mjs";
import {validSquareLaboratoryLevel} from "./square-rules.mjs";

export const NOTEBOOK_MAX_STEPS = 16;
export const NOTEBOOK_MAX_INPUT = 80;
const MAX_ROOM_OBJECTS = 48;

function error(code,message) { return {ok:false,code,message}; }

/** A side is a sum of nonnegative whole numbers and positive x terms. */
export function parseNotebookSide(input) {
  if(typeof input!=="string")return error("syntax","Write a whole-number expression.");
  const compact=input.replace(/\s+/g,"").toLowerCase();
  if(!compact)return error("syntax","Each side of the equation needs an expression.");
  if(/[−–-]/.test(compact))
    return error("negative","Stage 3 of World 1 cannot use negative terms or subtract inside a room.");
  if(/[./÷^²()]/.test(compact))
    return error("fraction","Use whole sprites and weights only; fractions, powers and typed brackets are not supported in the custom-room editor.");
  if(!/^[0-9x+]+$/.test(compact))
    return error("syntax","Use terms such as x, 2x, 3, or 2x + 3.");
  const terms=compact.split("+");
  if(terms.some(term=>!term))
    return error("syntax","A + must have a whole-number term on both sides.");
  let x=0,constant=0;
  for(const term of terms){
    if(term==="x") x++;
    else if(/^[1-9][0-9]*x$/.test(term)) x+=Number(term.slice(0,-1));
    else if(/^(?:0|[1-9][0-9]*)$/.test(term)) constant+=Number(term);
    else return error("syntax","Write each sprite as x or 2x, and weights as whole numbers.");
    if(!Number.isSafeInteger(x)||!Number.isSafeInteger(constant)||
       x+constant>MAX_ROOM_OBJECTS)
      return error("capacity","The written chamber would exceed the 48-object limit.");
  }
  return {ok:true,x,constant};
}

export function parseNotebookEquation(input) {
  if(typeof input!=="string"||input.length>NOTEBOOK_MAX_INPUT)
    return error("length","Keep each algebra line under 80 characters.");
  const parts=input.split("=");
  if(parts.length!==2)
    return error("equation","Write one equation with exactly one equals sign.");
  const left=parseNotebookSide(parts[0]);
  if(!left.ok)return left;
  const right=parseNotebookSide(parts[1]);
  if(!right.ok)return right;
  return {ok:true,left:{x:left.x,constant:left.constant},
    right:{x:right.x,constant:right.constant}};
}

export function notebookStateMatches(parsed,state) {
  if(!parsed?.ok||!state)return false;
  return ["left","right"].every(side=>{
    const actual=canonical(state[side]);
    return actual.x2===0 && actual.x===parsed[side].x &&
      actual.constant===parsed[side].constant;
  });
}

export function notebookCandidates() {
  const actions=[];
  // A transparent, bounded list of the EXACT tools available in World 1.
  // Removing before adding helps choose the most natural action when a
  // numerical step has multiple physical interpretations.
  for(const kind of ["posOne","posX"])
    for(let count=1;count<=12;count++)
      actions.push({op:"remove",kind,count});
  for(let factor=2;factor<=5;factor++)
    actions.push({op:"divide",factor});
  for(const kind of ["posOne","posX"])
    for(let count=1;count<=12;count++)
      actions.push({op:"add",kind,count});
  for(let factor=2;factor<=5;factor++)
    actions.push({op:"multiply",factor});
  return actions;
}
const CANDIDATES=Object.freeze(notebookCandidates());

export function startNotebook(level) {
  // World 4 accepts its explicitly authorised area or unique nonnegative
  // quadratic goal; the ordinary notebook retains its linear restriction.
  if(level?.squareLaboratory===true){
    if(!validSquareLaboratoryLevel(level)||!validInitialLevel(level))
      throw new RangeError("The Square Laboratory notebook needs a valid whole-object square goal or quadratic balance.");
    const state=initialState(level);
    if(isSolved(state))throw new RangeError("This equation is already complete.");
    return {level,state,steps:[]};
  }
  const positive=level?.lockPositive&&level.quantityMode==="positive";
  const signed=!level?.lockPositive&&level?.quantityMode==="signed";
  if((!positive&&!signed) ||
     level.goal&&level.goal!=="isolate" ||
     !Array.isArray(level.allowedOperations) ||
     level.allowedOperations.some(op=>!["remove","add","divide","multiply",
        ...(level.groupedPrototype?["unpack"]:[])].includes(op)) ||
     ["left","right"].some(side=>level[side]?.posX2) ||
     !validInitialLevel(level) ||
     !Number.isInteger(level.solution)||level.solution<=0)
    throw new RangeError("A notebook preview requires a valid positive whole-number linear level or signed Opposite Chambers level.");
  const state=initialState(level);
  if(isSolved(state)) throw new RangeError("This equation is already solved.");
  return {level,state,steps:[]};
}

export function tryNotebookLine(session,text) {
  if(!session?.level||!session.state||!Array.isArray(session.steps))
    return error("session","Start a notebook experiment first.");
  if(session.level.squareLaboratory)
    return error("square-editor","Choose one operation for both sides in the Square Laboratory maths editor.");
  if(session.level.quantityMode==="signed")
    return error("signed-editor","Use the signed operation-first editor: choose +, −, × or ÷ for both sides.");
  if(isSolved(session.state))
    return error("complete","Your written solution is complete. Replay it with the sprites.");
  if(session.steps.length>=NOTEBOOK_MAX_STEPS)
    return error("step-limit","This notebook has reached its 16-step limit. Undo a step or try a shorter route.");
  const parsed=parseNotebookEquation(text);
  if(!parsed.ok)return parsed;
  if(notebookStateMatches(parsed,session.state))
    return error("unchanged","That line rearranges the same objects. Try an operation on both sides.");
  const atSolution=side=>side.x*session.level.solution+side.constant;
  if(atSolution(parsed.left)!==atSolution(parsed.right))
    return error("not-equivalent","That equation is not balanced. Check that you changed both sides equally.");
  for(const action of CANDIDATES){
    const performed=perform(session.state,action,"auto");
    if(performed.ok&&notebookStateMatches(parsed,performed.state)){
      const line=equation({left:performed.state.left,right:performed.state.right});
      const next={level:session.level,state:performed.state,
        steps:[...session.steps,{line,action:{...action},
          explanation:algebraOperation(action)}]};
      return {ok:true,session:next,solved:isSolved(next.state),
        action:{...action},line,explanation:algebraOperation(action)};
    }
  }
  return error("not-one-move",
    "This is not one possible whole-object operation on BOTH sides. Try removing, adding, multiplying or making equal whole groups. Use one move per line.");
}
export function undoNotebookLine(session) {
  if(!session?.steps?.length)return session;
  return {level:session.level,state:undo(session.state),steps:session.steps.slice(0,-1)};
}
export function notebookReplayScript(session) {
  if(!session||!isSolved(session.state)||
     session.state.history.length!==session.steps.length)
    throw new RangeError("Finish your checked algebra before replaying the sprites.");
  return session.state.history.map((entry,i)=>({
    action:{...entry.action},
    before:entry.before,
    after:entry.after,
    line:session.steps[i].line,
    explanation:session.steps[i].explanation
  }));
}
