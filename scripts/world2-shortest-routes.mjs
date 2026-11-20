/**
 * Engine-backed shortest-route explorer for teachers, CI and the author
 * audit. This is NOT imported by the student application.
 *
 * State identity includes every physical object count, not just ax+b:
 * x, -x, +1 and -1 cannot be collapsed algebraically before the game has
 * physically cancelled them. It is safe to merge identical physical states
 * regardless of the history used to reach them, since future legal operations
 * depend on the rooms and static level permissions, not historical moves.
 *
 * Search breadth first, using the REAL engine and every legal signed action.
 * A first solution therefore has minimum move count, including any
 * alternative non-obvious route. This intentionally doesn't use authored
 * hints, reference routes or current star thresholds to select actions.
 */
import {initialState,perform,isSolved} from "../src/engine.mjs";

const TOKEN_KEYS=Object.freeze(["posX","negX","posX2","posOne","negOne"]);
export const ALL_SIGNED_ACTIONS=Object.freeze([
  ...["remove","add"].flatMap(op=>
    ["posX","negX","posOne","negOne"].flatMap(kind=>
      Array.from({length:12},(_,i)=>Object.freeze({op,kind,count:i+1})))),
  ...["divide","multiply"].flatMap(op=>
    [2,3,4,5].map(factor=>Object.freeze({op,factor})))
]);
const keyOf=state=>["left","right"].flatMap(side=>{
  const room=state[side];
  return [...TOKEN_KEYS.map(key=>room[key]||0),room.crates?.count||0];
}).join(",");

export function signedActionsFor(level){
  if(level?.quantityMode!=="signed" || !level?.allowedOperations ||
    !level?.allowedKinds)
    throw new RangeError("World 2 audit requires an authored signed level");
  if(["left","right"].some(side=>
    level[side]?.crates?.count||level[side]?.posX2))
    throw new RangeError("World 2 signed route search cannot silently ignore new crate/square actions");
  const operations=new Set(level.allowedOperations);
  const kinds=new Set(level.allowedKinds);
  if([...operations].some(op=>!["remove","add","divide","multiply"].includes(op)))
    throw new RangeError("Update World 2 route search when the allowed operation set changes");
  if([...kinds].some(kind=>!["posX","negX","posOne","negOne"].includes(kind)))
    throw new RangeError("Update World 2 route search when signed object kinds change");
  return ALL_SIGNED_ACTIONS.filter(action=>operations.has(action.op)&&
    (!action.kind||kinds.has(action.kind)));
}

/** Return one minimum legal witness, or null if no solution within maxMoves.
 * BFS visits ALL smaller-length routes before accepting the first solution.
 * Bound the search by a known valid authored route (or a published par).
 */
export function shortestSignedRoute(level,{maxMoves=level?.referenceRoute?.length}={}){
  if(!Number.isInteger(maxMoves)||maxMoves<1||maxMoves>16)
    throw new RangeError("Use a positive maximum of at most 16 moves");
  const moves=signedActionsFor(level);
  const initial=initialState(level);
  if(isSolved(initial))return {moves:0,route:[],visitedStates:1,triedActions:0};
  const visited=new Set([keyOf(initial)]);
  let frontier=[{state:initial,route:[]}],triedActions=0;
  for(let depth=1;depth<=maxMoves;depth++){
    const next=[];
    for(const entry of frontier){
      for(const action of moves){
        triedActions++;
        const attempted=perform(entry.state,action,"auto");
        if(!attempted.ok)continue;
        const route=[...entry.route,action];
        if(isSolved(attempted.state))
          return {moves:depth,route,visitedStates:visited.size,triedActions};
        // There is no need to retain states at depth maxMoves; a legal
        // route at or below the bound has already been checked.
        if(depth===maxMoves)continue;
        const key=keyOf(attempted.state);
        if(visited.has(key))continue;
        visited.add(key);
        next.push({state:attempted.state,route});
      }
    }
    frontier=next;
    if(!frontier.length)break;
  }
  return null;
}
