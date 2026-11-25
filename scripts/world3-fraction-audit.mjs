/** World 3 shortest-route certification and physical staging audit.
 * Teacher/developer only. Independent coefficient BFS provides a lower
 * bound for ALL operations (including additions not explored by the
 * certificate finder); the real engine supplies the matching witness.
 */
import {rational as q,rsub,rmul,rdiv,req,rcompare} from "../src/rational.mjs";
import {FRACTION_KINDS,FRACTION_CAPACITY,fractionRoomCount} from "../src/fraction-engine.mjs";
import {FRACTION_CAMPAIGN_STAGES} from "../src/fraction-campaign-levels.mjs";
import {FRACTION_LEVEL_PLAN} from "../src/fraction-level-plan.mjs";
import {initialState,prepare,perform,undo,isSolved,equation,balanceDifference} from "../src/engine.mjs";
import {proveFractionWorkshopRoute,createFractionWorkshopEquation} from "../src/fraction-workshop.mjs";
import {roomChoreography,gridRoom} from "../src/fraction-choreography.mjs";
import {weightGridMarkup,weightInventoryMarkup} from "../src/fraction-weights.mjs";
import {spriteGridMarkup,spriteInventoryMarkup} from "../src/fraction-sprites.mjs";
import {startFractionNotebook,tryFractionNotebookOperation,fractionNotebookOperationText,fractionNotebookReplayScript} from "../src/fraction-notebook-engine.mjs";
import {starsForMoves} from "../src/star-ratings.mjs";
import {curriculumForId} from "../src/curriculum.mjs";

