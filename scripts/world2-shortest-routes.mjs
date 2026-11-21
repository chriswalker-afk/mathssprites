/**
 * Teacher-only exhaustive minimum-scored-move search through the REAL engine.
 *
 * PR57: include optional sealed-group opening in either chamber and free
 * in-room pairing of pre-existing opposite objects. These physical identity
 * rewrites preserve value; opening crates costs one recorded history step,
 * attaching zero pairs costs zero steps. Search order is breadth-first in
 * recorded operations, including every legal Add/Remove 1–12 and ×/÷ 2–5.
 *
 * Physical state identity retains loose counts AND the exact intact contents
 * and number of sealed crates; canonical ax+b alone would be insufficient.
 * None of this search code is shipped to the student's game.
 */
import {
  initialState,perform,isSolved,attachAvailablePairs
} from "../src/engine.mjs";

const TOKEN_KEYS=Object.freeze(["posX","negX","posX2","posOne","negOne"]);
export const ALL_SIGNED_ACTIONS=Object.freeze([
  ...["remove","add"].flatMap(op=>
    ["posX","negX","posOne","negOne"].flatMap(kind=>
      Array.from({length:12},(_,i)=>Object.freeze({op,kind,count:i+1})))),
  ...["divide","multiply"].flatMap(op=>
    [2,3,4,5].map(factor=>Object.freeze({op,factor})))
]);

const keyOf=state=>JSON.stringify(["left","right"].map(side=>{
  const r=state[side],crate=r.crates;
  return [...TOKEN_KEYS.map(kind=>r[kind]||0),
    crate?[crate.count,...TOKEN_KEYS.map(kind=>crate.contents?.[kind]||0)]:null];
}));

export function signedActionsFor(level){
  if(level?.quantityMode!=="signed" || !level?.allowedOperations ||
     !level?.allowedKinds)
    throw new RangeError("World 2 audit requires an authored signed level");
  if(["left","right"].some(side=>level[side]?.posX2 ||
    level[side]?.crates?.contents?.posX2))
    throw new RangeError("World 2 signed route search cannot ignore square sprites");
  const operations=new Set(level.allowedOperations);
  const kinds=new Set(level.allowedKinds);
  if([...operations].some(op=>!["remove","add","divide","multiply","unpack"].includes(op)))
    throw new RangeError("Update World 2 audit for additional operation types");
  if([...kinds].some(kind=>!["posX","negX","posOne","negOne"].includes(kind)))
    throw new RangeError("Update World 2 audit for additional signed kinds");
  const actions=ALL_SIGNED_ACTIONS.filter(action=>operations.has(action.op)&&
    (!action.kind||kinds.has(action.kind)));
  if(operations.has("unpack"))
    for(const side of ["left","right"])
      if(level[side]?.crates?.count)
        actions.push(Object.freeze({op:"unpack",side}));
  return actions;
}

/** Collect all zero-cost physical simplifications available in ONE or BOTH
 * rooms. Each kind pairs as many opposites as already exist; no algebraic
 * operation on both sides is involved, and star/history cost remains zero.
 */
function freePairClosure(entry){
  const result=[entry],seen=new Set([keyOf(entry.state)]);
  for(let i=0;i<result.length;i++){
    const node=result[i];
    for(const side of ["left","right"]){
      for(const type of ["constants","sprites"]){
        const paired=attachAvailablePairs(node.state,side,type);
        if(!paired.ok)continue;
        const key=keyOf(paired.state);
        if(seen.has(key))continue;
        seen.add(key);
        result.push({state:paired.state,route:node.route,
          freePairings:[...node.freePairings,
            {at:node.route.length,side,type}]});
      }
    }
  }
  return result;
}

/** Proven shortest *scored* sequence, independently of the authored example.
 * freePairings holds any value-preserving pair actions needed by the witness,
 * labelled by the number of scored actions already performed. Existing
 * levels generally need none because normal moves show their own zero pairs.
 */
export function shortestSignedRoute(level,{maxMoves=level?.referenceRoute?.length}={}){
  if(!Number.isInteger(maxMoves)||maxMoves<1||maxMoves>16)
    throw new RangeError("Use a positive maximum of at most 16 moves");
  const moves=signedActionsFor(level);
  const initial=initialState(level);
  if(isSolved(initial))
    return {moves:0,route:[],freePairings:[],visitedStates:1,triedActions:0};
  const visited=new Set(),initialNodes=[];
  for(const node of freePairClosure({state:initial,route:[],freePairings:[]})){
    const key=keyOf(node.state);
    if(visited.has(key))continue;
    visited.add(key);
    if(isSolved(node.state))
      return {moves:0,route:[],freePairings:node.freePairings,
        visitedStates:visited.size,triedActions:0};
    initialNodes.push(node);
  }
  let frontier=initialNodes,triedActions=0;
  for(let depth=1;depth<=maxMoves;depth++){
    const next=[];
    for(const entry of frontier){
      for(const action of moves){
        triedActions++;
        const attempted=perform(entry.state,action,"auto");
        if(!attempted.ok)continue;
        const route=[...entry.route,action];
        for(const node of freePairClosure({
          state:attempted.state,route,freePairings:entry.freePairings
        })){
          if(isSolved(node.state))
            return {moves:depth,route:node.route,
              freePairings:node.freePairings,
              visitedStates:visited.size,triedActions};
          if(depth===maxMoves)continue;
          const key=keyOf(node.state);
          if(visited.has(key))continue;
          visited.add(key);
          next.push(node);
        }
      }
    }
    frontier=next;
    if(!frontier.length)break;
  }
  return null;
}
