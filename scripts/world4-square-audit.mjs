/** Teacher-only World 4 release certification. The pure graph establishes
 * the shortest distance, the actual engine verifies the mathematical
 * witness, and the actual geometry/operation-editor modules verify the
 * physical representation. No routes or solutions are imported by the UI.
 */
import assert from "node:assert/strict";
import {SQUARE_LEVEL_PLAN} from "../src/square-level-plan.mjs";
import {SQUARE_CAMPAIGN_STAGES} from "../src/square-campaign-levels.mjs";
import {SQUARE_KINDS,SQUARE_CAPACITY,validSquareRoom,uniqueNonnegativeSquareSolution} from "../src/square-rules.mjs";
import {initialState,prepare,perform,visibleRooms,undo,isSolved,equation,balanceDifference,areaArrangement,evaluate} from "../src/engine.mjs";
import {squareConstructionPlan,squareConstructionMarkup} from "../src/square-construction.mjs";
import {squareRootPlan,squareRootTrialPlan} from "../src/square-root-construction.mjs";
import {squareInspectionPolicy,guidedInspectionSide,squareInspectionPlan} from "../src/square-inspection.mjs";
import {handMotionPlan} from "../src/hand-timeline.mjs";
import {shortestSquareRoute} from "../src/square-route-search.mjs";
import {createSquareWorkshopEquation,proveSquareWorkshopRoute,SQUARE_WORKSHOP_ROUTE_BUDGET} from "../src/square-workshop.mjs";
import {startNotebook,notebookReplayScript,undoNotebookLine} from "../src/notebook-engine.mjs";
import {previewNotebookOperation,tryNotebookOperation} from "../src/notebook-maths-editor.mjs";
import {starsForMoves} from "../src/star-ratings.mjs";
import {curriculumForId} from "../src/curriculum.mjs";
import {findCampaignStage} from "../src/campaign-registry.mjs";
import {blankCampaignRecords,withCampaignCompleted,campaignStarTotals,campaignOptimalMoves} from "../src/campaign-records.mjs";

const sides=["left","right"];
const count=(r,k)=>r[k]??0;
const total=r=>SQUARE_KINDS.reduce((n,k)=>n+count(r,k),0);
const equalRoom=(a,b)=>SQUARE_KINDS.every(k=>count(a,k)===count(b,k));
const equalPair=(a,b)=>sides.every(side=>equalRoom(a[side],b[side]));
const opText=a=>a.op==="square"?"²":a.op==="sqrt"?"√":
  a.op==="multiply"?"×"+a.factor:a.op==="divide"?"÷"+a.factor:
  (a.op==="add"?"+":"−")+(a.count===1&&a.kind!=="posOne"?"":String(a.count))+
  (a.kind==="posX2"?"x²":a.kind==="posX"?"x":"");