const invariant=(v,id,message)=>{if(!v)throw new Error(id+": "+message);};
const pairEqual=(a,b)=>["left","right"].every(side=>FRACTION_KINDS.every(k=>req(a[side][k],b[side][k])));
const key=value=>value.n+"/"+value.d;
const countGrid=grid=>FRACTION_KINDS.reduce((sum,k)=>sum+grid[k].whole+grid[k].units,0);
export function minimumScalingMoves(value,maxMoves=5){
  const start=q(value),magnitude=q(Math.abs(start.n),start.d);
  if(!magnitude.n)return null;
  let frontier=[magnitude];const seen=new Set([key(magnitude)]);
  for(let depth=0;depth<=maxMoves;depth++){
    if(frontier.some(v=>req(v,1)))return depth;
    if(depth===maxMoves)break;
    const next=[];
    for(const v of frontier)for(const f of [2,3,4,5])for(const w of [rmul(v,f),rdiv(v,f)]){
      if(seen.has(key(w)))continue;seen.add(key(w));next.push(w);
    }
    frontier=next;
  }
  return null;
}
export function independentFractionLowerBound(level,maxMoves=5){
  const scales=minimumScalingMoves(rsub(level.left.posX,level.right.posX),maxMoves);
  if(scales===null)return null;
  // No scale operation turns a positive quantity into zero; each initially
  // shared kind needs at least one removal, even when additions are allowed.
  const cancellations=FRACTION_KINDS.filter(k=>rcompare(level.left[k],0)>0&&rcompare(level.right[k],0)>0).length;
  return scales+cancellations;
}
function inspectRoute(level,route,mode){
  let state=initialState(level),settled=0,temporary=0,borrowings=0,commonGrids=0;
  const id=level.id;
  const inspect=()=>{
    for(const side of ["left","right"]){
      const room=state[side];
      settled=Math.max(settled,fractionRoomCount(room));
      invariant(fractionRoomCount(room)<=FRACTION_CAPACITY,id,"settled room exceeds capacity");
      weightInventoryMarkup(room.posOne);spriteInventoryMarkup(room.posX);
    }
    invariant(req(balanceDifference(state),0),id,"committed room not balanced");
  };
  const grid=g=>{
    temporary=Math.max(temporary,countGrid(g));
    weightGridMarkup(g.posOne);spriteGridMarkup(g.posX);
  };
  inspect();
  let session=mode==="notebook"?startFractionNotebook(level):null;
  for(const [i,action] of route.entries()){
    invariant(!isSolved(state),id,"route continues after success");
    const before=state,p=prepare(before,action);
    invariant(p.ok,id,"illegal route move "+i);
    for(const side of ["left","right"]){
      const stages=roomChoreography(action,p.pair[side]);
      invariant(FRACTION_KINDS.every(k=>req(gridRoom(stages.prepared)[k],before[side][k])),id,"preparation not conserved");
      invariant(FRACTION_KINDS.every(k=>req(gridRoom(stages.raw)[k],stages.after[k])),id,"raw inventory not conserved");
      grid(stages.prepared);grid(stages.raw);grid(stages.amount);
      if(stages.group)grid(stages.group);
      borrowings+=Number(stages.borrowed);commonGrids+=Number(stages.changedGrid);
    }
    const auto=perform(before,action,"auto");invariant(auto.ok,id,"auto failed");
    if(mode==="manual"){
      for(const first of ["left","right"]){
        const second=first==="left"?"right":"left";
        const visit=perform(before,action,"manual",first);
        invariant(visit.ok&&!visit.committed&&visit.state.history.length===i,id,"first visit committed");
        invariant(!isSolved(visit.state)&&req(balanceDifference(undo(visit.state)),0),id,"pending undo did not restore balance");
        const matching=action.count?{...action,count:{n:action.count.n*2,d:action.count.d*2}}:action;
        const match=perform(visit.state,matching,"manual",second);
        invariant(match.ok&&match.committed&&pairEqual(match.state,auto.state),id,"manual result differs");
      }
    }
    if(session){
      const result=tryFractionNotebookOperation(session,fractionNotebookOperationText(action));
      invariant(result.ok&&pairEqual(result.session.state,auto.state),id,"notebook result differs");
      session=result.session;
    }
    state=auto.state;inspect();
  }
  invariant(isSolved(state),id,"did not isolate one whole sprite");
  if(session){
    invariant(fractionNotebookReplayScript(session).length===route.length,id,"notebook replay length differs");
    invariant(pairEqual(session.state,state),id,"notebook final state differs");
  }
  while(state.history.length)state=undo(state);
  invariant(pairEqual(state,initialState(level)),id,"undo did not restore initial state");
  return {settled,temporary,borrowings,commonGrids};
}
export function auditFractionWorld({stage:only=null}={}){
  if(only&&!FRACTION_CAMPAIGN_STAGES.some(s=>s.id===only))throw new RangeError("Unknown stage");
  const rows=[];
  for(const stage of FRACTION_CAMPAIGN_STAGES){
    if(only&&stage.id!==only)continue;
    for(const slot of stage.levels){
      const level=slot.level,reference=FRACTION_LEVEL_PLAN.find(l=>l.id===slot.id).reference;
      const minimum=independentFractionLowerBound(level,reference.length);
      invariant(minimum!==null&&minimum===stage.optimalMoves[slot.id]&&reference.length===minimum,slot.id,"star benchmark differs from independent bound");
      const witness=proveFractionWorkshopRoute(level);
      invariant(witness?.length===minimum,slot.id,"independent legal witness does not attain the bound");
      const authored=inspectRoute(level,reference,stage.method),found=inspectRoute(level,witness,stage.method);
      const normalized=equation(initialState(level)),custom=createFractionWorkshopEquation(normalized);
      invariant(custom.ok&&req(custom.level.solution,level.solution)&&pairEqual(initialState(custom.level),initialState(level)),slot.id,"custom equation differs");
      invariant(starsForMoves(minimum,minimum)===3&&starsForMoves(minimum+1,minimum)===2&&starsForMoves(minimum+2,minimum)===1,slot.id,"incorrect stars");
      const metadata=curriculumForId(slot.id);
      invariant(metadata?.difficulty.complexitySignals.benchmarkMoves===minimum,slot.id,"curriculum benchmark differs");
      rows.push({id:slot.id,stage:stage.id,number:slot.number,chapter:slot.chapterIndex+1,
        equation:normalized,minimum,tier:metadata.difficulty.tier,
        fractionalSolution:level.solution.d>1,solution:level.solution,
        referencePeakSettled:authored.settled,referencePeakTemporary:authored.temporary,
        foundPeakSettled:found.settled,foundPeakTemporary:found.temporary,
        borrowings:authored.borrowings,commonGrids:authored.commonGrids,
        authored:reference.map(fractionNotebookOperationText),witness:witness.map(fractionNotebookOperationText)});
    }
  }
  const summarize=r=>({levels:r.length,fractionalSolutions:r.filter(x=>x.fractionalSolution).length,
    minima:Object.fromEntries([1,2,3,4,5].map(n=>[n,r.filter(x=>x.minimum===n).length])),
    referencePeakSettled:Math.max(...r.map(x=>x.referencePeakSettled)),
    referencePeakTemporary:Math.max(...r.map(x=>x.referencePeakTemporary)),
    foundPeakSettled:Math.max(...r.map(x=>x.foundPeakSettled)),
    foundPeakTemporary:Math.max(...r.map(x=>x.foundPeakTemporary))});
  return {summary:{...summarize(rows),byStage:Object.fromEntries(FRACTION_CAMPAIGN_STAGES.filter(s=>!only||s.id===only).map(s=>[s.id,summarize(rows.filter(r=>r.stage===s.id))]))},levels:rows};
}
