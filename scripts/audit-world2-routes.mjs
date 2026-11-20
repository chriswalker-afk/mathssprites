/**
 * PR50 teacher/developer-only shortest legal route audit.
 *
 * npm run audit:world2
 * npm run audit:world2 -- --stage independent
 * npm run audit:world2 -- --json
 *
 * This CLI is deliberately NOT imported by any game UI.
 */
import {OPPOSITE_LEVELS,OPPOSITE_STAGE_ORDER} from "../src/opposite-levels.mjs";
import {OPPOSITE_OPTIMAL_MOVES} from "../src/opposite-star-benchmarks.mjs";
import {equation,initialState,perform,isSolved} from "../src/engine.mjs";
import {shortestSignedRoute} from "./world2-shortest-routes.mjs";

const args=process.argv.slice(2),stageFlag=args.indexOf("--stage");
const stageOnly=stageFlag>=0?args[stageFlag+1]:null;
if(stageFlag>=0&&!OPPOSITE_STAGE_ORDER.includes(stageOnly))
  throw new RangeError("Choose guided, independent or notebook for --stage");
const stages=stageOnly?[stageOnly]:OPPOSITE_STAGE_ORDER;
const routeText=route=>route.map(action=>{
  if(action.op==="divide")return "÷"+action.factor;
  if(action.op==="multiply")return "×"+action.factor;
  const sign=action.op==="remove"?"−":"+";
  const negative=action.kind==="negX"||action.kind==="negOne";
  const sprite=action.kind==="posX"||action.kind==="negX";
  const term=(sprite&&action.count===1?"":String(action.count))+(sprite?"x":"");
  return sign+(negative?"(−"+term+")":term);
}).join(" → ");
const rows=[];
for(const stage of stages)for(const slot of OPPOSITE_LEVELS[stage]){
  const level=slot.level,authored=level.referenceRoute.length;
  const target=OPPOSITE_OPTIMAL_MOVES[stage][slot.number-1];
  const result=shortestSignedRoute(level,{maxMoves:authored});
  if(!result||result.moves!==target)
    throw new Error(slot.id+": published par="+target+
      ", actual shortest="+(result?.moves??"unreachable"));
  let state=initialState(level);
  for(let i=0;i<authored;i++){
    const step=perform(state,level.referenceRoute[i],"auto");
    if(!step.ok)throw new Error(slot.id+": illegal authored route step "+i);
    state=step.state;
    if(i<authored-1&&isSolved(state))
      throw new Error(slot.id+": authored route continues after solving");
  }
  if(!isSolved(state))
    throw new Error(slot.id+": authored route does not isolate x");
  rows.push({
    stage,number:slot.number,id:slot.id,equation:equation(initialState(level)),
    minimum:result.moves,authoredRouteMoves:authored,
    shortestExample:routeText(result.route),
    authoredExample:routeText(level.referenceRoute),
    shortestMatchesAuthored:routeText(result.route)===routeText(level.referenceRoute),
    visitedStates:result.visitedStates,
    testedActions:result.triedActions
  });
}
const summary={
  audited:rows.length,
  minimaMatchAuthoredLength:rows.filter(r=>r.minimum===r.authoredRouteMoves).length,
  exampleRoutesDiffer:rows.filter(r=>!r.shortestMatchesAuthored).length,
  byStage:Object.fromEntries(stages.map(stage=>{
    const stageRows=rows.filter(r=>r.stage===stage);
    return [stage,{
      count:stageRows.length,
      moves:Object.fromEntries([1,2,3,4,5].map(n=>
        [String(n),stageRows.filter(r=>r.minimum===n).length]))}];
  }))
};
if(args.includes("--json")){
  process.stdout.write(JSON.stringify({summary,levels:rows},null,2)+"\n");
}else{
  const lines=[
    "# World 2 — independently certified shortest legal moves",
    "",
    "Audited "+summary.audited+" levels. "+summary.minimaMatchAuthoredLength+
      " authored route lengths are optimal; "+
      summary.exampleRoutesDiffer+" of the independent shortest examples choose a different equally short sequence.",
    "",
    "The solver enumerates every permitted signed action through the real game engine,",
    "including all four object kinds, add/remove 1–12, multiply/divide 2–5,",
    "cancellations and physical room capacities. A two-room move counts once,",
    "even in Independent mode; equations and routes here are teacher-only.",
    ""
  ];
  for(const stage of stages){
    lines.push("## "+stage,"",
      "| # | ID | Equation | Minimum moves | Author route | An independently found shortest route |",
      "|---:|---|---|---:|---:|---|");
    for(const row of rows.filter(r=>r.stage===stage))
      lines.push("| "+[row.number,row.id,row.equation,row.minimum,
        row.authoredRouteMoves,row.shortestExample].join(" | ")+" |");
    lines.push("");
  }
  process.stdout.write(lines.join("\n")+"\n");
}