const demand=(test,id,msg)=>assert.ok(test,id+": "+msg);
function inspectTrial(source,plan,id){
  if(!plan)return;
  demand(plan.cells.length===plan.side**2&&plan.cells.length<=36,id,"trial frame capacity");
  for(const k of SQUARE_KINDS){
    const used=plan.cells.filter(c=>c.kind===k&&c.present);
    const extra=plan.leftovers.filter(c=>c.kind===k);
    const missing=plan.cells.filter(c=>c.kind===k&&!c.present);
    const indices=[...used,...extra].map(c=>c.sourceIndex).sort((a,b)=>a-b);
    assert.deepEqual(indices,Array.from({length:count(source,k)},(_,i)=>i),id+" conserved source tokens");
    demand(missing.length===plan.missing[k]&&extra.length===plan.excess[k],id,"trial gap/excess accounting");
  }
}
function inspectArea(before,after,action,id){
  const area=areaArrangement(before,action.op);
  demand(!!area,id,"legal area arrangement");
  if(area.side===0){
    demand(total(before)===0&&total(after)===0,id,"empty area stays empty");
    return 0;
  }
  const plan=action.op==="square"?squareConstructionPlan(area):squareRootPlan(area);
  demand(plan.side<=6&&plan.cells.length===plan.side**2,id,"complete bounded square");
  demand(plan.edges.length===plan.side,id,"one-dimensional side");
  const [a,b]=[plan.spriteSide,plan.weightSide];
  demand(plan.regions.quadratic===a*a&&plan.regions.units===b*b&&
    plan.regions.mixedTop===a*b&&plan.regions.mixedBottom===a*b,id,"four exact regions");
  const interior=action.op==="square"?after:before;
  const edge=action.op==="square"?before:after;
  demand(equalRoom(plan.counts,interior)&&equalRoom({posX:a,posOne:b},edge),id,"area and side match engine");
  for(const k of SQUARE_KINDS)
    assert.deepEqual(plan.cells.filter(c=>c.kind===k).map(c=>c.outputIndex),
      Array.from({length:count(interior,k)},(_,i)=>i),id+" unique output cells");
  const html=squareConstructionMarkup(plan);
  demand((html.match(/data-cell-index="/g)||[]).length===area.cells,id,"rendered interior inventory");
  demand((html.match(/data-non-counting="true"/g)||[]).length===2*area.side+2,id,"edge rulers do not count");
  for(const reduced of [false,true]){
    const beats=handMotionPlan(action,reduced,area).phases;
    assert.deepEqual(beats.slice(3,-4).map(b=>b.name),plan.stages,id+" physical sequence");
    demand(beats.filter(b=>b.applyChange).length===1&&beats.find(b=>b.applyChange).name==="contact",id,"single contact");
  }
  for(const x of [0,1,2,6]){
    const L=evaluate(before,x),R=evaluate(after,x);
    demand(action.op==="square"?R===L**2:L===R**2,id,"polynomial area identity");
  }
  return plan.side;
}
function auditRoute(level,route){
  const id=level.id,start=initialState(level);
  let state=start,paper=startNotebook(level),peak=0,frames=0,maxSide=0,trials=0;
  const inspect=s=>{
    demand(balanceDifference(s)===0,id,"committed balance");
    for(const side of sides){
      demand(validSquareRoom(s[side]),id,"valid whole-object room");
      peak=Math.max(peak,total(s[side]));
    }
  };
  inspect(state);
  for(const action of route){
    demand(!isSolved(state),id,"no route steps after success");
    const before=state,snapshot=JSON.stringify(before),prepared=prepare(before,action);
    demand(prepared.ok,id,"legal engine prepare");
    const auto=perform(before,action,"auto");
    demand(auto.ok&&auto.committed,id,"Guided commit");
    const after=auto.state;
    for(const side of sides){
      demand(equalRoom(prepared.pair[side].after,after[side]),id,"prepare agrees with commit");
      if(action.op==="square"||action.op==="sqrt"){
        const sideLength=inspectArea(before[side],after[side],action,id);
        frames+=Number(sideLength>0);maxSide=Math.max(maxSide,sideLength);
      }
      const trial=squareRootTrialPlan(before[side]);
      if(trial){inspectTrial(before[side],trial,id);trials++;}
    }
    for(const first of sides){
      const other=first==="left"?"right":"left",one=perform(before,action,"manual",first);
      demand(one.ok&&!one.committed&&!isSolved(one.state),id,"first hand provisional");
      demand(equalPair(one.state,before)&&equalRoom(visibleRooms(one.state)[other],before[other])&&
        equalRoom(visibleRooms(one.state)[first],after[first]),id,"only visited room changes");
      demand(one.state.history.length===before.history.length,id,"first visit counts zero moves");
      assert.deepEqual(undo(one.state),before,id+" undo pending");
      demand(perform(one.state,action,"manual",first).code==="wrong-side",id,"same room refused");
      const two=perform(one.state,action,"manual",other);
      demand(two.ok&&two.committed&&equalPair(two.state,after)&&
        two.state.history.length===after.history.length,id,"matching pair counts one move");
    }
    const preview=previewNotebookOperation(paper,opText(action));
    demand(preview.ok&&preview.line===equation(after),id,"exact written preview");
    const checked=tryNotebookOperation(paper,opText(action));
    demand(checked.ok&&equalPair(checked.session.state,after),id,"checked written line");
    paper=checked.session;
    demand(JSON.stringify(before)===snapshot,id,"previews and visits did not mutate start");
    state=after;inspect(state);
  }
  demand(isSolved(state)&&isSolved(paper.state),id,"goal attained");
  const replay=notebookReplayScript(paper);
  demand(replay.length===route.length&&state.history.length===route.length,id,"replay length");
  let played=start;
  for(const step of replay){
    demand(equalPair(played,step.before),id,"recorded before");
    const next=perform(played,step.action,"auto");
    demand(next.ok&&equalPair(next.state,step.after)&&equation(next.state)===step.line,id,"exact recorded replay");
    played=next.state;
  }
  demand(equalPair(played,state),id,"paper and physical final agree");
  while(state.history.length)state=undo(state);
  assert.deepEqual(state,start,id+" complete physical undo");
  while(paper.steps.length)paper=undoNotebookLine(paper);
  assert.deepEqual(paper,startNotebook(level),id+" complete paper undo");
  return {peak,frames,maxSide,trials};
}
export function auditSquareWorld({stage:only=null}={}){
  if(only&&!SQUARE_CAMPAIGN_STAGES.some(s=>s.id===only))throw new RangeError("Unknown stage");
  const rows=[];let records=blankCampaignRecords();
  for(const stage of SQUARE_CAMPAIGN_STAGES){
    if(only&&stage.id!==only)continue;
    const registry=findCampaignStage("squares",stage.id);
    demand(stage.available&&registry.available&&stage.levels.length===registry.levels.length,stage.id,"published registry coverage");
    for(const slot of stage.levels){
      const l=slot.level,id=l.id,fixture=SQUARE_LEVEL_PLAN.find(f=>f.id===id),ref=fixture.reference;
      demand(slot.available&&!Object.hasOwn(l,"reference"),id,"student level has no reference");
      demand(uniqueNonnegativeSquareSolution(l.left,l.right,l.solution),id,"unique nonnegative solution");
      const proof=shortestSquareRoute(l,ref.length);
      const min=stage.optimalMoves[id];
      demand(proof?.moves===min&&ref.length===min&&campaignOptimalMoves("squares",stage.id,id)===min,id,"independent shortest target");
      const authored=auditRoute(l,ref),found=auditRoute(l,proof.route);
      const text=equation(initialState(l)),custom=createSquareWorkshopEquation(text,{goal:l.goal});
      demand(custom.ok&&custom.level.solution===l.solution&&equalPair(custom.level,l)&&!Object.hasOwn(custom.level,"reference"),id,"custom reconstruction");
      const route=proveSquareWorkshopRoute(custom.level);
      demand(route?.length===min&&proof.visited<=SQUARE_WORKSHOP_ROUTE_BUDGET,id,"bounded custom certificate");
      // The optional inspection is read-only and uses only the source room.
      const policy=squareInspectionPolicy(l,{mode:stage.method==="manual"?"manual":"auto",notebook:stage.method==="notebook"});
      demand(policy===(l.squareInspection||null),id,"inspection policy");
      if(policy)for(const side of sides){
        const source=l[side],fitted=guidedInspectionSide(source);
        if(fitted)inspectTrial(source,squareInspectionPlan(source,fitted),id);
        inspectTrial(source,squareInspectionPlan(source,{a:1,b:1}),id);
      }
      demand(starsForMoves(min,min)===3&&starsForMoves(min+1,min)===2&&starsForMoves(min+2,min)===1,id,"star bands");
      records=withCampaignCompleted(records,"squares",stage.id,id,min);
      const metadata=curriculumForId(id);
      demand(metadata?.difficulty.complexitySignals.benchmarkMoves===min&&metadata.chapterIndex===slot.chapterIndex,id,"curriculum alignment");
      demand(metadata.flags.squareBuild===(l.goal==="area"),id,"correct goal metadata");
      rows.push({id,stage:stage.id,number:slot.number,chapter:slot.chapterIndex+1,equation:text,
        solution:l.solution,goal:l.goal,tier:metadata.difficulty.tier,minimum:min,inspection:policy||"none",
        authoredPeak:authored.peak,foundPeak:found.peak,frameCount:authored.frames,
        maxSide:Math.max(authored.maxSide,found.maxSide),refusalTrials:authored.trials,
        searchStates:proof.visited,authored:ref.map(opText),witness:proof.route.map(opText)});
    }
  }
  const summarize=r=>({levels:r.length,buildGoals:r.filter(x=>x.goal==="area").length,
    solveGoals:r.filter(x=>x.goal==="isolate").length,
    minima:Object.fromEntries([1,2,3,4,5,6].map(n=>[n,r.filter(x=>x.minimum===n).length])),
    peakAuthored:Math.max(...r.map(x=>x.authoredPeak)),peakFound:Math.max(...r.map(x=>x.foundPeak)),
    maxSide:Math.max(...r.map(x=>x.maxSide)),frames:r.reduce((n,x)=>n+x.frameCount,0),
    largestSearch:Math.max(...r.map(x=>x.searchStates)),
    stars:3*r.length,chapters:Array.from({length:r.length/4},(_,i)=>{
      const levels=r.slice(i*4,i*4+4);return {chapter:i+1,minima:levels.map(l=>l.minimum),
        tiers:levels.map(l=>l.tier),peak:Math.max(...levels.map(l=>l.authoredPeak))};
    })});
  const totals=campaignStarTotals(records,{worldId:"squares",...(only?{stageId:only}:{})});
  demand(totals.earned===rows.length*3&&totals.completed===rows.length,"World 4","all stars attainable");
  return {summary:{...summarize(rows),byStage:Object.fromEntries(SQUARE_CAMPAIGN_STAGES
    .filter(s=>!only||s.id===only).map(s=>[s.id,summarize(rows.filter(r=>r.stage===s.id))]))},levels:rows};
}
