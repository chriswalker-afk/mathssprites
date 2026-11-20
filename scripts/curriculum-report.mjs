/**
 * Teacher / authoring report. The student application does not import this
 * script or the curriculum catalogue. Usage:
 *   npm run curriculum
 *   npm run curriculum -- --world opposites --stage guided
 *   npm run curriculum -- --json
 */
import {canonical,room} from "../src/engine.mjs";
import {WORLD1_LEVELS} from "../src/worlds.mjs";
import {INDEPENDENT_LEVELS} from "../src/independent-levels.mjs";
import {APPRENTICE_LEVELS} from "../src/apprentice-levels.mjs";
import {OPPOSITE_LEVELS} from "../src/opposite-levels.mjs";
import {CURRICULUM_LEVELS,CURRICULUM_CHAPTERS} from "../src/curriculum.mjs";

const sources={
  workshop:{guided:WORLD1_LEVELS,independent:INDEPENDENT_LEVELS,notebook:APPRENTICE_LEVELS},
  opposites:OPPOSITE_LEVELS
};
const args=process.argv.slice(2);
const argument=name=>{
  const index=args.indexOf("--"+name);
  return index<0?null:args[index+1];
};
const worldOnly=argument("world"),stageOnly=argument("stage"),asJSON=args.includes("--json");
if(worldOnly&&!sources[worldOnly])throw new Error("Unknown world: "+worldOnly);
if(stageOnly&&!["guided","independent","notebook"].includes(stageOnly))
  throw new Error("Unknown stage: "+stageOnly);

function algebraicExpression(raw){
  // Sealed crates need the same zero-filled normalisation as live rooms.
  const {x,x2,constant}=canonical(room(raw));
  const terms=[];
  for(const [coefficient,symbol] of [[x2,"x²"],[x,"x"]]){
    if(!coefficient)continue;
    const amount=Math.abs(coefficient);
    terms.push({negative:coefficient<0,value:(amount===1?"":String(amount))+symbol});
  }
  if(constant||!terms.length)
    terms.push({negative:constant<0,value:String(Math.abs(constant))});
  return terms.map((term,index)=>
    (index===0?(term.negative?"−":""):(term.negative?" − ":" + "))+term.value
  ).join("");
}
const equation=level=>algebraicExpression(level.left)+" = "+algebraicExpression(level.right);
const flags=entry=>Object.entries(entry.flags)
  .filter(([,value])=>value===true)
  .map(([name])=>name).join(", ")||"—";
const escapeCell=value=>String(value).replaceAll("|","\\|").replaceAll("\n"," ");
let rows=[];
for(const [worldId,stages] of Object.entries(sources)){
  if(worldOnly&&worldId!==worldOnly)continue;
  for(const [stage,slots] of Object.entries(stages)){
    if(stageOnly&&stage!==stageOnly)continue;
    rows.push(...slots.map((slot,index)=>({
      ...CURRICULUM_LEVELS[worldId][stage][index],
      equation:equation(slot.level)
    })));
  }
}
if(asJSON){
  process.stdout.write(JSON.stringify({count:rows.length,levels:rows},null,2)+"\n");
}else{
  const lines=[
    "# Maths Sprites — Curriculum and difficulty authoring report",
    "",
    "Covers "+rows.length+" playable campaign levels; mathematical equations appear here for teachers only.",
    "Bands describe authored reasoning demand (1–5). Both World 1 and World 2 star benchmarks are independently proven minimums under their legal game-engine actions; World 2 authored example routes remain separate.",
    ""
  ];
  for(const [worldId,stages] of Object.entries(sources)){
    if(worldOnly&&worldId!==worldOnly)continue;
    for(const stage of Object.keys(stages)){
      if(stageOnly&&stage!==stageOnly)continue;
      const section=rows.filter(row=>row.worldId===worldId&&row.stage===stage);
      lines.push("## "+worldId+" / "+stage,"",
        "| # | ID | Equation | Tier | Proven minimum | Authored route | Objective / skills | Difficulty features |",
        "|---:|---|---|---:|---:|---|---|");
      for(const row of section){
        const record=[
          row.number,row.id,row.equation,
          row.difficulty.tier+" — "+row.difficulty.label,
          row.difficulty.complexitySignals.benchmarkMoves,
          row.difficulty.complexitySignals.authoredRouteMoves??"—",
          row.skillIds.join(", "),
          flags(row)
        ];
        lines.push("| "+record.map(escapeCell).join(" | ")+" |");
      }
      lines.push("");
      for(const plan of CURRICULUM_CHAPTERS[worldId][stage]){
        lines.push("- **"+plan.title+":** "+plan.objective);
      }
      lines.push("");
    }
  }
  process.stdout.write(lines.join("\n")+"\n");
}
